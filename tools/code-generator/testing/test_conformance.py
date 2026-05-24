"""
Conformance Validator — Python side (pytest).

Discovers instance folders whose templates contain ``.py`` or ``.ipynb`` files,
renders Mustache templates with ``name_variables(name)`` (using ``chevron``),
then validates each file using:

- ``libcst``     for ``.py`` code cells / files
- ``json``       for notebook structure
- ``libcst``     for notebook code cells
- ``mistletoe``  for notebook Markdown cells

Because no Python-side generator templates currently exist, this suite
discovers zero instances and passes immediately.  When Python generators are
added the test will auto-expand via the discovery logic.

Error schema matches the shared ``ConformanceError`` TypeScript interface so
that downstream tooling can process both outputs uniformly.

Output: ``tools/code-generator/tmp/python-conformance-results.json``
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import chevron
import libcst as cst
import mistletoe
import pytest

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# This file lives at:  tools/code-generator/testing/test_conformance.py
# Workspace root is 3 levels up.
_HERE = Path(__file__).resolve().parent
WORKSPACE_ROOT = _HERE.parent.parent.parent  # …/monorepo
GENERATORS_DIR = WORKSPACE_ROOT / "tools" / "code-generator" / "src" / "generators"
RESULTS_OUTPUT_PATH = (
    WORKSPACE_ROOT / "tools" / "code-generator" / "tmp" / "python-conformance-results.json"
)

# ---------------------------------------------------------------------------
# name_variables (Python equivalent of the TS utility)
# ---------------------------------------------------------------------------

_name_variables_module = WORKSPACE_ROOT / "tools" / "code-generator" / "src" / "conformance" / "name_variables.py"
import importlib.util as _ilu

_spec = _ilu.spec_from_file_location("name_variables", str(_name_variables_module))
assert _spec and _spec.loader
_nv_mod = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_nv_mod)  # type: ignore[union-attr]
name_variables = _nv_mod.name_variables  # type: ignore[attr-defined]

# ---------------------------------------------------------------------------
# ConformanceError schema helpers
# ---------------------------------------------------------------------------

ConformanceError = dict[str, Any]


def _error(
    kind: str,
    file: str,
    expected: str,
    found: str | None,
    hint: str | None = None,
    line: int | None = None,
) -> ConformanceError:
    err: ConformanceError = {
        "kind": kind,
        "file": file,
        "expected": expected,
        "found": found,
    }
    if line is not None:
        err["location"] = {"line": line, "column": 0}
    if hint is not None:
        err["hint"] = hint
    return err


def _format_errors(folder_path: str, errors: list[ConformanceError]) -> str:
    lines = [f"CONFORMANCE FAILURE: {folder_path}", ""]
    for e in errors:
        tag = f"[{e['kind']}]".ljust(22)
        loc = f" line {e['location']['line']}" if e.get("location") else ""
        lines.append(f"{tag} {e['file']}{loc}")
        lines.append(f"                       Expected: {e['expected']}")
        lines.append(f"                       Found:    {e['found'] or '(none)'}")
        if hint := e.get("hint"):
            lines.append(f"                       Hint: {hint}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# TODO comment exclusion
# ---------------------------------------------------------------------------

def _is_todo_comment(text: str) -> bool:
    return text.strip().lower().startswith("todo")


# ---------------------------------------------------------------------------
# Python (.py) validator using libcst
# ---------------------------------------------------------------------------

def _validate_python_file(
    file: str,
    expected_src: str,
    actual_src: str,
) -> list[ConformanceError]:
    """Validate a ``.py`` file against its expected content using libcst."""
    errors: list[ConformanceError] = []
    try:
        expected_tree = cst.parse_module(expected_src)
        actual_tree = cst.parse_module(actual_src)
    except cst.ParserSyntaxError:
        return errors

    expected_defs = _collect_top_level_defs(expected_tree)
    actual_defs = _collect_top_level_defs(actual_tree)

    for name, expected_node in expected_defs.items():
        if name not in actual_defs:
            errors.append(
                _error(
                    kind="missing_function" if isinstance(expected_node, cst.FunctionDef) else "missing_export",
                    file=file,
                    expected=f"def {name}" if isinstance(expected_node, cst.FunctionDef) else f"class {name}",
                    found=None,
                    hint=f"Add a {'function' if isinstance(expected_node, cst.FunctionDef) else 'class'} named '{name}'",
                )
            )
            continue

        actual_node = actual_defs[name]
        if isinstance(expected_node, cst.FunctionDef) and isinstance(actual_node, cst.FunctionDef):
            errors.extend(_validate_function_def(file, expected_node, actual_node))

    # Validate module-level comments
    errors.extend(_validate_module_comments(file, expected_tree, actual_tree))

    return errors


def _unwrap_statement_node(
    stmt: cst.BaseStatement,
) -> cst.BaseStatement:
    """Unwrap a ``SimpleStatementLine`` to its first child if applicable."""
    if isinstance(stmt, cst.SimpleStatementLine) and hasattr(stmt, "body"):
        return stmt.body[0]  # type: ignore[return-value]
    return stmt


def _collect_top_level_defs(
    module: cst.Module,
) -> dict[str, cst.FunctionDef | cst.ClassDef]:
    result: dict[str, cst.FunctionDef | cst.ClassDef] = {}
    for stmt in module.body:
        node = _unwrap_statement_node(stmt)
        if isinstance(node, (cst.FunctionDef, cst.ClassDef)):
            result[node.name.value] = node
        elif isinstance(stmt, (cst.FunctionDef, cst.ClassDef)):
            result[stmt.name.value] = stmt
    return result


def _render_params(func: cst.FunctionDef) -> str:
    parts: list[str] = []
    for param in func.params.params:
        annotation = (
            cst.parse_module("").code_for_node(param.annotation.annotation)
            if param.annotation
            else ""
        )
        parts.append(f"{param.name.value}: {annotation}" if annotation else param.name.value)
    return ", ".join(parts)


def _validate_function_def(
    file: str,
    expected: cst.FunctionDef,
    actual: cst.FunctionDef,
) -> list[ConformanceError]:
    errors: list[ConformanceError] = []
    name = expected.name.value

    # Signature (parameters)
    expected_params = _render_params(expected)
    actual_params = _render_params(actual)
    if expected_params != actual_params:
        errors.append(
            _error(
                kind="wrong_signature",
                file=file,
                expected=f"def {name}({expected_params})",
                found=f"def {name}({actual_params})",
                hint=f"Update '{name}' to match expected parameter signature",
            )
        )

    # Inline comments (via leading lines)
    errors.extend(_validate_leading_comments(file, name, expected, actual))

    return errors


def _validate_leading_comments(
    file: str,
    name: str,
    expected: cst.FunctionDef | cst.ClassDef,
    actual: cst.FunctionDef | cst.ClassDef,
) -> list[ConformanceError]:
    errors: list[ConformanceError] = []

    expected_comments = _extract_leading_comments(expected)
    actual_comments = set(_extract_leading_comments(actual))

    for comment in expected_comments:
        if _is_todo_comment(comment):
            continue
        if comment not in actual_comments:
            errors.append(
                _error(
                    kind="missing_comment",
                    file=file,
                    expected=comment,
                    found=None,
                    hint=f"Add the comment '{comment}' before '{name}'",
                )
            )
    return errors


def _extract_leading_comments(node: cst.CSTNode) -> list[str]:
    """Extract leading comment texts from a CST node's leading lines."""
    comments: list[str] = []
    if hasattr(node, "lines_after_decorators"):
        for line in node.lines_after_decorators:
            for part in line.comment if hasattr(line, "comment") and line.comment else []:
                comments.append(str(part.value) if hasattr(part, "value") else "")
    if hasattr(node, "leading_lines"):
        for line in node.leading_lines:
            if hasattr(line, "comment") and line.comment is not None:
                comments.append(str(line.comment.value))
    return [c for c in comments if c]


