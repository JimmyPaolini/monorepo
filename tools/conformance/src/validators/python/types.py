"""🔎 Conformance error types for Python validators."""
from dataclasses import dataclass
from typing import Literal, Optional

ConformanceErrorType = Literal["comment", "directory", "file", "code"]
ConformanceErrorLanguage = Literal["javascript", "json", "markdown", "python", "text"]


@dataclass
class ConformanceError:
    """A structured conformance error produced by any Python validator."""

    error_type: ConformanceErrorType
    fix: str
    message: str
    language: Optional[ConformanceErrorLanguage] = None
    instance_line: Optional[int] = None
    instance_column: Optional[int] = None
    instance_path: Optional[str] = None
    template_line: Optional[int] = None
    template_column: Optional[int] = None
    template_path: Optional[str] = None
    expected: Optional[str] = None
    actual: Optional[str] = None
