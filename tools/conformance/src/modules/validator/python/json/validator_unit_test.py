"""Unit tests for the JSON/JSONC conformance validator."""

import pytest

from python.json.comments import get_comments, validate_comments
from python.json.validator import validate_json_conformance


@pytest.mark.unit
def test_no_errors_for_identical_objects():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": 1, "b": 2}',
        template='{"a": 1, "b": 2}',
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_no_errors_when_instance_is_superset():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": 1, "b": 2, "c": 3}',
        template='{"a": 1, "b": 2}',
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_key():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": 1}',
        template='{"a": 1, "b": 2}',
    )
    assert len(result["errors"]) == 1
    assert "b" in result["errors"][0].message


@pytest.mark.unit
def test_error_for_value_mismatch():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": 2}',
        template='{"a": 1}',
    )
    assert len(result["errors"]) == 1
    assert "expected" in result["errors"][0].message.lower() or result["errors"][0].expected == "1"


@pytest.mark.unit
def test_renders_mustache_variables():
    result = validate_json_conformance(
        data={"version": "1.0.0"},
        filename="test.json",
        instance='{"version": "1.0.0"}',
        template='{"version": "{{version}}"}',
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_nested_missing_key():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": {}}',
        template='{"a": {"b": 1}}',
    )
    assert len(result["errors"]) == 1
    assert "b" in result["errors"][0].message


@pytest.mark.unit
def test_array_validation():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance="[1, 2]",
        template="[1, 2, 3]",
    )
    assert len(result["errors"]) == 1


@pytest.mark.unit
def test_empty_objects_match():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance="{}",
        template="{}",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_comment_validation_all_present():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='// required comment\n{"a": 1}',
        template='// required comment\n{"a": 1}',
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_comment():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": 1}',
        template='// required comment\n{"a": 1}',
    )
    assert any(e.error_type == "comment" for e in result["errors"])


@pytest.mark.unit
def test_extra_comments_allowed():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='// extra\n// required comment\n{"a": 1}',
        template='// required comment\n{"a": 1}',
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_todo_comment_loose_match():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='// anything here\n{"a": 1}',
        template='// TODO: fill this in\n{"a": 1}',
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_todo_comment_missing():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='{"a": 1}',
        template='// TODO: fill this in\n{"a": 1}',
    )
    assert any(e.error_type == "comment" for e in result["errors"])


@pytest.mark.unit
def test_non_todo_comment_exact_match_required():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='// different comment\n{"a": 1}',
        template='// required comment\n{"a": 1}',
    )
    assert any(e.error_type == "comment" for e in result["errors"])


@pytest.mark.unit
def test_comment_order_enforced():
    result = validate_json_conformance(
        data={},
        filename="test.json",
        instance='// second\n// first\n{"a": 1}',
        template='// first\n// second\n{"a": 1}',
    )
    # "first" appears after "second" in instance, so "second" is consumed first
    # then "first" is not found in remaining comments
    assert any(e.error_type == "comment" for e in result["errors"])


@pytest.mark.unit
def test_get_comments_extracts_line_comments():
    comments = get_comments('// hello\n{"a": 1}')
    assert "// hello" in comments


@pytest.mark.unit
def test_get_comments_extracts_block_comments():
    comments = get_comments('/* block */\n{"a": 1}')
    assert "/* block */" in comments


@pytest.mark.unit
def test_validate_comments_no_errors():
    errors = validate_comments(
        template_text="// hello\n{}",
        instance_text="// hello\n{}",
    )
    assert errors == []


@pytest.mark.unit
def test_validate_comments_missing_comment():
    errors = validate_comments(
        template_text="// required\n{}",
        instance_text="{}",
    )
    assert len(errors) == 1
    assert errors[0].error_type == "comment"
