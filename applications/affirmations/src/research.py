"""Research processing layer for transforming raw search results into LLM-digestible context.

Uses Trafilatura for best-in-class HTML content extraction, then applies relevance-based
truncation, deduplication, and context budgeting to keep the 4B model's context window
focused on the most useful research material.
"""

import re
from typing import Any

import trafilatura


def extract_content(raw: str) -> str:
    """Extract main content from raw HTML using Trafilatura.

    Trafilatura removes boilerplate (navs, footers, ads, sidebars) and returns
    clean article text. Falls back to basic tag stripping if Trafilatura returns empty.

    Args:
        raw: Raw HTML or plain text content.

    Returns:
        Extracted main content as plain text.
    """
    if not raw or not raw.strip():
        return ""

    # Try Trafilatura extraction first
    extracted = trafilatura.extract(
        raw,
        include_comments=False,
        include_tables=True,
        no_fallback=False,
    )

    if extracted and extracted.strip():
        return extracted.strip()

    # Fallback: basic tag stripping for non-HTML content
    cleaned = re.sub(r"<[^>]+>", " ", raw)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def truncate_with_relevance(text: str, query: str, max_chars: int = 1000) -> str:
    """Keep the most query-relevant section of long text.

    Scores chunks by keyword overlap with the query and returns the highest-scoring
    chunk truncated to max_chars.

    Args:
        text: The input text to truncate.
        query: The search query for relevance scoring.
        max_chars: Maximum character length of the returned text.

    Returns:
        The most relevant portion of the text, at most max_chars characters.
    """
    if len(text) <= max_chars:
        return text

    query_words = set(query.lower().split())
    # Split into overlapping chunks of ~max_chars characters
    chunk_size = max_chars
    overlap = max_chars // 4
    chunks: list[str] = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start += chunk_size - overlap

    if not chunks:
        return text[:max_chars]

    # Score each chunk by keyword overlap
    def score_chunk(chunk: str) -> int:
        chunk_words = set(chunk.lower().split())
        return len(query_words & chunk_words)

    best_chunk = max(chunks, key=score_chunk)
    return best_chunk[:max_chars]


def format_research_result(title: str, source: str, content: str) -> str:
    """Format a single research result into a consistent template.

    Args:
        title: The result title or headline.
        source: The source tool name (e.g., 'wikipedia', 'duckduckgo').
        content: The extracted content text.

    Returns:
        Formatted string: "[Source: {source}] {title}: {content}"
    """
    return f"[Source: {source}] {title}: {content}"


def deduplicate_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Remove results with highly overlapping content across sources.

    Uses simple content fingerprinting (first 200 chars normalized) to detect
    near-duplicate results from different search engines.

    Args:
        results: List of result dicts with at least a "content" key.

    Returns:
        Deduplicated list of results.
    """
    seen_fingerprints: set[str] = set()
    unique_results: list[dict[str, Any]] = []

    for result in results:
        content = str(result.get("content", ""))
        # Create a simple fingerprint from normalized first 200 chars
        fingerprint = re.sub(r"\s+", " ", content[:200].lower().strip())
        if fingerprint not in seen_fingerprints:
            seen_fingerprints.add(fingerprint)
            unique_results.append(result)

    return unique_results


def budget_context(results: list[str], max_total_chars: int = 12000) -> str:
    """Cap total research context to preserve the model's context window.

    Distributes the character budget proportionally across results.

    Args:
        results: List of formatted research result strings.
        max_total_chars: Maximum total character budget (default: ~3000 tokens).

    Returns:
        Concatenated research context within the character budget.
    """
    if not results:
        return ""

    if sum(len(r) for r in results) <= max_total_chars:
        return "\n\n".join(results)

    # Distribute budget proportionally
    per_result_budget = max_total_chars // len(results)
    truncated = [r[:per_result_budget] for r in results]
    return "\n\n".join(truncated)


def process_search_results(raw_results: str, query: str, source_name: str) -> str:
    """Main entry point: transform a tool's raw output into LLM-digestible context.

    Applies the full pipeline: extract → truncate with relevance → format.

    Args:
        raw_results: Raw output from a search or lookup tool (may be HTML or plain text).
        query: The original search query for relevance scoring.
        source_name: The tool/source name for attribution (e.g., 'wikipedia').

    Returns:
        Processed, formatted research context string ready for the LLM.
    """
    extracted = extract_content(raw_results)
    if not extracted:
        return ""

    truncated = truncate_with_relevance(extracted, query, max_chars=1000)
    return format_research_result(title=query, source=source_name, content=truncated)
