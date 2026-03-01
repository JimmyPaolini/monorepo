"""Unit tests for Pydantic models."""

import json

import pytest
from pydantic import ValidationError

from src.models import Affirmation, AffirmationSet, ResearchResult


@pytest.mark.unit
class TestAffirmation:
    def test_valid_construction(self) -> None:
        aff = Affirmation(
            text="I am resilient through transformation",
            practice="tarot",
            structure="I am [quality] through [process]",
            keywords=["resilience", "transformation"],
        )
        assert aff.text == "I am resilient through transformation"
        assert aff.practice == "tarot"
        assert aff.keywords == ["resilience", "transformation"]

    def test_json_round_trip(self) -> None:
        aff = Affirmation(
            text="I shine through clarity",
            practice="astrology",
            structure="I [verb] through [quality]",
            keywords=["clarity", "light"],
        )
        json_str = aff.model_dump_json(indent=2)
        data = json.loads(json_str)
        restored = Affirmation.model_validate(data)
        assert restored.text == aff.text
        assert restored.keywords == aff.keywords

    def test_missing_text_raises(self) -> None:
        with pytest.raises(ValidationError):
            Affirmation.model_validate({"practice": "tarot", "structure": "x", "keywords": []})

    def test_missing_keywords_raises(self) -> None:
        with pytest.raises(ValidationError):
            Affirmation.model_validate({"text": "I am", "practice": "tarot", "structure": "x"})


@pytest.mark.unit
class TestAffirmationSet:
    def test_construction(self) -> None:
        aff = Affirmation(
            text="I am grounded", practice="chakras", structure="I am [state]", keywords=["ground"]
        )
        aff_set = AffirmationSet(practice="chakras", affirmations=[aff])
        assert aff_set.practice == "chakras"
        assert len(aff_set.affirmations) == 1

    def test_json_serialization(self) -> None:
        aff = Affirmation(
            text="I flow with wisdom",
            practice="kabbalah",
            structure="I [verb] with [quality]",
            keywords=["wisdom", "flow"],
        )
        aff_set = AffirmationSet(practice="kabbalah", affirmations=[aff])
        json_str = aff_set.model_dump_json(indent=2)
        data = json.loads(json_str)
        assert data["practice"] == "kabbalah"
        assert len(data["affirmations"]) == 1
        assert data["affirmations"][0]["text"] == "I flow with wisdom"

    def test_model_validate_json(self) -> None:
        json_str = json.dumps(
            {
                "practice": "runes",
                "affirmations": [
                    {
                        "text": "I carry strength",
                        "practice": "runes",
                        "structure": "I carry [quality]",
                        "keywords": ["strength"],
                    }
                ],
            }
        )
        restored = AffirmationSet.model_validate_json(json_str)
        assert restored.practice == "runes"
        assert restored.affirmations[0].text == "I carry strength"


@pytest.mark.unit
class TestResearchResult:
    def test_valid_construction(self) -> None:
        result = ResearchResult(
            query="tarot Tower card symbolism",
            source="wikipedia",
            summary="The Tower represents sudden change and revelation.",
        )
        assert result.source == "wikipedia"
        assert "Tower" in result.summary

    def test_missing_fields_raise(self) -> None:
        with pytest.raises(ValidationError):
            ResearchResult.model_validate({"query": "test"})
