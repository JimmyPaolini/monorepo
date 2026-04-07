from enum import StrEnum

from pydantic import BaseModel, computed_field


class DescribedEnum(StrEnum):
    """StrEnum base that stores a per-member generation instruction and usage examples."""

    _description: str
    _examples: tuple[str, str, str]

    def __new__(
        cls,
        name: str,
        description: str,
        examples: tuple[str, str, str],
    ) -> "DescribedEnum":
        described_enum = str.__new__(cls, name)
        described_enum._value_ = name
        described_enum._description = description
        described_enum._examples = examples
        return described_enum

    @staticmethod
    def create(
        *,
        name: str,
        description: str,
        examples: tuple[str, str, str],
    ) -> tuple[str, str, tuple[str, str, str]]:
        return (name, description, examples)

    @property
    def description(self) -> str:
        """Imperative generation instruction for this specifier."""
        return self._description

    @property
    def examples(self) -> tuple[str, str, str]:
        """Short usage examples demonstrating this specifier."""
        return self._examples


class Mood(DescribedEnum):
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
    INDICATIVE = DescribedEnum.create(
        name="INDICATIVE",
        description="State a direct fact or present truth (indicative mood).",
        examples=("I am {adjective}...", "I {verb}...", "I {verb} {noun}..."),
    )

    # -- Irrealis / Epistemic --------------------------------------------------
    SUBJUNCTIVE = DescribedEnum.create(
        name="SUBJUNCTIVE",
        description="Express a wish or hypothetical using 'may', 'might', or subjunctive form.",
        examples=(
            "May I be {adjective}...",
            "Might I {verb} {noun}...",
            "Let it be that I am {adjective}...",
        ),
    )

    CONDITIONAL = DescribedEnum.create(
        name="CONDITIONAL",
        description="Express a condition using 'would'.",
        examples=(
            "I would be {adjective} if I {verb-past}...",
            "I would {verb} {noun} if I {verb-past}...",
            "I could {verb} {noun} if I {verb-past}...",
        ),
    )

    INTERROGATIVE = DescribedEnum.create(
        name="INTERROGATIVE",
        description=(
            "CRITICAL: The sentence MUST be a QUESTION and MUST end with '?'. "
            "Required patterns: 'Am I not...?', 'Have I not...?', 'Can I not...?', 'Do I not...?'. "
            "The '?' at the very end of the sentence is MANDATORY — never omit it. "
            "Do NOT write a declarative statement. 'Can' and 'have' are valid finite auxiliaries."
        ),
        examples=("Am I not {adjective}?", "Have I not {verb-past} {noun}?", "Can I not {verb}?"),
    )

    POTENTIAL = DescribedEnum.create(
        name="POTENTIAL",
        description=(
            "CRITICAL: The main verb structure MUST use 'can' or 'could' or 'able to': 'I can...', 'I could...', 'I am able to...'. "
            "Do NOT use indicative verbs like 'trust', 'believe', or 'know' without 'can'/'could'."
        ),
        examples=("I can {verb}...", "I could {verb} {noun}...", "I am able to {verb}..."),
    )

    DUBITATIVE = DescribedEnum.create(
        name="DUBITATIVE",
        description="Express doubt or skepticism.",
        examples=(
            "I doubt I am {adjective}...",
            "I question whether I am {adjective}...",
            "I can hardly believe I have {verb-past}...",
        ),
    )

    PRESUMPTIVE = DescribedEnum.create(
        name="PRESUMPTIVE",
        description="Express a logical presumption or inference.",
        examples=(
            "I must be {adjective}...",
            "I should be {adjective} of {noun}...",
            "I ought to have {noun}...",
        ),
    )

    ENERGETIC = DescribedEnum.create(
        name="ENERGETIC",
        description="Strongly emphasize and assert the truth of the statement.",
        examples=(
            "I indeed am {adjective}...",
            "I truly do {verb} in {noun}...",
            "I do {verb} my {noun}...",
        ),
    )

    INFERENTIAL = DescribedEnum.create(
        name="INFERENTIAL",
        description="Report something inferred or unwitnessed, not directly confirmed.",
        examples=(
            "I am apparently {verbing}...",
            "It seems I am {adjective}...",
            "I appear to be {adjective}...",
        ),
    )

    SPECULATIVE = DescribedEnum.create(
        name="SPECULATIVE",
        description="Express possibility based on speaker speculation.",
        examples=(
            "I might be {adjective}...",
            "Perhaps I am {adjective}...",
            "Maybe I could {verb}...",
        ),
    )

    # -- Irrealis / Deontic / Directive ----------------------------------------
    IMPERATIVE = DescribedEnum.create(
        name="IMPERATIVE",
        description=(
            "Use the imperative mood: start the sentence with a bare infinitive verb — NO explicit subject. "
            "The implicit (unstated) subject is always 'you'. "
            "Subordinate clauses in the same sentence may use any voice, tense, or person — "
            "only the MAIN verb (the one that starts the sentence) must be bare imperative. "
            "Do NOT write 'You should...', 'You must...', or any sentence that starts with 'I'."
        ),
        examples=("Be {adjective}!", "{Verb} yourself!", "{Verb} your {noun}!"),
    )

    PROHIBITIVE = DescribedEnum.create(
        name="PROHIBITIVE",
        description="Express a negative command or prohibition.",
        examples=("Do not {verb} yourself!", "Never {verb}!", "Stop {verbing} your {noun}!"),
    )

    JUSSIVE = DescribedEnum.create(
        name="JUSSIVE",
        description="Express an order to a third party.",
        examples=(
            "Let her {verb} {noun}...",
            "Let him be {adjective}...",
            "Let them {verb} their {noun}...",
        ),
    )

    HORTATIVE = DescribedEnum.create(
        name="HORTATIVE",
        description="Use an exhortation with 'let us'.",
        examples=(
            "Let us be {adjective}...",
            "Let us {verb} this {noun}...",
            "Let us {verb} {noun} together...",
        ),
    )

    # -- Irrealis / Deontic / Volative -----------------------------------------
    OPTATIVE = DescribedEnum.create(
        name="OPTATIVE",
        description="Express a wish or hope.",
        examples=(
            "May I {verb} {noun}...",
            "If only I could {verb}...",
            "Would that I might {verb} my {noun}...",
        ),
    )

    # -- Irrealis / Deontic ----------------------------------------------------
    COMMISSIVE = DescribedEnum.create(
        name="COMMISSIVE",
        description="Express a commitment or promise to do or be something.",
        examples=(
            "I will be {adjective}...",
            "I commit to {verbing} every {time-unit}...",
            "I pledge to {verb}...",
        ),
    )

    BENEDICTIVE = DescribedEnum.create(
        name="BENEDICTIVE",
        description="Express a blessing or wish directed toward another person.",
        examples=(
            "May you be blessed with {noun}...",
            "May you {verb} {noun}...",
            "May you {verb} and {verb}...",
        ),
    )

    AORIST = DescribedEnum.create(
        name="AORIST",
        description="Express a single, complete historical event.",
        examples=(
            "I was {adjective} that day...",
            "I {verb-past} to the {noun}...",
            "In that moment, I {verb-past}...",
        ),
    )

    DEBITIVE = DescribedEnum.create(
        name="DEBITIVE",
        description="Express a duty or obligation.",
        examples=(
            "I must be {adjective}...",
            "I ought to {verb} in {noun}...",
            "I owe it to myself to {verb}...",
        ),
    )

    PRECATIVE = DescribedEnum.create(
        name="PRECATIVE",
        description="Express a prayer or earnest entreaty.",
        examples=(
            "I pray to {verb} {noun}...",
            "Grant that I may be {adjective}...",
            "Let me be {adjective} of {noun}...",
        ),
    )

    PERMISSIVE = DescribedEnum.create(
        name="PERMISSIVE",
        description="Express permission — granted or self-granted.",
        examples=(
            "I am allowed to be {adjective}...",
            "I permit myself to {verb}...",
            "I give myself permission to {verb}...",
        ),
    )

    NECESSITATIVE = DescribedEnum.create(
        name="NECESSITATIVE",
        description="Express necessity or an urgent need.",
        examples=(
            "I need to {verb} in {noun}...",
            "It is necessary that I {verb}...",
            "I must {verb} my {noun}...",
        ),
    )


