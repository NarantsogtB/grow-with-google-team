# =============================================================================
# LANGGRAPH ORCHESTRATOR — app/agents/orchestrator.py
# =============================================================================
# The central router agent for FamilyDoc-AI.
#
# WHAT IS LANGGRAPH?
# LangGraph is a framework for building stateful, multi-step AI workflows.
# Unlike a simple LLM call, LangGraph lets you:
#   1. Define a GRAPH of nodes (each node is a Python function)
#   2. Control FLOW between nodes with edges and conditional routing
#   3. Share STATE across all nodes (like a shared whiteboard)
#
# ARCHITECTURE OF THIS WORKFLOW:
#
#   ┌─────────┐
#   │  START  │
#   └────┬────┘
#        │
#        ▼
#   ┌──────────────────┐
#   │  classify_intent  │  ← Small Gemini call: "what does the doctor want?"
#   └────────┬─────────┘
#            │
#     ┌──────┴──────┐ (conditional routing based on intent)
#     │             │
#     ▼             ▼             ▼              ▼
# [schedule]  [route_opt]  [soap_note]  [general_response]
#     │             │             │              │
#     └─────────────┴─────────────┴──────────────┘
#                               │
#                               ▼
#                            [ END ]
#
# INTENT CATEGORIES:
#   schedule_update  → patient can't come → reorder_schedule_tool
#   route_optimize   → show today's route → calculate_shortest_route_tool
#   soap_note        → structure dictation → Gemini SOAP agent
#   general          → other messages → simple response
#
# TOKEN OPTIMIZATION STRATEGY:
#   - classify_intent: ~100-200 tokens (small classification prompt)
#   - schedule_update: 0 tokens (calls reorder_schedule_tool)
#   - route_optimize: 0 tokens (calls calculate_shortest_route_tool)
#   - soap_note: ~500-800 tokens (structured extraction)
#   - general: ~100-200 tokens (simple response)
# =============================================================================

import json
import logging
import operator
from typing import Annotated, Any, Dict, Optional

# google-genai==1.75.0 (new SDK) — NOT `import google.generativeai as genai` (old SDK)
from google import genai
from google.genai import types
from langgraph.graph import END, START, StateGraph
from typing_extensions import TypedDict

from app.core.config import settings

logger = logging.getLogger(__name__)

# Instantiate the client once (new SDK pattern — no module-level configure())
_client = genai.Client(api_key=settings.GOOGLE_GEMINI_API_KEY)


# ── STATE SCHEMA ──────────────────────────────────────────────────────────────
# The AgentState TypedDict defines all data flowing through the graph.
# Every node receives the full state and returns an updated state.
#
# Annotated[list, operator.add] means messages ACCUMULATE across nodes
# (each node appends to the list, not replaces it). This preserves conversation history.
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]  # Full conversation history
    intent: str  # Classified intent: "schedule_update" | "route_optimize" | "soap_note" | "general"
    tool_result: Optional[Dict[str, Any]]  # Output from deterministic tools
    final_response: Optional[str]  # Final response to return to the doctor


# ── NODE 1: INTENT CLASSIFIER ─────────────────────────────────────────────────
INTENT_CLASSIFICATION_PROMPT = """You are an intent classifier for a Mongolian family doctor AI assistant.
The doctor interacts in Mongolian, English, or a mix of both.

Classify the user's message into EXACTLY ONE of these intents:
- "schedule_update": Patient is unavailable, needs to cancel or reschedule
- "route_optimize": Doctor wants to see today's optimal visit route
- "soap_note": Doctor wants to structure examination notes into SOAP format
- "general": Any other question or message

IMPORTANT: Respond with ONLY the intent string, nothing else.
Examples:
  "Энэ даваа гарагт өвчтөн ирж чадахгүй байна" → schedule_update
  "Өнөөдрийн маршрутыг харуул" → route_optimize
  "BP 160/100, толгой өвдөнө, Enalapril бичье" → soap_note
  "Маргааш хэдэн гэрийн эргэлт байна?" → general"""


async def classify_intent(state: AgentState) -> AgentState:
    """
    Node 1: Classify the last user message's intent using Gemini.

    This is the only LLM call for routing decisions.
    All subsequent nodes either use another targeted LLM call (SOAP)
    or call deterministic tools (schedule, route).
    """
    last_message = state["messages"][-1] if state["messages"] else ""
    if isinstance(last_message, dict):
        content = last_message.get("content", "")
    else:
        content = str(last_message)

    try:
        response = await _client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=content,
            config=types.GenerateContentConfig(
                system_instruction=INTENT_CLASSIFICATION_PROMPT
            ),
        )
        intent = (response.text or "general").strip().lower()

        # Validate against known intents — default to "general" if unexpected
        valid_intents = {"schedule_update", "route_optimize", "soap_note", "general"}
        if intent not in valid_intents:
            logger.warning("Unknown intent '%s', defaulting to 'general'", intent)
            intent = "general"

        logger.info("Intent classified: '%s' for message: '%s'", intent, content[:50])
        return {**state, "intent": intent}

    except Exception as e:
        logger.exception("Intent classification failed: %s", e)
        return {**state, "intent": "general"}


# ── ROUTING FUNCTION ──────────────────────────────────────────────────────────
def route_by_intent(state: AgentState) -> str:
    """
    Conditional edge: determines which node to visit next.

    This is NOT an LLM call — just a Python dict lookup.
    LangGraph calls this function after classify_intent to decide routing.
    """
    routing_map = {
        "schedule_update": "schedule_node",
        "route_optimize": "route_node",
        "soap_note": "soap_node",
        "general": "general_node",
    }
    next_node = routing_map.get(state["intent"], "general_node")
    logger.info("Routing to node: %s", next_node)
    return next_node


