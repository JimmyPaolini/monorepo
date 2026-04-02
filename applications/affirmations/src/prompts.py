from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    PromptTemplate,
    SystemMessagePromptTemplate,
)

search_sources_prompt_template: PromptTemplate = PromptTemplate.from_template(
    '"{subject_name}" {category_name} meaning interpretation significance symbolism themes correspondences'
)

generate_document_from_sources_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a reference document writer for spiritual subjects. Summarize web search results into a flowing prose reference document. "
            "Output ONLY plain text in flowing paragraphs. Do NOT use any markdown formatting — no headings, no bullet points, no tables, no bold, no italic, no code fences. "
            "Target length 1600 words. "
            "Use only the provided search results as the source of truth. Do not use prior knowledge."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Web search results for "{subject_name}" ({category_name}):

{sources}

---

Write a reference document about the meaning of "{subject_name}" ({category_name_plural}) using the search results above.

Your response must be plain flowing prose with NO markdown formatting whatsoever — no headings, no bullet points, \
no numbered lists, no tables, no bold, no italic, no code fences. Write in connected paragraphs only.

The document should thoroughly cover these topics, weaving them together naturally rather than treating them as separate sections:

- The meaning, interpretation, and significance of "{subject_name}" within {category_name_plural} and how it relates to other subjects in the category. Ignore history and origins; focus on interpretation.
- How the themes of "{subject_name}" apply to life: love, relationships, work, finances, health, and fortune.
- Key symbols, imagery, and archetypes associated with "{subject_name}" and what they represent.
- Cross-system correspondences in other spiritual and esoteric traditions \
(tarot, lenormand, numerology, zodiac, planets, elements, cardinality, polarity, runes, chakras, colors, \
solfeggio frequencies, sephirot, hebrew letters, kabbalah worlds, gemstones, metals, weekdays). \
Include only correspondences with specific, factual values found in the search results.

Interleave these topics freely wherever connections arise. Let the structure emerge from the content.\
"""
        ),
    ]
)

analyze_sources_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are an expert researcher. Analyze web search results and extract a concise, factual research brief. "
            "Identify what is well-supported by the sources and flag anything uncertain or contradicted."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Web search results for "{subject_name}" ({category_name}):

{sources}

---

Analyze the results above and produce a concise research brief:

1. **Core Themes & Meaning**: The 3–5 most important themes and interpretations of "{subject_name}".
2. **Life Applications**: How "{subject_name}" relates to love, relationships, work, finances, health, and fortune.
3. **Symbols & Archetypes**: Key symbols, imagery, and archetypes and what they represent.
4. **Cross-System Correspondences**: List ONLY correspondences confirmed by the search results \
(zodiac, planet, element, number, suit, rank, rune, chakra, color, solfeggio, sephirot, \
hebrew letter, kabbalah world, gemstone, metal, weekday, cardinality, polarity, lenormand, tarot). \
Format each as "category: value". Omit categories with no evidence in the results.

Be concise.\"
"""
        ),
    ]
)

generate_document_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a reference document writer for spiritual subjects. Summarize a research brief into a flowing prose reference document. "
            "Output ONLY plain text in flowing paragraphs. Do NOT use any markdown formatting — no headings, no bullet points, no tables, no bold, no italic, no code fences. "
            "Target length 1600 words. "
            "Use only the provided research brief as the source of truth. Do not use prior knowledge."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Research brief for "{subject_name}" ({category_name}):

{source_analysis}

---

Write a reference document about the meaning of "{subject_name}" ({category_name_plural}) using the research brief above.

Your response must be plain flowing prose with NO markdown formatting whatsoever — no headings, no bullet points, \
no numbered lists, no tables, no bold, no italic, no code fences. Write in connected paragraphs only.

Cover the following topics in order, transitioning naturally between them:

Begin by explaining the meaning and interpretation of "{subject_name}". Ignore its history and origins; focus on interpretation. \
Describe its significance within {category_name_plural} and how it relates to other subjects in the category.

Then discuss how the themes of "{subject_name}" apply to different aspects of life: love, relationships, work, finances, health, and fortune.

Next, highlight key symbols, imagery, and archetypes associated with "{subject_name}" and what they represent.

Finally, weave in the cross-system correspondences for "{subject_name}" in other spiritual and esoteric traditions, \
such as tarot, lenormand, numerology, zodiac, planets, elements, cardinality, polarity, runes, chakras, colors, \
solfeggio frequencies, sephirot, hebrew letters, kabbalah worlds, gemstones, metals, and weekdays. \
Include only correspondences with specific, factual values found in the research brief.\
"""
        ),
    ]
)

analyze_document_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a spiritual subject analyst. Distill a reference document into a concise thematic brief for affirmation generation. "
            "Output a plain text brief of at most 300 words. No markdown, no headers, no bullet points. "
            "Focus only on: core themes, emotional tone, key symbols, and spiritual lessons."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Reference document for "{subject_name}" ({category_name}):

{document}

---

Write a concise thematic brief for "{subject_name}" ({category_name}) covering core themes, emotional tone, key symbols, and spiritual lessons. \
Maximum 300 words. Plain text only — no markdown, no headers."""
        ),
    ]
)

generate_affirmations_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are an affirmation writer specializing in spirituality and personal growth. "
            "Generate exactly 3 affirmations for the given tarot card that match a specific grammatical form. "
            "Each affirmation must conform to the grammar's mood, voice, tense, aspect, person, number, polarity, and form. "
            "Each affirmation must be thematically connected to the card's meaning, symbolism, and spiritual lessons. "
            "Do not end affirmations with a period."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Tarot card: {subject_name}
Thematic brief: {document_analysis}

Grammar: {grammar_name}
Grammatical constraints: {grammar_specifiers}
Example affirmations for this grammar: {grammar_examples}
Grammar emoji: {grammar_emoji}

---

Generate exactly 3 affirmations for "{subject_name}" that:
1. Match the grammatical form: {grammar_name} ({grammar_specifiers})
2. Are thematically connected to {subject_name}'s meaning and symbolism
3. Follow the style of the examples: {grammar_examples}
4. Do not end with a period

Return a JSON object with an "affirmations" key containing a list of exactly 3 affirmation strings."""
        ),
    ]
)

validate_affirmation_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a grammar validator. Check whether an affirmation matches specific grammatical constraints. "
            "Return a JSON object with 'valid' (boolean) and 'reason' (string explaining the validation result)."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Affirmation: "{affirmation_text}"
Target grammar: {grammar_name}
Grammatical constraints: {grammar_specifiers}

---

Does this affirmation match the grammatical constraints ({grammar_specifiers})?

Return JSON: {{"valid": true/false, "reason": "explanation"}}"""
        ),
    ]
)
