"""🔤 Text file conformance validator."""
import chevron

from ..types import ConformanceError


def validate_text_conformance(
    *, data: dict, filename: str, instance: str, template: str
) -> dict:
    rendered = chevron.render(template, data)
    instance_line_counts: dict[str, int] = {}
    for line in instance.split("\n"):
        instance_line_counts[line] = instance_line_counts.get(line, 0) + 1
    errors = []
    for i, line in enumerate(rendered.split("\n")):
        count = instance_line_counts.get(line, 0)
        if count == 0:
            errors.append(
                ConformanceError(
                    error_type="code",
                    language="text",
                    message=f"Missing line: {line}",
                    template_line=i + 1,
                    expected=line,
                    fix=f"Add the line `{line}` to the instance file.",
                )
            )
        else:
            instance_line_counts[line] = count - 1
    return {"errors": errors}
