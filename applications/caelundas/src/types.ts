/**
 * Core type definitions for celestial bodies, aspects, and astronomical phenomena.
 *
 * Types are derived from symbol mappings to ensure consistency between runtime values
 * and type definitions.
 */

import {
  aspectBodies,
  aspectPhases,
  type eclipsePhases,
  ingressBodies,
  phaseBodies,
  retrogradeBodies,
  type symbolByAspect,
  type symbolByAsteroid,
  type symbolByBody,
  type symbolByComet,
  type symbolByDecan,
  type symbolByLunarPhase,
  type symbolByMajorAspect,
  type symbolByMartianPhase,
  type symbolByMercurianPhase,
  type symbolByMinorAspect,
  type symbolByNode,
  type symbolByOrbitalDirection,
  type symbolByPlanet,
  type symbolByQuadrupleAspect,
  type symbolByQuintupleAspect,
  type symbolBySextupleAspect,
  type symbolBySign,
  type symbolBySpecialtyAspect,
  type symbolByTripleAspect,
  type symbolByVenusianPhase,
} from "./symbols";

// #region Signs 🪧

/**
 * Zodiac sign representing a 30-degree segment of the ecliptic.
 *
 * The zodiac is divided into 12 equal signs starting from the vernal equinox (0° Aries).
 * Signs are tropical (aligned with seasons) rather than sidereal.
 */
export type Sign = keyof typeof symbolBySign;

/**
 * Unicode symbol representing a zodiac sign.
 */
export type SignSymbol = (typeof symbolBySign)[Sign];

// #region Decans 🔟

/**
 * Decan representing a 10-degree subdivision within a zodiac sign.
 *
 * Each sign is divided into three decans (e.g., "aries 1", "aries 2", "aries 3").
 */
export type Decan = keyof typeof symbolByDecan;

/**
 * Unicode symbol representing a decan subdivision.
 */
export type DecanSymbol = (typeof symbolByDecan)[Decan];

// #region Planets 🪐

/**
 * Classical and modern planets tracked for ephemeris calculations.
 *
 * Includes luminaries (Sun, Moon), inner planets (Mercury, Venus, Mars),
 * social planets (Jupiter, Saturn), and outer planets (Uranus, Neptune, Pluto).
 */
export type Planet = keyof typeof symbolByPlanet;
// export type PlanetSymbol = (typeof symbolByPlanet)[Planet];

// #region Asteroids 💫

/**
 * Asteroids (minor planets) tracked for astrological significance.
 *
 * Includes major asteroids: Ceres, Pallas, Juno, Vesta, Chiron.
 */
export type Asteroid = keyof typeof symbolByAsteroid;
// export type AsteroidSymbol = (typeof symbolByAsteroid)[Asteroid];

// #region Comets ☄️

/**
 * Notable periodic comets tracked for ingress events.
 *
 * Tracked for sign ingress but not aspects due to irregular visibility.
 */
export type Comet = keyof typeof symbolByComet;
// export type CometSymbol = (typeof symbolByComet)[Comet];

// #region Nodes 🌕

/**
 * Lunar nodes and apsides representing calculated points in the Moon's orbit.
 *
 * Includes north/south nodes (ecliptic intersections) and lunar perigee/apogee
 * (closest/farthest points from Earth).
 */
export type Node = keyof typeof symbolByNode;
// export type NodeSymbol = (typeof symbolByNode)[Node];

// #region Bodies 🔭

/**
 * Union of all celestial body types tracked by caelundas.
 *
 * Encompasses planets, asteroids, comets, and calculated lunar points.
 * Primary type used for ephemeris queries and aspect calculations.
 */
export type Body = keyof typeof symbolByBody;

/**
 * Unicode symbol representing a celestial body.
 */
export type BodySymbol = (typeof symbolByBody)[Body];

// #region Major Aspects 📐

/**
 * Major aspects representing primary angular relationships between bodies.
 *
 * Includes conjunction (0°), sextile (60°), square (90°), trine (120°),
 * opposition (180°) with orbs of ±6-8°.
 */
