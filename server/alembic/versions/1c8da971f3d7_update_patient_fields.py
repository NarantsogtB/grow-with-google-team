"""update patient fields

Revision ID: 1c8da971f3d7
Revises: a64af0e2d514
Create Date: 2026-05-13 23:19:56.729881

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1c8da971f3d7'
down_revision: Union[str, Sequence[str], None] = 'a64af0e2d514'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


gender_enum = sa.Enum('FEMALE', 'MALE', name='genderenum')
action_type_enum = sa.Enum('REGULAR_CHECK', 'FOLLOW_UP', 'EMERGENCY', name='actiontypeenum')
patient_type_enum = sa.Enum('NEWBORN', 'ELDERLY', 'PALLIATIVE', 'DISABLED', 'REGULAR', name='patienttypeenum')


def upgrade() -> None:
    """Upgrade schema."""

    # PostgreSQL дээр uuid үүсгэх extension
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')

    # Enum type-үүд үүсгэнэ
    gender_enum.create(op.get_bind(), checkfirst=True)
    action_type_enum.create(op.get_bind(), checkfirst=True)
    patient_type_enum.create(op.get_bind(), checkfirst=True)

    # Эхлээд uuid nullable=True гэж нэмнэ, учир нь хуучин rows байж магадгүй
    op.add_column('patients', sa.Column('uuid', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('patients', sa.Column('gender', gender_enum, nullable=True))
    op.add_column('patients', sa.Column('medical_history', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('anamnesis', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('symptoms', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('patients', sa.Column('action_type', action_type_enum, nullable=True))
    op.add_column('patients', sa.Column('guardian_phone', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('patient_type', patient_type_enum, nullable=False, server_default='REGULAR'))
    op.add_column('patients', sa.Column('registration_number', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('location_coordinates', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')))
    op.add_column('patients', sa.Column('last_visit_at', sa.DateTime(timezone=True), nullable=True))

    # Хуучин patient rows-д uuid бөглөнө
    op.execute("UPDATE patients SET uuid = gen_random_uuid()::text WHERE uuid IS NULL")

    # Дараа нь uuid-г NOT NULL болгоно
    op.alter_column('patients', 'uuid', nullable=False)

    # Index / unique constraint
    op.create_index('ix_patients_uuid', 'patients', ['uuid'], unique=True)
    op.create_index('ix_patients_registration_number', 'patients', ['registration_number'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index('ix_patients_registration_number', table_name='patients')
    op.drop_index('ix_patients_uuid', table_name='patients')

    op.drop_column('patients', 'last_visit_at')
    op.drop_column('patients', 'created_at')
    op.drop_column('patients', 'location_coordinates')
    op.drop_column('patients', 'registration_number')
    op.drop_column('patients', 'patient_type')
    op.drop_column('patients', 'guardian_phone')
    op.drop_column('patients', 'action_type')
    op.drop_column('patients', 'is_active')
    op.drop_column('patients', 'symptoms')
    op.drop_column('patients', 'anamnesis')
    op.drop_column('patients', 'medical_history')
    op.drop_column('patients', 'gender')
    op.drop_column('patients', 'age')
    op.drop_column('patients', 'uuid')

    patient_type_enum.drop(op.get_bind(), checkfirst=True)
    action_type_enum.drop(op.get_bind(), checkfirst=True)
    gender_enum.drop(op.get_bind(), checkfirst=True)