def _validate_module_comments(
    file: str,
    expected: cst.Module,
    actual: cst.Module,
) -> list[ConformanceError]:
    errors: list[ConformanceError] = []
    expected_comments = _extract_module_comments(expected)
    actual_comments = set(_extract_module_comments(actual))

    for comment in expected_comments:
        if _is_todo_comment(comment):
            continue
        if comment not in actual_comments:
            errors.append(
                _error(
                    kind="missing_comment",
                    file=file,
                    expected=comment,
                    found=None,
                    hint=f"Add the comment '{comment}' at the module level",
                )
            )
    return errors


def _extract_module_comments(module: cst.Module) -> list[str]:
    comments: list[str] = []
    for stmt in module.body:
        if hasattr(stmt, "leading_lines"):
            for line in stmt.leading_lines:
                if hasattr(line, "comment") and line.comment is not None:
                    comments.append(str(line.comment.value))
    return comments


# ---------------------------------------------------------------------------
# Jupyter Notebook (.ipynb) validator
# ---------------------------------------------------------------------------

def _validate_notebook(
    file: str,
    expected_src: str,
    actual_src: str,
) -> list[ConformanceError]:
    """Validate a ``.ipynb`` notebook against its expected content."""
    errors: list[ConformanceError] = []
    try:
        expected_nb: dict[str, Any] = json.loads(expected_src)
        actual_nb: dict[str, Any] = json.loads(actual_src)
    except json.JSONDecodeError:
        return errors

    expected_cells: list[dict[str, Any]] = expected_nb.get("cells", [])
    actual_cells: list[dict[str, Any]] = actual_nb.get("cells", [])

    # 1. Cell count and types
    for i, expected_cell in enumerate(expected_cells):
        if i >= len(actual_cells):
            errors.append(
                _error(
                    kind="missing_cell",
                    file=file,
                    expected=f"cell {i} of type '{expected_cell.get('cell_type')}'",
                    found=None,
                    hint=f"Add cell {i} (type: {expected_cell.get('cell_type')})",
                    line=i,
                )
            )
            continue

        actual_cell = actual_cells[i]
        if expected_cell.get("cell_type") != actual_cell.get("cell_type"):
            errors.append(
                _error(
                    kind="wrong_cell_type",
                    file=file,
                    expected=f"cell {i} type '{expected_cell.get('cell_type')}'",
                    found=f"cell {i} type '{actual_cell.get('cell_type')}'",
                    hint=f"Change cell {i} to type '{expected_cell.get('cell_type')}'",
                    line=i,
                )
            )
            continue

        cell_type = expected_cell.get("cell_type")
        expected_source = "".join(expected_cell.get("source", []))
        actual_source = "".join(actual_cell.get("source", []))

        if cell_type == "code":
            cell_errors = _validate_python_file(file, expected_source, actual_source)
            for err in cell_errors:
                err.setdefault("location", {})["line"] = i
            errors.extend(cell_errors)
        elif cell_type == "markdown":
            md_errors = _validate_markdown_cell(file, expected_source, actual_source)
            for err in md_errors:
                err.setdefault("location", {})["line"] = i
            errors.extend(md_errors)

    return errors


