import re
from pathlib import Path

from src.models import SubjectAffirmations
from src.subjects import Subject


def strip_markdown_fences(content: str) -> str:
    """Strip leading/trailing markdown code fences that small LLMs sometimes emit."""
    content = content.strip()
    content = re.sub(r"^```(?:markdown)?\s*\n", "", content)
    content = re.sub(r"\n```\s*$", "", content)
    return content.strip()


def write_document(subject: Subject, content: str) -> None:
    output_directory = Path(f"../../output/{subject.category.slug}")
    output_directory.mkdir(parents=True, exist_ok=True)
    output_filename = f"{subject.order}-{subject.slug}.md"
    output_path = output_directory / output_filename
    output_path.write_text(content, encoding="utf-8")
    print(f"\nWritten to: {output_path.resolve()}\n")


def write_affirmations_json(
    subject: Subject,
    subject_affirmations: SubjectAffirmations,
    output_dir: Path | None = None,
) -> None:
    output_directory = output_dir if output_dir is not None else Path("../../output/affirmations")
    output_directory.mkdir(parents=True, exist_ok=True)
    output_path = output_directory / f"{subject.slug}.json"
    output_path.write_text(subject_affirmations.model_dump_json(indent=2), encoding="utf-8")
    print(f"\nWritten to: {output_path.resolve()}\n")


def write_affirmations_markdown(
    subject: Subject,
    subject_affirmations: SubjectAffirmations,
    output_dir: Path | None = None,
) -> None:
    output_directory = output_dir if output_dir is not None else Path("../../output/affirmations")
    output_directory.mkdir(parents=True, exist_ok=True)
    output_path = output_directory / f"{subject.slug}.md"
    lines: list[str] = [f"# {subject.name} Affirmations\n"]
    for grammar_affirmations in subject_affirmations.grammars:
        lines.append(f"\n## {grammar_affirmations.grammar.name}\n")
        for i, affirmation in enumerate(grammar_affirmations.affirmations, start=1):
            lines.append(f"{i}. {affirmation.text}")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nWritten to: {output_path.resolve()}\n")
