# =============================================================================
# SCHEDULE AGENT — app/agents/schedule_agent.py
# =============================================================================
# Handles schedule-related intents from the orchestrator.
# Uses Gemini (one small LLM call) to extract the patient identifier from the
# natural language message, then calls the deterministic reorder_schedule_tool.
#
# FLOW:
#   Doctor/Patient message: "Энэ даваа гарагт үзлэгт очиж чадахгүй байна"
#         ↓
#   schedule_agent: Gemini extracts patient_id from context
#         ↓
#   reorder_schedule_tool: DB operation (zero tokens)
#         ↓
#   format_response: "Хуваарь шинэчлэгдлээ. Дараагийн өвчтөн 10:30-д ирнэ."
# =============================================================================

import logging
from typing import Any, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.tools.schedule_tools import reorder_schedule_tool

logger = logging.getLogger(__name__)


async def handle_schedule_update(
    state: Dict[str, Any],
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    LangGraph node: handles schedule update intent.

    This node is called when the orchestrator classifies the intent as "schedule_update".
    It expects state["tool_result"] to contain the schedule_id and patient_id extracted
    by the orchestrator's classification step.

    In the full implementation, the orchestrator's classify_intent node would extract
    these IDs from the message context. For now, we demonstrate the tool call pattern.

    Args:
        state: LangGraph agent state (see orchestrator.py for schema)
        db: Async database session

    Returns:
        Updated state with tool_result and final_response populated
    """
    tool_result_data = state.get("tool_result") or {}

    schedule_id = tool_result_data.get("schedule_id")
    patient_id = tool_result_data.get("patient_id")

    if not schedule_id or not patient_id:
        logger.warning("Schedule agent missing required IDs: %s", tool_result_data)
        return {
            **state,
            "final_response": (
                "Хуваарийн ID эсвэл оршин суугчийн ID олдсонгүй. "
                "Дахин зааж өгнө үү."
            ),
        }

    # Call the zero-token deterministic tool
    result = await reorder_schedule_tool(
        schedule_id=UUID(schedule_id),
        unavailable_patient_id=UUID(patient_id),
        db=db,
    )

    if result["success"]:
        response = (
            f"Хуваарь амжилттай шинэчлэгдлээ. "
            f"Үлдсэн зай: {result.get('remaining_capacity', 'тодорхойгүй')}"
        )
    else:
        response = f"Хуваарь шинэчлэхэд алдаа гарлаа: {result.get('error', 'Unknown error')}"

    return {
        **state,
        "tool_result": result,
        "final_response": response,
    }
