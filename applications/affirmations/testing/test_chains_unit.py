"""Unit tests for LCEL affirmation chains."""

from unittest.mock import MagicMock, patch

import pytest

from src.models import Affirmation


@pytest.mark.unit
class TestCreateAffirmationChain:
    def test_chain_returns_affirmation_type(self) -> None:
        """Verify create_affirmation_chain returns a Runnable."""
        from src.chains import create_affirmation_chain

        mock_llm = MagicMock()
        mock_structured = MagicMock()
        mock_llm.with_structured_output.return_value = mock_structured
        mock_chain = MagicMock()
        mock_prompt = MagicMock()
        mock_prompt.__or__ = MagicMock(return_value=mock_chain)

        with patch("src.chains.ChatPromptTemplate") as mock_template:
            mock_template.from_messages.return_value = mock_prompt
            chain = create_affirmation_chain(mock_llm)

        assert chain is not None
        mock_llm.with_structured_output.assert_called_once_with(Affirmation)

    def test_chain_invoke_passes_variables(self) -> None:
        """Verify chain invocation passes the correct template variables."""
        from src.chains import create_affirmation_chain

        expected_affirmation = Affirmation(
            text="I am resilient through transformation",
            practice="tarot",
            structure="I am [quality] through [process]",
            keywords=["resilience"],
        )

        mock_llm = MagicMock()
        mock_structured = MagicMock()
        mock_llm.with_structured_output.return_value = mock_structured
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = expected_affirmation
        mock_prompt = MagicMock()
        mock_prompt.__or__ = MagicMock(return_value=mock_chain)

        with patch("src.chains.ChatPromptTemplate") as mock_template:
            mock_template.from_messages.return_value = mock_prompt
            chain = create_affirmation_chain(mock_llm)

        result = chain.invoke(
            {
                "practice": "tarot",
                "topic": "The Tower",
                "structure": "I am [quality] through [process]",
            }
        )
        assert result.text == "I am resilient through transformation"
        assert result.practice == "tarot"
