# TSDoc Implementation Plan: caelundas

Comprehensive documentation strategy for the caelundas astronomical calendar application. This document provides templates, terminology, and organization for systematically adding TSDoc comments to ~43 source files.

## TSDoc Template Patterns

### Function Documentation

````typescript
/**
 * Brief one-line description of what the function does.
 *
 * More detailed explanation if needed, including algorithm descriptions,
 * astronomical concepts, or important implementation notes.
 *
 * @param paramName - Description of parameter and its constraints
 * @param options - Configuration object
 * @param options.property - Nested property description
 * @returns Description of return value and its structure
 * @throws {ErrorType} Description of when and why error is thrown
 * @see {@link RelatedFunction} for related functionality
 * @see {@link https://example.com} for external documentation
 *
 * @example
 * ```typescript
 * const result = functionName(arg1, { property: value });
 * ```
 */
````

### Interface/Type Documentation

```typescript
/**
 * Brief description of the type's purpose.
 *
 * Additional context about when and how to use this type.
 *
 * @see {@link RelatedType} for related structures
 */
export interface TypeName {
  /**
   * Description of this property and its significance.
   */
  propertyName: string;

  /**
   * Optional property with constraints.
   *
   * @remarks Additional notes about usage or validation
   */
  optionalProperty?: number;
}
```

### Class Documentation

```typescript
/**
 * Brief description of the class's responsibility.
 *
 * Detailed explanation of the class's role in the system,
 * lifecycle, and key interactions.
 *
 * @see {@link RelatedClass} for related functionality
 */
export class ClassName {
  /**
   * Description of what this method accomplishes.
   *
   * @param param - Parameter description
   * @returns Return value description
   * @throws {ErrorType} When error occurs
   */
  public methodName(param: string): Result {
    // implementation
  }
}
```

### Constant Documentation

```typescript
/**
 * Brief description of the constant's purpose.
 *
 * Context about the value, including its astronomical significance
 * or computational role.
 *
 * @remarks Source or derivation of this value
 */
export const CONSTANT_NAME = value;
```

## File Priority Tiers

### Tier 1: Critical Public API (5 files)

**Priority:** Highest - These files define the application's core interface and main execution flow.

1. [main.ts](../applications/caelundas/src/main.ts) - Application entry point, orchestrates the entire ephemeris pipeline
2. [ephemeris.service.ts](../applications/caelundas/src/ephemeris/ephemeris.service.ts) - Core ephemeris calculations using NASA JPL data
3. [ephemeris.aggregates.ts](../applications/caelundas/src/ephemeris/ephemeris.aggregates.ts) - Aggregates ephemeris data for time ranges
4. [calendar.utilities.ts](../applications/caelundas/src/calendar.utilities.ts) - iCal generation and calendar event formatting
5. [types.ts](../applications/caelundas/src/types.ts) - Core type definitions for celestial bodies and aspects

### Tier 2: Domain Logic (5 files)

**Priority:** High - Core astronomical event detection algorithms.

6. [aspects.utilities.ts](../applications/caelundas/src/events/aspects/aspects.utilities.ts) - Aspect angle calculations and detection
7. [majorAspects.events.ts](../applications/caelundas/src/events/aspects/majorAspects.events.ts) - Conjunction, opposition, trine, square, sextile
8. [retrogrades.events.ts](../applications/caelundas/src/events/retrogrades/retrogrades.events.ts) - Retrograde motion detection for planets
9. [monthlyLunarCycle.events.ts](../applications/caelundas/src/events/monthlyLunarCycle/monthlyLunarCycle.events.ts) - New moon, full moon, quarters
10. [dailySolarCycle.events.ts](../applications/caelundas/src/events/dailyCycles/dailySolarCycle.events.ts) - Sunrise, noon, sunset calculations

### Tier 3: Supporting Utilities (4 files)

**Priority:** Medium - Essential helper functions and validation.

