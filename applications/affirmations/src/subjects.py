"""Spiritual practice configuration: topics and affirmation grammatical structures."""

from typing import TypeAlias

from pydantic import BaseModel

Primitive: TypeAlias = str | int | float | bool | None


class SubjectCategory(BaseModel):
    name: str
    slug: str


class Subject(BaseModel):
    category: SubjectCategory
    metadata: dict[str, Primitive] = {}
    name: str
    order: int
    slug: str


TAROT_CARDS = [
    {
        "name": "The Fool",
        "slug": "the-fool",
        "order": 0,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Magician",
        "slug": "the-magician",
        "order": 1,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The High Priestess",
        "slug": "the-high-priestess",
        "order": 2,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Empress",
        "slug": "the-empress",
        "order": 3,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Emperor",
        "slug": "the-emperor",
        "order": 4,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Hierophant",
        "slug": "the-hierophant",
        "order": 5,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Lovers",
        "slug": "the-lovers",
        "order": 6,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Chariot",
        "slug": "the-chariot",
        "order": 7,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "Strength",
        "slug": "strength",
        "order": 8,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Hermit",
        "slug": "the-hermit",
        "order": 9,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "Wheel of Fortune",
        "slug": "wheel-of-fortune",
        "order": 10,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "Justice",
        "slug": "justice",
        "order": 11,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Hanged Man",
        "slug": "the-hanged-man",
        "order": 12,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "Death",
        "slug": "death",
        "order": 13,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "Temperance",
        "slug": "temperance",
        "order": 14,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Devil",
        "slug": "the-devil",
        "order": 15,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Tower",
        "slug": "the-tower",
        "order": 16,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Star",
        "slug": "the-star",
        "order": 17,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Moon",
        "slug": "the-moon",
        "order": 18,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Sun",
        "slug": "the-sun",
        "order": 19,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "Judgment",
        "slug": "judgment",
        "order": 20,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The World",
        "slug": "the-world",
        "order": 21,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ace of Wands",
        "slug": "the-ace-of-wands",
        "order": 22,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Two of Wands",
        "slug": "the-two-of-wands",
        "order": 23,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Three of Wands",
        "slug": "the-three-of-wands",
        "order": 24,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Four of Wands",
        "slug": "the-four-of-wands",
        "order": 25,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Five of Wands",
        "slug": "the-five-of-wands",
        "order": 26,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Six of Wands",
        "slug": "the-six-of-wands",
        "order": 27,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Seven of Wands",
        "slug": "the-seven-of-wands",
        "order": 28,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Eight of Wands",
        "slug": "the-eight-of-wands",
        "order": 29,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Nine of Wands",
        "slug": "the-nine-of-wands",
        "order": 30,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ten of Wands",
        "slug": "the-ten-of-wands",
        "order": 31,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Page of Wands",
        "slug": "the-page-of-wands",
        "order": 32,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Knight of Wands",
        "slug": "the-knight-of-wands",
        "order": 33,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Queen of Wands",
        "slug": "the-queen-of-wands",
        "order": 34,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The King of Wands",
        "slug": "the-king-of-wands",
        "order": 35,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ace of Cups",
        "slug": "the-ace-of-cups",
        "order": 36,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Two of Cups",
        "slug": "the-two-of-cups",
        "order": 37,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Three of Cups",
        "slug": "the-three-of-cups",
        "order": 38,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Four of Cups",
        "slug": "the-four-of-cups",
        "order": 39,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Five of Cups",
        "slug": "the-five-of-cups",
        "order": 40,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Six of Cups",
        "slug": "the-six-of-cups",
        "order": 41,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Seven of Cups",
        "slug": "the-seven-of-cups",
        "order": 42,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Eight of Cups",
        "slug": "the-eight-of-cups",
        "order": 43,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Nine of Cups",
        "slug": "the-nine-of-cups",
        "order": 44,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ten of Cups",
        "slug": "the-ten-of-cups",
        "order": 45,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Page of Cups",
        "slug": "the-page-of-cups",
        "order": 46,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Knight of Cups",
        "slug": "the-knight-of-cups",
        "order": 47,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Queen of Cups",
        "slug": "the-queen-of-cups",
        "order": 48,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The King of Cups",
        "slug": "the-king-of-cups",
        "order": 49,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ace of Swords",
        "slug": "the-ace-of-swords",
        "order": 50,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Two of Swords",
        "slug": "the-two-of-swords",
        "order": 51,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Three of Swords",
        "slug": "the-three-of-swords",
        "order": 52,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Four of Swords",
        "slug": "the-four-of-swords",
        "order": 53,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Five of Swords",
        "slug": "the-five-of-swords",
        "order": 54,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Six of Swords",
        "slug": "the-six-of-swords",
        "order": 55,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Seven of Swords",
        "slug": "the-seven-of-swords",
        "order": 56,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Eight of Swords",
        "slug": "the-eight-of-swords",
        "order": 57,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Nine of Swords",
        "slug": "the-nine-of-swords",
        "order": 58,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ten of Swords",
        "slug": "the-ten-of-swords",
        "order": 59,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Page of Swords",
        "slug": "the-page-of-swords",
        "order": 60,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Knight of Swords",
        "slug": "the-knight-of-swords",
        "order": 61,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Queen of Swords",
        "slug": "the-queen-of-swords",
        "order": 62,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The King of Swords",
        "slug": "the-king-of-swords",
        "order": 63,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ace of Pentacles",
        "slug": "the-ace-of-pentacles",
        "order": 64,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Two of Pentacles",
        "slug": "the-two-of-pentacles",
        "order": 65,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Three of Pentacles",
        "slug": "the-three-of-pentacles",
        "order": 66,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Four of Pentacles",
        "slug": "the-four-of-pentacles",
        "order": 67,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Five of Pentacles",
        "slug": "the-five-of-pentacles",
        "order": 68,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Six of Pentacles",
        "slug": "the-six-of-pentacles",
        "order": 69,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Seven of Pentacles",
        "slug": "the-seven-of-pentacles",
        "order": 70,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Eight of Pentacles",
        "slug": "the-eight-of-pentacles",
        "order": 71,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Nine of Pentacles",
        "slug": "the-nine-of-pentacles",
        "order": 72,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Ten of Pentacles",
        "slug": "the-ten-of-pentacles",
        "order": 73,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Page of Pentacles",
        "slug": "the-page-of-pentacles",
        "order": 74,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Knight of Pentacles",
        "slug": "the-knight-of-pentacles",
        "order": 75,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The Queen of Pentacles",
        "slug": "the-queen-of-pentacles",
        "order": 76,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
    {
        "name": "The King of Pentacles",
        "slug": "the-king-of-pentacles",
        "order": 77,
        "category": {"name": "Tarot Card", "slug": "tarot-card"},
    },
]

LENORMAND_CARDS = [
    {
        "name": "Rider",
        "slug": "rider",
        "order": 1,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Clover",
        "slug": "clover",
        "order": 2,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Ship",
        "slug": "ship",
        "order": 3,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "House",
        "slug": "house",
        "order": 4,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Tree",
        "slug": "tree",
        "order": 5,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Clouds",
        "slug": "clouds",
        "order": 6,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Snake",
        "slug": "snake",
        "order": 7,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Coffin",
        "slug": "coffin",
        "order": 8,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Bouquet",
        "slug": "bouquet",
        "order": 9,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Scythe",
        "slug": "scythe",
        "order": 10,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Whip",
        "slug": "whip",
        "order": 11,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Birds",
        "slug": "birds",
        "order": 12,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Child",
        "slug": "child",
        "order": 13,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Fox",
        "slug": "fox",
        "order": 14,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Bear",
        "slug": "bear",
        "order": 15,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Stars",
        "slug": "stars",
        "order": 16,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Stork",
        "slug": "stork",
        "order": 17,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Dog",
        "slug": "dog",
        "order": 18,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Tower",
        "slug": "tower",
        "order": 19,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Garden",
        "slug": "garden",
        "order": 20,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Mountain",
        "slug": "mountain",
        "order": 21,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Crossroads",
        "slug": "crossroads",
        "order": 22,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Mice",
        "slug": "mice",
        "order": 23,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Heart",
        "slug": "heart",
        "order": 24,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Ring",
        "slug": "ring",
        "order": 25,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Book",
        "slug": "book",
        "order": 26,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Letter",
        "slug": "letter",
        "order": 27,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Man",
        "slug": "man",
        "order": 28,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Gentleman",
        "slug": "gentleman",
        "order": 29,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Woman",
        "slug": "woman",
        "order": 30,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Lady",
        "slug": "lady",
        "order": 31,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Lily",
        "slug": "lily",
        "order": 32,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Sun",
        "slug": "sun",
        "order": 33,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Moon",
        "slug": "moon",
        "order": 34,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Key",
        "slug": "key",
        "order": 35,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Fish",
        "slug": "fish",
        "order": 36,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Anchor",
        "slug": "anchor",
        "order": 37,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
    {
        "name": "Cross",
        "slug": "cross",
        "order": 38,
        "category": {"name": "Lenormand", "slug": "lenormand"},
    },
]

ASTROLOGY_SIGNS = [
    {
        "name": "Aries",
        "slug": "aries",
        "order": 1,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Taurus",
        "slug": "taurus",
        "order": 2,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Gemini",
        "slug": "gemini",
        "order": 3,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Cancer",
        "slug": "cancer",
        "order": 4,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Leo",
        "slug": "leo",
        "order": 5,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Virgo",
        "slug": "virgo",
        "order": 6,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Libra",
        "slug": "libra",
        "order": 7,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Scorpio",
        "slug": "scorpio",
        "order": 8,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Sagittarius",
        "slug": "sagittarius",
        "order": 9,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Capricorn",
        "slug": "capricorn",
        "order": 10,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Aquarius",
        "slug": "aquarius",
        "order": 11,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
    {
        "name": "Pisces",
        "slug": "pisces",
        "order": 12,
        "category": {"name": "Astrology Sign", "slug": "astrology-sign"},
    },
]

ASTROLOGY_PLANETS = [
    {
        "name": "Sun",
        "slug": "sun",
        "order": 1,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Moon",
        "slug": "moon",
        "order": 2,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Mercury",
        "slug": "mercury",
        "order": 3,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Venus",
        "slug": "venus",
        "order": 4,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Mars",
        "slug": "mars",
        "order": 5,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Jupiter",
        "slug": "jupiter",
        "order": 6,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Saturn",
        "slug": "saturn",
        "order": 7,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Uranus",
        "slug": "uranus",
        "order": 8,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Neptune",
        "slug": "neptune",
        "order": 9,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
    {
        "name": "Pluto",
        "slug": "pluto",
        "order": 10,
        "category": {"name": "Astrology Planet", "slug": "astrology-planet"},
    },
]

ASTROLOGY_ASTEROIDS = [
    {
        "name": "Chiron",
        "slug": "chiron",
        "order": 1,
        "category": {"name": "Astrology Asteroid", "slug": "astrology-asteroid"},
    },
    {
        "name": "Lilith",
        "slug": "lilith",
        "order": 2,
        "category": {"name": "Astrology Asteroid", "slug": "astrology-asteroid"},
    },
    {
        "name": "Ceres",
        "slug": "ceres",
        "order": 3,
        "category": {"name": "Astrology Asteroid", "slug": "astrology-asteroid"},
    },
    {
        "name": "Pallas",
        "slug": "pallas",
        "order": 4,
        "category": {"name": "Astrology Asteroid", "slug": "astrology-asteroid"},
    },
    {
        "name": "Juno",
        "slug": "juno",
        "order": 5,
        "category": {"name": "Astrology Asteroid", "slug": "astrology-asteroid"},
    },
    {
        "name": "Vesta",
        "slug": "vesta",
        "order": 6,
        "category": {"name": "Astrology Asteroid", "slug": "astrology-asteroid"},
    },
]

ASTROLOGY_ASPECTS = [
    {
        "name": "Conjunction",
        "slug": "conjunction",
        "order": 1,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Sextile",
        "slug": "sextile",
        "order": 2,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Square",
        "slug": "square",
        "order": 3,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Trine",
        "slug": "trine",
        "order": 4,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Opposition",
        "slug": "opposition",
        "order": 5,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Quincunx",
        "slug": "quincunx",
        "order": 6,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Semisextile",
        "slug": "semisextile",
        "order": 7,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Semisquare",
        "slug": "semisquare",
        "order": 8,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Sesquiquadrate",
        "slug": "sesquiquadrate",
        "order": 9,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Quintile",
        "slug": "quintile",
        "order": 10,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Biquintile",
        "slug": "biquintile",
        "order": 11,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Novile",
        "slug": "novile",
        "order": 12,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Binovile",
        "slug": "binovile",
        "order": 13,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Tredecile",
        "slug": "tredecile",
        "order": 14,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Septile",
        "slug": "septile",
        "order": 15,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Biseptile",
        "slug": "biseptile",
        "order": 16,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
    {
        "name": "Tredecile",
        "slug": "tredicile",
        "order": 17,
        "category": {"name": "Astrology Aspect", "slug": "astrology-aspect"},
    },
]

ASTROLOGY_HOUSES = [
    {
        "name": "First House (Ascendant)",
        "slug": "first-house",
        "order": 1,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Second House",
        "slug": "second-house",
        "order": 2,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Third House",
        "slug": "third-house",
        "order": 3,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Fourth House (Imum Coeli)",
        "slug": "fourth-house",
        "order": 4,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Fifth House",
        "slug": "fifth-house",
        "order": 5,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Sixth House",
        "slug": "sixth-house",
        "order": 6,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Seventh House (Descendant)",
        "slug": "seventh-house",
        "order": 7,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Eighth House",
        "slug": "eighth-house",
        "order": 8,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Ninth House",
        "slug": "ninth-house",
        "order": 9,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Tenth House (Medium Coeli)",
        "slug": "tenth-house",
        "order": 10,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Eleventh House",
        "slug": "eleventh-house",
        "order": 11,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
    {
        "name": "Twelfth House",
        "slug": "twelfth-house",
        "order": 12,
        "category": {"name": "Astrology House", "slug": "astrology-house"},
    },
]

MODALITIES = [
    {
        "name": "Cardinal",
        "slug": "cardinal",
        "order": 1,
        "category": {"name": "Modality", "slug": "modality"},
    },
    {
        "name": "Fixed",
        "slug": "fixed",
        "order": 2,
        "category": {"name": "Modality", "slug": "modality"},
    },
    {
        "name": "Mutable",
        "slug": "mutable",
        "order": 3,
        "category": {"name": "Modality", "slug": "modality"},
    },
]

POLARITIES = [
    {
        "name": "Negative",
        "slug": "negative",
        "order": 0,
        "category": {"name": "Polarity", "slug": "polarity"},
    },
    {
        "name": "Positive",
        "slug": "positive",
        "order": 1,
        "category": {"name": "Polarity", "slug": "polarity"},
    },
]


CHAKRAS = [
    {
        "name": "Root Chakra (Muladhara)",
        "slug": "root",
        "order": 1,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
    {
        "name": "Sacral Chakra (Svadhisthana)",
        "slug": "sacral",
        "order": 2,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
    {
        "name": "Solar Plexus Chakra (Manipura)",
        "slug": "solar-plexus",
        "order": 3,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
    {
        "name": "Heart Chakra (Anahata)",
        "slug": "heart",
        "order": 4,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
    {
        "name": "Throat Chakra (Vishuddha)",
        "slug": "throat",
        "order": 5,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
    {
        "name": "Third Eye Chakra (Ajna)",
        "slug": "third-eye",
        "order": 6,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
    {
        "name": "Crown Chakra (Sahasrara)",
        "slug": "crown",
        "order": 7,
        "category": {"name": "Chakra", "slug": "chakra"},
    },
]

RUNES = [
    {
        "name": "Fehu (Wealth)",
        "slug": "fehu",
        "order": 1,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Uruz (Strength)",
        "slug": "uruz",
        "order": 2,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Thurisaz (Protection)",
        "slug": "thurisaz",
        "order": 3,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Ansuz (Wisdom)",
        "slug": "ansuz",
        "order": 4,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Raidho (Journey)",
        "slug": "raidho",
        "order": 5,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Kenaz (Knowledge)",
        "slug": "kenaz",
        "order": 6,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Gebo (Partnership)",
        "slug": "gebo",
        "order": 7,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Wunjo (Joy)",
        "slug": "wunjo",
        "order": 8,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Hagalaz (Transformation)",
        "slug": "hagalaz",
        "order": 9,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Nauthiz (Need)",
        "slug": "nauthiz",
        "order": 10,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Isa (Stillness)",
        "slug": "isa",
        "order": 11,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Jera (Harvest)",
        "slug": "jera",
        "order": 12,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Eihwaz (Connection)",
        "slug": "eihwaz",
        "order": 13,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Perth (Mystery)",
        "slug": "perth",
        "order": 14,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Algiz (Protection)",
        "slug": "algiz",
        "order": 15,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Sowilo (Success)",
        "slug": "sowilo",
        "order": 16,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Tiwaz (Victory)",
        "slug": "tiwaz",
        "order": 17,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Berkano (Growth)",
        "slug": "berkano",
        "order": 18,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Ehwaz (Movement)",
        "slug": "ehwaz",
        "order": 19,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Mannaz (Humanity)",
        "slug": "mannaz",
        "order": 20,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Laguz (Flow)",
        "slug": "laguz",
        "order": 21,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Ingwaz (Potential)",
        "slug": "ingwaz",
        "order": 22,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Dagaz (Breakthrough)",
        "slug": "dagaz",
        "order": 23,
        "category": {"name": "Rune", "slug": "rune"},
    },
    {
        "name": "Othala (Heritage)",
        "slug": "othala",
        "order": 24,
        "category": {"name": "Rune", "slug": "rune"},
    },
]

SEPHIROTH = [
    {
        "name": "Kether (Crown)",
        "slug": "kether",
        "order": 1,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Chokmah (Wisdom)",
        "slug": "chokmah",
        "order": 2,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Binah (Understanding)",
        "slug": "binah",
        "order": 3,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Chesed (Mercy)",
        "slug": "chesed",
        "order": 4,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Geburah (Strength)",
        "slug": "geburah",
        "order": 5,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Tiphareth (Beauty)",
        "slug": "tiphareth",
        "order": 6,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Netzach (Victory)",
        "slug": "netzach",
        "order": 7,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Hod (Splendor)",
        "slug": "hod",
        "order": 8,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Yesod (Foundation)",
        "slug": "yesod",
        "order": 9,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
    {
        "name": "Malkuth (Kingdom)",
        "slug": "malkuth",
        "order": 10,
        "category": {"name": "Sephiroth", "slug": "sephiroth"},
    },
]

HEBREW_LETTERS = [
    {
        "name": "Aleph",
        "slug": "aleph",
        "order": 1,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "א"},
    },
    {
        "name": "Beth",
        "slug": "beth",
        "order": 2,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ב"},
    },
    {
        "name": "Gimel",
        "slug": "gimel",
        "order": 3,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ג"},
    },
    {
        "name": "Daleth",
        "slug": "daleth",
        "order": 4,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ד"},
    },
    {
        "name": "He",
        "slug": "he",
        "order": 5,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ה"},
    },
    {
        "name": "Vav",
        "slug": "vav",
        "order": 6,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ו"},
    },
    {
        "name": "Zayin",
        "slug": "zayin",
        "order": 7,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ז"},
    },
    {
        "name": "Chet",
        "slug": "chet",
        "order": 8,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ח"},
    },
    {
        "name": "Tet",
        "slug": "tet",
        "order": 9,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ט"},
    },
    {
        "name": "Yod",
        "slug": "yod",
        "order": 10,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "י"},
    },
    {
        "name": "Kaf",
        "slug": "kaf",
        "order": 11,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "כ"},
    },
    {
        "name": "Lamed",
        "slug": "lamed",
        "order": 12,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ל"},
    },
    {
        "name": "Mem",
        "slug": "mem",
        "order": 13,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "מ"},
    },
    {
        "name": "Nun",
        "slug": "nun",
        "order": 14,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "נ"},
    },
    {
        "name": "Samekh",
        "slug": "samekh",
        "order": 15,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ס"},
    },
    {
        "name": "Ayin",
        "slug": "ayin",
        "order": 16,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ע"},
    },
    {
        "name": "Pe",
        "slug": "pe",
        "order": 17,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "פ"},
    },
    {
        "name": "Tsadi",
        "slug": "tsadi",
        "order": 18,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "צ"},
    },
    {
        "name": "Qof",
        "slug": "qof",
        "order": 19,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ק"},
    },
    {
        "name": "Resh",
        "slug": "resh",
        "order": 20,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ר"},
    },
    {
        "name": "Shin",
        "slug": "shin",
        "order": 21,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ש"},
    },
    {
        "name": "Tav",
        "slug": "tav",
        "order": 22,
        "category": {"name": "Hebrew Letter", "slug": "hebrew-letter"},
        "metadata": {"letter": "ת"},
    },
]

KABBALAH_WORLDS = [
    {
        "name": "Atziluth (Emanation)",
        "slug": "atziluth",
        "order": 1,
        "category": {"name": "Kabbalah World", "slug": "kabbalah-world"},
    },
    {
        "name": "Briah (Creation)",
        "slug": "briah",
        "order": 2,
        "category": {"name": "Kabbalah World", "slug": "kabbalah-world"},
    },
    {
        "name": "Yetzirah (Formation)",
        "slug": "yetzirah",
        "order": 3,
        "category": {"name": "Kabbalah World", "slug": "kabbalah-world"},
    },
    {
        "name": "Assiah (Action)",
        "slug": "assiah",
        "order": 4,
        "category": {"name": "Kabbalah World", "slug": "kabbalah-world"},
    },
]

SOLFEGGIOS = [
    {
        "name": "Do",
        "slug": "do",
        "order": 1,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
    {
        "name": "Re",
        "slug": "re",
        "order": 2,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
    {
        "name": "Mi",
        "slug": "mi",
        "order": 3,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
    {
        "name": "Fa",
        "slug": "fa",
        "order": 4,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
    {
        "name": "Sol",
        "slug": "sol",
        "order": 5,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
    {
        "name": "La",
        "slug": "la",
        "order": 6,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
    {
        "name": "Ti",
        "slug": "ti",
        "order": 7,
        "category": {"name": "Solfeggio", "slug": "solfeggio"},
    },
]

WEEKDAYS = [
    {
        "name": "Monday",
        "slug": "monday",
        "order": 1,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
    {
        "name": "Tuesday",
        "slug": "tuesday",
        "order": 2,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
    {
        "name": "Wednesday",
        "slug": "wednesday",
        "order": 3,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
    {
        "name": "Thursday",
        "slug": "thursday",
        "order": 4,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
    {
        "name": "Friday",
        "slug": "friday",
        "order": 5,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
    {
        "name": "Saturday",
        "slug": "saturday",
        "order": 6,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
    {
        "name": "Sunday",
        "slug": "sunday",
        "order": 7,
        "category": {"name": "Weekday", "slug": "weekday"},
    },
]

ELEMENTS = [
    {
        "name": "Earth",
        "slug": "earth",
        "order": 1,
        "category": {"name": "Element", "slug": "element"},
    },
    {"name": "Air", "slug": "air", "order": 2, "category": {"name": "Element", "slug": "element"}},
    {
        "name": "Fire",
        "slug": "fire",
        "order": 3,
        "category": {"name": "Element", "slug": "element"},
    },
    {
        "name": "Water",
        "slug": "water",
        "order": 4,
        "category": {"name": "Element", "slug": "element"},
    },
]

COLORS = [
    {"name": "Black", "slug": "black", "order": 1, "category": {"name": "Color", "slug": "color"}},
    {"name": "White", "slug": "white", "order": 2, "category": {"name": "Color", "slug": "color"}},
    {"name": "Red", "slug": "red", "order": 3, "category": {"name": "Color", "slug": "color"}},
    {
        "name": "Orange",
        "slug": "orange",
        "order": 4,
        "category": {"name": "Color", "slug": "color"},
    },
    {
        "name": "Yellow",
        "slug": "yellow",
        "order": 5,
        "category": {"name": "Color", "slug": "color"},
    },
    {"name": "Green", "slug": "green", "order": 6, "category": {"name": "Color", "slug": "color"}},
    {"name": "Blue", "slug": "blue", "order": 7, "category": {"name": "Color", "slug": "color"}},
    {
        "name": "Indigo",
        "slug": "indigo",
        "order": 8,
        "category": {"name": "Color", "slug": "color"},
    },
    {
        "name": "Violet",
        "slug": "violet",
        "order": 9,
        "category": {"name": "Color", "slug": "color"},
    },
    {"name": "Pink", "slug": "pink", "order": 10, "category": {"name": "Color", "slug": "color"}},
    {"name": "Brown", "slug": "brown", "order": 11, "category": {"name": "Color", "slug": "color"}},
    {"name": "Gray", "slug": "gray", "order": 12, "category": {"name": "Color", "slug": "color"}},
]

GEMSTONES = [
    {
        "name": "Garnet",
        "slug": "garnet",
        "order": 1,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Amethyst",
        "slug": "amethyst",
        "order": 2,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Aquamarine",
        "slug": "aquamarine",
        "order": 3,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Diamond",
        "slug": "diamond",
        "order": 4,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Emerald",
        "slug": "emerald",
        "order": 5,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Pearl",
        "slug": "pearl",
        "order": 6,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Ruby",
        "slug": "ruby",
        "order": 7,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Peridot",
        "slug": "peridot",
        "order": 8,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Sapphire",
        "slug": "sapphire",
        "order": 9,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Opal",
        "slug": "opal",
        "order": 10,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Topaz",
        "slug": "topaz",
        "order": 11,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
    {
        "name": "Turquoise",
        "slug": "turquoise",
        "order": 12,
        "category": {"name": "Gemstone", "slug": "gemstone"},
    },
]

METALS = [
    {"name": "Gold", "slug": "gold", "order": 1, "category": {"name": "Metal", "slug": "metal"}},
    {
        "name": "Mercury",
        "slug": "mercury",
        "order": 2,
        "category": {"name": "Metal", "slug": "metal"},
    },
    {
        "name": "Copper",
        "slug": "copper",
        "order": 3,
        "category": {"name": "Metal", "slug": "metal"},
    },
    {
        "name": "Silver",
        "slug": "silver",
        "order": 4,
        "category": {"name": "Metal", "slug": "metal"},
    },
    {"name": "Iron", "slug": "iron", "order": 5, "category": {"name": "Metal", "slug": "metal"}},
    {"name": "Tin", "slug": "tin", "order": 6, "category": {"name": "Metal", "slug": "metal"}},
    {"name": "Lead", "slug": "lead", "order": 7, "category": {"name": "Metal", "slug": "metal"}},
]

NUMBERS = [
    {"name": "One", "slug": "one", "order": 1, "category": {"name": "Number", "slug": "number"}},
    {"name": "Two", "slug": "two", "order": 2, "category": {"name": "Number", "slug": "number"}},
    {
        "name": "Three",
        "slug": "three",
        "order": 3,
        "category": {"name": "Number", "slug": "number"},
    },
    {"name": "Four", "slug": "four", "order": 4, "category": {"name": "Number", "slug": "number"}},
    {"name": "Five", "slug": "five", "order": 5, "category": {"name": "Number", "slug": "number"}},
    {"name": "Six", "slug": "six", "order": 6, "category": {"name": "Number", "slug": "number"}},
    {
        "name": "Seven",
        "slug": "seven",
        "order": 7,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Eight",
        "slug": "eight",
        "order": 8,
        "category": {"name": "Number", "slug": "number"},
    },
    {"name": "Nine", "slug": "nine", "order": 9, "category": {"name": "Number", "slug": "number"}},
    {"name": "Ten", "slug": "ten", "order": 10, "category": {"name": "Number", "slug": "number"}},
    {
        "name": "Eleven",
        "slug": "eleven",
        "order": 11,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twelve",
        "slug": "twelve",
        "order": 12,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Thirteen",
        "slug": "thirteen",
        "order": 13,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Fourteen",
        "slug": "fourteen",
        "order": 14,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Fifteen",
        "slug": "fifteen",
        "order": 15,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Sixteen",
        "slug": "sixteen",
        "order": 16,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Seventeen",
        "slug": "seventeen",
        "order": 17,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Eighteen",
        "slug": "eighteen",
        "order": 18,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Nineteen",
        "slug": "nineteen",
        "order": 19,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty",
        "slug": "twenty",
        "order": 20,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty One",
        "slug": "twenty-one",
        "order": 21,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Two",
        "slug": "twenty-two",
        "order": 22,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Three",
        "slug": "twenty-three",
        "order": 23,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Four",
        "slug": "twenty-four",
        "order": 24,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Five",
        "slug": "twenty-five",
        "order": 25,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Six",
        "slug": "twenty-six",
        "order": 26,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Seven",
        "slug": "twenty-seven",
        "order": 27,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Eight",
        "slug": "twenty-eight",
        "order": 28,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Twenty Nine",
        "slug": "twenty-nine",
        "order": 29,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Thirty",
        "slug": "thirty",
        "order": 30,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Thirty One",
        "slug": "thirty-one",
        "order": 31,
        "category": {"name": "Number", "slug": "number"},
    },
    {
        "name": "Thirty Two",
        "slug": "thirty-two",
        "order": 32,
        "category": {"name": "Number", "slug": "number"},
    },
]

SUBJECTS = (
    TAROT_CARDS
    + LENORMAND_CARDS
    + ASTROLOGY_SIGNS
    + ASTROLOGY_PLANETS
    + ASTROLOGY_ASTEROIDS
    + ASTROLOGY_ASPECTS
    + ASTROLOGY_HOUSES
    + MODALITIES
    + POLARITIES
    + CHAKRAS
    + RUNES
    + SEPHIROTH
    + HEBREW_LETTERS
    + KABBALAH_WORLDS
    + SOLFEGGIOS
    + WEEKDAYS
    + ELEMENTS
    + COLORS
    + GEMSTONES
    + METALS
    + NUMBERS
)
