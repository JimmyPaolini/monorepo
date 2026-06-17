// 🏷️ Body Types
import type {
  aspectPhases,
  eclipsePhases,
  retrogradeBodies,
} from "./caelundas.constants.js";
import type {
  symbolByAspect,
  symbolByAsteroid,
  symbolByBody,
  symbolByDecan,
  symbolByLunarPhase,
  symbolByMajorAspect,
  symbolByMartianPhase,
  symbolByMercurianPhase,
  symbolByMinorAspect,
  symbolByNode,
  symbolByOrbitalDirection,
  symbolByPlanet,
  symbolByQuadrupleAspect,
  symbolByQuintupleAspect,
  symbolBySextupleAspect,
  symbolBySign,
  symbolBySpecialtyAspect,
  symbolByTripleAspect,
  symbolByVenusianPhase,
} from "./caelundas.symbol-constants.js";

// 🪧 Signs

/**
 * Union of all two-body aspect types (major, minor, and specialty).
 */
export type Aspect = keyof typeof symbolByAspect;

/**
 * Phase of an aspect's lifecycle (applying, exact, or separating).
 *
 * Describes whether two bodies are approaching, at, or departing from
 * an exact angular relationship.
 *
 * @remarks
 * Phase values:
 * - "applying": Bodies approaching exact aspect angle (within orb)
 * - "perfective": Bodies at precise aspect angle
 * - "separating": Bodies departing from exact aspect angle (within orb)
 *
 * Applying aspects are considered more potent than separating aspects in
 * traditional astrological interpretation.
 *
 * @see {@link getMajorAspectEvents} for aspect phase detection
 */
export type AspectPhase = (typeof aspectPhases)[number];

// 🔟 Decans

/**
 * Asteroids (minor planets) tracked for astrological significance.
 *
 * Includes major asteroids: Ceres, Pallas, Juno, Vesta, Chiron.
 */
export type Asteroid = keyof typeof symbolByAsteroid;

/**
 * Union of all celestial body types tracked by caelundas.
 *
 * Encompasses planets, asteroids, comets, and calculated lunar points.
 * Primary type used for ephemeris queries and aspect calculations.
 */
export type Body = keyof typeof symbolByBody;

// 🪐 Planets

/**
 * Unicode symbol representing a celestial body.
 */
export type BodySymbol = (typeof symbolByBody)[Body];
// export type PlanetSymbol = (typeof symbolByPlanet)[Planet];

// 💫 Asteroids

/**
 * Decan representing a 10-degree subdivision within a zodiac sign.
 *
 * Each sign is divided into three decans (e.g., "aries 1", "aries 2", "aries 3").
 */
export type Decan = keyof typeof symbolByDecan;
// export type AsteroidSymbol = (typeof symbolByAsteroid)[Asteroid];

// ☄️ Comets

/**
 * Notable periodic comets tracked for ingress events.
 *
 * Tracked for sign ingress but not aspects due to irregular visibility.
 */
// export type Comet = keyof typeof symbolByComet;
// export type CometSymbol = (typeof symbolByComet)[Comet];

// 🌕 Nodes

/**
 * Unicode symbol representing a decan subdivision.
 */
export type DecanSymbol = (typeof symbolByDecan)[Decan];
// export type NodeSymbol = (typeof symbolByNode)[Node];

// 🔭 Bodies

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

/**
 * Lunar phase representing the Moon's illumination state as seen from Earth.
 *
 * Eight phases from new moon (0°) through full moon (180°) and back.
 */
export type LunarPhase = keyof typeof symbolByLunarPhase;

// 📐 Major Aspects

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

// 🖇️ Minor Aspects

/**
 * Mars phase representing its illumination and visibility state from Earth.
 *
 * Mars exhibits limited phase variation (never appears as a crescent) because
 * it orbits outside Earth's orbit.
 */
export type MartianPhase = keyof typeof symbolByMartianPhase;

