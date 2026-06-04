"""🔤 JSONC comment extraction utilities."""
import re

from ..constants import TODO_LINE_REGEX
from ..types import ConformanceError

_COMMENT_PATTERN = re.compile(r"//[^\n]*|/\*[\s\S]*?\*/")


def get_comments(text: str) -> list[str]:
    return [m.group(0).strip() for m in _COMMENT_PATTERN.finditer(text)]


def get_comments_with_offsets(text: str) -> list[tuple[str, int]]:
    return [(m.group(0).strip(), m.start()) for m in _COMMENT_PATTERN.finditer(text)]


def offset_to_line(text: str, offset: int) -> int:
    return text[:offset].count("\n") + 1


def validate_comments(*, template_text: str, instance_text: str) -> list[ConformanceError]:
    template_comments = get_comments_with_offsets(template_text)
    instance_comments = get_comments(instance_text)
    errors = []
    start_pos = 0
    for comment_text, offset in template_comments:
        is_todo = bool(TODO_LINE_REGEX.search(comment_text))
        idx = next(
            (
                i
                for i, ic in enumerate(instance_comments[start_pos:])
                if is_todo or ic == comment_text
            ),
            -1,
        )
        if idx == -1:
            template_line = offset_to_line(template_text, offset)
            errors.append(
                ConformanceError(
                    error_type="comment",
                    language="json",
                    message=f'Missing comment: "{comment_text}"',
                    template_line=template_line,
                    expected=comment_text,
                    fix=f"Add the comment `{comment_text}` to the instance file.",
                )
            )
        else:
            start_pos += idx + 1
    return errors