export type MajorAspect = keyof typeof symbolByMajorAspect;

/**
 * Unicode symbol representing a major aspect.
 */
export type MajorAspectSymbol = (typeof symbolByMajorAspect)[MajorAspect];

// #region Minor Aspects 🖇️

/**
 * Minor aspects representing secondary angular relationships between bodies.
 *
 * Includes semi-sextile (30°), semi-square (45°), sesquiquadrate (135°),
 * quincunx (150°) with ±3° orbs.
 */
export type MinorAspect = keyof typeof symbolByMinorAspect;

/**
 * Unicode symbol representing a minor aspect.
 */
export type MinorAspectSymbol = (typeof symbolByMinorAspect)[MinorAspect];

// #region Specialty Aspects 🧮

/**
 * Specialty aspects based on harmonic divisions of the zodiac circle.
 *
 * Includes quintile (72°), biquintile (144°), septile (51.43°), novile (40°)
 * with ±1-2° orbs.
 */
export type SpecialtyAspect = keyof typeof symbolBySpecialtyAspect;

/**
 * Unicode symbol representing a specialty aspect.
 */
export type SpecialtyAspectSymbol =
  (typeof symbolBySpecialtyAspect)[SpecialtyAspect];

// #region Double Aspects 📐

/**
 * Union of all two-body aspect types (major, minor, and specialty).
 */
export type Aspect = keyof typeof symbolByAspect;
// export type AspectSymbol = (typeof symbolByAspect)[Aspect];

// #region Triple Aspects 🔺

/**
 * Three-body aspect patterns: grand trine, t-square, yod.
 */
 * for geometric completion with a third body.
 *
 * @see {@link getTripleAspectEvents} for pattern detection algorithm
 * @see {@link getActiveAspectsAt} for retrieving active aspect context
 */
export type TripleAspect = keyof typeof symbolByTripleAspect;
// export type TripleAspectSymbol = (typeof symbolByTripleAspect)[TripleAspect];

// #region Quadruple Aspects ✖️

/**
 * Four-body aspect patterns formed by specific angular relationships.
 *
 * Quadruple aspects represent complex geometric configurations involving
 * four celestial bodies in balanced angular relationships.
 *
 * @remarks
 * Pattern definitions:
 * - "grand cross": Four bodies forming two oppositions (180°) and four squares (90°)
 * - "kite": Grand trine with a fourth body opposite one of the trine bodies
 * - "mystic rectangle": Two oppositions (180°) connected by four sextiles (60°)
 *
 * @see {@link getQuadrupleAspectEvents} for pattern detection
 */
export type QuadrupleAspect = keyof typeof symbolByQuadrupleAspect;
// export type QuadrupleAspectSymbol =
//   (typeof symbolByQuadrupleAspect)[QuadrupleAspect];

// #region Quintuple Aspects ⭐

/**
 * Five-body aspect patterns (rare geometric configurations).
 *
 * Quintuple aspects represent highly complex and rare alignments
 * involving five celestial bodies simultaneously.
 *
 * @remarks
 * These patterns are extremely rare and typically only form with asteroids
 * and lunar nodes included in calculations.
 *
 * @see {@link getQuintupleAspectEvents} for detection algorithm
 */
export type QuintupleAspect = keyof typeof symbolByQuintupleAspect;
// export type QuintupleAspectSymbol =
//   (typeof symbolByQuintupleAspect)[QuintupleAspect];

// #region Sextuple Aspects 🔯

/**
 * Six-body aspect patterns (extremely rare geometric configurations).
 *
 * Sextuple aspects represent the most complex multi-body alignments,
 * requiring all bodies to be in precise angular relationships.
 *
 * @remarks
 * Pattern definitions:
 * - "grand sextile": Six bodies each 60° apart forming a perfect hexagon
 * - "star of david": Two overlapping grand trines 60° apart
 *
 * These patterns are exceedingly rare in actual celestial configurations.
 *
 * @see {@link getSextupleAspectEvents} for detection algorithm
 */