class Voice(DescribedEnum):
    """Grammatical voice — the relationship between subject and verb action."""

    ACTIVE = DescribedEnum.create(
        name="ACTIVE",
        description="Use ACTIVE voice: the subject ('I'/'we') performs the action.",
        examples=("I {verb} {noun}...", "I {verb} my {noun}...", "I {verb} my own {noun}..."),
    )

    PASSIVE = DescribedEnum.create(
        name="PASSIVE",
        description=(
            "CRITICAL: The MAIN clause must use PASSIVE voice — the subject receives the action. "
            "Pattern: 'I am/was/have been [past participle]'. "
            "Subordinate clauses and infinitive phrases (e.g., 'ready to feel', 'able to see') may use active voice. "
            "Do NOT write active main clauses like 'I trust', 'I choose', or 'I feel'."
        ),
        examples=(
            "I am {past-participle}...",
            "I am {past-participle} by {noun}...",
            "I am {past-participle} by {description}...",
        ),
    )


class Tense(DescribedEnum):
    """Grammatical tense — when an event takes place.

    Past:           past · recent past · remote past · pluperfect
    Cross-cutting:  nonpast · nonfuture
    Present:        present
    Future:         future · near future · remote future
                    future perfect · future-in-the-past
    """

    # -- Past ------------------------------------------------------------------
    PAST = DescribedEnum.create(
        name="PAST",
        description="Use the past tense.",
        examples=("I was {adjective}...", "I {verb-past} {noun}...", "I {verb-past} my {noun}..."),
    )

    RECENT_PAST = DescribedEnum.create(
        name="RECENT_PAST",
        description="Use the near past — something that happened very recently.",
        examples=(
            "I was just {adjective}...",
            "I have just {verb-past} to {verb}...",
            "Only moments ago I {verb-past}...",
        ),
    )

    REMOTE_PAST = DescribedEnum.create(
        name="REMOTE_PAST",
        description="Use the distant past — something long ago.",
        examples=(
            "Long ago, I {verb-past} my {noun}...",
            "Years back, I {verb-past} {noun}...",
            "I was once {adjective}, and {verb-past}...",
        ),
    )

    PLUPERFECT = DescribedEnum.create(
        name="PLUPERFECT",
        description="Use the past perfect (pluperfect).",
        examples=(
            "I had already {verb-past} {adjective}...",
            "Before that moment, I had {verb-past}...",
            "I had long since {verb-past} my {noun}...",
        ),
    )

    # -- Cross-cutting ---------------------------------------------------------
    NONPAST = DescribedEnum.create(
        name="NONPAST",
        description="Place the event in the present or future — do not use past-tense forms.",
        examples=(
            "I am {adjective}...",
            "I will {verb} my {noun}...",
            "I {verb} every {time-unit}...",
        ),
    )

    NONFUTURE = DescribedEnum.create(
        name="NONFUTURE",
        description="Place the event in the past or present — do not use future-tense forms such as 'will'.",
        examples=(
            "I am {adjective}...",
            "Yesterday I {verb-past} {noun}...",
            "I have always {verb-past} my {noun}...",
        ),
    )

    # -- Present ---------------------------------------------------------------
    PRESENT = DescribedEnum.create(
        name="PRESENT",
        description="Use the present tense.",
        examples=("I am {adjective}...", "I {verb} myself...", "I am {adjective}..."),
    )

    # -- Future ----------------------------------------------------------------
    FUTURE = DescribedEnum.create(
        name="FUTURE",
        description="Use the future tense with 'will'.",
        examples=(
            "I will be {adjective}...",
            "I will {verb} my {noun}...",
            "I will {verb} into {description}...",
        ),
    )

    NEAR_FUTURE = DescribedEnum.create(
        name="NEAR_FUTURE",
        description="Use the near future — something about to happen.",
        examples=(
            "I am about to {verb} my {noun}...",
            "I am on the verge of {verbing}...",
            "I am soon to {verb} {description}...",
        ),
    )

    REMOTE_FUTURE = DescribedEnum.create(
        name="REMOTE_FUTURE",
        description="Use the distant future.",
        examples=(
            "Someday I will {verb} {noun}...",
            "One day I will {verb}...",
            "Far from now, I will have {verb-past}...",
        ),
    )

    FUTURE_PERFECT = DescribedEnum.create(
        name="FUTURE_PERFECT",
        description=(
            "Use FUTURE PERFECT tense: 'I will have [past participle]...'. "
            "This is DIFFERENT from present perfect ('I have [past participle]'). "
            "'I will have become...', 'I will have achieved...', 'I will have created...' are all valid future perfect. "
            "The 'will have' structure is mandatory."
        ),
        examples=(
            "I will have become {adjective}...",
            "I will have {verb-past} my {noun}...",
            "I will have {verb-past} into {description}...",
        ),
    )

    FUTURE_IN_THE_PAST = DescribedEnum.create(
        name="FUTURE_IN_THE_PAST",
        description="Express an event that was future relative to a past moment.",
        examples=(
            "I was going to be {adjective}...",
            "I was about to {verb} my {noun}...",
            "Back then, I would {verb} my {noun}...",
        ),
    )


