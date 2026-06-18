"""🔤 JSON/JSONC file conformance validator."""

import json
import re

import chevron

from src.validators.python.json.comments import validate_comments
from src.validators.python.types import ConformanceError

_TOKEN_PATTERN = re.compile(r'("(?:\\.|[^"\\])*")|(//[^\n]*|/\*[\s\S]*?\*/)')


def _strip_comments(text: str) -> str:
    return _TOKEN_PATTERN.sub(lambda m: m.group(1) if m.group(1) else "", text)


def _format_path(path: list) -> str:
    result = ""
    for segment in path:
        if isinstance(segment, int):
            result = f"{result}[{segment}]"
        elif result == "":
            result = segment
        else:
            result = f"{result}.{segment}"
    return result


def _validate_dfs(template, instance, path=None) -> list[ConformanceError]:
    if path is None:
        path = []
    errors = []
    if isinstance(template, list) and isinstance(instance, list):
        for template_item in template:
            current_path = _format_path(path)
            if isinstance(template_item, (bool, int, float, str, type(None))):
                if template_item not in instance:
                    item_path = (
                        f"{current_path}[{json.dumps(template_item)}]"
                        if current_path
                        else f"[{json.dumps(template_item)}]"
                    )
                    errors.append(
                        ConformanceError(
                            error_type="code",
                            language="json",
                            message=f'Missing required value: "{item_path}"',
                            instance_path=item_path,
                            template_path=item_path,
                            fix=f'Add the missing value at "{item_path}" to the instance file.',
                        )
                    )
            else:
                if not instance:
                    errors.append(
                        ConformanceError(
                            error_type="code",
                            language="json",
                            message=f'Missing required value: "{current_path}"',
                            instance_path=current_path,
                            template_path=current_path,
                            fix=f'Add the missing value at "{current_path}" to the instance file.',
                        )
                    )
                else:
                    candidate_errors = []
                    for i, instance_item in enumerate(instance):
                        candidate_errors.append(
                            _validate_dfs(template_item, instance_item, [*path, i])
                        )
                    best = min(candidate_errors, key=len)
                    errors.extend(best)
    elif isinstance(template, dict) and isinstance(instance, dict):
        for key in template:
            key_path = _format_path([*path, key])
            if key in instance:
                errors.extend(_validate_dfs(template[key], instance[key], [*path, key]))
            else:
                errors.append(
                    ConformanceError(
                        error_type="code",
                        language="json",
                        message=f'Missing required key: "{key_path}"',
                        instance_path=key_path,
                        template_path=key_path,
                        fix=f'Add the missing key "{key_path}" to the instance file.',
                    )
                )
    elif template != instance:
        current_path = _format_path(path)
        errors.append(
            ConformanceError(
                error_type="code",
                language="json",
                message=f'Key "{current_path}": expected {json.dumps(template)}, got {json.dumps(instance)}',
                instance_path=current_path,
                template_path=current_path,
                expected=json.dumps(template),
                actual=json.dumps(instance),
                fix=f'Change the value at "{current_path}" in the instance file to {json.dumps(template)}.',
            )
        )
    return errors


def validate_json_conformance(*, data: dict, filename: str, instance: str, template: str) -> dict:
    rendered = chevron.render(template, data)
    template_obj = json.loads(_strip_comments(rendered))
    instance_obj = json.loads(_strip_comments(instance))
    structural_errors = _validate_dfs(template_obj, instance_obj)
    comment_errors = validate_comments(template_text=rendered, instance_text=instance)
    return {"errors": [*structural_errors, *comment_errors]}
