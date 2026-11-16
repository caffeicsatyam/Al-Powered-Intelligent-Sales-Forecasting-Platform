from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    Text
)

from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Lead(Base):

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    company_name: Mapped[str] = mapped_column(
        String(200),
        index=True
    )

    industry: Mapped[str] = mapped_column(
        String(120),
        index=True
    )

    contact_person: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    employee_count: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    technology_stack: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(40),
        default="New",
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class CompanyAnalysis(Base):

    __tablename__ = "company_analyses"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    lead_id: Mapped[int] = mapped_column(
        Integer,
        index=True
    )

    company_overview: Mapped[str] = mapped_column(Text)

    business_needs: Mapped[str] = mapped_column(Text)

    opportunities: Mapped[str] = mapped_column(Text)

    industry_analysis: Mapped[str] = mapped_column(Text)

    qualification_score: Mapped[int] = mapped_column(Integer)

    recommended_action: Mapped[str] = mapped_column(Text)

    generated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )