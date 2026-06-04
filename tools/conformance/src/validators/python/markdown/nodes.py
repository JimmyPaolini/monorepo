"""🔤 Markdown AST node utilities for conformance validation."""
from ..constants import TODO_LINE_REGEX

CONTAINER_TYPES = frozenset(
    [
        "Quote",
        "List",
        "ListItem",
        "Paragraph",
        "Table",
        "TableRow",
    ]
)


def get_text(node) -> str:
    """Extract all text content from a mistletoe node."""
    from mistletoe.span_token import RawText

    if isinstance(node, RawText):
        return node.content
    if hasattr(node, "content") and isinstance(node.content, str):
        return node.content
    if hasattr(node, "children") and node.children:
        return "".join(get_text(child) for child in node.children)
    return ""


def text_matches(template_text: str, instance_text: str) -> bool:
    """Compare two texts line-by-line; TODO lines accept any content."""
    template_lines = template_text.split("\n")
    instance_lines = instance_text.split("\n")
    if len(template_lines) != len(instance_lines):
        return False
    return all(
        bool(TODO_LINE_REGEX.search(t)) or t == i
        for t, i in zip(template_lines, instance_lines)
    )


def get_node_children(node) -> list:
    """Get meaningful children of a markdown node for recursion."""
    from mistletoe.block_token import Table, TableRow

    if isinstance(node, Table):
        rows = []
        if hasattr(node, "header") and node.header is not None:
            rows.append(node.header)
        if hasattr(node, "children") and node.children:
            rows.extend(node.children)
        return rows
    if isinstance(node, TableRow):
        if hasattr(node, "cells"):
            return list(node.cells)
        if hasattr(node, "children"):
            return list(node.children)
        return []
    if hasattr(node, "children") and node.children:
        return list(node.children)
    return []


def nodes_match(template_node, instance_node) -> bool:
    """Returns True when instance_node is a valid match for template_node."""
    from mistletoe.block_token import (
        Heading,
        CodeFence,
        BlockCode,
        List,
        ListItem,
        Table,
        TableRow,
        ThematicBreak,
        Quote,
        Paragraph,
    )
    from mistletoe.span_token import Link, Image, Strong, Emphasis, InlineCode, RawText

    if type(template_node) != type(instance_node):
        return False
    if isinstance(template_node, Heading):
        return template_node.level == instance_node.level and text_matches(
            get_text(template_node), get_text(instance_node)
        )
    if isinstance(template_node, (Paragraph, Quote, ListItem)):
        return text_matches(get_text(template_node), get_text(instance_node))
    if isinstance(template_node, (CodeFence, BlockCode)):
        t_lang = getattr(template_node, "language", "") or ""
        i_lang = getattr(instance_node, "language", "") or ""
        return t_lang == i_lang and text_matches(
            get_text(template_node), get_text(instance_node)
        )
    if isinstance(template_node, List):
        t_ordered = getattr(template_node, "start", None) is not None
        i_ordered = getattr(instance_node, "start", None) is not None
        return t_ordered == i_ordered
    if isinstance(template_node, Table):
        t_header = getattr(template_node, "header", None)
        i_header = getattr(instance_node, "header", None)
        if t_header is None or i_header is None:
            return True
        t_cells = get_node_children(t_header)
        i_cells = get_node_children(i_header)
        return len(t_cells) == len(i_cells)
    if isinstance(template_node, TableRow):
        t_cells = get_node_children(template_node)
        i_cells = get_node_children(instance_node)
        return len(t_cells) == len(i_cells)
    if isinstance(template_node, ThematicBreak):
        return True
    if isinstance(template_node, Link):
        t_target = getattr(template_node, "target", None) or getattr(template_node, "url", "") or ""
        i_target = getattr(instance_node, "target", None) or getattr(instance_node, "url", "") or ""
        return text_matches(t_target, i_target) and text_matches(
            get_text(template_node), get_text(instance_node)
        )
    if isinstance(template_node, Image):
        t_src = getattr(template_node, "src", None) or getattr(template_node, "url", "") or ""
        i_src = getattr(instance_node, "src", None) or getattr(instance_node, "url", "") or ""
        t_alt = get_text(template_node)
        i_alt = get_text(instance_node)
        return text_matches(t_src, i_src) and t_alt == i_alt
    if isinstance(template_node, (Strong, Emphasis)):
        return text_matches(get_text(template_node), get_text(instance_node))
    if isinstance(template_node, InlineCode):
        return text_matches(get_text(template_node), get_text(instance_node))
    # Handle Strikethrough gracefully (GFM extension, may not always be importable)
    return text_matches(get_text(template_node), get_text(instance_node))


def build_error(node, instance_hint=None):
    """Build a ConformanceError for a missing markdown node."""
    from ..types import ConformanceError
    from mistletoe.block_token import (
        Heading,
        CodeFence,
        BlockCode,
        List,
        ThematicBreak,
        Table,
        Paragraph,
        Quote,
        ListItem,
        TableRow,
    )
    from mistletoe.span_token import Link, Image, Strong, Emphasis, InlineCode

    node_type = type(node).__name__
    pos = getattr(node, "position", None)
    template_line = None
    template_col = None
    instance_line = None
    instance_col = None
    if pos is not None:
        template_line = pos.start.line if hasattr(pos, "start") else None
        template_col = pos.start.column if hasattr(pos, "start") else None
    if instance_hint is not None:
        h_pos = getattr(instance_hint, "position", None)
        if h_pos is not None and hasattr(h_pos, "end"):
            instance_line = (h_pos.end.line or 1) + 1
            instance_col = 1
    text = get_text(node)
    fix = f"Add the missing {node_type} to the instance file. See the template for the expected content."
    if isinstance(node, Heading):
        message = f'Expected heading (h{node.level}): "{text}"'
    elif isinstance(node, Paragraph):
        message = f'Expected paragraph: "{text}"'
    elif isinstance(node, (CodeFence, BlockCode)):
        lang = getattr(node, "language", None) or "(none)"
        message = f'Expected code block ({lang}): "{text}"'
    elif isinstance(node, Quote):
        message = f'Expected blockquote: "{text}"'
    elif isinstance(node, List):
        kind = "ordered" if getattr(node, "start", None) is not None else "unordered"
        message = f"Expected {kind} list"
    elif isinstance(node, ListItem):
        message = f'Expected list item: "{text}"'
    elif isinstance(node, Table):
        message = "Expected table"
    elif isinstance(node, TableRow):
        message = f'Expected table row: "{text}"'
    elif isinstance(node, ThematicBreak):
        message = "Expected thematic break (---)"
    elif isinstance(node, Link):
        target = getattr(node, "target", None) or getattr(node, "url", "") or ""
        message = f'Expected link to "{target}": "{text}"'
    elif isinstance(node, Image):
        src = getattr(node, "src", None) or getattr(node, "url", "") or ""
        alt = get_text(node)
        message = f'Expected image "{alt}" at "{src}"'
    elif isinstance(node, Strong):
        message = f'Expected bold text: "{text}"'
    elif isinstance(node, Emphasis):
        message = f'Expected italic text: "{text}"'
    elif isinstance(node, InlineCode):
        message = f'Expected inline code: `{text}`'
    else:
        message = f'Expected {node_type}: "{text}"'
    err = ConformanceError(
        error_type="code",
        language="markdown",
        message=message,
        fix=fix,
    )
    if template_line is not None:
        err.template_line = template_line
    if template_col is not None:
        err.template_column = template_col
    if instance_line is not None:
        err.instance_line = instance_line
    if instance_col is not None:
        err.instance_column = instance_col
    return err
