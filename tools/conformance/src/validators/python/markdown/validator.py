"""🔤 Markdown file conformance validator."""
import chevron
from mistletoe.html_renderer import HtmlRenderer
from mistletoe.block_token import Document
from mistletoe.span_token import RawText

from .nodes import CONTAINER_TYPES, build_error, get_node_children, nodes_match


def _validate_children(template_children: list, instance_children: list) -> list:
    errors = []
    last_matched = None
    for template_child in template_children:
        if isinstance(template_child, RawText):
            continue
        node_type = type(template_child).__name__
        candidates = [ic for ic in instance_children if nodes_match(template_child, ic)]
        if not candidates:
            errors.append(build_error(template_child, last_matched))
            continue
        if node_type not in CONTAINER_TYPES:
            last_matched = candidates[-1]
            continue
        template_grandchildren = get_node_children(template_child)
        if not template_grandchildren:
            last_matched = candidates[-1]
            continue
        best_errors = None
        best_candidate = candidates[0]
        for candidate in candidates:
            candidate_children = get_node_children(candidate)
            child_errors = _validate_children(template_grandchildren, candidate_children)
            if best_errors is None or len(child_errors) < len(best_errors):
                best_errors = child_errors
                best_candidate = candidate
        last_matched = best_candidate
        if best_errors:
            errors.extend(best_errors)
    return errors


def validate_markdown_conformance(
    *, data: dict, filename: str, instance: str, template: str
) -> dict:
    """Validates that a generated Markdown file is a structural superset of its Mustache template."""
    rendered = chevron.render(template, data)
    with HtmlRenderer():
        template_doc = Document(rendered)
        instance_doc = Document(instance)
    errors = _validate_children(
        get_node_children(template_doc),
        get_node_children(instance_doc),
    )
    return {"errors": errors}