11. [math.utilities.ts](../applications/caelundas/src/math.utilities.ts) - Astronomical math functions (angles, interpolation)
12. [database.utilities.ts](../applications/caelundas/src/database.utilities.ts) - SQLite caching for ephemerides and aspects
13. [duration.utilities.ts](../applications/caelundas/src/duration.utilities.ts) - Aspect duration tracking and overlap detection
14. [input.schema.ts](../applications/caelundas/src/input.schema.ts) - Zod validation schemas for user input

### Tier 4: Aspect Pattern Generators (11 files)

**Priority:** Medium - Specialized aspect detection algorithms.

15. [minorAspects.events.ts](../applications/caelundas/src/events/aspects/minorAspects.events.ts) - Semi-sextile, quincunx, semi-square, sesquiquadrate
16. [specialtyAspects.events.ts](../applications/caelundas/src/events/aspects/specialtyAspects.events.ts) - Quintile, biquintile, septile, novile
17. [tripleAspects.events.ts](../applications/caelundas/src/events/aspects/tripleAspects.events.ts) - Grand trine, T-square, Yod
18. [quadrupleAspects.events.ts](../applications/caelundas/src/events/aspects/quadrupleAspects.events.ts) - Grand cross, kite, mystic rectangle
19. [quintupleAspects.events.ts](../applications/caelundas/src/events/aspects/quintupleAspects.events.ts) - Five-body patterns
20. [sextupleAspects.events.ts](../applications/caelundas/src/events/aspects/sextupleAspects.events.ts) - Star of David, grand sextile
21. [stellium.events.ts](../applications/caelundas/src/events/aspects/stellium.events.ts) - Concentration of 3+ bodies in sign
22. [aspects.cache.ts](../applications/caelundas/src/events/aspects/aspects.cache.ts) - Caching strategy for active aspects
23. [aspects.composition.ts](../applications/caelundas/src/events/aspects/aspects.composition.ts) - Composing complex patterns from simple aspects
24. [phases.events.ts](../applications/caelundas/src/events/phases/phases.events.ts) - Planetary phase calculations (Venus, Mercury, Mars)
25. [phases.utilities.ts](../applications/caelundas/src/events/phases/phases.utilities.ts) - Phase angle utilities

### Tier 5: Cycles and Special Events (18 files)

**Priority:** Lower - Specialized event generators and supporting utilities.

26. [dailyLunarCycle.events.ts](../applications/caelundas/src/events/dailyCycles/dailyLunarCycle.events.ts) - Moonrise, moonset, culmination
27. [dailyCycle.utilities.ts](../applications/caelundas/src/events/dailyCycles/dailyCycle.utilities.ts) - Daily cycle calculations
28. [annualSolarCycle.events.ts](../applications/caelundas/src/events/annualSolarCycle/annualSolarCycle.events.ts) - Solstices, equinoxes, cross-quarters
29. [annualSolarCycle.utilities.ts](../applications/caelundas/src/events/annualSolarCycle/annualSolarCycle.utilities.ts) - Annual cycle utilities
30. [twilights.events.ts](../applications/caelundas/src/events/twilights/twilights.events.ts) - Civil, nautical, astronomical twilight
31. [twilights.utilities.ts](../applications/caelundas/src/events/twilights/twilights.utilities.ts) - Twilight calculations
32. [eclipses.events.ts](../applications/caelundas/src/events/eclipses/eclipses.events.ts) - Solar and lunar eclipse detection
33. [eclipses.utilities.ts](../applications/caelundas/src/events/eclipses/eclipses.utilities.ts) - Eclipse prediction utilities
34. [ingresses.events.ts](../applications/caelundas/src/events/ingresses/ingresses.events.ts) - Sign and decan ingress detection
35. [ingresses.utilities.ts](../applications/caelundas/src/events/ingresses/ingresses.utilities.ts) - Ingress calculations
36. [retrogrades.utilities.ts](../applications/caelundas/src/events/retrogrades/retrogrades.utilities.ts) - Retrograde detection utilities
37. [monthlyLunarCycle.utilities.ts](../applications/caelundas/src/events/monthlyLunarCycle/monthlyLunarCycle.utilities.ts) - Lunar cycle utilities
38. [ephemeris.constants.ts](../applications/caelundas/src/ephemeris/ephemeris.constants.ts) - JPL body constants and configurations
39. [ephemeris.types.ts](../applications/caelundas/src/ephemeris/ephemeris.types.ts) - Ephemeris data structures
40. [output.utilities.ts](../applications/caelundas/src/output.utilities.ts) - JSON and iCal output formatting
41. [fetch.utilities.ts](../applications/caelundas/src/fetch.utilities.ts) - HTTP utilities for NASA JPL API
42. [constants.ts](../applications/caelundas/src/constants.ts) - Application-wide constants
43. [symbols.ts](../applications/caelundas/src/symbols.ts) - Unicode symbols for celestial bodies and aspects

