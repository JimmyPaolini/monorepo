"""Python conformance validator.

Verifies that a generated Python instance file is a structural superset of its
Mustache-rendered template using libcst for AST analysis.

Algorithm mirrors ``tools/code-generator/src/validators/abstract-syntax-tree.ts``:

- Depth-first superset semantics: every node present in the template must exist
  somewhere in the instance at the same tree depth.
- **Keyed** nodes are matched by a stable identity string (function/class name,
  import module, identifier text, etc.).  The matching instance node is then
  recursed into.
- **Keyless** nodes are matched by node kind; all same-kind instance candidates
  are evaluated and the one with the fewest errors is selected.
- Comment validation uses a sequential forward-cursor search so the instance
  may add extra comments between template comments without failing.
- Body-placeholder nodes (``pass``, ``...``) in the template are not enforced
  in the instance, mirroring how empty ``{}`` blocks work in TypeScript
  templates.

Public API
----------
``validate_conformance(template, instance, data)``
    Content-string entry point.  Returns a list of error strings.

``validate_instance_file(template_path, instance_path, data)``
    File-path convenience wrapper.
"""

from __future__ import annotations

import dataclasses
import re
from typing import Any

import chevron
import libcst as cst

# ---------------------------------------------------------------------------
# Node classification helpers
# ---------------------------------------------------------------------------

_WHITESPACE_TYPES = (
    cst.SimpleWhitespace,
    cst.Newline,
    cst.TrailingWhitespace,
    cst.EmptyLine,
    cst.ParenthesizedWhitespace,
)

# Type names (strings) of pure syntactic-separator nodes that carry no
# semantic meaning and should be excluded from the child list.
_PUNCTUATION_TYPE_NAMES: frozenset[str] = frozenset(
    [
        "Comma",
        "AssignEqual",
        "Dot",
        "ImportStar",
        "ParamSlash",  # the '/' positional-only separator
        "ParamStar",  # the '*' keyword-only separator
    ]
)


def _is_structural(node: cst.CSTNode) -> bool:
    """Return True for semantically meaningful (non-whitespace/punctuation) nodes."""
    if isinstance(node, _WHITESPACE_TYPES):
        return False
    if type(node).__name__ in _PUNCTUATION_TYPE_NAMES:
        return False
    if isinstance(node, cst.MaybeSentinel):
        return False
    return True


def _is_placeholder(node: cst.CSTNode) -> bool:
    """Return True for body-placeholder nodes that must not be enforced.

    ``pass`` and ``...`` are idiomatic Python stubs used in generator templates
    to satisfy the parser while leaving the body unconstrained — analogous to
    an empty ``{}`` block in a TypeScript template.
    """
    if isinstance(node, cst.Pass):
        return True
    if isinstance(node, cst.Expr) and isinstance(node.value, cst.Ellipsis):
        return True
    return False


# ---------------------------------------------------------------------------
# get_children
# ---------------------------------------------------------------------------


def get_children(node: cst.CSTNode) -> list[cst.CSTNode]:
    """Return the direct structural children of a libcst node.

    Sequences (tuples) stored in dataclass fields are flattened so each
    element appears as a direct child.  Whitespace nodes, punctuation
    sentinels, and ``MaybeSentinel`` values are excluded.  This mirrors the
    behavior of TypeScript's ``forEachChild()``.
    """
    out: list[cst.CSTNode] = []
    for field in dataclasses.fields(node):  # type: ignore[arg-type]
        _collect(getattr(node, field.name), out)
    return out


def _collect(value: Any, out: list[cst.CSTNode]) -> None:
    """Recursively flatten *value* into *out*, skipping non-structural items."""
    if value is None:
        return
    if isinstance(value, (bool, str, int, float)):
        return
    if isinstance(value, cst.CSTNode):
        if _is_structural(value):
            out.append(value)
    elif isinstance(value, (list, tuple)):
        for item in value:
            _collect(item, out)


