"""Pydantic models for affirmation data structures."""

from pydantic import BaseModel, Field


class Affirmation(BaseModel):
    """A single structured affirmation for a spiritual practice."""

    text: str = Field(description="The affirmation text (e.g., 'I am resilient through change')")
    practice: str = Field(description="The spiritual practice (e.g., 'tarot', 'astrology')")
    structure: str = Field(
        description="The grammatical structure used (e.g., 'I am [quality] through [process]')"
    )
    keywords: list[str] = Field(description="Key symbolic words or themes from the affirmation")


class AffirmationSet(BaseModel):
    """A collection of affirmations for a single spiritual practice."""

    practice: str = Field(description="The spiritual practice name")
    affirmations: list[Affirmation] = Field(description="List of generated affirmations")


class ResearchResult(BaseModel):
    """A processed research result from a search or lookup tool."""

    query: str = Field(description="The search query used")
    source: str = Field(description="The source tool name (e.g., 'wikipedia', 'duckduckgo')")
    summary: str = Field(description="Condensed, LLM-digestible summary of the research content")
