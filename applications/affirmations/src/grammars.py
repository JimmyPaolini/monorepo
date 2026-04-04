from enum import StrEnum

from pydantic import BaseModel, Field, computed_field

# ---------------------------------------------------------------------------
# Mood
# ---------------------------------------------------------------------------


class Mood(StrEnum):
    """Grammatical mood — the speaker's attitude toward the proposition.

    Realis
        indicative
    Irrealis / Epistemic
        subjunctive · conditional · interrogative · potential
        dubitative · presumptive · energetic · inferential · speculative
    Irrealis / Deontic
        Directive: imperative · prohibitive · jussive · hortative
        Volative:  optative
        commissive · benedictive · aorist · debitive · precative · permissive · necessitative
    """

    # -- Realis ----------------------------------------------------------------
    INDICATIVE = "INDICATIVE"
    """States a known fact: "I am strong"."""

    # -- Irrealis / Epistemic --------------------------------------------------
    SUBJUNCTIVE = "SUBJUNCTIVE"
    """Expresses events considered unlikely or attitudes toward events: "may I be strong"."""

    CONDITIONAL = "CONDITIONAL"
    """Expresses events dependent on other events: "I would be strong if…"."""

    INTERROGATIVE = "INTERROGATIVE"
    """Expresses a question: "am I strong?"."""

    POTENTIAL = "POTENTIAL"
    """Expresses events considered possible or likely: "I could be strong"."""

    DUBITATIVE = "DUBITATIVE"
    """Expresses events considered impossible or unlikely: "I doubt I am strong"."""

    PRESUMPTIVE = "PRESUMPTIVE"
    """Expresses events hypothesized or presupposed to be true: "I must be strong"."""

    ENERGETIC = "ENERGETIC"
    """Expresses events emphasized or strongly believed to be true: "I indeed am strong"."""

    INFERENTIAL = "INFERENTIAL"
    """Expresses events unwitnessed without confirming them: "I am apparently strong"."""

    SPECULATIVE = "SPECULATIVE"
    """Expresses events possible based on speaker speculation: "I might be strong"."""

    # -- Irrealis / Deontic / Directive ----------------------------------------
    IMPERATIVE = "IMPERATIVE"
    """Expresses a positive command: "be strong!"."""

    PROHIBITIVE = "PROHIBITIVE"
    """Expresses a negative command or prohibition: "do not be weak!"."""

    JUSSIVE = "JUSSIVE"
    """Expresses an order, plea, or request — often to a third person: "let her be strong"."""

    HORTATIVE = "HORTATIVE"
    """Expresses an exhortation — often to a first person: "let us be strong"."""

    # -- Irrealis / Deontic / Volative -----------------------------------------
    OPTATIVE = "OPTATIVE"
    """Expresses hope, expectation, or anticipation: "if only I were strong"."""

    # -- Irrealis / Deontic ----------------------------------------------------
    COMMISSIVE = "COMMISSIVE"
    """Expresses events promised or threatened: "I will be strong"."""

    BENEDICTIVE = "BENEDICTIVE"
    """Expresses a polite request or blessing: "may you be blessed with strength"."""

    AORIST = "AORIST"
    """Expresses historical or punctual events: "I was strong (once)"."""

    DEBITIVE = "DEBITIVE"
    """Expresses an obligation: "I must be strong"."""

    PRECATIVE = "PRECATIVE"
    """Expresses a request or entreaty: "I pray to be strong"."""

    PERMISSIVE = "PERMISSIVE"
    """Expresses permission: "I am allowed to be strong"."""

    NECESSITATIVE = "NECESSITATIVE"
    """Expresses necessity — commanded, wished, desired, insisted: "I need to be strong"."""


# ---------------------------------------------------------------------------
# Voice
# ---------------------------------------------------------------------------


class Voice(StrEnum):
    """Grammatical voice — the relationship between subject and verb action."""

    ACTIVE = "ACTIVE"
    """The subject performs the action: "I choose strength"."""

    PASSIVE = "PASSIVE"
    """The subject receives the action: "strength is chosen by me"."""


