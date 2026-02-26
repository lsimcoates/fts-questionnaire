from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column
import os

# Use JSONB on Postgres; fallback to JSON on SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_POSTGRES = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql+psycopg2://")

if IS_POSTGRES:
    from sqlalchemy.dialects.postgresql import JSONB as JSON_TYPE
else:
    from sqlalchemy import JSON as JSON_TYPE


class Questionnaire(SQLModel, table=True):
    id: str = Field(primary_key=True, index=True)

    case_number: str = Field(index=True)
    version: int = Field(default=1, index=True)

    status: str = Field(default="draft", index=True)  # draft|submitted
    redo_of_id: Optional[str] = Field(default=None, index=True)

    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    submitted_at: Optional[str] = Field(default=None, index=True)

    user_id: Optional[int] = Field(default=None, index=True)
    user_email: Optional[str] = Field(default=None, index=True)

    data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON_TYPE))
