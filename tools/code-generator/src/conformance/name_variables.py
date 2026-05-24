"""
name_variables — Python equivalent of the TypeScript ``nameVariables()`` utility.

Converts a generator name (any casing) into all pre-computed variants used in
Mustache templates.  Both implementations (TS and Python) must produce identical
output for any given input — parity is verified by the conformance test suite.
"""

import re


def _words(name: str) -> list[str]:
    """Split *name* into lower-case words regardless of its original casing.

    Handles: kebab-case, snake_case, camelCase, PascalCase, CONSTANT_CASE.
    """
    # Insert a word boundary before each upper-case run that follows a
    # lower-case character (camelCase / PascalCase split).
    separated = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    # Also split on consecutive upper-case followed by lower-case (ABCDef → ABC Def).
    separated = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", separated)
    # Tokenize on any non-alphanumeric character.
    raw = re.split(r"[^a-zA-Z0-9]+", separated)
    return [w.lower() for w in raw if w]


def name_variables(name: str) -> dict[str, str]:
    """Return all pre-computed name variants for a generator instance name.

    Keys match the TypeScript ``NameVariables`` interface exactly so they can
    be used directly as Mustache context variables on both sides.

    >>> name_variables("myService")
    {'name': 'myService', 'nameCamel': 'myService', 'namePascal': 'MyService', \
'nameSnake': 'my_service', 'nameConstant': 'MY_SERVICE', 'nameKebab': 'my-service'}
    """
    words = _words(name)

    if not words:
        return {
            "name": name,
            "nameCamel": name,
            "namePascal": name,
            "nameSnake": name,
            "nameConstant": name,
            "nameKebab": name,
        }

    name_camel = words[0] + "".join(w.capitalize() for w in words[1:])
    name_pascal = "".join(w.capitalize() for w in words)
    name_snake = "_".join(words)
    name_constant = "_".join(w.upper() for w in words)
    name_kebab = "-".join(words)

    return {
        "name": name,
        "nameCamel": name_camel,
        "namePascal": name_pascal,
        "nameSnake": name_snake,
        "nameConstant": name_constant,
        "nameKebab": name_kebab,
    }
