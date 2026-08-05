"""add email column to contacts

Revision ID: 003
Revises: 002
Create Date: 2026-05-06
"""

from alembic import op
import sqlalchemy as sa


revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("contacts", sa.Column("email", sa.String(length=255), nullable=True))
    op.create_index("ix_contacts_email", "contacts", ["email"], unique=False)


def downgrade():
    op.drop_index("ix_contacts_email", table_name="contacts")
    op.drop_column("contacts", "email")
