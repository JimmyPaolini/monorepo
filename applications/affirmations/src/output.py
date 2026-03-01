"""Utilities for saving and loading affirmation sets to/from JSON files."""

import json
from pathlib import Path

from src.models import AffirmationSet


def save_affirmations(affirmations: AffirmationSet, output_dir: Path) -> Path:
    """Save an AffirmationSet to a JSON file in the output directory.

    The file is named after the practice (e.g., output/tarot.json).

    Args:
        affirmations: The AffirmationSet to serialize.
        output_dir: The directory to write the JSON file to.

    Returns:
        The path to the written JSON file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{affirmations.practice}.json"
    output_path.write_text(affirmations.model_dump_json(indent=2), encoding="utf-8")
    return output_path


def load_affirmations(practice: str, output_dir: Path) -> AffirmationSet:
    """Load an AffirmationSet from a JSON file in the output directory.

    Args:
        practice: The practice name (e.g., 'tarot') — maps to {practice}.json.
        output_dir: The directory containing the JSON file.

    Returns:
        The deserialized AffirmationSet.

    Raises:
        FileNotFoundError: If no JSON file exists for the given practice.
        json.JSONDecodeError: If the file contains invalid JSON.
    """
    file_path = output_dir / f"{practice}.json"
    if not file_path.exists():
        raise FileNotFoundError(
            f"No affirmations file found for practice '{practice}' at {file_path}"
        )
    content = file_path.read_text(encoding="utf-8")
    return AffirmationSet.model_validate(json.loads(content))