# ---------------------------------------------------------------------------
# get_key
# ---------------------------------------------------------------------------


def get_key(node: cst.CSTNode) -> str | None:
    """Return a stable identity string for a libcst node, or ``None`` if anonymous.

    Mirrors ``getKey()`` from ``src/validators/nodes.ts``.  Keyed nodes are
    matched by their identity string; keyless nodes fall back to kind-based
    best-match selection.

    Key sources:

    - ``FunctionDef`` / ``ClassDef`` → the definition name
    - ``Param`` → the parameter name
    - ``Name`` → the identifier text
    - ``Attribute`` → dotted-name string (e.g. ``"os.path"``)
    - ``SimpleString`` / ``Integer`` / ``Float`` / ``Imaginary`` → the literal value
    - ``ImportFrom`` → the module path
    - ``ImportAlias`` → the imported name
    - ``Decorator`` → the decorator callable name
    - ``Arg`` (keyword) → the keyword name
    """
    # Named definitions
    if isinstance(node, (cst.FunctionDef, cst.ClassDef)):
        return node.name.value

    # Function parameters
    if isinstance(node, cst.Param):
        name = node.name
        return name.value if isinstance(name, cst.Name) else None

    # Bare identifiers
    if isinstance(node, cst.Name):
        return node.value

    # Dotted attribute access (e.g. ``os.path``, ``typing.Optional``)
    if isinstance(node, cst.Attribute):
        left = get_key(node.value)
        return f"{left}.{node.attr.value}" if left else None

    # String literals
    if isinstance(node, cst.SimpleString):
        return node.value

    # Numeric literals
    if isinstance(node, (cst.Integer, cst.Float, cst.Imaginary)):
        return node.value

    # Import aliases — keyed by the imported name
    if isinstance(node, cst.ImportAlias):
        name = node.name
        return get_key(name) if isinstance(name, cst.CSTNode) else None

    # ``from X import …`` — keyed by the module path
    if isinstance(node, cst.ImportFrom):
        module = node.module
        return get_key(module) if isinstance(module, cst.CSTNode) else None

    # Decorators — keyed by the callable name
    if isinstance(node, cst.Decorator):
        deco = node.decorator
        if isinstance(deco, cst.Name):
            return deco.value
        if isinstance(deco, cst.Attribute):
            return get_key(deco)
        if isinstance(deco, cst.Call):
            func = deco.func
            if isinstance(func, (cst.Name, cst.Attribute)):
                return get_key(func)
        return None

    # Keyword arguments — keyed by the keyword name
    if isinstance(node, cst.Arg):
        kw = node.keyword
        return kw.value if isinstance(kw, cst.Name) else None

    return None


# ---------------------------------------------------------------------------
# Comment validation (mirrors comments.ts)
# ---------------------------------------------------------------------------

_TODO_RE = re.compile(r"\btodo\b", re.IGNORECASE)


def _get_leading_comments(node: cst.CSTNode) -> list[str]:
    """Extract comment text from the leading lines of a libcst node."""
    comments: list[str] = []
    for attr in ("leading_lines", "lines_after_decorators"):
        lines = getattr(node, attr, None)
        if not lines:
            continue
        for line in lines:
            if isinstance(line, cst.EmptyLine) and line.comment is not None:
                comments.append(line.comment.value)
    return comments


def _validate_comments(
    template_node: cst.CSTNode,
    instance_node: cst.CSTNode,
) -> list[str]:
    """Check that every template comment is present in the instance (in order).

    Uses a sequential forward-cursor search so the instance may add extra
    comments between template comments without failing.  TODO comments match
    loosely — any ``# ... TODO ...`` line satisfies a template TODO comment.
    """
    errors: list[str] = []
    template_comments = _get_leading_comments(template_node)
    instance_comments = _get_leading_comments(instance_node)

    cursor = 0
    for tpl in template_comments:
        if _TODO_RE.search(tpl):
            continue
        found = next(
            (
                i
                for i, inst in enumerate(instance_comments[cursor:])
                if inst == tpl
            ),
            -1,
        )
        if found == -1:
            errors.append(f'Missing comment: "{tpl}"')
        else:
            cursor += found + 1

    return errors


