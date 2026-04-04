import json
from pathlib import Path

import pytest

from src.grammars import PRESENT
from src.models import Affirmation, GrammarAffirmations, SubjectAffirmations
from src.output import (
    strip_markdown_fences,
    write_affirmations_document_markdown,
    write_affirmations_json,
    write_affirmations_markdown,
)
from src.subjects import TAROT_CARDS


def _make_subject_affirmations() -> SubjectAffirmations:
    subject = TAROT_CARDS[0]  # The Fool
    grammar = PRESENT
    affirmations = [
        Affirmation(
            text=f"I am affirmation {i}.",
        )
        for i in range(1, 4)
    ]
    grammar_affirmations = GrammarAffirmations(grammar=grammar, affirmations=affirmations)
    return SubjectAffirmations(subject=subject, grammars=[grammar_affirmations])


@pytest.mark.unit
def test_write_affirmations_json_creates_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject_affirmations = _make_subject_affirmations()
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    write_affirmations_json(subject_affirmations)
    subject = subject_affirmations.subject
    output_file = tmp_path / "output" / "affirmations" / f"{subject.slug}.json"
    assert output_file.exists()


@pytest.mark.unit
def test_write_affirmations_json_valid_json(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject_affirmations = _make_subject_affirmations()
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    write_affirmations_json(subject_affirmations)
    subject = subject_affirmations.subject
    output_file = tmp_path / "output" / "affirmations" / f"{subject.slug}.json"
    parsed = json.loads(output_file.read_text())
    assert "grammars" in parsed
    assert len(parsed["grammars"]) == 1


@pytest.mark.unit
def test_write_affirmations_markdown_creates_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject_affirmations = _make_subject_affirmations()
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    write_affirmations_markdown(subject_affirmations)
    subject = subject_affirmations.subject
    output_file = tmp_path / "output" / "affirmations" / f"{subject.slug}.md"
    assert output_file.exists()


@pytest.mark.unit
def test_write_affirmations_markdown_heading(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject_affirmations = _make_subject_affirmations()
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    write_affirmations_markdown(subject_affirmations)
    subject = subject_affirmations.subject
    output_file = tmp_path / "output" / "affirmations" / f"{subject.slug}.md"
    content = output_file.read_text()
    assert f"# {subject.name} Affirmations" in content


@pytest.mark.unit
def test_write_affirmations_markdown_grammar_subheading(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject_affirmations = _make_subject_affirmations()
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    write_affirmations_markdown(subject_affirmations)
    subject = subject_affirmations.subject
    output_file = tmp_path / "output" / "affirmations" / f"{subject.slug}.md"
    content = output_file.read_text()
    assert f"## {PRESENT.name}" in content


@pytest.mark.unit
def test_write_affirmations_markdown_numbered_list(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    subject_affirmations = _make_subject_affirmations()
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    write_affirmations_markdown(subject_affirmations)
    subject = subject_affirmations.subject
    output_file = tmp_path / "output" / "affirmations" / f"{subject.slug}.md"
    content = output_file.read_text()
    assert "1. I am affirmation 1." in content
    assert "2. I am affirmation 2." in content
    assert "3. I am affirmation 3." in content


@pytest.mark.unit
def test_strip_markdown_fences_plain_text() -> None:
    assert strip_markdown_fences("Hello world") == "Hello world"


@pytest.mark.unit
def test_strip_markdown_fences_with_fence() -> None:
    content = "```\nsome content\n```"
    assert strip_markdown_fences(content) == "some content"


@pytest.mark.unit
def test_strip_markdown_fences_with_markdown_fence() -> None:
    content = "```markdown\nsome content\n```"
    assert strip_markdown_fences(content) == "some content"


@pytest.mark.unit
def test_strip_markdown_fences_strips_surrounding_whitespace() -> None:
    content = "  \n```\nsome content\n```\n  "
    assert strip_markdown_fences(content) == "some content"


@pytest.mark.unit
def test_write_document_creates_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    subject = TAROT_CARDS[0]  # The Fool
    work_dir = tmp_path / "app" / "src"
    work_dir.mkdir(parents=True)
    monkeypatch.chdir(work_dir)
    expected_file = (
        tmp_path
        / "output"
        / "affirmations"
        / "documents"
        / subject.category.slug
        / f"{subject.order}-{subject.slug}.md"
    )
    write_affirmations_document_markdown(subject, "# The Fool\nContent here.")
    assert expected_file.exists()
    assert "# The Fool" in expected_file.read_text()
