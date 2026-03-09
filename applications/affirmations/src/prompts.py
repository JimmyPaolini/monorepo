from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    PromptTemplate,
    SystemMessagePromptTemplate,
)

search_query_prompt_template: PromptTemplate = PromptTemplate.from_template(
    '"{subject_name}" {category_name} meaning interpretation significance symbolism themes correspondences'
)

ingest_document_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a reference document writer for spiritual subjects. Summarize web search results into a structured markdown reference document. "
            "Output ONLY raw markdown. Do NOT wrap your response in code fences or backtick blocks. "
            "Start your response directly with the `# {subject_name}` heading. Target length 1600 words. "
            "Use only the provided search results as the source of truth. Do not use prior knowledge. "
            "Do not add sections beyond the ones specified."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Web search results for "{subject_name}" ({category_name}):

{search_results}

---

Write a reference document about the meaning of "{subject_name}" ({category_name_plural}) using the search results above.

Your response must be raw markdown with EXACTLY the four sections below — no more, no fewer. \
Do NOT add extra sections. Do NOT use code fences. Start directly with `# {subject_name}`.

# {subject_name}

## Meaning

Explain the meaning and interpretation of "{subject_name}". Ignore its history and origins; focus on interpretation. \
Describe its significance within {category_name_plural} and how it relates to other subjects in the category.

## Application

Summarize how the themes of "{subject_name}" apply to different aspects of life: love, relationships, work, finances, health, and fortune.

## Symbolism

Highlight key symbols, imagery, and archetypes associated with "{subject_name}" and what they represent.

## Correspondences

List the factual cross-system correspondences for "{subject_name}" in other spiritual and esoteric traditions. \
Include ONLY rows with a specific, factual correspondence found in the search results. \
Do NOT include life domains such as love, relationships, career, health, finances, or fortune — those belong in Application. \
Replace `...` with actual values. Remove rows with no known correspondence.

| Category | Subject | Notes |
| -------- | ------- | ----- |
| tarot | ... | ... |
| lenormand | ... | ... |
| number | ... | ... |
| suit | ... | ... |
| rank | ... | ... |
| zodiac | ... | ... |
| planet | ... | ... |
| element | ... | ... |
| cardinality | ... | ... |
| polarity | ... | ... |
| rune | ... | ... |
| chakra | ... | ... |
| color | ... | ... |
| solfeggio | ... | ... |
| sephirot | ... | ... |
| hebrew letter | ... | ... |
| kabbalah world | ... | ... |
| gemstone | ... | ... |
| metal | ... | ... |
| weekday | ... | ... |\
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

{search_results}

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

write_document_prompt_template: ChatPromptTemplate = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a reference document writer for spiritual subjects. Summarize a research brief into a structured markdown reference document. "
            "Output ONLY raw markdown. Do NOT wrap your response in code fences or backtick blocks. "
            "Start your response directly with the `# {subject_name}` heading. Target length 1600 words. "
            "Use only the provided research brief as the source of truth. Do not use prior knowledge. "
            "Do not add sections beyond the ones specified."
        ),
        HumanMessagePromptTemplate.from_template(
            """\
Research brief for "{subject_name}" ({category_name}):

{analysis}

---

Write a reference document about the meaning of "{subject_name}" ({category_name_plural}) using the research brief above.

Your response must be raw markdown with EXACTLY the four sections below — no more, no fewer. \
Do NOT add extra sections. Do NOT use code fences. Start directly with `# {subject_name}`.

# {subject_name}

## Meaning

Explain the meaning and interpretation of "{subject_name}". Ignore its history and origins; focus on interpretation. \
Describe its significance within {category_name_plural} and how it relates to other subjects in the category.

## Application

Summarize how the themes of "{subject_name}" apply to different aspects of life: love, relationships, work, finances, health, and fortune.

## Symbolism

Highlight key symbols, imagery, and archetypes associated with "{subject_name}" and what they represent.

## Correspondences

List the factual cross-system correspondences for "{subject_name}" in other spiritual and esoteric traditions. \
Output ONLY a markdown table — do NOT use bullet points, numbered lists, bold text, or prose. \
Include ONLY rows with a specific, factual correspondence found in the research brief. \
Do NOT include life domains such as love, relationships, career, health, finances, or fortune — those belong in Application. \
Replace `...` with actual values. Remove rows with no known correspondence.

| Category | Subject | Notes |
| -------- | ------- | ----- |
| tarot | ... | ... |
| lenormand | ... | ... |
| number | ... | ... |
| suit | ... | ... |
| rank | ... | ... |
| zodiac | ... | ... |
| planet | ... | ... |
| element | ... | ... |
| cardinality | ... | ... |
| polarity | ... | ... |
| rune | ... | ... |
| chakra | ... | ... |
| color | ... | ... |
| solfeggio | ... | ... |
| sephirot | ... | ... |
| hebrew letter | ... | ... |
| kabbalah world | ... | ... |
| gemstone | ... | ... |
| metal | ... | ... |
| weekday | ... | ... |\
"""
        ),
    ]
)
