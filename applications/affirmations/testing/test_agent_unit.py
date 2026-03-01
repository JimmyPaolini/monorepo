"""Unit tests for the LangGraph ReAct agent."""

from unittest.mock import MagicMock, patch

import pytest


@pytest.mark.unit
class TestCreateResearchAgent:
    def test_agent_is_not_none(self) -> None:
        """create_research_agent returns a non-None compiled graph."""
        mock_compiled = MagicMock()
        mock_compiled.get_graph.return_value = MagicMock(nodes={"agent": None, "tools": None})

        with patch("src.agent.create_react_agent", return_value=mock_compiled):
            from src.agent import create_research_agent

            mock_llm = MagicMock()
            mock_tools = [MagicMock(), MagicMock()]
            agent = create_research_agent(mock_llm, mock_tools)

        assert agent is not None

    def test_agent_called_with_llm_and_tools(self) -> None:
        """create_research_agent passes llm and tools to create_react_agent."""
        mock_compiled = MagicMock()

        with patch("src.agent.create_react_agent", return_value=mock_compiled) as mock_create:
            from src.agent import create_research_agent

            mock_llm = MagicMock()
            mock_tools = [MagicMock(name="tool1"), MagicMock(name="tool2")]
            create_research_agent(mock_llm, mock_tools)

        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args
        # create_react_agent is called with model=llm, tools=tools, prompt=...
        assert call_kwargs.kwargs.get("model") == mock_llm or call_kwargs.args[0] == mock_llm
        tools_arg = call_kwargs.kwargs.get("tools") or (
            call_kwargs.args[1] if len(call_kwargs.args) > 1 else None
        )
        assert tools_arg == mock_tools

    def test_agent_graph_has_nodes(self) -> None:
        """The compiled agent graph has accessible nodes."""
        mock_graph = MagicMock()
        mock_graph.nodes = {"agent": None, "tools": None}
        mock_compiled = MagicMock()
        mock_compiled.get_graph.return_value = mock_graph

        with patch("src.agent.create_react_agent", return_value=mock_compiled):
            from src.agent import create_research_agent

            agent = create_research_agent(MagicMock(), [])

        graph = agent.get_graph()
        assert len(graph.nodes) > 0
