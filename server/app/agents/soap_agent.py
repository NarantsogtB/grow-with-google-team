# =============================================================================
# SOAP MEDICAL NOTE AGENT — app/agents/soap_agent.py
# =============================================================================
# This agent converts raw doctor dictation (Speech-to-Text output) into
# a structured SOAP medical note using Google Gemini.
#
# WHAT IS SOAP?
# SOAP is the international standard format for medical documentation:
#   S = Subjective  → What the patient TELLS you ("I have chest pain")
#   O = Objective   → What you OBSERVE/MEASURE (BP 140/90, temp 37.2°C)
#   A = Assessment  → Your medical conclusion (Hypertension, suspected)
#   P = Plan        → What to do next (Prescribe Enalapril 10mg, follow up in 2 weeks)
#
# WHY GEMINI FOR THIS?
# Mongolian family doctors write notes in a mix of:
#   - Mongolian (everyday descriptions)
#   - English (medical terms they learned from textbooks)
#   - Latin (standard clinical terminology: edema, arrhythmia, dyspnea)
# Only an LLM can handle this trilingual medical shorthand correctly.
# A rule-based parser would fail on every creative abbreviation.
#
# TOKEN OPTIMIZATION:
# - The prompt is kept minimal: just the SOAP format definition + one example
# - The model is instructed to return ONLY JSON (no explanatory text)
# - JSON parsing is strict: if the model returns non-JSON, we return the raw text
#
# COST ESTIMATE: ~500-800 tokens per SOAP note at current Gemini pricing.
# Compare to the alternatives: manual transcription (15+ min) or double data entry.
# =============================================================================

import json
import logging
from typing import Optional

# google-genai==1.75.0 uses the new SDK: `from google import genai`
# NOT `import google.generativeai as genai` (that was the old SDK, now deprecated)
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

# Instantiate the client once at module load time.
# The new SDK uses Client objects instead of module-level configure().
_client = genai.Client(api_key=settings.GOOGLE_GEMINI_API_KEY)