class Aspect(DescribedEnum):
    """Grammatical aspect — how events extend over time.

    Completeness:   simple · perfective
    Imperfective:   imperfective · progressive · continuous · stative
    Other:          habitual · prospective · gnomic · episodic
                    inceptive · terminative · experiential
    """

    # -- Completeness ----------------------------------------------------------
    SIMPLE = DescribedEnum.create(
        name="SIMPLE",
        description="Express the action plainly without specifying duration or extent over time.",
        examples=("I {verb}...", "I {verb} {noun}...", "I am {adjective}..."),
    )

    PERFECTIVE = DescribedEnum.create(
        name="PERFECTIVE",
        description="Express the action as a complete, bounded whole — viewed start-to-finish.",
        examples=(
            "I {verb-past} and {verb-past}...",
            "I {verb-past} my {noun}...",
            "I {verb-past} the {noun}...",
        ),
    )

    # -- Imperfective ----------------------------------------------------------
    IMPERFECTIVE = DescribedEnum.create(
        name="IMPERFECTIVE",
        description="Express the action as ongoing with internal structure — not yet complete.",
        examples=(
            "I was {verbing} toward my {noun}...",
            "I was becoming {adjective}...",
            "I was {verbing} toward {noun}...",
        ),
    )

    PROGRESSIVE = DescribedEnum.create(
        name="PROGRESSIVE",
        description="Use the progressive: 'I am [verb]ing...'.",
        examples=(
            "I am {verbing}...",
            "I am {verbing} my {noun}...",
            "I am becoming {adjective}...",
        ),
    )

    CONTINUOUS = DescribedEnum.create(
        name="CONTINUOUS",
        description="Express an actively, dynamically evolving ongoing action.",
        examples=(
            "I am {verbing} {adjective}...",
            "I am becoming my {noun}...",
            "I am continuously {verbing} {noun}...",
        ),
    )

    STATIVE = DescribedEnum.create(
        name="STATIVE",
        description="Express an ongoing, unchanging state with no internal movement.",
        examples=("I {verb} my {noun}...", "I remain {adjective}...", "I hold this {noun}..."),
    )

    # -- Other -----------------------------------------------------------------
    HABITUAL = DescribedEnum.create(
        name="HABITUAL",
        description="Express a recurring action using 'always', 'regularly', 'consistently', or 'every day'.",
        examples=(
            "I always {verb} {noun}...",
            "I regularly {verb} {noun}...",
            "I consistently {verb} for {noun}...",
        ),
    )

    PROSPECTIVE = DescribedEnum.create(
        name="PROSPECTIVE",
        description="Express an action on the verge of beginning.",
        examples=(
            "I am about to {verb}...",
            "I am on the verge of {verbing}...",
            "I am ready to {verb} on {noun}...",
        ),
    )

    GNOMIC = DescribedEnum.create(
        name="GNOMIC",
        description="Express a universal truth or timeless principle.",
        examples=(
            "{Noun} {verbs} through {noun}...",
            "{Noun} is {verb-past} in {noun}...",
            "Every {noun} {verbs}...",
        ),
    )

    EPISODIC = DescribedEnum.create(
        name="EPISODIC",
        description="Express a specific individual event or concrete truth.",
        examples=(
            "I {verb-past} {noun} yesterday...",
            "Last week, I {verb-past} up for {noun}...",
            "That day, I {verb-past} my {noun}...",
        ),
    )

    INCEPTIVE = DescribedEnum.create(
        name="INCEPTIVE",
        description="Express the very start or beginning of an action.",
        examples=(
            "I am beginning to {verb}...",
            "I am starting to {verb} {adjective}...",
            "Something is {verbing} within me...",
        ),
    )

    TERMINATIVE = DescribedEnum.create(
        name="TERMINATIVE",
        description="Express the completion or end of an action.",
        examples=(
            "I have stopped {verbing} myself...",
            "I am done {verbing} that {noun}...",
            "I have finished {verbing} myself...",
        ),
    )

    EXPERIENTIAL = DescribedEnum.create(
        name="EXPERIENTIAL",
        description="Express thorough, repeated lived experience.",
        examples=(
            "I have {verb-past} this before...",
            "I have {verb-past} {noun} many times...",
            "I have {verb-past} from every {noun}...",
        ),
    )

    PERFECT_PROGRESSIVE = DescribedEnum.create(
        name="PERFECT_PROGRESSIVE",
        description=(
            "Use the perfect progressive: 'I have been [verb]ing...'. "
            "The sentence must open with 'I have been'. "
            "Coordinated verbs must also use the -ing form, e.g., 'I have been growing and becoming...'"
        ),
        examples=(
            "I have been {verbing}...",
            "I have been {verbing} my {noun}...",
            "I have been {verbing} {noun} every {time-unit}...",
        ),
    )


