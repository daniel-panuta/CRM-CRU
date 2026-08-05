"""Add role field to users table"""
from alembic import op
import sqlalchemy as sa


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('role', sa.String(20), nullable=False, server_default='user'))


def downgrade():
    op.drop_column('users', 'role')
