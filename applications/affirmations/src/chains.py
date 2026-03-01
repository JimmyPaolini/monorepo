"""Simple LCEL chain for direct affirmation generation (no research tools).

For research-augmented generation, use the LangGraph agent in agent.py instead.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from langchain_ollama import ChatOllama

from src.models import Affirmation

AFFIRMATION_SYSTEM_PROMPT = """You are an expert in spiritual practices and affirmation creation.
Generate a single affirmation for the given spiritual practice and topic.
Follow the specified grammatical structure exactly.
The affirmation should be uplifting, personal, and spiritually resonant."""

AFFIRMATION_HUMAN_PROMPT = """Create an affirmation for the {practice} practice.
Topic: {topic}
Grammatical structure to follow: {structure}

Generate an affirmation that embodies the spiritual energy of {topic} within {practice}."""


def create_affirmation_chain(llm: ChatOllama) -> Runnable[dict[str, str], Affirmation]:
    """Create a simple LCEL chain for affirmation generation without research tools.

    The chain accepts a dict with keys: practice, topic, structure.
    Returns a structured Affirmation validated by Pydantic.

    Args:
        llm: A configured ChatOllama instance.

    Returns:
        A RunnableSequence: ChatPromptTemplate | llm.with_structured_output(Affirmation)
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", AFFIRMATION_SYSTEM_PROMPT),
            ("human", AFFIRMATION_HUMAN_PROMPT),
        ]
    )
    structured_llm = llm.with_structured_output(Affirmation)
    return prompt | structured_llm  # type: ignore[return-value]