def _validate_markdown_cell(
    file: str,
    expected_src: str,
    actual_src: str,
) -> list[ConformanceError]:
    """Validate markdown cell content using mistletoe (heading presence check)."""
    errors: list[ConformanceError] = []
    try:
        expected_doc = mistletoe.Document(expected_src)
        actual_doc = mistletoe.Document(actual_src)
    except Exception:  # noqa: BLE001
        return errors

    expected_headings = _extract_headings(expected_doc)
    actual_headings = _extract_headings(actual_doc)

    for heading in expected_headings:
        if heading not in actual_headings:
            errors.append(
                _error(
                    kind="missing_section",
                    file=file,
                    expected=heading,
                    found=None,
                    hint=f"Add the heading '{heading}' to the markdown cell",
                )
            )
    return errors


def _extract_headings(doc: Any) -> list[str]:
    headings: list[str] = []
    for child in getattr(doc, "children", []):
        type_name = type(child).__name__
        if type_name == "Heading":
            text = "".join(
                getattr(c, "content", "") for c in getattr(child, "children", [])
            )
            level = getattr(child, "level", 1)
            headings.append(f"{'#' * level} {text}")
    return headings


# ---------------------------------------------------------------------------
# Template and instance discovery
# ---------------------------------------------------------------------------

def _has_python_templates(generator_dir: Path) -> bool:
    """Return True if the generator's templates/ folder contains .py or .ipynb files."""
    templates_dir = generator_dir / "templates"
    if not templates_dir.is_dir():
        return False
    return any(
        f.suffix in {".py", ".ipynb"}
        for f in templates_dir.iterdir()
        if f.is_file()
    )


