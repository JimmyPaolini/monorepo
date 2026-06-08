"""📓 Jupyter notebook conformance validator."""

import json

import chevron

from src.validators.python.json.validator import _strip_comments, _validate_dfs
from src.validators.python.markdown.validator import validate_markdown_conformance
from src.validators.python.types import ConformanceError
from src.validators.python.validator import validate_python_conformance


def validate_notebook_conformance(
    *, data: dict, filename: str, instance: str, template: str
) -> dict:
    """Validates a Jupyter notebook (.ipynb) as JSON with cell content validation."""
    rendered = chevron.render(template, data)
    try:
        template_obj = json.loads(_strip_comments(rendered))
        instance_obj = json.loads(_strip_comments(instance))
    except json.JSONDecodeError as e:
        return {
            "errors": [
                ConformanceError(
                    error_type="code",
                    language="json",
                    message=f"JSON parse error: {e}",
                    fix="Fix the JSON syntax in the notebook file.",
                )
            ]
        }
    structural_errors = _validate_dfs(template_obj, instance_obj)
    cell_errors: list[ConformanceError] = []
    template_cells = template_obj.get("cells", [])
    instance_cells = instance_obj.get("cells", [])
    for i, template_cell in enumerate(template_cells):
        cell_type = template_cell.get("cell_type", "")
        template_source = "".join(template_cell.get("source", []))
        if i >= len(instance_cells):
            cell_errors.append(
                ConformanceError(
                    error_type="code",
                    language="json",
                    message=f'Missing notebook cell at index {i} (cell_type: "{cell_type}")',
                    instance_path=f"cells[{i}]",
                    fix=f"Add the missing cell at index {i} to the notebook.",
                )
            )
            continue
        instance_cell = instance_cells[i]
        instance_source = "".join(instance_cell.get("source", []))
        if cell_type == "code" and template_source.strip():
            result = validate_python_conformance(
                data=data,
                filename=filename,
                instance=instance_source,
                template=template_source,
            )
            cell_errors.extend(result["errors"])
        elif cell_type == "markdown" and template_source.strip():
            result = validate_markdown_conformance(
                data=data,
                filename=filename,
                instance=instance_source,
                template=template_source,
            )
            cell_errors.extend(result["errors"])
    return {"errors": [*structural_errors, *cell_errors]}
