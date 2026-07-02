"""Unit tests for the text conformance validator."""

import pytest

from python.text.validator import validate_text_conformance


@pytest.mark.unit
def test_no_errors_when_instance_matches_template():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="hello\nworld",
        template="hello\nworld",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_no_errors_when_instance_is_superset():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="hello\nworld\nextra line",
        template="hello\nworld",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_line():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="hello",
        template="hello\nworld",
    )
    assert len(result["errors"]) == 1
    assert "world" in result["errors"][0].message


@pytest.mark.unit
def test_renders_mustache_variables():
    result = validate_text_conformance(
        data={"name": "Alice"},
        filename="test.txt",
        instance="Hello, Alice!",
        template="Hello, {{name}}!",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_when_mustache_rendered_line_missing():
    result = validate_text_conformance(
        data={"name": "Alice"},
        filename="test.txt",
        instance="Hello, Bob!",
        template="Hello, {{name}}!",
    )
    assert len(result["errors"]) == 1
    assert "Alice" in result["errors"][0].message


@pytest.mark.unit
def test_blank_lines_are_required():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="line1\nline2",
        template="line1\n\nline2",
    )
    assert any(e.expected == "" for e in result["errors"]) or len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_when_blank_lines_preserved():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="line1\n\nline2",
        template="line1\n\nline2",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_whitespace_differences_are_errors():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="hello world",
        template="hello  world",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_requires_duplicate_lines():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="hello",
        template="hello\nhello",
    )
    assert len(result["errors"]) == 1


@pytest.mark.unit
def test_no_errors_when_duplicate_count_met():
    result = validate_text_conformance(
        data={},
        filename="test.txt",
        instance="hello\nhello",
        template="hello\nhello",
    )
    assert result["errors"] == []