# ── NODE 2a: SCHEDULE UPDATE ──────────────────────────────────────────────────
async def schedule_node(state: AgentState) -> AgentState:
    """
    Handle schedule update intent.
    In production: extract patient ID from message, call reorder_schedule_tool.
    Returns a confirmation message for the doctor.
    """
    # The schedule_agent module handles the full flow
    from app.agents.schedule_agent import handle_schedule_update

    # NOTE: In production, the db session is passed via the FastAPI endpoint
    # that invokes this graph. For now, we return an instructional message.
    logger.info("Schedule node invoked — requires DB session from endpoint")
    return {
        **state,
        "final_response": (
            "Хуваарь шинэчлэх үйлдлийг илрүүлэв. "
            "Оршин суугчийн ID болон хуваарийн ID шаардлагатай. "
            "Системийн интеграцийг дуусгасны дараа автоматаар шинэчлэгдэнэ."
        ),
    }


# ── NODE 2b: ROUTE OPTIMIZATION ───────────────────────────────────────────────
async def route_node(state: AgentState) -> AgentState:
    """
    Handle route optimization intent.
    Extracts W3W addresses from schedule and calls calculate_shortest_route_tool.
    Returns sorted route as a numbered list.
    """
    from app.tools.route_tools import calculate_shortest_route_tool

    # In production, W3W addresses are fetched from today's patient schedule
    # For demonstration, we return an instructional message
    logger.info("Route node invoked — requires patient W3W addresses from DB")
    return {
        **state,
        "final_response": (
            "Маршрут тооцоолох үйлдлийг илрүүлэв. "
            "Өнөөдрийн хуваарийн What3Words хаягуудыг датабаазаас авч "
            "оновчтой дарааллаар зохион байгуулна."
        ),
    }


# ── NODE 2c: SOAP NOTE STRUCTURING ────────────────────────────────────────────
async def soap_node(state: AgentState) -> AgentState:
    """
    Handle SOAP note structuring intent.
    Sends the last message to the SOAP agent and returns structured JSON.
    """
    from app.agents.soap_agent import structure_soap_note

    last_message = state["messages"][-1] if state["messages"] else ""
    if isinstance(last_message, dict):
        content = last_message.get("content", "")
    else:
        content = str(last_message)

    soap_data = await structure_soap_note(content)

    # Format as human-readable response
    response_lines = [
        "SOAP тэмдэглэл амжилттай бүтэцлэгдлээ:",
        f"S (Субьектив): {soap_data.get('S') or 'тодорхойгүй'}",
        f"O (Объектив): {soap_data.get('O') or 'тодорхойгүй'}",
        f"A (Үнэлгээ): {soap_data.get('A') or 'тодорхойгүй'}",
        f"P (Төлөвлөгөө): {soap_data.get('P') or 'тодорхойгүй'}",
    ]

    return {
        **state,
        "tool_result": soap_data,
        "final_response": "\n".join(response_lines),
    }


# ── NODE 2d: GENERAL RESPONSE ─────────────────────────────────────────────────
async def general_node(state: AgentState) -> AgentState:
    """
    Handle general messages that don't fit other categories.
    Uses Gemini for a helpful response in Mongolian.
    """
    GENERAL_SYSTEM_PROMPT = """You are a helpful AI assistant for Mongolian family doctors.
    Respond concisely and helpfully in Mongolian. If you don't know something, say so clearly."""

    last_message = state["messages"][-1] if state["messages"] else ""
    if isinstance(last_message, dict):
        content = last_message.get("content", "")
    else:
        content = str(last_message)

    try:
        response = await _client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=content,
            config=types.GenerateContentConfig(
                system_instruction=GENERAL_SYSTEM_PROMPT
            ),
        )
        return {**state, "final_response": response.text or ""}
    except Exception as e:
        logger.exception("General node failed: %s", e)
        return {
            **state,
            "final_response": "Уучлаарай, хүсэлтийг боловсруулахад алдаа гарлаа.",
        }


# ── BUILD THE GRAPH ───────────────────────────────────────────────────────────
# This section defines the workflow graph structure.
# Think of it as a flowchart: boxes = nodes, arrows = edges.

workflow = StateGraph(AgentState)

# Add all nodes to the graph
workflow.add_node("classify_intent", classify_intent)
workflow.add_node("schedule_node", schedule_node)
workflow.add_node("route_node", route_node)
workflow.add_node("soap_node", soap_node)
workflow.add_node("general_node", general_node)

# Entry point: every conversation starts at classify_intent
workflow.add_edge(START, "classify_intent")

# Conditional routing: after classify_intent, call route_by_intent() to decide next node
workflow.add_conditional_edges(
    "classify_intent",
    route_by_intent,
    {
        "schedule_node": "schedule_node",
        "route_node": "route_node",
        "soap_node": "soap_node",
        "general_node": "general_node",
    },
)

# All leaf nodes end the conversation
workflow.add_edge("schedule_node", END)
workflow.add_edge("route_node", END)
workflow.add_edge("soap_node", END)
workflow.add_edge("general_node", END)

# Compile the graph into a runnable application
# `orchestrator_app.ainvoke(state)` runs the full graph asynchronously
orchestrator_app = workflow.compile()
