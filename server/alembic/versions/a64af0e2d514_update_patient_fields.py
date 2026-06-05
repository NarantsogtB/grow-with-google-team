"""update patient fields

Revision ID: a64af0e2d514
Revises: 
Create Date: 2026-05-13 23:10:57.573515

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a64af0e2d514'
down_revision: Union[str, Sequence[str], None] = '9f58e94db2bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
