"""Unit tests for the spiritual practice configuration."""

import pytest
from pydantic import ValidationError

from src.practices import PRACTICES, PracticeConfig


@pytest.mark.unit
class TestPracticeConfig:
    def test_valid_config(self) -> None:
        config = PracticeConfig(
            name="test",
            topics=["Topic A", "Topic B"],
            structures=["I am [x]"],
        )
        assert config.name == "test"
        assert len(config.topics) == 2

    def test_empty_topics_raises(self) -> None:
        with pytest.raises(ValidationError):
            PracticeConfig(name="test", topics=[], structures=["I am [x]"])

    def test_empty_structures_raises(self) -> None:
        with pytest.raises(ValidationError):
            PracticeConfig(name="test", topics=["Topic A"], structures=[])


@pytest.mark.unit
class TestPracticesDict:
    def test_all_expected_practices_present(self) -> None:
        expected = {"tarot", "astrology", "chakras", "kabbalah", "runes", "lenormand"}
        assert expected.issubset(set(PRACTICES.keys()))

    def test_all_practices_have_non_empty_topics(self) -> None:
        for name, config in PRACTICES.items():
            assert len(config.topics) > 0, f"{name} has empty topics"

    def test_all_practices_have_non_empty_structures(self) -> None:
        for name, config in PRACTICES.items():
            assert len(config.structures) > 0, f"{name} has empty structures"

    def test_tarot_has_major_arcana(self) -> None:
        tarot = PRACTICES["tarot"]
        assert "The Tower" in tarot.topics
        assert "The Fool" in tarot.topics

    def test_astrology_has_all_zodiac_signs(self) -> None:
        astrology = PRACTICES["astrology"]
        signs = {
            "Aries",
            "Taurus",
            "Gemini",
            "Cancer",
            "Leo",
            "Virgo",
            "Libra",
            "Scorpio",
            "Sagittarius",
            "Capricorn",
            "Aquarius",
            "Pisces",
        }
        assert signs.issubset(set(astrology.topics))

    def test_chakras_has_seven_chakras(self) -> None:
        chakras = PRACTICES["chakras"]
        assert len(chakras.topics) == 7

    def test_all_practice_configs_are_practice_config_instances(self) -> None:
        for name, config in PRACTICES.items():
            assert isinstance(config, PracticeConfig), f"{name} is not PracticeConfig"
