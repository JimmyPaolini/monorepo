"""LangGraph ReAct agent for research-augmented affirmation generation.

The agent uses SearxNG metasearch (which aggregates Wikipedia and 135+ engines)
to research a spiritual practice before generating an affirmation informed by
the processed research context.
"""

from typing import Any

from langchain_core.messages import SystemMessage
from langchain_core.tools import BaseTool
from langchain_ollama import ChatOllama
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import create_react_agent

RESEARCH_AGENT_SYSTEM_PROMPT = """You are an expert researcher and affirmation writer specializing in spiritual practices.

Your workflow for generating affirmations:
1. RESEARCH: Use the available tools to gather information about the spiritual practice and topic.
   - Use searxng_search for comprehensive results across multiple sources including Wikipedia

2. GENERATE: Based on your research, create a rich, meaningful affirmation that incorporates
   the authentic symbolism, history, and spiritual significance of the topic.

Research results are pre-processed and condensed — trust the summaries rather than
requesting redundant searches on the same topic.

When generating affirmations:
- Follow the requested grammatical structure exactly
- Draw on authentic symbolism and meanings from your research
- Make the affirmation personal (use "I"), uplifting, and spiritually resonant
- Include relevant keywords from the spiritual practice
"""


def create_research_agent(
    llm: ChatOllama, tools: list[BaseTool]
) -> CompiledStateGraph[Any, Any, Any]:
    """Create a LangGraph ReAct agent for research-augmented affirmation generation.

    The agent first researches the topic using available tools (all outputs pass
    through the research processing layer with Trafilatura extraction), then
    generates an affirmation informed by the processed research results.

    Args:
        llm: A configured ChatOllama instance.
        tools: List of research tools (SearxNG Tool instances).

    Returns:
        A compiled LangGraph StateGraph ready to invoke with {"messages": [...]}.
    """
    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=SystemMessage(content=RESEARCH_AGENT_SYSTEM_PROMPT),
    )