# ---------------------------------------------------------------------------
# DFS validator (mirrors validateDepthFirstSearch in abstract-syntax-tree.ts)
# ---------------------------------------------------------------------------


def _node_kind(node: cst.CSTNode) -> str:
    """Return the node's type name (mirrors ``SyntaxKind`` name in TypeScript)."""
    return type(node).__name__


def _build_error(template_child: cst.CSTNode) -> str:
    """Build a human-readable error for a missing template node."""
    key = get_key(template_child)
    kind = _node_kind(template_child)
    breadcrumb = f'{kind} "{key}"' if key is not None else kind
    return f"Missing {breadcrumb}"


def validate_depth_first_search(
    template_node: cst.CSTNode,
    instance_node: cst.CSTNode,
) -> list[str]:
    """Recursively verify that the template is a structural subset of the instance.

    Mirrors ``validateDepthFirstSearch`` from
    ``src/validators/abstract-syntax-tree.ts``.

    For each child of *template_node*:

    - If the child has a key → find the same-keyed child in *instance_node*'s
      children and recurse.
    - If the child is keyless → find all same-kind children in *instance_node*,
      recurse into each, and propagate only the errors from the best match.
    - Body-placeholder nodes (``pass``, ``...``) are skipped.
    """
    errors: list[str] = _validate_comments(template_node, instance_node)

    instance_children = get_children(instance_node)
    template_children = [
        c for c in get_children(template_node) if not _is_placeholder(c)
    ]

    for template_child in template_children:
        child_key = get_key(template_child)

        if child_key is not None:
            # Keyed child: match by identity key.
            match = next(
                (ic for ic in instance_children if get_key(ic) == child_key),
                None,
            )
            if match is None:
                errors.append(_build_error(template_child))
            else:
                errors.extend(validate_depth_first_search(template_child, match))
        else:
            # Keyless child: match by kind, choosing the candidate with fewest errors.
            child_kind = _node_kind(template_child)
            same_kind = [
                ic for ic in instance_children if _node_kind(ic) == child_kind
            ]
            if not same_kind:
                errors.append(_build_error(template_child))
            else:
                fewest = min(
                    (
                        validate_depth_first_search(template_child, ic)
                        for ic in same_kind
                    ),
                    key=len,
                )
                errors.extend(fewest)

    return errors


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def validate_conformance(
    *,
    template: str,
    instance: str,
    data: dict[str, Any],
) -> list[str]:
    """Validate a Python instance file against its Mustache template.

    Renders *template* with *data* via Mustache, parses both the rendered
    template and *instance* as Python ASTs, then runs a depth-first superset
    check.  Returns a list of error strings; an empty list means the instance
    conforms.
    """
    rendered = chevron.render(template, data)
    try:
        template_tree = cst.parse_module(rendered)
        instance_tree = cst.parse_module(instance)
    except cst.ParserSyntaxError as exc:
        return [f"Parse error: {exc}"]

    return validate_depth_first_search(template_tree, instance_tree)


def validate_instance_file(
    *,
    template_path: str,
    instance_path: str,
    data: dict[str, Any],
) -> list[str]:
    """File-path wrapper around :func:`validate_conformance`.

    Returns ``["Missing file: <path>"]`` when either file does not exist
    instead of raising ``FileNotFoundError``, matching the TypeScript
    ``validateInstanceFile`` behavior.
    """
    from pathlib import Path  # noqa: PLC0415

    try:
        template_content = Path(template_path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return [f"Missing template file: {template_path}"]

    try:
        instance_content = Path(instance_path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return [f"Missing file: {instance_path}"]

    return validate_conformance(
        template=template_content,
        instance=instance_content,
        data=data,
    )
