"""Vulture whitelist — suppress false positives for Pydantic fields and LangChain patterns.

Vulture cannot detect that Pydantic model fields are accessed via the model's
__fields__ / __dict__ at runtime, or that LangChain uses duck-typing for tool
attributes (name, description, func).
"""

# Pydantic model fields accessed at runtime by Pydantic internals
from src.models import Affirmation, AffirmationSet, ResearchResult
from src.practices import PracticeConfig

Affirmation.text
Affirmation.practice
Affirmation.structure
Affirmation.keywords
AffirmationSet.practice
AffirmationSet.affirmations
ResearchResult.query
ResearchResult.source
ResearchResult.summary
PracticeConfig.name
PracticeConfig.topics
PracticeConfig.structures