def _discover_python_generator_instances() -> list[tuple[Path, Path]]:
    """Return (template_dir, instance_dir) pairs for all Python-side generators.

    For each generator whose templates/ contains .py or .ipynb files, find all
    instance folders in corresponding project source directories.
    """
    instances: list[tuple[Path, Path]] = []
    if not GENERATORS_DIR.is_dir():
        return instances

    for generator_dir in sorted(GENERATORS_DIR.iterdir()):
        if not generator_dir.is_dir():
            continue
        if not _has_python_templates(generator_dir):
            continue
        templates_dir = generator_dir / "templates"
        # Instances must be discovered from the workspace; for now we return
        # an empty list since no Python templates exist.
        # Future: read generator metadata to find instance paths.
        _ = templates_dir  # noqa: F841
    return instances


# ---------------------------------------------------------------------------
# Parametrized test
# ---------------------------------------------------------------------------

_INSTANCES = _discover_python_generator_instances()
_ALL_RESULTS: dict[str, list[ConformanceError]] = {}


def _instance_id(pair: tuple[Path, Path]) -> str:
    return str(pair[1].relative_to(WORKSPACE_ROOT))


@pytest.mark.parametrize(
    "template_dir,instance_dir",
    _INSTANCES,
    ids=[_instance_id(p) for p in _INSTANCES],
)
def test_python_conformance(
    template_dir: Path,
    instance_dir: Path,
) -> None:
    """Validate a Python generator instance against its Mustache templates."""
    folder_name = instance_dir.name
    vars_ = name_variables(folder_name)
    errors: list[ConformanceError] = []

    # Render each template and validate the corresponding instance file
    for template_file in sorted(template_dir.iterdir()):
        if not template_file.is_file():
            continue
        if template_file.suffix not in {".py", ".ipynb"}:
            continue

        output_filename = re.sub(
            r"__(\w+)__",
            lambda m: str(vars_.get(m.group(1), "")),
            template_file.name,
        )
        instance_file = instance_dir / output_filename

        with template_file.open() as f:
            template_content = f.read()
        expected_content = chevron.render(template_content, vars_)

        if not instance_file.exists():
            errors.append(
                _error(
                    kind="missing_file",
                    file=output_filename,
                    expected=f"file {output_filename} to be present",
                    found=None,
                    hint=f"Create the file '{output_filename}' in the instance folder",
                )
            )
            continue

        actual_content = instance_file.read_text()

        if template_file.suffix == ".py":
            errors.extend(_validate_python_file(output_filename, expected_content, actual_content))
        elif template_file.suffix == ".ipynb":
            errors.extend(_validate_notebook(output_filename, expected_content, actual_content))

    _ALL_RESULTS[str(instance_dir.relative_to(WORKSPACE_ROOT))] = errors

    if errors:
        pytest.fail(
            _format_errors(
                str(instance_dir.relative_to(WORKSPACE_ROOT)),
                errors,
            )
        )


# ---------------------------------------------------------------------------
# name_variables parity test
# ---------------------------------------------------------------------------

_PARITY_CASES = [
    "calendar",
    "myService",
    "MyComponent",
    "annual_solar_cycle",
    "AnnualSolarCycle",
    "annualSolarCycle",
    "MY_SERVICE",
    "my-service",
]


@pytest.mark.parametrize("name", _PARITY_CASES)
def test_name_variables_parity(name: str) -> None:
    """Python name_variables must produce the same keys as the TypeScript equivalent."""
    result = name_variables(name)
    assert "name" in result
    assert "nameCamel" in result
    assert "namePascal" in result
    assert "nameSnake" in result
    assert "nameScream" in result
    assert "nameTitle" in result
    # name is always preserved as-is
    assert result["name"] == name


# ---------------------------------------------------------------------------
# Write JSON output after all tests (via session-scoped fixture)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _write_results() -> Any:
    yield
    RESULTS_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RESULTS_OUTPUT_PATH.open("w") as f:
        json.dump(_ALL_RESULTS, f, indent=2)