class Person(DescribedEnum):
    """Grammatical person — the relationship between speaker and subject."""

    FIRST = DescribedEnum.create(
        name="FIRST",
        description="Subject is first-person ('I' for singular, 'we' for plural).",
        examples=("I am {adjective}...", "We are {adjective}...", "I {verb} in {noun}..."),
    )
    SECOND = DescribedEnum.create(
        name="SECOND",
        description="Subject/address is 'you' (second person).",
        examples=("You are {adjective}...", "You {verb} {noun}...", "You have {noun}..."),
    )
    THIRD = DescribedEnum.create(
        name="THIRD",
        description=(
            "CRITICAL: Do NOT use 'I'. "
            "The subject must be third-person: 'he', 'she', 'it', or 'they'. "
            "Never start the sentence with 'I'."
        ),
        examples=("She is {adjective}...", "He {verbs} himself...", "They {verb} their {noun}..."),
    )


class Number(DescribedEnum):
    """Grammatical number — how many subjects are involved."""

    SINGULAR = DescribedEnum.create(
        name="SINGULAR",
        description="Subject is singular (one person): 'I am', 'he is', 'she is.'",
        examples=("I am {adjective}...", "He is {adjective}...", "She {verbs} in {noun}..."),
    )

    PLURAL = DescribedEnum.create(
        name="PLURAL",
        description="Subject is plural (multiple people, unspecified count): 'we are', 'they are.'",
        examples=("We are {adjective}...", "They are {adjective}...", "We all {verb}..."),
    )

    DUAL = DescribedEnum.create(
        name="DUAL",
        description="Subject is exactly two people: 'we two are', 'the two of us are', 'both of us are.'",
        examples=(
            "We two are {adjective} together...",
            "The two of us are {adjective}...",
            "Both of us are {adjective}...",
        ),
    )

    TRIPLE = DescribedEnum.create(
        name="TRIPLE",
        description="Subject is exactly three people: 'we three are', 'the three of us are', 'all three of us are.'",
        examples=(
            "We three are {noun}...",
            "The three of us are {adjective}...",
            "All three of us have {verb-past}...",
        ),
    )

    EXISTENTIAL = DescribedEnum.create(
        name="EXISTENTIAL",
        description="Subject is 'some' (but not all): 'some of us are', 'some people are', 'some among us are.'",
        examples=(
            "Some of us are {adjective}...",
            "Some among us are {adjective}...",
            "Some people {verb} their {noun}...",
        ),
    )

    UNIVERSAL = DescribedEnum.create(
        name="UNIVERSAL",
        description="Subject is 'all' or 'every': 'all of us are', 'everyone is', 'each of us is.'",
        examples=(
            "All of us are {adjective}...",
            "Everyone is {adjective}...",
            "Each of us has {noun}...",
        ),
    )

    PAUCAL = DescribedEnum.create(
        name="PAUCAL",
        description="Subject is a small number: 'few of us are', 'a few of us are', 'only a handful of us are.'",
        examples=(
            "Few of us are {adjective}...",
            "A few of us {verb}...",
            "Only a handful of us {verb}...",
        ),
    )

    SUPERPLURAL = DescribedEnum.create(
        name="SUPERPLURAL",
        description="Subject is a large number: 'many of us are', 'so many of us are', 'countless among us are.'",
        examples=(
            "Many of us are {adjective}...",
            "So many of us {verb}...",
            "Countless people have {verb-past}...",
        ),
    )


