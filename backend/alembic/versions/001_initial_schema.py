"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_created_at', 'users', ['created_at'])

    # Create contacts table
    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('firstname', sa.String(255), nullable=True),
        sa.Column('tel1', sa.String(20), nullable=True),
        sa.Column('tel2', sa.String(20), nullable=True),
        sa.Column('tel3', sa.String(20), nullable=True),
        sa.Column('social1', sa.Text(), nullable=True),
        sa.Column('social2', sa.Text(), nullable=True),
        sa.Column('social3', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_contacts_name', 'contacts', ['name'])
    op.create_index('ix_contacts_firstname', 'contacts', ['firstname'])
    op.create_index('ix_contacts_tel1', 'contacts', ['tel1'])
    op.create_index('ix_contacts_tel2', 'contacts', ['tel2'])
    op.create_index('ix_contacts_tel3', 'contacts', ['tel3'])
    op.create_index('ix_contacts_created_at_desc', 'contacts', ['created_at'])
    op.create_index('ix_contacts_created_by', 'contacts', ['created_by'])

    # Create contact_history table
    op.create_table(
        'contact_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('added_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('added_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_contact_history_contact_id', 'contact_history', ['contact_id'])
    op.create_index('ix_contact_history_added_at_desc', 'contact_history', ['added_at'])

    # Create logs table
    op.create_table(
        'logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('level', sa.String(50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('data', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_logs_timestamp', 'logs', ['timestamp'])
    op.create_index('ix_logs_user_id', 'logs', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_logs_user_id', table_name='logs')
    op.drop_index('ix_logs_timestamp', table_name='logs')
    op.drop_table('logs')
    
    op.drop_index('ix_contact_history_added_at_desc', table_name='contact_history')
    op.drop_index('ix_contact_history_contact_id', table_name='contact_history')
    op.drop_table('contact_history')
    
    op.drop_index('ix_contacts_created_by', table_name='contacts')
    op.drop_index('ix_contacts_created_at_desc', table_name='contacts')
    op.drop_index('ix_contacts_tel3', table_name='contacts')
    op.drop_index('ix_contacts_tel2', table_name='contacts')
    op.drop_index('ix_contacts_tel1', table_name='contacts')
    op.drop_index('ix_contacts_firstname', table_name='contacts')
    op.drop_index('ix_contacts_name', table_name='contacts')
    op.drop_table('contacts')
    
    op.drop_index('ix_users_created_at', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
