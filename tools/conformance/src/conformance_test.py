"""🧪 Conformance tests for generated Python applications and libraries."""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import pytest

from src.validators.python.files import (
    stringify_conformance_errors,
    validate_instance_directory,
    validate_instances_directory,
)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent

# Hardcode the template dir since we don't have a generator.py to import it from
JUPYTER_NOTEBOOK_APPLICATION_TEMPLATES_DIRECTORY_PATH = (
    WORKSPACE_ROOT
    / "tools"
    / "conformance"
    / "src"
    / "generators"
    / "jupyter-notebook-application"
    / "templates"
)

JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG = "generator:jupyter-notebook-application"
APPLICATIONS_DIRECTORY_PATH = WORKSPACE_ROOT / "applications"


@dataclass
class ConformanceTemplateInstance:
    """Configuration for a specific template validation."""

    # Absolute instance paths to validate for this template.
    instance_directory_paths: list[Path]
    # Whether each path points to one instance directory or a directory of many instances.
    instance_type: Literal["multiple", "single"]
    # Human-readable template identifier.
    template: str
    # Absolute path to the template directory used for validation.
    template_directory_path: Path


def resolve_workspace_applications() -> list[dict]:
    applications = []
    if not APPLICATIONS_DIRECTORY_PATH.exists():
        return applications

    for entry in APPLICATIONS_DIRECTORY_PATH.iterdir():
        if entry.is_dir():
            project_json_path = entry / "project.json"
            if project_json_path.exists():
                try:
                    with open(project_json_path, encoding="utf-8") as f:
                        project_data = json.load(f)
                    applications.append(
                        {
                            "root_path": entry,
                            "tags": project_data.get("tags", []),
                        }
                    )
                except Exception as e:
                    raise RuntimeError(
                        f'Unable to parse project configuration at "{project_json_path}"'
                    ) from e

    return applications


def resolve_template_instances() -> list[ConformanceTemplateInstance]:
    applications = resolve_workspace_applications()
    return [
        ConformanceTemplateInstance(
            instance_directory_paths=[
                app["root_path"]
                for app in applications
                if JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG in app["tags"]
            ],
            instance_type="single",
            template="jupyter-notebook-application",
            template_directory_path=JUPYTER_NOTEBOOK_APPLICATION_TEMPLATES_DIRECTORY_PATH,
        ),
    ]


@pytest.mark.integration
class TestGeneratorTemplateConformance:
    @pytest.mark.parametrize(
        "conformance_case",
        resolve_template_instances(),
        ids=lambda c: c.template,
    )
    def test_validates_generated_instances(self, conformance_case: ConformanceTemplateInstance):
        results = []
        if conformance_case.instance_type == "single":
            for instance_path in conformance_case.instance_directory_paths:
                results.append(
                    validate_instance_directory(
                        instance_directory_path=instance_path,
                        template_directory_path=conformance_case.template_directory_path,
                    )
                )
        else:
            for instances_path in conformance_case.instance_directory_paths:
                results.extend(
                    validate_instances_directory(
                        instances_directory_path=instances_path,
                        template_directory_path=conformance_case.template_directory_path,
                    )
                )

        assert len(results) > 0, f"No instances found for template '{conformance_case.template}'"
        errors = stringify_conformance_errors(results)
        if errors is not None:
            pytest.fail(f"\n{errors}")
