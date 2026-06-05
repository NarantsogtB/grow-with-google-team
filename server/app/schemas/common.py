# =============================================================================
# COMMON SCHEMAS — app/schemas/common.py
# =============================================================================
# Shared Pydantic schema types used across multiple endpoints.
#
# WHY A GENERIC PAGINATED RESPONSE?
# Without this, each domain (patients, doctors, hospitals) would define its own
# `DoctorListResponse`, `HospitalListResponse`, etc. — all with identical structure.
# A Generic type lets us define the shape once and reuse:
#   PaginatedResponse[DoctorResponse]  # → list of doctors + total/page/size
#   PaginatedResponse[HospitalResponse]  # → list of hospitals + same metadata
# =============================================================================

from typing import Generic, List, TypeVar

from pydantic import BaseModel, ConfigDict

# T is a placeholder for any Pydantic model type
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated list response wrapper.

    All list endpoints should return this structure for consistency.
    The frontend can always expect `items`, `total`, `page`, `size` — no surprises.

    Example response body:
    {
        "items": [...],
        "total": 42,
        "page": 1,
        "size": 10
    }
    """

    items: List[T]
    total: int
    page: int
    size: int

    model_config = ConfigDict(from_attributes=True)


class DeleteResponse(BaseModel):
    """Standard response for DELETE operations."""

    message: str
    success: bool