class Tense(StrEnum):
    """Grammatical tense — when an event takes place.

    Past:           past · recent past · remote past · pluperfect
    Cross-cutting:  nonpast · nonfuture
    Present:        present
    Future:         future · near future · remote future
                    future perfect · future-in-the-past
    """

    # -- Past ------------------------------------------------------------------
    PAST = "PAST"
    """General past: "I was strong"."""

    RECENT_PAST = "RECENT_PAST"
    """Near past — events that happened shortly ago: "I was just strong"."""

    REMOTE_PAST = "REMOTE_PAST"
    """Distant past — events long ago: "I was strong long ago"."""

    PLUPERFECT = "PLUPERFECT"
    """Past relative to another past event: "I had been strong (before that)"."""

    # -- Cross-cutting ---------------------------------------------------------
    NONPAST = "NONPAST"
    """Present or future — not locating an event in the past."""

    NONFUTURE = "NONFUTURE"
    """Past or present — not locating an event in the future."""

    # -- Present ---------------------------------------------------------------
    PRESENT = "PRESENT"
    """Events occurring now: "I am strong"."""

    # -- Future ----------------------------------------------------------------
    FUTURE = "FUTURE"
    """General future: "I will be strong"."""

    NEAR_FUTURE = "NEAR_FUTURE"
    """Immediately upcoming events: "I am about to be strong"."""

    REMOTE_FUTURE = "REMOTE_FUTURE"
    """Distant future events: "I will someday be strong"."""

    FUTURE_PERFECT = "FUTURE_PERFECT"
    """Events in the past relative to a future reference point: "I will have been strong"."""

    FUTURE_IN_THE_PAST = "FUTURE_IN_THE_PAST"
    """Events in the future relative to a past reference point: "I was going to be strong"."""


# ---------------------------------------------------------------------------
# Aspect
# ---------------------------------------------------------------------------


class Aspect(StrEnum):
    """Grammatical aspect — how events extend over time.

    Completeness:   simple · perfective
    Imperfective:   imperfective · progressive · continuous · stative
    Other:          habitual · prospective · gnomic · episodic
                    inceptive · terminative · experiential
    """

    # -- Completeness ----------------------------------------------------------
    SIMPLE = "SIMPLE"
    """Expresses actions without specifying extent over time: "I run"."""

    PERFECTIVE = "PERFECTIVE"
    """Expresses actions viewed as a complete whole: "I ran (and finished)"."""

    # -- Imperfective ----------------------------------------------------------
    IMPERFECTIVE = "IMPERFECTIVE"
    """Expresses actions viewed as having internal structure: "I was running"."""

    PROGRESSIVE = "PROGRESSIVE"
    """Expresses actions ongoing (imperfective sub-type): "I am running"."""

    CONTINUOUS = "CONTINUOUS"
    """Expresses actions ongoing and actively evolving (imperfective sub-type): "I am growing stronger"."""

    STATIVE = "STATIVE"
    """Expresses actions ongoing but not evolving (imperfective sub-type): "I am knowing"."""

    # -- Other -----------------------------------------------------------------
    HABITUAL = "HABITUAL"
    """Expresses actions performed regularly: "I run every day"."""

    PROSPECTIVE = "PROSPECTIVE"
    """Expresses actions anticipated to happen: "I am about to run"."""

    GNOMIC = "GNOMIC"
    """Expresses general truths or aphorisms: "the sun rises in the east"."""

    EPISODIC = "EPISODIC"
    """Expresses specific events and truths (opposite of gnomic): "I ran yesterday"."""

    INCEPTIVE = "INCEPTIVE"
    """Expresses the start of events: "I am beginning to run"."""

    TERMINATIVE = "TERMINATIVE"
    """Expresses the end of events: "I have stopped running"."""

    EXPERIENTIAL = "EXPERIENTIAL"
    """Expresses events experienced thoroughly: "I have run many times"."""

    PERFECT_PROGRESSIVE = "PERFECT_PROGRESSIVE"
    """Expresses actions begun in the past and still ongoing: "I have been growing stronger"."""


