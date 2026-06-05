# =============================================================================
# AI AGENT ENDPOINT — app/api/v1/endpoints/agent.py
# =============================================================================
# HTTP interface for the LangGraph orchestrator.
#
# This endpoint replaces the `setTimeout(1500, mockResponse)` in:
#   client/components/consultation/consultation-view.tsx
#
# FRONTEND INTEGRATION:
# Replace the mock AI call in consultation-view.tsx with:
#
#   const token = localStorage.getItem('token');
#   const response = await fetch('/api/v1/agent/chat', {
#     method: 'POST',
#     headers: {
#       'Authorization': `Bearer ${token}`,
#       'Content-Type': 'application/json',
#     },
#     body: JSON.stringify({ message: doctorNotes }),
#   });
#   const data = await response.json();
#   setAiResponse(data.response);       // SOAP note or schedule confirmation
#   setSoapData(data.tool_result);      // Structured S/O/A/P if soap_note intent
# =============================================================================

from typing import List, Optional
from uuid import UUID

from app.agents.orchestrator import orchestrator_app
from app.agents.soap_agent import structure_soap_note, transcribe_audio
from app.api.deps import CurrentDoctor, Database
from app.repositories.patient_repo import PatientRepository
from app.tools.route_tools import calculate_shortest_route_by_coords, haversine_km
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agent", tags=["AI Agent"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str
    tool_result: dict | None = None


class SOAPRequest(BaseModel):
    transcription: str


class SOAPResponse(BaseModel):
    S: str | None = None
    O: str | None = None
    A: str | None = None
    P: str | None = None
    raw: str | None = None
    error: str | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    # Requires valid JWT — the doctor must be logged in to use the AI
    current_doctor: CurrentDoctor,
    db: Database,
):
    """
    Send a message to the FamilyDoc-AI orchestrator.

    The orchestrator:
    1. Classifies intent (schedule/route/SOAP/general)
    2. Routes to the appropriate sub-agent or tool
    3. Returns a structured response

    Authentication: Bearer JWT token required.
    The doctor's patient ID is extracted from the token and can be used
    for context-aware responses (e.g., fetching their specific schedule).

    Rate limits: Consider adding rate limiting in production to control Gemini costs.
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    try:
        # Invoke the LangGraph workflow
        # ainvoke() runs the full graph asynchronously and returns the final state
        result = await orchestrator_app.ainvoke(
            {
                "messages": [{"role": "user", "content": request.message}],
                "intent": "",
                "tool_result": None,
                "final_response": None,
                "doctor_id": str(current_doctor.id),
            }
        )

        return ChatResponse(
            response=result.get("final_response") or "Хариулт алга байна.",
            intent=result.get("intent", "general"),
            tool_result=result.get("tool_result"),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI agent алдаа гарлаа: {str(e)}",
        )


class RouteOptimizeRequest(BaseModel):
    patient_ids: List[UUID] = Field(..., min_length=1)
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None


class RouteStop(BaseModel):
    patient_id: Optional[UUID] = None  # None when the stop is the doctor's start point
    full_name: str
    latitude: float
    longitude: float
    leg_km: float  # km from previous stop (0.0 for the first stop)


class RouteOptimizeResponse(BaseModel):
    stops: List[RouteStop]
    total_km: float


@router.post("/route/optimize", response_model=RouteOptimizeResponse)
async def optimize_route(
    request: RouteOptimizeRequest,
    current_doctor: CurrentDoctor,
    db: Database,
):
    """
    Optimize a doctor's home-visit route using lat/lng nearest-neighbor TSP.

    Behaviour:
    - Loads patients by `patient_ids`. Patients without lat/lng are skipped.
    - If `start_lat` & `start_lng` are provided, that point is fixed as the
      starting stop (index 0) and the patients are sorted from there.
    - Otherwise the first patient in the input list is treated as the start.
    - Returns ordered stops with per-leg km and the total km.
    """
    repo = PatientRepository(db)
    patients = await repo.get_by_ids(request.patient_ids)
    geo_patients = [p for p in patients if p.latitude is not None and p.longitude is not None]

    if not geo_patients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сонгосон өвчтнүүдийн аль нь ч GPS координаттай биш байна.",
        )

    has_explicit_start = request.start_lat is not None and request.start_lng is not None

    if has_explicit_start:
        coords = [(request.start_lat, request.start_lng)] + [
            (p.latitude, p.longitude) for p in geo_patients
        ]
        labels = ["Эхлэлийн цэг"] + [p.full_name for p in geo_patients]
        ids = [None] + [p.id for p in geo_patients]
    else:
        coords = [(p.latitude, p.longitude) for p in geo_patients]
        labels = [p.full_name for p in geo_patients]
        ids = [p.id for p in geo_patients]

    order = calculate_shortest_route_by_coords(coords)

    stops: List[RouteStop] = []
    total_km = 0.0
    for position, idx in enumerate(order):
        lat, lng = coords[idx]
        if position == 0:
            leg = 0.0
        else:
            prev_lat, prev_lng = coords[order[position - 1]]
            leg = haversine_km(prev_lat, prev_lng, lat, lng)
            total_km += leg
        stops.append(
            RouteStop(
                patient_id=ids[idx],
                full_name=labels[idx],
                latitude=lat,
                longitude=lng,
                leg_km=round(leg, 2),
            )
        )

    return RouteOptimizeResponse(stops=stops, total_km=round(total_km, 2))


@router.post("/transcribe")
async def transcribe_audio_endpoint(audio: UploadFile = File(...)):
    """
    Transcribe a Mongolian medical audio recording using Gemini.
    Accepts audio/webm (Chrome MediaRecorder default) or audio/mp4, audio/ogg.
    Returns the transcription text — much more accurate than browser Web Speech API.
    """
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Аудио файл хоосон байна"
        )
    mime = audio.content_type or "audio/webm"
    text = await transcribe_audio(audio_bytes, mime)
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Дуу таних боломжгүй байна",
        )
    return {"transcription": text}


@router.post("/soap", response_model=SOAPResponse)
async def generate_soap_note(
    request: SOAPRequest,
):
    """
    Convert a raw voice transcript into a structured SOAP medical note.
    Called from the admin panel after the doctor finishes recording.
    Authentication: doctor Bearer JWT required.
    """
    if not request.transcription.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Транскрипц хоосон байна",
        )
    try:
        result = await structure_soap_note(request.transcription)
        return SOAPResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SOAP боловсруулахад алдаа гарлаа: {str(e)}",
        )