## Domain Terminology Guide

### Astronomical Concepts

- **Aspect:** Angular relationship between two or more celestial bodies (e.g., 0°, 60°, 90°, 120°, 180°)
- **Orb:** Allowable deviation from exact aspect angle (e.g., ±8° for major aspects)
- **Applying:** Aspect that is forming, bodies approaching exact angle
- **Separating:** Aspect that is breaking apart, bodies moving away from exact angle
- **Ephemeris:** Table of celestial body positions at regular time intervals
- **Ecliptic:** Apparent path of the Sun across the celestial sphere
- **Longitude:** Position along the ecliptic, measured in degrees (0°-360°)
- **Declination:** Angular distance north or south of the celestial equator
- **Retrograde:** Apparent backward motion of a planet relative to the stars
- **Ingress:** Moment when a body enters a new zodiac sign or decan
- **Phase:** Illumination state of a body as seen from Earth (applies to Moon, Venus, Mercury, Mars)
- **Syzygy:** Alignment of three celestial bodies (Sun, Earth, and Moon for lunar phases)
- **Eclipse:** Occultation of Sun (solar) or Moon (lunar) due to alignment
- **Culmination:** Highest point in the sky (transit of the meridian)
- **Twilight:** Period between day and night (civil, nautical, astronomical)

### Aspect Types

- **Major Aspects (0°-180°):** Conjunction (0°), sextile (60°), square (90°), trine (120°), opposition (180°)
- **Minor Aspects (30°-150°):** Semi-sextile (30°), semi-square (45°), sesquiquadrate (135°), quincunx (150°)
- **Specialty Aspects:** Quintile (72°), biquintile (144°), septile (51.43°), novile (40°)
- **Triple Aspects:** Grand trine (3 bodies at 120°), T-square (2 oppositions + 2 squares), Yod (2 quincunxes + 1 sextile)
- **Quadruple Aspects:** Grand cross (4 squares + 2 oppositions), kite, mystic rectangle
- **Stellium:** 3+ bodies within 8° in the same sign

### Bodies

- **Luminaries:** Sun and Moon
- **Inner Planets:** Mercury, Venus, Mars
- **Social Planets:** Jupiter, Saturn
- **Outer Planets:** Uranus, Neptune, Pluto
- **Asteroids:** Ceres, Pallas, Juno, Vesta, Chiron
- **Lunar Nodes:** North Node (ascending), South Node (descending)
- **Comets:** Notable periodic comets tracked for ingresses

### Time Concepts

- **Julian Date (JD):** Continuous count of days since January 1, 4713 BCE (noon UTC)
- **Barycentric Dynamical Time (TDB):** Time scale for astronomical calculations
- **UTC:** Coordinated Universal Time, civil time standard
- **Local Time:** Time adjusted for timezone and daylight saving

### Calculation Methods