# ---------------------------------------------------------------------------
# Person
# ---------------------------------------------------------------------------


class Person(StrEnum):
    """Grammatical person — the relationship between speaker and subject."""

    FIRST = "FIRST"  # I / we
    SECOND = "SECOND"  # you
    THIRD = "THIRD"  # he / she / it / they


# ---------------------------------------------------------------------------
# Number
# ---------------------------------------------------------------------------


class Number(StrEnum):
    """Grammatical number — how many subjects are involved."""

    SINGULAR = "SINGULAR"
    """One: "I am"."""

    PLURAL = "PLURAL"
    """Multiple (unspecified): "we are"."""

    DUAL = "DUAL"
    """Exactly two: "we two are"."""

    TRIPLE = "TRIPLE"
    """Exactly three: "we three are"."""

    EXISTENTIAL = "EXISTENTIAL"
    """Some (but not all): "some of us are"."""

    UNIVERSAL = "UNIVERSAL"
    """All: "all of us are"."""

    PAUCAL = "PAUCAL"
    """Few: "few of us are"."""

    SUPERPLURAL = "SUPERPLURAL"
    """Many: "many of us are"."""


# ---------------------------------------------------------------------------
# Polarity
# ---------------------------------------------------------------------------


class Polarity(StrEnum):
    """Grammatical polarity — whether the proposition is affirmed or negated."""

    POSITIVE = "POSITIVE"
    """The proposition is affirmed: "I am strong"."""

    NEGATIVE = "NEGATIVE"
    """The proposition is negated: "I am not weak"."""


# ---------------------------------------------------------------------------
# Deixis
# ---------------------------------------------------------------------------


class Deixis(StrEnum):
    """Deictic values — words anchored to a specific time, place, or person.

    The deictic center (origo) is the speaker's “here and now”.

    Spatial (proximal → far-distal): proximal · medial · distal · far-distal
    Temporal (relative to origo):    immediate · proximate temporal · remote temporal
    Personal:                        inclusive · exclusive
    """

    # -- Spatial ---------------------------------------------------------------
    PROXIMAL = "PROXIMAL"
    """Close to the speaker — "this", "here": "I am here, in this strength"."""

    MEDIAL = "MEDIAL"
    """Near but not immediately close — "near", "there (nearby)": "I am becoming that strength"."""

    DISTAL = "DISTAL"
    """Far from the speaker — "that", "there (far)": "I reach toward that clarity"."""

    FAR_DISTAL = "FAR_DISTAL"
    """Very far — "yon", "yonder": "I am drawn toward yonder horizon"."""

    # -- Temporal --------------------------------------------------------------
    IMMEDIATE = "IMMEDIATE"
    """Right now or this very moment — "now", "this instant"."""

    PROXIMATE_TEMPORAL = "PROXIMATE_TEMPORAL"
    """Near in time — "soon", "recently": "I am soon to be whole"."""

    REMOTE_TEMPORAL = "REMOTE_TEMPORAL"
    """Far in time — "later", "long ago": "I will later understand this"."""

    # -- Personal --------------------------------------------------------------
    INCLUSIVE = "INCLUSIVE"
    """Includes both speaker and addressee — "we (all of us)"."""

    EXCLUSIVE = "EXCLUSIVE"
    """Excludes the addressee — "we (but not you)", "they"."""


# ---------------------------------------------------------------------------
# Form
# ---------------------------------------------------------------------------