class Polarity(DescribedEnum):
    """Grammatical polarity — whether the proposition is affirmed or negated."""

    POSITIVE = DescribedEnum.create(
        name="POSITIVE",
        description="Do not include any negation words ('not', 'never', 'no').",
        examples=("I am {adjective}...", "I {verb} myself...", "I am {adjective}..."),
    )

    NEGATIVE = DescribedEnum.create(
        name="NEGATIVE",
        description="Include negation using 'not', 'never', 'no longer', or 'without'.",
        examples=("I am not {adjective}...", "I never {verb}...", "I am no longer {verb-past}..."),
    )


class Deixis(DescribedEnum):
    """Deictic values — words anchored to a specific time, place, or person.

    The deictic center (origo) is the speaker's "here and now".

    Spatial (proximal → far-distal): proximal · medial · distal · far-distal
    Temporal (relative to origo):    immediate · proximate temporal · remote temporal
    Personal:                        inclusive · exclusive
    """

    # -- Spatial ---------------------------------------------------------------
    PROXIMAL = DescribedEnum.create(
        name="PROXIMAL",
        description="Anchor the statement to the immediate here and now — use 'this', 'here', 'in this moment'.",
        examples=(
            "I am here, in this {noun}...",
            "This {noun} is mine...",
            "I hold this {noun} right now...",
        ),
    )

    MEDIAL = DescribedEnum.create(
        name="MEDIAL",
        description="Use near-but-not-immediate deictic words — 'near', 'that (nearby)', 'this approaching'.",
        examples=(
            "That {noun} is near...",
            "I am becoming that {noun}...",
            "That {noun} is drawing closer...",
        ),
    )

    DISTAL = DescribedEnum.create(
        name="DISTAL",
        description="Use far deictic words — 'that', 'there (far)', 'beyond'.",
        examples=(
            "I reach toward that {noun}...",
            "I am moving toward that {noun}...",
            "That {noun} of me awaits...",
        ),
    )

    FAR_DISTAL = DescribedEnum.create(
        name="FAR_DISTAL",
        description="Use very far deictic words — 'yon', 'yonder', 'far beyond'.",
        examples=(
            "I am drawn toward yonder {noun}...",
            "Out beyond, a greater {noun} awaits...",
            "I look to yonder {noun} of {noun}...",
        ),
    )

    # -- Temporal --------------------------------------------------------------
    IMMEDIATE = DescribedEnum.create(
        name="IMMEDIATE",
        description="Ground the statement in the exact present instant — use 'now', 'this very instant', 'right now', 'in this breath'.",
        examples=(
            "Right now, I am {adjective}...",
            "In this very breath, I am {adjective}...",
            "This instant, I {verb} {noun}...",
        ),
    )

    PROXIMATE_TEMPORAL = DescribedEnum.create(
        name="PROXIMATE_TEMPORAL",
        description="Place the event near in time — use 'soon', 'recently', 'shortly', 'before long'.",
        examples=(
            "I am soon to be {adjective}...",
            "I have recently {verb-past} my {noun}...",
            "Before long, I will {verb}...",
        ),
    )

    REMOTE_TEMPORAL = DescribedEnum.create(
        name="REMOTE_TEMPORAL",
        description="Place the event far in time — use 'later', 'long ago', 'eventually', 'someday'.",
        examples=(
            "I will later {verb} {noun}...",
            "Long ago, I {verb-past} {noun}...",
            "Eventually, {noun} all {verbs}...",
        ),
    )

    # -- Personal --------------------------------------------------------------
    INCLUSIVE = DescribedEnum.create(
        name="INCLUSIVE",
        description="Use inclusive 'we' that encompasses both speaker and addressee — 'we (all of us)', 'together we', 'all of us'.",
        examples=(
            "Together we are {adjective}...",
            "All of us can {verb} {noun}...",
            "We share this {noun}...",
        ),
    )

    EXCLUSIVE = DescribedEnum.create(
        name="EXCLUSIVE",
        description="Use exclusive 'we' that excludes the addressee, or third-person 'they' — 'we (but not you)', 'they among us'.",
        examples=(
            "We {verb} this forward on our own...",
            "We {verb-past} this happen ourselves...",
            "They {verb-past} this without {noun}...",
        ),
    )