/**
 * Mercury phase representing its illumination and visibility state from Earth.
 *
 * Mercury exhibits phases similar to Venus due to its orbit inside Earth's orbit.
 * Phases cycle more quickly than Venus (approximately 116 days per synodic period).
 */
export type MercurianPhase = keyof typeof symbolByMercurianPhase;

// 🧮 Specialty Aspects

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

// 📐 Double Aspects

/**
 * Lunar nodes and apsides representing calculated points in the Moon's orbit.
 *
 * Includes north/south nodes (ecliptic intersections) and lunar perigee/apogee
 * (closest/farthest points from Earth).
 */
export type Node = keyof typeof symbolByNode;
// export type AspectSymbol = (typeof symbolByAspect)[Aspect];

// 🔺 Triple Aspects

/**
 * Direction of a planet's apparent motion relative to the zodiac.
 *
 * Values: "direct" (eastward), "retrograde" (westward), "stationary" (transition).
 */
export type OrbitalDirection = keyof typeof symbolByOrbitalDirection;
// export type TripleAspectSymbol = (typeof symbolByTripleAspect)[TripleAspect];

// ✖️ Quadruple Aspects

/**
 * Unicode symbol representing an orbital direction.
 */
export type OrbitalDirectionSymbol =
  (typeof symbolByOrbitalDirection)[OrbitalDirection];
// export type QuadrupleAspectSymbol =
//   (typeof symbolByQuadrupleAspect)[QuadrupleAspect];

// ⭐ Quintuple Aspects

/**
 * Classical and modern planets tracked for ephemeris calculations.
 *
 * Includes luminaries (Sun, Moon), inner planets (Mercury, Venus, Mars),
 * social planets (Jupiter, Saturn), and outer planets (Uranus, Neptune, Pluto).
 */
export type Planet = keyof typeof symbolByPlanet;
// export type QuintupleAspectSymbol =
//   (typeof symbolByQuintupleAspect)[QuintupleAspect];

// 🔯 Sextuple Aspects

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
// export type SextupleAspectSymbol =
//   (typeof symbolBySextupleAspect)[SextupleAspect];

// ✨ Stellium

// export type Stellium = keyof typeof symbolByStellium;
// export type StelliumSymbol = (typeof symbolByStellium)[Stellium];

// 🔁 Orbital Directions

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
// export type LunarPhaseSymbol = (typeof symbolByLunarPhase)[LunarPhase];

// ♀️ Venusian Phases

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

/**
 * Zodiac sign representing a 30-degree segment of the ecliptic.
 *
 * The zodiac is divided into 12 equal signs starting from the vernal equinox (0° Aries).
 * Signs are tropical (aligned with seasons) rather than sidereal.
 */
export type Sign = keyof typeof symbolBySign;

// ☿️ Mercurian Phases

/**
 * Unicode symbol representing a zodiac sign.
 */
export type SignSymbol = (typeof symbolBySign)[Sign];

// ♂ Martian Phases

/**
 * Specialty aspects based on harmonic divisions of the zodiac circle.
 *
 * Includes quintile (72°), biquintile (144°), septile (51.43°), novile (40°)
 * with ±1-2° orbs.
 */
export type SpecialtyAspect = keyof typeof symbolBySpecialtyAspect;

// 📐 Aspect Phases

/**
 * Unicode symbol representing a specialty aspect.
 */
export type SpecialtyAspectSymbol =
  (typeof symbolBySpecialtyAspect)[SpecialtyAspect];

/**
 * Three-body aspect patterns: grand trine, t-square, yod.
 *
 * Complex geometric configurations formed when multiple planets create
 * specific angular relationships. These patterns are evaluated in real-time
 * for geometric completion with a third body.
 *
 * @see {@link getTripleAspectEvents} for pattern detection algorithm
 * @see {@link getAspectBodiesAt} for retrieving active aspect context
 */
export type TripleAspect = keyof typeof symbolByTripleAspect;

// 🔭 Body Types

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