class Form(StrEnum):
    """Grammatical form — the finite or non-finite character of the verb phrase.

    Non-finite forms lack agreement with a subject for person/number/tense and
    are typically used in subordinate or infinitival constructions.

    Finite:     finite
    Non-finite: infinitive · gerund · participle · supine
    """

    FINITE = "FINITE"
    """Finite (default) form — fully inflected verb agreeing with its subject: "I am strong"."""

    INFINITIVE = "INFINITIVE"
    """Non-finite base form, typically introduced by "to": "to be strong"."""

    GERUND = "GERUND"
    """Non-finite -ing form functioning as a noun: "being strong is powerful"."""

    PARTICIPLE = "PARTICIPLE"
    """Non-finite -ing/-ed form functioning as a modifier: "feeling strong, I…"."""

    SUPINE = "SUPINE"
    """Non-finite purposive form: "I came here to be strong"."""


# ---------------------------------------------------------------------------
# Grammar
# ---------------------------------------------------------------------------


class Grammar(BaseModel):
    """A grammatical form for an affirmation sentence.

    All fields are optional — omitted fields are left to the LLM's discretion.
    Any combination of specifiers can be provided to constrain generation.

    Example (minimal): Grammar(mood=Mood.INDICATIVE)  → "indicative"
    Example (full):    Grammar(...)                   → "indicative-active-present-simple-first-singular-proximal"
    """

    emoji: str
    examples: list[str] = Field(default_factory=list)

    form: Form | None = None
    mood: Mood | None = None
    tense: Tense | None = None
    person: Person | None = None
    voice: Voice | None = None
    aspect: Aspect | None = None
    number: Number | None = None
    deixis: Deixis | None = None
    polarity: Polarity | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def specifiers(self) -> list[str]:
        """Ordered list of active specifier values, omitting unspecified fields.

        Example: ["INDICATIVE", "ACTIVE", "PRESENT", "SIMPLE", "FIRST", "SINGULAR", "PROXIMAL"]
        """
        return [
            str(specifier)
            for specifier in (
                self.form,
                self.mood,
                self.voice,
                self.tense,
                self.aspect,
                self.person,
                self.number,
                self.deixis,
                self.polarity,
            )
            if specifier is not None
        ]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def name(self) -> str:
        """Emoji-prefixed Capital Start Case name, omitting unspecified fields.

        Example: "⭐ Indicative Active Present Simple First Singular Proximal"
        """
        return f"{self.emoji} {' '.join(specifier.replace('_', ' ').title() for specifier in self.specifiers)}"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def slug(self) -> str:
        """Kebab-case slug, omitting unspecified fields (emoji excluded).

        Example: "indicative-active-present-simple-first-singular-proximal"
        """
        return "-".join(specifier.replace("_", "-").lower() for specifier in self.specifiers)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def description(self) -> str:
        """Clear, imperative generation instructions for each active grammatical constraint."""
        lines: list[str] = []

        if self.form == Form.FINITE:
            lines.append("Use a fully conjugated (finite) verb that agrees with its subject.")
        elif self.form == Form.INFINITIVE:
            lines.append(
                "Start with the base infinitive: 'To [verb]...' — no subject or conjugation."
            )
        elif self.form == Form.GERUND:
            lines.append("Begin with a gerund (-ing form as a noun), e.g., 'Being brave is...'.")
        elif self.form == Form.PARTICIPLE:
            lines.append("Begin with a participial phrase (-ing or past-participle as a modifier).")
        elif self.form == Form.SUPINE:
            lines.append(
                "Use a purposive infinitive structure, e.g., 'I walk forward to discover...'."
            )

        if self.mood == Mood.INDICATIVE:
            lines.append("State a direct fact or present truth (indicative mood).")
        elif self.mood == Mood.INTERROGATIVE:
            lines.append(
                "CRITICAL: The sentence MUST be phrased as a QUESTION ending with '?', "
                "e.g., 'Am I not...?', 'Have I not...?', 'Can I not...?'. "
                "Do NOT write a declarative statement."
            )
        elif self.mood == Mood.IMPERATIVE:
            lines.append("Give a direct command (imperative mood), e.g., 'Be bold!'.")
        elif self.mood == Mood.OPTATIVE:
            lines.append("Express a wish or hope, e.g., 'May I find...', 'If only I could...'.")
        elif self.mood == Mood.POTENTIAL:
            lines.append("Express capability or possibility using 'can' or 'could'.")
        elif self.mood == Mood.SUBJUNCTIVE:
            lines.append(
                "Express a wish or hypothetical using 'may', 'might', or subjunctive form."
            )
        elif self.mood == Mood.CONDITIONAL:
            lines.append("Express a condition using 'would', e.g., 'I would be... if...'.")
        elif self.mood == Mood.HORTATIVE:
            lines.append("Use an exhortation with 'let us', e.g., 'Let us embrace...'.")
        elif self.mood == Mood.JUSSIVE:
            lines.append(
                "Express an order to a third party, e.g., 'Let her be...', 'Let them find...'."
            )

        if self.voice == Voice.ACTIVE:
            lines.append("Use ACTIVE voice: the subject ('I'/'we') performs the action.")
        elif self.voice == Voice.PASSIVE:
            lines.append(
                "CRITICAL: Use PASSIVE voice — the subject receives the action. "
                "Pattern: 'I am/was/have been [past participle]', "
                "e.g., 'I am loved', 'I am guided', 'I am supported by...'. "
                "Do NOT write active sentences like 'I trust' or 'I choose'."
            )

        if self.polarity == Polarity.NEGATIVE:
            lines.append("Include negation using 'not', 'never', 'no longer', or 'without'.")
        elif self.polarity == Polarity.POSITIVE:
            lines.append("Do not include any negation words ('not', 'never', 'no').")

        if self.aspect == Aspect.HABITUAL:
            lines.append(
                "Express a recurring action using 'always', 'regularly', 'consistently', or 'every day'."
            )
        elif self.aspect == Aspect.PERFECT_PROGRESSIVE:
            lines.append("Use the perfect progressive: 'I have been [verb]ing...'.")
        elif self.aspect == Aspect.PROGRESSIVE:
            lines.append("Use the progressive: 'I am [verb]ing...'.")

        if self.tense == Tense.FUTURE_PERFECT:
            lines.append("Use the future perfect tense: 'I will have [past participle]...'.")
        elif self.tense == Tense.FUTURE:
            lines.append("Use the future tense with 'will': 'I will...'.")
        elif self.tense == Tense.PAST:
            lines.append("Use the past tense, e.g., 'I was...', 'I chose...'.")
        elif self.tense == Tense.PRESENT:
            lines.append("Use the present tense, e.g., 'I am...', 'I trust...'.")

        if self.person == Person.FIRST and self.number == Number.SINGULAR:
            lines.append("Subject is 'I' (first person singular).")
        elif self.person == Person.FIRST and self.number == Number.PLURAL:
            lines.append("Subject is 'we' (first person plural).")
        elif self.person == Person.SECOND:
            lines.append("Subject/address is 'you' (second person).")
        elif self.person == Person.THIRD:
            lines.append("Subject is third-person: 'he', 'she', 'it', or 'they'.")

        return "\n".join(f"- {line}" for line in lines)

    def __str__(self) -> str:
        return self.slug


