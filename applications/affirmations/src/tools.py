"""LangChain tool definitions for the affirmations research agent.

Provides SearxNG metasearch and Wikipedia lookup tools. All tools pass their
raw output through the research processing layer before returning to the agent.
"""

from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities import SearxSearchWrapper, WikipediaAPIWrapper
from langchain_core.tools import BaseTool, Tool

from src.research import process_search_results


def _wrap_with_research_processing(
    tool_fn: BaseTool,
    source_name: str,
) -> Tool:
    """Wrap a tool so its output passes through the research processing layer.

    Args:
        tool_fn: The underlying LangChain tool to wrap.
        source_name: The source name for attribution in formatted results.

    Returns:
        A new Tool that processes the underlying tool's output.
    """

    def processed_run(query: str) -> str:
        raw = tool_fn.run(query)
        return process_search_results(str(raw), query, source_name)

    return Tool(
        name=tool_fn.name,
        description=tool_fn.description,
        func=processed_run,
    )


def create_tools() -> list[BaseTool]:
    """Create and return all available research tools.

    Includes: SearxNG metasearch (self-hosted), Wikipedia lookup.

    All tools pass their raw output through the research processing layer
    (Trafilatura extraction, relevance truncation, context formatting).

    Returns:
        List of BaseTool instances ready to bind to the LLM.
    """
    tools: list[BaseTool] = []

    # Wikipedia lookup (always available, public API)
    wiki_wrapper = WikipediaAPIWrapper(  # type: ignore[call-arg]
        top_k_results=2, doc_content_chars_max=2000
    )
    wiki_base = WikipediaQueryRun(api_wrapper=wiki_wrapper, name="wikipedia_lookup")
    tools.append(_wrap_with_research_processing(wiki_base, "wikipedia"))

    # SearxNG metasearch (self-hosted, aggregates 135+ engines)
    try:
        searxng_wrapper = SearxSearchWrapper(searx_host="http://localhost:8889")
        searxng_tool = Tool(
            name="searxng_search",
            description=(
                "Search using SearxNG, a self-hosted metasearch engine aggregating "
                "results from Wikipedia, DuckDuckGo, Google Scholar, ArXiv, GitHub, "
                "and more. Use for comprehensive research on spiritual practices, "
                "symbolism, history, and grammar structures."
            ),
            func=lambda query: process_search_results(searxng_wrapper.run(query), query, "searxng"),
        )
        tools.append(searxng_tool)
    except Exception:
        # SearxNG may not be available during unit tests or offline development
        pass

    return tools
