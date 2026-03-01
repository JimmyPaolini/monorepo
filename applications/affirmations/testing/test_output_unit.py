"""Unit tests for output save/load utilities."""

import json
from pathlib import Path

import pytest

from src.models import Affirmation, AffirmationSet
from src.output import load_affirmations, save_affirmations


def make_affirmation_set(practice: str = "tarot") -> AffirmationSet:
    return AffirmationSet(
        practice=practice,
        affirmations=[
            Affirmation(
                text="I am resilient through change",
                practice=practice,
                structure="I am [quality] through [process]",
                keywords=["resilience", "change"],
            )
        ],
    )


@pytest.mark.unit
class TestSaveAffirmations:
    def test_writes_json_file(self, tmp_path: Path) -> None:
        aff_set = make_affirmation_set("tarot")
        saved_path = save_affirmations(aff_set, tmp_path)
        assert saved_path.exists()
        assert saved_path.name == "tarot.json"

    def test_valid_json_content(self, tmp_path: Path) -> None:
        aff_set = make_affirmation_set("chakras")
        saved_path = save_affirmations(aff_set, tmp_path)
        data = json.loads(saved_path.read_text())
        assert data["practice"] == "chakras"
        assert len(data["affirmations"]) == 1

    def test_creates_output_dir_if_missing(self, tmp_path: Path) -> None:
        nested = tmp_path / "nested" / "output"
        aff_set = make_affirmation_set("runes")
        save_affirmations(aff_set, nested)
        assert nested.is_dir()


@pytest.mark.unit
class TestLoadAffirmations:
    def test_loads_saved_file(self, tmp_path: Path) -> None:
        aff_set = make_affirmation_set("astrology")
        save_affirmations(aff_set, tmp_path)
        loaded = load_affirmations("astrology", tmp_path)
        assert loaded.practice == "astrology"
        assert loaded.affirmations[0].text == "I am resilient through change"

    def test_raises_for_missing_file(self, tmp_path: Path) -> None:
        with pytest.raises(FileNotFoundError):
            load_affirmations("nonexistent", tmp_path)

    def test_round_trip_preserves_data(self, tmp_path: Path) -> None:
        aff_set = make_affirmation_set("kabbalah")
        save_affirmations(aff_set, tmp_path)
        loaded = load_affirmations("kabbalah", tmp_path)
        assert loaded.model_dump_json() == aff_set.model_dump_json()