# ---------------------------------------------------------------------------
# Affirmation Grammars
# ---------------------------------------------------------------------------

PAST = Grammar(
    emoji="✅",
    examples=[
        "I was brave.",
        "I chose courage.",
        "I found my strength.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PAST,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

PRESENT = Grammar(
    emoji="⭐",
    examples=[
        "I am confident.",
        "I trust myself.",
        "I am worthy of love.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

FUTURE = Grammar(
    emoji="⏭️",
    examples=[
        "I will succeed.",
        "I will embrace my potential.",
        "I will find peace.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.FUTURE,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

PERFECT_PROGRESSIVE = Grammar(
    emoji="🔄",
    examples=[
        "I have been building my resilience.",
        "I have been choosing kindness.",
        "I have been growing every day.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.PERFECT_PROGRESSIVE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

FUTURE_PERFECT = Grammar(
    emoji="🎯",
    examples=[
        "I will have overcome this challenge.",
        "I will have become the person I am meant to be.",
        "I will have created a life I love.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.FUTURE_PERFECT,
    aspect=Aspect.PERFECTIVE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

FIRST_PLURAL = Grammar(
    emoji="🤝",
    examples=[
        "We are stronger together.",
        "We support each other.",
        "We create positive change.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.PLURAL,
)

THIRD_PRESENT = Grammar(
    emoji="👤",
    examples=[
        "They believe in their own power.",
        "She embraces her uniqueness.",
        "He is worthy of respect.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.SIMPLE,
    person=Person.THIRD,
)

POTENTIAL = Grammar(
    emoji="💪",
    examples=[
        "I could achieve great things.",
        "I can handle whatever comes my way.",
        "I could become who I dream of being.",
    ],
    form=Form.FINITE,
    mood=Mood.POTENTIAL,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

OPTATIVE = Grammar(
    emoji="🙏",
    examples=[
        "May I find clarity in this moment.",
        "If only I could feel at peace.",
        "Would that I might know my own worth.",
    ],
    form=Form.FINITE,
    mood=Mood.OPTATIVE,
    voice=Voice.ACTIVE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

IMPERATIVE = Grammar(
    emoji="❗",
    examples=[
        "Be bold!",
        "Trust yourself!",
        "Embrace your greatness!",
    ],
    form=Form.FINITE,
    mood=Mood.IMPERATIVE,
    voice=Voice.ACTIVE,
    person=Person.SECOND,
    number=Number.SINGULAR,
)

INTERROGATIVE = Grammar(
    emoji="❓",
    examples=[
        "Am I not capable of this?",
        "Have I not already proven my resilience?",
        "Can I not rise to this challenge?",
    ],
    form=Form.FINITE,
    mood=Mood.INTERROGATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    person=Person.FIRST,
    number=Number.SINGULAR,
    polarity=Polarity.NEGATIVE,
)

INFINITIVE = Grammar(
    emoji="♾️",
    examples=[
        "To be courageous.",
        "To live fully.",
        "To love without fear.",
    ],
    form=Form.INFINITIVE,
    voice=Voice.ACTIVE,
    aspect=Aspect.SIMPLE,
)

GERUND = Grammar(
    emoji="💡",
    examples=[
        "Being compassionate is my strength.",
        "Choosing growth every day.",
        "Embracing uncertainty with grace.",
    ],
    form=Form.GERUND,
    voice=Voice.ACTIVE,
)

PASSIVE = Grammar(
    emoji="🌊",
    examples=[
        "I am loved and appreciated.",
        "I am guided by wisdom.",
        "I am supported by those around me.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.PASSIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

HABITUAL = Grammar(
    emoji="🔁",
    examples=[
        "I always choose kindness.",
        "I regularly practice gratitude.",
        "I consistently show up for myself.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.HABITUAL,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

NEGATIVE = Grammar(
    emoji="🫷",
    examples=[
        "I am not defined by my past.",
        "I am not afraid of change.",
        "I do not limit my own potential.",
    ],
    form=Form.FINITE,
    mood=Mood.INDICATIVE,
    voice=Voice.ACTIVE,
    tense=Tense.PRESENT,
    aspect=Aspect.SIMPLE,
    person=Person.FIRST,
    number=Number.SINGULAR,
    polarity=Polarity.NEGATIVE,
)

GRAMMARS = [
    PAST,
    PRESENT,
    FUTURE,
    PERFECT_PROGRESSIVE,
    FUTURE_PERFECT,
    FIRST_PLURAL,
    THIRD_PRESENT,
    POTENTIAL,
    OPTATIVE,
    IMPERATIVE,
    INTERROGATIVE,
    INFINITIVE,
    GERUND,
    PASSIVE,
    HABITUAL,
    NEGATIVE,
]