# ── CLINICAL SYSTEM PROMPT ────────────────────────────────────────────────────
# Carefully crafted for Mongolian family doctor context.
# Key instructions:
#   1. Acknowledge the trilingual reality of Mongolian medical notes
#   2. Preserve Latin medical terms as-is (don't translate "edema" to Mongolian)
#   3. Return ONLY JSON — no markdown, no code blocks, no explanation
#   4. One few-shot example to anchor the model's output format
SOAP_SYSTEM_PROMPT = """You are a medical documentation assistant for Mongolian family doctors.
Doctors dictate examination notes in a mix of Mongolian, English, and Latin medical terminology.
The input is raw Speech-to-Text output and may contain speech disfluencies.

Examples of mixed-language inputs you will receive:
- "BP 160/100, толгой өвдөнө, Enalapril 10mg бичье" (BP + Mongolian complaint + Latin drug)
- "Зүрхний rhythm тогтмол, edema алга, амьсгалахад хүндрэл байхгүй" (Mongolian + English/Latin terms)
- "Temp 37.8, cough, хоолой өвдөнө, antibiotic зааж өгье" (Mixed vitals + symptoms + plan)

STEP 1 — PREPROCESSING (clean up STT artifacts before structuring):
- Remove Mongolian filler words and hesitations: "тэр", "за тэр", "яагаад гэвэл", "гэж хэлэхэд", "ааа", "ммм", "ийм юм", "тэгэхэд", "яг тэр", "яагаад"
- Remove word-level repetitions caused by STT restart pauses (e.g. "өвдөнө өвдөнө" → "өвдөнө", "BP BP 160" → "BP 160")
- Silently complete obviously broken fragments from pause boundaries
- IMPORTANT: Do NOT remove medically relevant content — preserve all symptoms, measurements, drug names, dosages

STEP 2 — STRUCTURING: Structure the cleaned text into SOAP format.
- S (Subjective): Patient's complaints IN THEIR OWN WORDS
- O (Objective): Measurable findings — vital signs, exam observations
- A (Assessment): Medical diagnosis or differential diagnosis
- P (Plan): Treatment, medications (with dosage), follow-up instructions

RULES:
1. Preserve medical Latin terms exactly as-is: edema, dyspnea, arrhythmia, hypertension, etc.
2. Keep Mongolian text in Mongolian — do not translate it to English
3. If information for a SOAP section is absent from the input, write null for that field
4. Return ONLY a valid JSON object with keys "S", "O", "A", "P" — nothing else
5. No markdown, no code blocks, no explanatory text — ONLY the JSON object

FEW-SHOT EXAMPLE:
Input: "тэр BP 160/100 160/100, толгой өвдөнө өвдөнө, нүд харанхуйлна. Enalapril 10mg өглөө, орой 2 удаа. 2 долоо хоногийн дараа дахин үзүүлэх."
Output:
{"S": "Толгой өвдөх, нүд харанхуйлах", "O": "BP 160/100", "A": "Arterial hypertension (артерийн даралт ихсэх)", "P": "Enalapril 10mg өглөө, орой 2 удаа. 2 долоо хоногийн дараа дахин үзүүлэх."}"""


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """
    Transcribe Mongolian medical audio using Gemini audio understanding.
    Much more accurate than browser Web Speech API for mixed Mongolian/Latin/English.
    """
    try:
        response = await _client.aio.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                (
                    "Дараах аудиог Монгол хэлээр транскрипт хий. "
                    "Монгол үгийг монголоор, эмнэлгийн латин/англи нэр томъёог "
                    "(BP, edema, arrhythmia, Enalapril г.м.) хэвээр хадгал. "
                    "Зөвхөн транскриптийн текстийг буцаа. Тайлбар, тэмдэглэл нэмэхгүй."
                ),
            ],
            config=types.GenerateContentConfig(temperature=0),
        )
        return (response.text or "").strip()
    except Exception as e:
        logger.exception("Audio transcription failed: %s", e)
        return ""


async def structure_soap_note(raw_transcription: str) -> dict:
    """
    Convert a raw STT transcription into a structured SOAP note.

    Args:
        raw_transcription: The doctor's dictated examination notes (mixed Mongolian/English/Latin)

    Returns:
        A dict with keys "S", "O", "A", "P" (Subjective, Objective, Assessment, Plan).
        Values may be null if the information wasn't in the transcription.
        On parsing failure, returns {"raw": <original_text>, "error": "Could not parse SOAP"}

    Example:
        await structure_soap_note("BP 160/100, толгой өвдөнө")
        # → {"S": "Толгой өвдөх", "O": "BP 160/100", "A": null, "P": null}
    """
    response_text = ""
    try:
        # New SDK: pass system_instruction inside GenerateContentConfig, call via client.aio.models
        response = await _client.aio.models.generate_content(
            model="gemini-2.5-flash",  # Flash: fast + cheap, ideal for structured extraction
            contents=raw_transcription,
            config=types.GenerateContentConfig(system_instruction=SOAP_SYSTEM_PROMPT),
        )
        response_text = (response.text or "").strip()

        # Clean common model misbehavior: wrapping JSON in markdown code blocks
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])  # strip first and last lines

        soap_data = json.loads(response_text)

        # Validate expected structure
        for key in ("S", "O", "A", "P"):
            if key not in soap_data:
                soap_data[key] = None

        logger.info("SOAP note structured successfully")
        return soap_data

    except json.JSONDecodeError:
        logger.warning("SOAP agent returned non-JSON response: %s", response_text[:200])
        return {
            "S": None, "O": None, "A": None, "P": None,
            "raw": raw_transcription,
            "error": "AI буцаасан өгөгдлийг задлан шинжлэхэд алдаа гарлаа",
        }
    except Exception as e:
        logger.exception("SOAP agent failed: %s", e)
        return {
            "S": None, "O": None, "A": None, "P": None,
            "raw": raw_transcription,
            "error": str(e),
        }