export type SextupleAspect = keyof typeof symbolBySextupleAspect;
// export type SextupleAspectSymbol =
//   (typeof symbolBySextupleAspect)[SextupleAspect];

// #region Stellium ✨

// export type Stellium = keyof typeof symbolByStellium;
// export type StelliumSymbol = (typeof symbolByStellium)[Stellium];

// #region Orbital Directions 🔁

/**
 * Direction of a planet's apparent motion relative to the zodiac.
 *
 * Values: "direct" (eastward), "retrograde" (westward), "stationary" (transition).
 */
export type OrbitalDirection = keyof typeof symbolByOrbitalDirection;

/**
 * Unicode symbol representing an orbital direction.
 */
export type OrbitalDirectionSymbol =
  (typeof symbolByOrbitalDirection)[OrbitalDirection];

/**
 * Unicode symbol representing orbital direction.
 *
 * @example
 * ```typescript
/**
 * Lunar phase representing the Moon's illumination state as seen from Earth.
 *
 * Eight phases from new moon (0°) through full moon (180°) and back.
 */
export type LunarPhase = keyof typeof symbolByLunarPhase;
// export type LunarPhaseSymbol = (typeof symbolByLunarPhase)[LunarPhase];

// #region Venusian Phases ♀️

/**
 * Venus phase representing its illumination and visibility state from Earth.
 *
 * Phases correlate with Venus's synodic cycle and visibility as morning/evening star.
 * Occurs in an 8-year cycle (5 synodic periods = 8 Earth years).
 */
export type VenusianPhase = keyof typeof symbolByVenusianPhase;

/**
 * Unicode symbol representing a Venus phase.
 */
export type VenusianPhaseSymbol = (typeof symbolByVenusianPhase)[VenusianPhase];

// #region Mercurian Phases ☿️

/**
 * Mercury phase representing its illumination and visibility state from Earth.
 *
 * Mercury exhibits phases similar to Venus due to its orbit inside Earth's orbit.
 * Phases cycle more quickly than Venus (approximately 116 days per synodic period).
 *
/**
 * Phase of an aspect's lifecycle (applying, exact, or separating).
 *
 * Describes whether two bodies are approaching, at, or departing from
 * an exact angular relationship.
 *
 * @remarks
 * Phase values:
 * - "applying": Bodies approaching exact aspect angle (within orb)
 * - "exact": Bodies at precise aspect angle
 * - "separating": Bodies departing from exact aspect angle (within orb)
 *
 * Applying aspects are considered more potent than separating aspects in
 * traditional astrological interpretation.
 *
 * @see {@link getMajorAspectEvents} for aspect phase detection
 */
export type AspectPhase = (typeof aspectPhases)[number];

/**
 * Phase of an eclipse event (partial, total, annular, or penumbral).
 *
 * Describes the type and magnitude of a solar or lunar eclipse.
 *
 * @remarks
 * Eclipse phase values:
 * - "partial": Moon or Sun partially obscured
 * - "total": Complete obscuration (lunar eclipse or solar totality)
 * - "annular": Ring of light visible around Moon (solar eclipse)
 * - "penumbral": Moon passes through Earth's penumbral shadow only
 *
 * @see {@link getEclipseEvents} for eclipse detection and classification
 */
export type EclipsePhase = (typeof eclipsePhases)[number];

// #region Body Types 🔭

/**
 * Celestial body that exhibits retrograde motion.
 *
 * Only planets (excluding luminaries Sun and Moon) can appear to move
 * retrograde from Earth's perspective.
 *
 * @remarks
 * Retrograde bodies include:
 * - Inner planets: Mercury, Venus, Mars
 * - Outer planets: Jupiter, Saturn, Uranus, Neptune, Pluto
 *
 * Sun and Moon never go retrograde. Asteroids and nodes can also exhibit
 * retrograde motion but are not currently tracked.
 *
 * @see {@link getRetrogradeEvents} for retrograde detection
 * @see {@link OrbitalDirection} for direction states
 */
