"""Unit tests for the research tools factory."""

from unittest.mock import MagicMock, patch

import pytest
from langchain_core.tools import BaseTool


def _make_mock_tool(name: str, description: str) -> MagicMock:
    """Create a MagicMock with proper string name/description attributes."""
    mock = MagicMock(spec=BaseTool)
    mock.name = name
    mock.description = description
    mock.run.return_value = "result"
    return mock


@pytest.mark.unit
class TestCreateTools:
    def test_returns_two_tools(self) -> None:
        """create_tools() returns exactly 2 tools (Wikipedia + SearxNG)."""
        with (
            patch("src.tools.WikipediaQueryRun") as mock_wiki,
            patch("src.tools.WikipediaAPIWrapper"),
            patch("src.tools.SearxSearchWrapper") as mock_searx,
        ):
            mock_wiki.return_value = _make_mock_tool("wikipedia_lookup", "Wikipedia lookup")
            mock_searx.return_value = MagicMock(run=MagicMock(return_value="searx result"))

            from src.tools import create_tools

            tools = create_tools()

        assert len(tools) == 2
        tool_names = [t.name for t in tools]
        assert "wikipedia_lookup" in tool_names
        assert "searxng_search" in tool_names

    def test_searxng_failure_returns_one_tool(self) -> None:
        """create_tools() returns just Wikipedia when SearxNG init fails."""
        with (
            patch("src.tools.WikipediaQueryRun") as mock_wiki,
            patch("src.tools.WikipediaAPIWrapper"),
            patch("src.tools.SearxSearchWrapper", side_effect=Exception("offline")),
        ):
            mock_wiki.return_value = _make_mock_tool("wikipedia_lookup", "Wikipedia lookup")

            from src.tools import create_tools as _create_tools

            tools = _create_tools()

        assert len(tools) == 1
        assert tools[0].name == "wikipedia_lookup"

    def test_all_tools_are_base_tool_instances(self) -> None:
        """All returned tools are BaseTool instances."""
        with (
            patch("src.tools.WikipediaQueryRun") as mock_wiki,
            patch("src.tools.WikipediaAPIWrapper"),
            patch("src.tools.SearxSearchWrapper") as mock_searx,
        ):
            mock_wiki.return_value = _make_mock_tool("wikipedia_lookup", "Wiki")
            mock_searx.return_value = MagicMock(run=MagicMock(return_value="r"))

            from src.tools import create_tools as _create_tools

            tool_list = _create_tools()

        for tool in tool_list:
            assert isinstance(tool, BaseTool), f"{tool} is not a BaseTool"
