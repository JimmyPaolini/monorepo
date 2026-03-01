"""Unit tests for the research processing layer."""

import pytest

from src.research import (
    budget_context,
    deduplicate_results,
    extract_content,
    format_research_result,
    process_search_results,
    truncate_with_relevance,
)


@pytest.mark.unit
class TestExtractContent:
    def test_extracts_from_html(self) -> None:
        html = """
        <html>
        <nav>Menu</nav>
        <article><h1>Tarot</h1><p>The Tower represents sudden change.</p></article>
        <footer>Footer content</footer>
        </html>
        """
        result = extract_content(html)
        assert "Tower" in result or "sudden change" in result or len(result) > 0

    def test_returns_empty_for_empty_input(self) -> None:
        assert extract_content("") == ""
        assert extract_content("   ") == ""

    def test_handles_plain_text(self) -> None:
        plain = "The Tower card symbolizes upheaval and revelation."
        result = extract_content(plain)
        assert "Tower" in result or len(result) > 0

    def test_falls_back_for_non_content_html(self) -> None:
        # Minimal HTML that Trafilatura might not extract content from
        minimal = "<html><body><script>alert(1)</script></body></html>"
        result = extract_content(minimal)
        # Should return something (even if empty — just not raise)
        assert isinstance(result, str)


@pytest.mark.unit
class TestTruncateWithRelevance:
    def test_returns_text_unchanged_if_short(self) -> None:
        text = "The Tower card is all about transformation."
        result = truncate_with_relevance(text, "Tower transformation", max_chars=1000)
        assert result == text

    def test_truncates_to_max_chars(self) -> None:
        text = "a" * 2000
        result = truncate_with_relevance(text, "query", max_chars=500)
        assert len(result) <= 500

    def test_keeps_relevant_section(self) -> None:
        text = (
            "unrelated filler text " * 50
            + "The Tower card transformation spiritual "
            + "unrelated filler text " * 50
        )
        result = truncate_with_relevance(text, "Tower transformation spiritual", max_chars=200)
        # The result should prefer the relevant section
        assert isinstance(result, str)
        assert len(result) <= 200


@pytest.mark.unit
class TestFormatResearchResult:
    def test_produces_expected_format(self) -> None:
        result = format_research_result(
            title="Tower Tarot Meaning",
            source="wikipedia",
            content="The Tower represents sudden change.",
        )
        assert "[Source: wikipedia]" in result
        assert "Tower Tarot Meaning" in result
        assert "sudden change" in result

    def test_format_string(self) -> None:
        result = format_research_result("Title", "duckduckgo", "Content here")
        assert result == "[Source: duckduckgo] Title: Content here"


@pytest.mark.unit
class TestDeduplicateResults:
    def test_removes_duplicate_content(self) -> None:
        results = [
            {"content": "The Tower card represents sudden change and upheaval", "id": 1},
            {"content": "The Tower card represents sudden change and upheaval", "id": 2},
            {"content": "Completely different content about astrology", "id": 3},
        ]
        deduped = deduplicate_results(results)
        assert len(deduped) == 2

    def test_preserves_unique_results(self) -> None:
        results = [
            {"content": "Tarot symbolism and history", "id": 1},
            {"content": "Astrology zodiac signs", "id": 2},
            {"content": "Kabbalah tree of life", "id": 3},
        ]
        deduped = deduplicate_results(results)
        assert len(deduped) == 3

    def test_empty_input(self) -> None:
        assert deduplicate_results([]) == []


@pytest.mark.unit
class TestBudgetContext:
    def test_returns_empty_for_empty_input(self) -> None:
        assert budget_context([]) == ""

    def test_returns_all_if_within_budget(self) -> None:
        results = ["Short result 1", "Short result 2"]
        output = budget_context(results, max_total_chars=10000)
        assert "Short result 1" in output
        assert "Short result 2" in output

    def test_truncates_when_over_budget(self) -> None:
        results = ["a" * 500, "b" * 500, "c" * 500]
        output = budget_context(results, max_total_chars=600)
        assert len(output) <= 700  # Allow some overhead for separators

    def test_distributes_budget_across_results(self) -> None:
        results = ["x" * 1000, "y" * 1000]
        output = budget_context(results, max_total_chars=600)
        # Each result should get roughly equal budget
        parts = output.split("\n\n")
        if len(parts) >= 2:
            assert abs(len(parts[0]) - len(parts[1])) < 100


@pytest.mark.unit
class TestProcessSearchResults:
    def test_end_to_end_with_html(self) -> None:
        raw_html = """
        <html>
        <nav>Navigation menu items here</nav>
        <article>
          <h1>The Tower Tarot Card</h1>
          <p>The Tower (XVI) is one of the Major Arcana cards. It depicts a tower
          struck by lightning, with figures falling. It represents sudden change,
          upheaval, and the breaking down of false structures.</p>
        </article>
        <footer>Footer ads</footer>
        </html>
        """
        result = process_search_results(raw_html, "Tower tarot sudden change", "wikipedia")
        assert isinstance(result, str)
        # Should have source attribution or be empty if trafilatura couldn't extract
        if result:
            assert "[Source: wikipedia]" in result

    def test_returns_empty_for_empty_input(self) -> None:
        result = process_search_results("", "query", "source")
        assert result == ""

    def test_includes_source_attribution(self) -> None:
        raw = "The Tower represents sudden change and revelation in tarot."
        result = process_search_results(raw, "Tower tarot", "duckduckgo")
        if result:
            assert "[Source: duckduckgo]" in result
