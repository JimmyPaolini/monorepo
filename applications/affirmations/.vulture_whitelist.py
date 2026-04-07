"""Vulture whitelist — suppress false positives for Pydantic fields and LangChain patterns.

Vulture cannot detect that Pydantic model fields are accessed via the model's
__fields__ / __dict__ at runtime, or that LangChain uses duck-typing for tool
attributes (name, description, func).
"""

# Pydantic model fields accessed at runtime by Pydantic internals
from src.models import (Affirmation, GeneratedAffirmations,
                        GrammarAffirmations, SubjectAffirmations,
                        ValidationResult)

Affirmation.text
Affirmation.grammar_slug
Affirmation.subject_slug
Affirmation.subject_name
Affirmation.grammar_name
GrammarAffirmations.subject
GrammarAffirmations.grammar
GrammarAffirmations.affirmations
SubjectAffirmations.subject
SubjectAffirmations.affirmation_sets
GeneratedAffirmations.affirmations
ValidationResult.valid
ValidationResult.reason