- **Interpolation:** Estimating intermediate values from discrete ephemeris data
- **Root-finding:** Numerically solving for exact aspect times (bisection, Newton's method)
- **Caching:** Storing computed ephemerides and aspects in SQLite to avoid redundant calculations

## Cross-Referencing Strategy

### Core Function References

All event generator functions should reference:

- `@see {@link getEphemerides}` for ephemeris data retrieval
- `@see {@link getCalendar}` for iCal generation
- `@see {@link upsertEvents}` for database persistence

### Aspect Detection Chain

Aspect utilities should cross-reference:

- `@see {@link normalizeAngle}` for angle normalization (math.utilities)
- `@see {@link interpolateLinear}` for time estimation (math.utilities)
- `@see {@link getActiveAspectsAt}` for aspect caching (database.utilities)
- `@see {@link aspects.cache}` for aspect lifetime management

### Event Type Hierarchy

Event generators should reference related patterns:

- Major aspect → Minor aspect → Specialty aspect
- Double aspect → Triple aspect → Quadruple/Quintuple/Sextuple aspect
- Individual aspects → Stellium (concentration)
- Lunar phase → Eclipse (special case of New/Full Moon)
- Sign ingress → Decan ingress (subdivision)

### Cycle References

Cycle events should link:

- Daily solar cycle ↔ Daily lunar cycle (complementary)
- Daily solar cycle → Twilights (derived from sunrise/sunset)
- Monthly lunar cycle → Lunar phases (phase progression)
- Annual solar cycle → Solstices/Equinoxes (seasonal markers)

## Documentation Style Guidelines

### Voice and Tone

- Use imperative mood for function descriptions: "Calculates...", "Detects...", "Returns..."
- Be precise with astronomical terminology
- Include units for numerical values: "degrees", "minutes", "Julian days"
- Explain "why" for non-obvious implementation decisions

### Code Examples

- Provide examples for complex functions with multiple parameters
- Show typical use cases from the application pipeline
- Include expected output format
- Demonstrate error handling when applicable

### Remarks and Notes

Use `@remarks` for:

- Performance considerations (e.g., "This function caches results for 1 hour")
- Astronomical accuracy notes (e.g., "Accurate to within 1 minute of arc")
- Data source citations (e.g., "Uses NASA JPL DE431 ephemeris")
- Algorithm references (e.g., "Based on Jean Meeus's Astronomical Algorithms")

### Error Documentation

Document all `@throws` cases:

- Invalid input ranges (e.g., "dates outside ephemeris range")
- Missing dependencies (e.g., "ephemeris data not cached")
- Calculation failures (e.g., "root-finding did not converge")

## Implementation Strategy

### Phase 1: Foundation (Tier 1)

Document the core API to establish patterns and terminology. These files have the most complexity and require careful explanation.

**Focus areas:**

- Pipeline orchestration in main.ts
- Ephemeris calculation algorithms
- Type system documentation
- Calendar generation flow

### Phase 2: Domain Logic (Tier 2)

Document the primary astronomical algorithms that other code depends on.

**Focus areas:**

- Aspect detection mechanics
- Retrograde calculation algorithms
- Phase calculation methods
- Daily event timing

### Phase 3: Utilities (Tier 3)

Document supporting infrastructure that enables domain logic.

**Focus areas:**

- Mathematical functions and their accuracy
- Database caching strategy
- Duration tracking approach
- Input validation rules

### Phase 4: Specialized Generators (Tiers 4-5)

Batch document related files by domain using subagents:

**Batch 1: Aspect patterns**

- Minor, specialty, triple, quadruple, quintuple, sextuple aspects
- Stellium detection
- Aspect composition and caching

**Batch 2: Cycles**

- Daily lunar cycle
- Annual solar cycle
- Twilights

**Batch 3: Special events**

- Phases (Venus, Mercury, Mars)
- Eclipses
- Ingresses

**Batch 4: Supporting files**

- Event-specific utilities
- Ephemeris constants and types
- Output formatting
- Symbols and constants

### Phase 5: Validation

Run comprehensive checks:

```bash
nx run caelundas:lint      # Verify JSDoc requirements met
nx run caelundas:test      # Ensure no behavioral changes
nx run caelundas:typecheck # Confirm type accuracy
```

## ESLint JSDoc Requirements

Current configuration from [eslint.config.base.ts](../eslint.config.base.ts):

```typescript
"jsdoc/require-jsdoc": [
  "warn",
  {
    require: {
      FunctionDeclaration: true,        // All exported functions
      MethodDefinition: true,           // All class methods
      ClassDeclaration: true,           // All classes
      ArrowFunctionExpression: false,   // Not required
      FunctionExpression: false,        // Not required
    },
    contexts: [
      "TSInterfaceDeclaration",         // All interfaces
      "TSTypeAliasDeclaration",         // All type aliases
      "TSEnumDeclaration",              // All enums
    ],
    publicOnly: true,                   // Only exported items
    exemptEmptyConstructors: true,
    exemptEmptyFunctions: false,
  },
],
```

**Must document:**

- ✅ All exported functions (function declarations)
- ✅ All exported classes and their public methods
- ✅ All exported interfaces
- ✅ All exported type aliases
- ✅ All exported enums

**Not required:**

- ❌ Arrow function expressions
- ❌ Function expressions
- ❌ Non-exported (internal) code
- ❌ Empty constructors

## Common Patterns by File Type

### Event Generators (\*.events.ts)

```typescript
/**
 * Detects [EVENT TYPE] events within the specified date range.
 *
 * [Explanation of the astronomical phenomenon and detection algorithm]
 *
 * @param startDate - Range start (inclusive)
 * @param endDate - Range end (inclusive)
 * @param ephemerides - Pre-computed ephemeris data for required bodies
 * @returns Array of calendar events with precise timing and metadata
 * @throws {Error} When ephemeris data is missing for required date range
 * @see {@link getEphemerides} for ephemeris data retrieval
 * @see {@link RELATED_UTILITY} for calculation details
 */
export function getEventTypeEvents(
  startDate: moment.Moment,
  endDate: moment.Moment,
  ephemerides: Ephemerides,
): CalendarEvent[] {
  // implementation
}
```

### Utilities (\*.utilities.ts)

````typescript
/**
 * [VERB] [WHAT] [FOR WHAT PURPOSE].
 *
 * [Algorithm description or mathematical formula]
 *
 * @param input - Input description with constraints
 * @returns Output description with guarantees
 * @remarks [Performance notes, accuracy, or algorithmic source]
 *
 * @example
 * ```typescript
 * const result = utilityFunction(input);
 * // result === expectedValue
 * ```
 */
export function utilityFunction(input: Type): ReturnType {
  // implementation
}
````

### Type Definitions (types.ts, \*.types.ts)

```typescript
/**
 * Represents [CONCEPT] in the astronomical domain.
 *
 * [Context about when this type is used and what it models]
 *
 * @see {@link RelatedType} for related structures
 * @see {@link https://en.wikipedia.org/wiki/...} for astronomical background
 */
export interface TypeName {
  /**
   * [Property description with astronomical significance]
   *
   * @remarks [Units, range constraints, or calculation source]
   */
  property: Type;
}
```

## References

### External Documentation

- **NASA JPL Horizons:** <https://ssd.jpl.nasa.gov/horizons/>
- **Astronomical Algorithms (Jean Meeus):** Standard reference for calculations
- **TSDoc Specification:** <https://tsdoc.org/>
- **JSDoc Tags:** <https://jsdoc.app/>

### Internal Documentation

- [Static Analysis Tools](../documentation/static-analysis-tools.md) - ESLint and TSDoc configuration
- [GitHub Actions Workflows](../documentation/github-actions-workflows.md) - CI/CD pipeline
- [Abbreviations](../documentation/abbreviations.md) - Common acronyms

---

**Document Status:** Planning document for systematic TSDoc implementation
**Created:** 2026-01-21
**Target Completion:** Incremental, tier-by-tier implementation
