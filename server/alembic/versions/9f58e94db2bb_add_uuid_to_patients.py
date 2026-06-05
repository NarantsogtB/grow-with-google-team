"""add uuid to patients

Revision ID: 9f58e94db2bb
Revises: 1c8da971f3d7
Create Date: 2026-05-14 10:58:03.885120

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f58e94db2bb'
down_revision: Union[str, Sequence[str], None] = 'e3bc8f1b99c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
