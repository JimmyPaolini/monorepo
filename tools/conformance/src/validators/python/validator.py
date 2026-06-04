"""🐍 Python file conformance validator using abstract syntax trees."""
import ast
import io
import tokenize
from typing import Optional

import chevron

from .constants import TODO_LINE_REGEX
from .types import ConformanceError


def _extract_comments(source: str) -> list[tuple[str, int, int]]:
    """Extract (comment_text, line, col) from Python source using tokenize."""
    comments = []
    try:
        tokens = tokenize.generate_tokens(io.StringIO(source).readline)
        for tok_type, tok_str, (srow, scol), _, _ in tokens:
            if tok_type == tokenize.COMMENT:
                comments.append((tok_str, srow, scol))
    except tokenize.TokenizeError:
        pass
    return comments


def _get_key(node: ast.AST) -> Optional[str]:
    """Get a stable identity key for a Python AST node, or None if keyless."""
    if isinstance(node, ast.Import):
        return ",".join(alias.name for alias in node.names)
    if isinstance(node, ast.ImportFrom):
        return node.module or ""
    if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
        return node.name
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.Call):
        return _get_key(node.func)
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _get_children(node: ast.AST) -> list[ast.AST]:
    """Get semantically meaningful children of a Python AST node."""
    if isinstance(node, ast.Module):
        return list(node.body)
    if isinstance(node, ast.ClassDef):
        return [*node.decorator_list, *node.body]
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return list(node.decorator_list)
    return []


def _get_node_location(node: ast.AST) -> tuple[Optional[int], Optional[int]]:
    line = getattr(node, "lineno", None)
    col = getattr(node, "col_offset", None)
    return line, (col + 1 if col is not None else None)


def _build_error(
    template_child: ast.AST, instance_node: ast.AST, filename: str
) -> ConformanceError:
    kind = type(template_child).__name__
    key = _get_key(template_child)
    breadcrumb = f'{kind} "{key}"' if key is not None else kind
    instance_line, instance_col = _get_node_location(instance_node)
    template_line, template_col = _get_node_location(template_child)
    return ConformanceError(
        error_type="code",
        language="python",
        message=f"Missing {breadcrumb}",
        instance_line=instance_line,
        instance_column=instance_col,
        template_line=template_line,
        template_column=template_col,
        fix=f"Add the missing {breadcrumb} to the instance file. See the template for the expected structure.",
    )


def _filter_by_same_key(
    instance_nodes: list[ast.AST], template_node: ast.AST
) -> list[ast.AST]:
    key = _get_key(template_node)
    return [n for n in instance_nodes if _get_key(n) == key]


def _filter_by_same_type(
    instance_nodes: list[ast.AST], template_node: ast.AST
) -> list[ast.AST]:
    return [n for n in instance_nodes if type(n) == type(template_node)]


def _validate_dfs(
    template_node: ast.AST,
    instance_node: ast.AST,
    template_source: str,
    instance_source: str,
    filename: str,
) -> list[ConformanceError]:
    errors: list[ConformanceError] = []
    instance_children = _get_children(instance_node)
    template_children = _get_children(template_node)
    for template_child in template_children:
        key = _get_key(template_child)
        if key is not None:
            matches = _filter_by_same_key(instance_children, template_child)
            match = matches[0] if matches else None
            if match is None:
                errors.append(_build_error(template_child, instance_node, filename))
            else:
                errors.extend(
                    _validate_dfs(
                        template_child, match, template_source, instance_source, filename
                    )
                )
        else:
            same_type = _filter_by_same_type(instance_children, template_child)
            if not same_type:
                errors.append(_build_error(template_child, instance_node, filename))
            else:
                candidate_errors = [
                    _validate_dfs(
                        template_child, candidate, template_source, instance_source, filename
                    )
                    for candidate in same_type
                ]
                fewest = min(candidate_errors, key=len)
                errors.extend(fewest)
    return errors


def _validate_comments(
    template_source: str, instance_source: str
) -> list[ConformanceError]:
    template_comments = _extract_comments(template_source)
    instance_comment_texts = [c[0] for c in _extract_comments(instance_source)]
    errors = []
    start_pos = 0
    for comment_text, template_line, template_col in template_comments:
        is_todo = bool(TODO_LINE_REGEX.search(comment_text))
        idx = next(
            (
                i
                for i, ic in enumerate(instance_comment_texts[start_pos:])
                if is_todo or ic == comment_text
            ),
            -1,
        )
        if idx == -1:
            errors.append(
                ConformanceError(
                    error_type="comment",
                    language="python",
                    message=f'Missing comment: "{comment_text}"',
                    template_line=template_line,
                    template_column=template_col + 1,
                    expected=comment_text,
                    fix=f"Add the comment `{comment_text}` to the instance file at or near line {template_line}.",
                )
            )
        else:
            start_pos += idx + 1
    return errors


def validate_python_conformance(
    *, data: dict, filename: str, instance: str, template: str
) -> dict:
    """Validates that a generated Python file is a structural superset of its Mustache template."""
    rendered = chevron.render(template, data)
    try:
        template_tree = ast.parse(rendered, filename=filename)
    except SyntaxError as e:
        return {
            "errors": [
                ConformanceError(
                    error_type="code",
                    language="python",
                    message=f"Template syntax error: {e}",
                    fix="Fix the syntax error in the template.",
                )
            ]
        }
    try:
        instance_tree = ast.parse(instance, filename=filename)
    except SyntaxError as e:
        return {
            "errors": [
                ConformanceError(
                    error_type="code",
                    language="python",
                    message=f"Instance syntax error: {e}",
                    fix="Fix the syntax error in the instance file.",
                )
            ]
        }
    structural_errors = _validate_dfs(
        template_tree, instance_tree, rendered, instance, filename
    )
    comment_errors = _validate_comments(rendered, instance)
    return {"errors": [*structural_errors, *comment_errors]}