class Form(DescribedEnum):
    """Grammatical form — the finite or non-finite character of the verb phrase.

    Non-finite forms lack agreement with a subject for person/number/tense and
    are typically used in subordinate or infinitival constructions.

    Finite:     finite
    Non-finite: infinitive · gerund · participle · supine
    """

    FINITE = DescribedEnum.create(
        name="FINITE",
        description="Use a fully conjugated (finite) verb that agrees with its subject.",
        examples=(
            "I am {adjective}...",
            "She {verbs} every {time-unit}...",
            "We {verb} in {noun}...",
        ),
    )

    INFINITIVE = DescribedEnum.create(
        name="INFINITIVE",
        description="Start with the base infinitive: 'To [verb]...' — no subject or conjugation.",
        examples=("To be {adjective}...", "To {verb} {adverb}...", "To {verb} yourself..."),
    )

    GERUND = DescribedEnum.create(
        name="GERUND",
        description="Begin with a gerund (-ing form as a noun).",
        examples=(
            "Being {adjective} is a {noun}...",
            "{Verbing} {noun} every {time-unit}...",
            "{Verbing} with {noun} {verbs}...",
        ),
    )

    PARTICIPLE = DescribedEnum.create(
        name="PARTICIPLE",
        description="Begin with a participial phrase (-ing or past-participle as a modifier).",
        examples=(
            "{Verbing} {adjective}, I {verb-past}...",
            "{Verb-past} in {noun}, I {verb-past}...",
            "Having {verb-past} {noun}, I {verb-past}...",
        ),
    )

    SUPINE = DescribedEnum.create(
        name="SUPINE",
        description="Use a purposive infinitive structure.",
        examples=(
            "I {verb} forward to {verb} my {noun}...",
            "I {verb-past} here to {verb} {noun}...",
            "I {verb} in order to {verb}...",
        ),
    )


