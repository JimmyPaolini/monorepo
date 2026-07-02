"""Unit tests for the Markdown conformance validator."""

import pytest

from python.markdown.validator import validate_markdown_conformance


@pytest.mark.unit
def test_no_errors_for_matching_h1():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="# Hello\n",
        template="# Hello\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_heading():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Some paragraph\n",
        template="# Hello\n",
    )
    assert len(result["errors"]) > 0
    assert any("heading" in e.message.lower() or "h1" in e.message for e in result["errors"])


@pytest.mark.unit
def test_error_for_wrong_heading_depth():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="## Hello\n",
        template="# Hello\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_when_heading_is_superset():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="# Hello\n## World\n",
        template="# Hello\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_heading_with_mustache():
    result = validate_markdown_conformance(
        data={"name": "Alice"},
        filename="test.md",
        instance="# Hello, Alice!\n",
        template="# Hello, {{name}}!\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_no_errors_for_matching_code_block():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="```python\nprint('hello')\n```\n",
        template="```python\nprint('hello')\n```\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_code_block():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Some text\n",
        template="```python\nprint('hello')\n```\n",
    )
    assert len(result["errors"]) > 0
    assert any("code" in e.message.lower() for e in result["errors"])


@pytest.mark.unit
def test_error_for_code_block_wrong_language():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="```javascript\nprint('hello')\n```\n",
        template="```python\nprint('hello')\n```\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_code_block_with_mustache():
    result = validate_markdown_conformance(
        data={"lang": "python"},
        filename="test.md",
        instance="```python\nprint('hello')\n```\n",
        template="```{{lang}}\nprint('hello')\n```\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_no_errors_for_matching_paragraph():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Hello world\n",
        template="Hello world\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_paragraph():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="# Just a heading\n",
        template="Hello world\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_paragraph_superset():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Hello world\n\nExtra paragraph\n",
        template="Hello world\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_no_errors_for_matching_unordered_list():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="- item 1\n- item 2\n",
        template="- item 1\n- item 2\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_list():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Just text\n",
        template="- item 1\n- item 2\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_list_with_extra_items():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="- item 1\n- item 2\n- item 3\n",
        template="- item 1\n- item 2\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_ordered_vs_unordered_list():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="- item 1\n- item 2\n",
        template="1. item 1\n2. item 2\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_matching_blockquote():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="> This is a quote\n",
        template="> This is a quote\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_blockquote():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="This is not a quote\n",
        template="> This is a quote\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_matching_table():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="| Name | Age |\n|------|-----|\n| Alice | 30 |\n",
        template="| Name | Age |\n|------|-----|\n| Alice | 30 |\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_table():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Some text\n",
        template="| Name | Age |\n|------|-----|\n| Alice | 30 |\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_matching_thematic_break():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="---\n",
        template="---\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_thematic_break():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Some text\n",
        template="---\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_matching_link():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="[Click here](https://example.com)\n",
        template="[Click here](https://example.com)\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_link():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Just text\n",
        template="[Click here](https://example.com)\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_error_for_link_wrong_url():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="[Click here](https://other.com)\n",
        template="[Click here](https://example.com)\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_no_errors_for_matching_image():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="![alt text](image.png)\n",
        template="![alt text](image.png)\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_error_for_missing_image():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="Just text\n",
        template="![alt text](image.png)\n",
    )
    assert len(result["errors"]) > 0


@pytest.mark.unit
def test_todo_line_in_paragraph():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="anything here\n",
        template="TODO: fill this in\n",
    )
    assert result["errors"] == []


@pytest.mark.unit
def test_todo_line_in_code_block():
    result = validate_markdown_conformance(
        data={},
        filename="test.md",
        instance="```python\nanything\n```\n",
        template="```python\n# TODO: implement\n```\n",
    )
    assert result["errors"] == []