export type RetrogradeBody = (typeof retrogradeBodies)[number];

/**
 * Unicode symbol for a body that exhibits retrograde motion.
 */
export type RetrogradeBodySymbol = (typeof symbolByBody)[RetrogradeBody];

// export type PhaseBody = (typeof phaseBodies)[number];
// export type PhaseBodySymbol = (typeof symbolByBody)[PhaseBody];

// export type SignIngressBody = (typeof ingressBodies)[number];
// export type DecanIngressBody = (typeof ingressBodies)[number];
// export type PeakIngressBody = (typeof ingressBodies)[number];

// export type MajorAspectBody = (typeof aspectBodies)[number];
// export type MinorAspectBody = (typeof aspectBodies)[number];
// export type SpecialtyAspectBody = (typeof aspectBodies)[number];

// export type TripleAspectBody = (typeof aspectBodies)[number];
// export type QuadrupleAspectBody = (typeof aspectBodies)[number];
// export type QuintupleAspectBody = (typeof aspectBodies)[number];
// export type SextupleAspectBody = (typeof aspectBodies)[number];
// export type StelliumBody = (typeof aspectBodies)[number];

/**
 * Re-exported arrays of bodies for specific astronomical phenomena.
 *
 * These arrays define which celestial bodies participate in various types of events:
 * - aspectPhases: Phases of aspect lifecycle
 * - retrogradeBodies: Planets that exhibit retrograde motion
 * - planetaryPhaseBodies: Bodies with observable phase cycles (Moon, Venus, Mercury, Mars)
 * - signIngressBodies/decanIngressBodies/peakIngressBodies: Bodies tracked for zodiac ingress
 * - aspectBodies variants: Bodies included in aspect pattern detection
 *
 * @remarks
 * These arrays are used internally for filtering ephemeris queries and event detection.
 * Exported for type safety and validation in user code.
 */

// export type Apsis = keyof typeof symbolByApsis;
// export type ApsisSymbol = (typeof symbolByApsis)[Apsis];

// export type Position = keyof typeof symbolByPosition;
// export type PositionSymbol = (typeof symbolByPosition)[Position];

// export type Phase = keyof typeof symbolByPhase;
// export type PhaseSymbol = (typeof symbolByPhase)[Phase];

// #region Houses 🏠

// export type House = keyof typeof symbolByHouse;
// export type HouseSymbol = (typeof symbolByHouse)[House];

// export type PhaseBody = (typeof phaseBodies)[number];
// export type PhaseBodySymbol = (typeof symbolByBody)[PhaseBody];

// export type SignIngressBody = (typeof ingressBodies)[number];
// export type DecanIngressBody = (typeof ingressBodies)[number];
// export type PeakIngressBody = (typeof ingressBodies)[number];

// export type MajorAspectBody = (typeof aspectBodies)[number];
// export type MinorAspectBody = (typeof aspectBodies)[number];
// export type SpecialtyAspectBody = (typeof aspectBodies)[number];

// export type TripleAspectBody = (typeof aspectBodies)[number];
// export type QuadrupleAspectBody = (typeof aspectBodies)[number];
// export type QuintupleAspectBody = (typeof aspectBodies)[number];
// export type SextupleAspectBody = (typeof aspectBodies)[number];
// export type StelliumBody = (typeof aspectBodies)[number];

// Re-export arrays from symbols for convenience
export {
  aspectPhases,
  retrogradeBodies,
  phaseBodies as planetaryPhaseBodies,
  ingressBodies as signIngressBodies,
  ingressBodies as decanIngressBodies,
  ingressBodies as peakIngressBodies,
  aspectBodies as majorAspectBodies,
  aspectBodies as minorAspectBodies,
  aspectBodies as specialtyAspectBodies,
  aspectBodies as tripleAspectBodies,
  aspectBodies as quadrupleAspectBodies,
  aspectBodies as quintupleAspectBodies,
  aspectBodies as sextupleAspectBodies,
  aspectBodies as stelliumBodies,
};