class Grammar(BaseModel):
    """A grammatical form for an affirmation sentence.

    All fields are optional — omitted fields are left to the LLM's discretion.
    Any combination of specifiers can be provided to constrain generation.

    Example (minimal): Grammar(mood=Mood.INDICATIVE)  → "indicative"
    Example (full):    Grammar(...)                   → "indicative-active-present-simple-first-singular-proximal"
    """

    emoji: str
    description: str
    examples: list[str]

    form: Form | None = None
    mood: Mood | None = None
    tense: Tense | None = None
    person: Person | None = None
    voice: Voice | None = None
    aspect: Aspect | None = None
    number: Number | None = None
    deixis: Deixis | None = None
    polarity: Polarity | None = None

    @computed_field
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

    @computed_field
    @property
    def name(self) -> str:
        """Emoji-prefixed Capital Start Case name, omitting unspecified fields.

        Example: "⭐ Indicative Active Present Simple First Singular Proximal"
        """
        return f"{self.emoji} {' '.join(specifier.replace('_', ' ').title() for specifier in self.specifiers)}"

    @computed_field
    @property
    def slug(self) -> str:
        """Kebab-case slug, omitting unspecified fields (emoji excluded).

        Example: "indicative-active-present-simple-first-singular-proximal"
        """
        return "-".join(specifier.replace("_", "-").lower() for specifier in self.specifiers)

    @computed_field
    @property
    def specifier_descriptions(self) -> str:
        """Clear, imperative generation instructions assembled from active grammatical specifiers."""
        lines: list[str] = []

        for specifier in (self.form, self.mood, self.voice, self.polarity, self.aspect, self.tense):
            if specifier is not None and specifier.description:
                lines.append(specifier.description)

        if self.person == Person.FIRST and self.number == Number.SINGULAR:
            lines.append("Subject is 'I' (first person singular).")
        elif self.person == Person.FIRST and self.number == Number.PLURAL:
            lines.append("Subject is 'we' (first person plural).")
        elif self.person is not None and self.person.description:
            lines.append(self.person.description)

        return "\n".join(f"- {line}" for line in lines)

    def __str__(self) -> str:
        return self.slug


# ---------------------------------------------------------------------------
# Affirmation Grammars
# ---------------------------------------------------------------------------

PAST = Grammar(
    emoji="✅",
    description="Grounds the affirmation in a completed past action or state — celebrating past strength and achievement.",
    examples=[
        "I was {adjective}...",
        "I {verb-past}...",
        "I {verb-past} {noun}...",
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
    description="Asserts a present-moment truth directly and simply — the most fundamental form of affirmation.",
    examples=[
        "I am {adjective}...",
        "I {verb}...",
        "I am {adjective} of {noun}...",
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
    description="Projects confident intention toward the future — affirming what one will be or achieve.",
    examples=[
        "I will {verb}...",
        "I will {verb} my {noun}...",
        "I will {verb} {noun}...",
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
    description="Affirms continuous progress that began in the past and is still unfolding — capturing momentum and sustained effort.",
    examples=[
        "I have been {verbing}...",
        "I have been {verbing} my {noun}...",
        "I have been {verbing} every {time-unit}...",
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
    description="Visualizes a future moment where something is already accomplished — affirming from the vantage point of completion.",
    examples=[
        "I will have {verb-past} {noun}...",
        "I will have become {description}...",
        "I will have {verb-past} a {noun}...",
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
    description="Affirms shared strength and collective identity — embracing connection and belonging with others.",
    examples=[
        "We are {adjective} together...",
        "We {verb} each other...",
        "We {verb} {noun}...",
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
    description="Speaks a present truth about another person — broadening perspective beyond the self.",
    examples=[
        "They {verb} in their own {noun}...",
        "She {verbs} her {noun}...",
        "He is {adjective} of {noun}...",
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
    description="Affirms capability and possibility — what the speaker can do or is able to accomplish.",
    examples=[
        "I can {verb}...",
        "I could {verb} {noun}...",
        "I am able to {verb}...",
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
    description="Expresses a sincere wish or deep longing — voicing the heart's desire with openness and hope.",
    examples=[
        "May I {verb} {noun}...",
        "If only I could {verb}...",
        "Would that I might {verb}...",
    ],
    form=Form.FINITE,
    mood=Mood.OPTATIVE,
    voice=Voice.ACTIVE,
    person=Person.FIRST,
    number=Number.SINGULAR,
)

IMPERATIVE = Grammar(
    emoji="❗",
    description="Commands the self or another to act — activating, direct, and rousing.",
    examples=[
        "Be {adjective}!",
        "{Verb} yourself!",
        "{Verb} your {noun}!",
    ],
    form=Form.FINITE,
    mood=Mood.IMPERATIVE,
    voice=Voice.ACTIVE,
    person=Person.SECOND,
    number=Number.SINGULAR,
)

INTERROGATIVE = Grammar(
    emoji="❓",
    description="Challenges limiting beliefs through a rhetorical question — confronting self-doubt head-on.",
    examples=[
        "Am I not {adjective}?",
        "Have I not {verb-past} {noun}?",
        "Can I not {verb}?",
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
    description="Names a purpose or aspiration in its purest infinitive form — to be, to do, to become.",
    examples=[
        "To {verb}...",
        "To {verb} {adverb}...",
        "To {verb} without {noun}...",
    ],
    form=Form.INFINITIVE,
    voice=Voice.ACTIVE,
    aspect=Aspect.SIMPLE,
)

GERUND = Grammar(
    emoji="💡",
    description="Affirms through process and action — celebrating the doing and becoming, not merely the state of being.",
    examples=[
        "Being {adjective} is {noun}...",
        "{Verbing} {noun} every day...",
        "{Verbing} {noun} with {noun}...",
    ],
    form=Form.GERUND,
    voice=Voice.ACTIVE,
)

PASSIVE = Grammar(
    emoji="🌊",
    description="Affirms being received, held, or supported — openness to grace, love, and forces beyond the self.",
    examples=[
        "I am {past-participle}...",
        "I am {past-participle} by {noun}...",
        "I am {past-participle} by {description}...",
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
    description="Reinforces a repeated practice or pattern — affirming what the speaker consistently does or believes.",
    examples=[
        "I always {verb} {noun}...",
        "I regularly {verb} {noun}...",
        "I consistently {verb} {noun}...",
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
    description="Affirms by negating a false belief or limitation — releasing what is not true about the self.",
    examples=[
        "I am not {adjective}...",
        "I am not {adjective} of {noun}...",
        "I do not {verb} {noun}...",
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
