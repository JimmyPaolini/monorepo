// ♟️ Constants
import type {
  AzimuthElevationEphemerisBody,
  DiameterEphemerisBody,
  DistanceEphemerisBody,
  IlluminationEphemerisBody,
} from "../ephemeris/ephemeris.types";

type Aspect = keyof typeof symbolByAspect;
// Local type aliases derived from constants to avoid circular imports with caelundas.types.ts
type MajorAspect = keyof typeof symbolByMajorAspect;
type MinorAspect = keyof typeof symbolByMinorAspect;
type SpecialtyAspect = keyof typeof symbolBySpecialtyAspect;

/**
 * Strongly-typed wrapper around `Object.keys()` that preserves the key union type.
 *
 * `Object.keys()` always returns `string[]` by design, so a cast is required to
 * recover the typed keys. This helper centralizes that cast in one place.
 */
export function typedObjectKeys<T extends object>(obj: T): (keyof T)[] {
  // type-coverage:ignore-next-line
  return Object.keys(obj) as (keyof T)[];
}

// #region Signs 🪧

/**
 * Maps each zodiac sign to its Unicode symbol.
 * Uses standard astrological glyphs from the Unicode Miscellaneous Symbols block.
 */
export const symbolBySign = {
  aquarius: "♒︎",
  aries: "♈",
  cancer: "♋︎",
  capricorn: "♑︎",
  gemini: "♊︎",
  leo: "♌︎",
  libra: "♎︎",
  pisces: "♓︎",
  sagittarius: "♐︎",
  scorpio: "♏︎",
  taurus: "♉︎",
  virgo: "♍︎",
} as const;

// #region Decans 🔟

/**
 * Maps each decan number (1-3) to its emoji representation.
 * Each zodiac sign is divided into three decans of 10° each.
 */
export const symbolByDecan = {
  "1": "1️⃣",
  "2": "2️⃣",
  "3": "3️⃣",
} as const;

// #region Planets 🪐

/**
 * Maps each classical and modern planet to its Unicode symbol.
 * Includes Sun and Moon as luminaries in traditional astrological usage.
 */
export const symbolByPlanet = {
  jupiter: "♃",
  mars: "♂️",
  mercury: "☿",
  moon: "🌙",
  neptune: "♆",
  pluto: "♇",
  saturn: "♄",
  sun: "☀️",
  uranus: "♅",
  venus: "♀️",
} as const;

// #region Asteroids 💫

/**
 * Maps each asteroid to its Unicode symbol.
 * Includes Chiron (centaur) and the four main belt asteroids used in modern astrology.
 */
export const symbolByAsteroid = {
  ceres: "⚳",
  chiron: "⚷",
  juno: "⚵",
  lilith: "⚸",
  pallas: "⚴",
  vesta: "⚶",
} as const;

// #region Comets ☄️

/**
 * Maps each comet to its emoji representation.
 * Currently includes Halley's comet as the most notable periodic comet.
 */
// export const symbolByComet = {
//   halley: "☄",
// } as const;

// #region Nodes 🌕

/**
 * Maps lunar nodes and lunar apsides to their symbols.
 * Nodes mark lunar orbit crossings with the ecliptic; apsides mark near/far points from Earth.
 */
export const symbolByNode = {
  "lunar apogee": "🌚",
  "lunar perigee": "🌝",
  "north lunar node": "☊",
  "south lunar node": "☋",
} as const;

// #region Bodies 🔭

/**
 * Complete mapping of all celestial bodies to their symbols.
 * Combines planets, asteroids, and lunar nodes.
 */
export const symbolByBody = {
  ...symbolByPlanet,
  ...symbolByAsteroid,
  ...symbolByNode,
} as const;

// #region Aspects 🧭

// #region Major Aspects 📐

/**
 * Maps each of the five Ptolemaic aspects to its Unicode symbol.
 * These are the classical aspects used since ancient times.
 */
export const symbolByMajorAspect = {
  conjunct: "☌",
  opposite: "☍",
  sextile: "⚹",
  square: "□",
  trine: "△",
} as const;

// #region Minor Aspects 🖇️

/**
 * Maps each minor aspect to its Unicode symbol.
 * Minor aspects are used in modern psychological astrology.
 */
export const symbolByMinorAspect = {
  quincunx: "⚻",
  semisextile: "⚺",
  semisquare: "∠",
  sesquiquadrate: "⚼",
} as const;

// #region Specialty Aspects 🧮

/**
 * Maps each harmonic aspect to its symbol.
 * Based on harmonic divisions (5ths, 7ths, 9ths) of the zodiac circle.
 */
export const symbolBySpecialtyAspect = {
  biquintile: "±",
  decile: "⊥",
  novile: "N",
  quintile: "⬠",
  septile: "S",
  tredecile: "∓",
  undecile: "U",
} as const;

// #region Double Aspects 📐

/**
 * Complete mapping of all two-body aspects to their symbols.
 * Combines major, minor, and specialty aspects.
 */
export const symbolByAspect = {
  ...symbolByMajorAspect,
  ...symbolByMinorAspect,
  ...symbolBySpecialtyAspect,
} as const;

// #region Triple Aspects 🔺

/**
 * Maps three-planet aspect patterns to their symbols.
 * Includes T-square, grand trine, yod (finger of God), and hammer patterns.
 */
export const symbolByTripleAspect = {
  "grand trine": "△",
  hammer: "🔨",
  "t-square": "⊤",
  yod: "⚛",
} as const;

// #region Quadruple Aspects ✖️

/**
 * Maps four-planet aspect patterns to their symbols.
 * Includes grand cross, kite, mystic rectangle, and other complex configurations.
 */
export const symbolByQuadrupleAspect = {
  boomerang: "🪃",
  butterfly: "🦋",
  cradle: "🛏",
  "grand cross": "➕",
  hourglass: "⏳",
  kite: "🪁",
  "mystic rectangle": "🚪",
} as const;

// #region Quintuple Aspects ⭐

/**
 * Maps five-planet aspect patterns to their symbols.
 * The pentagram configuration forms a five-pointed star.
 */
export const symbolByQuintupleAspect = {
  pentagram: "⭐",
} as const;

// #region Sextuple Aspects 🔯

/**
 * Maps six-planet aspect patterns to their symbols.
 * The hexagram configuration forms a six-pointed star.
 */
export const symbolBySextupleAspect = {
  hexagram: "🔯",
} as const;

// #region Stellium ✨

/**
 * Maps stellium configurations to their emoji symbols.
 * Stelliums are clusters of 3+ planets in the same sign or house.
 * Symbol brightness increases with the number of planets involved.
 */
export const symbolByStellium = {
  "decuple stellium": "☀️",
  "duodecuple stellium": "🔥",
  "nonuple stellium": "🔆",
  "octuple stellium": "✴️",
  "quadruple stellium": "🌟",
  "quintuple stellium": "⭐",
  "septuple stellium": "🌠",
  "sextuple stellium": "💫",
  "triple stellium": "✨",
  "undecuple stellium": "🌞",
} as const;

// #region Orbital Directions 🔁

/**
 * Maps orbital motion directions to their emoji symbols.
 * Retrograde indicates apparent backward motion from Earth's perspective.
 */
export const symbolByOrbitalDirection = {
  direct: "↪️",
  prograde: "↪️",
  retrograde: "↩️",
} as const;

// #region Planetary Directions ⏫

// export const symbolByPlanetaryDirection = {
//   rise: "🔼",
//   ascendant: "🔼",

//   zenith: "⏫",
//   "medium coeli": "⏫",
//   culmination: "⏫",

//   set: "🔽",
//   descendant: "🔽",

//   nadir: "⏬",
//   "imum coeli": "⏬",
//   declination: "⏬",
// } as const;

// #region Directions 🧭

// export const symbolByDirection = {
//   ...symbolByOrbitalDirection,
//   ...symbolByPlanetaryDirection,
// };

// #region Positions 🌐

// export const symbolByApsis = {
//   perihelion: "🔥",
//   aphelion: "❄️",
//   perigee: "🔥",
//   apogee: "❄️",
//   periapsis: "🔥",
//   apoapsis: "❄️",
// } as const;

// export const symbolByPosition = {
//   ...symbolByApsis,
//   "vernal equinox": "🌸",
//   beltane: "🌼",
//   "summer solstice": "🌞",
//   lammas: "🌾",
//   "autumn equinox": "🍂",
//   samhain: "🎃",
//   "winter solstice": "☃️",
//   imbolc: "🐑",
// } as const;

// #region Phases 🌓

/**
 * Maps lunar phases to their emoji representations.
 * Ordered from new moon through the synodic month back to new moon.
 */
export const symbolByLunarPhase = {
  "first quarter": "🌓",
  full: "🌕",
  "last quarter": "🌗",
  new: "🌑",
  "waning crescent": "🌘",
  "waning gibbous": "🌖",
  "waxing crescent": "🌒",
  "waxing gibbous": "🌔",
} as const;

// #region Venusian Phases ♀️

/**
 * Maps Venus's phases and synodic cycle events to their emoji combinations.
 * Tracks Venus as morning/evening star with stations, elongations, and brightest points.
 */
export const symbolByVenusianPhase = {
  "inferior conjunction": "🌑☌",
  new: "🌑",

  "morning rise": "🌄↥",
  "morning set": "🌄↧",
  "morning station": "🌄⏹️",
  "western brightest": "🔆",
  "western elongation": "⬅️📏",

  full: "🌕",
  "superior conjunction": "🌕☌",

  "eastern brightest": "🔆",
  "eastern elongation": "📏➡️",
  "evening rise": "🌇↥",
  "evening set": "🌇↧",
  "evening station": "🌇⏹️",
} as const;

// #region Mercurian Phases ☿️

/**
 * Maps Mercury's phases and synodic cycle events to their emoji combinations.
 * Includes Promethean (morning) and Epimethean (evening) conjunctions in Hellenistic tradition.
 */
export const symbolByMercurianPhase = {
  "inferior conjunction": "🌑☌",
  new: "🌑",
  "promethian conjunction": "🌑☌",

  "morning rise": "🌄↥",
  "morning set": "🌄↧",
  "western brightest": "🔆",
  "western elongation": "⬅️📏",

  "epimethian conjunction": "🌕☌",
  full: "🌕",
  "superior conjunction": "🌕☌",

  "eastern brightest": "🔆",
  "eastern elongation": "📏➡️",
  "evening rise": "🌇↥",
  "evening set": "🌇↧",
} as const;

// #region Martian Phases ♂️

/**
 * Maps Mars's phases and synodic cycle events to their emoji combinations.
 * Tracks visibility as morning/evening star with retrograde stations.
 */
export const symbolByMartianPhase = {
  conjunction: "🌑☌",
  "morning star": "🌄🌟",
  new: "🌑",

  "morning first": "🌄🌖",
  "morning rise": "🌄↥",
  "morning set": "🌄↧",
  "morning station": "🌄⏹️",

  "evening star": "🌇🌟",
  full: "🌕",
  opposition: "🌕☍",

  brightest: "🌟",

  "evening last": "🌇🌘",
  "evening rise": "🌇↥",
  "evening set": "🌇↧",
  "evening station": "🌇⏹️",
} as const;

// export const symbolByPhase = {
//   ...symbolByLunarPhase,
//   ...symbolByVenusianPhase,
//   ...symbolByMercurianPhase,
//   ...symbolByMartianPhase,
// } as const;

// #region Houses 🏠

// export const symbolByHouse = {
//   first: "1",
//   second: "2",
//   third: "3",
//   fourth: "4",
//   fifth: "5",
//   sixth: "6",
//   seventh: "7",
//   eighth: "8",
//   ninth: "9",
//   tenth: "10",
//   eleventh: "11",
//   twelfth: "12",
// } as const;

// #region Event Phase Types 🔄

/**
 * Array of aspect lifecycle phases.
 * Aspects form as bodies approach, become perfective at peak, then dissolve as bodies separate.
 */
export const aspectPhases = ["forming", "perfective", "dissolving"] as const;
/**
 * Array of eclipse event phases.
 * Tracks the start, peak, and end of solar/lunar eclipses.
 */
export const eclipsePhases = ["beginning", "maximum", "ending"] as const;

// #region Body Arrays 🔭

/**
 * Array of bodies that can exhibit retrograde motion.
 * Excludes Sun, Moon (always direct), and nodes (different calculation).
 */
export const retrogradeBodies = [
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron",
  "lilith",
  "ceres",
  "pallas",
  "juno",
  "vesta",
] as const;

/**
 * Array of inferior/superior planets tracked for synodic phases.
 * Venus and Mercury have interior orbits; Mars has observable evening star phases.
 */
export const phaseBodies = ["venus", "mercury", "mars"] as const;

/**
 * Array of bodies tracked for sign/decan ingress events.
 * Includes planets, asteroids, selected comets, and lunar nodes.
 */
export const ingressBodies = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron",
  "lilith",
  "ceres",
  "pallas",
  "juno",
  "vesta",
  "north lunar node",
  "lunar apogee",
] as const;

/**
 * Array of bodies used in aspect calculations.
 * Matches ingressBodies; all tracked bodies can form aspects with each other.
 */
export const aspectBodies = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron",
  "lilith",
  "ceres",
  "pallas",
  "juno",
  "vesta",
  "north lunar node",
  "lunar apogee",
] as const;

// #region Signs 🪧

/**
 * Array of all zodiac sign names in tropical zodiac order.
 * Starts with Aries (0°) and proceeds counter-clockwise around the ecliptic.
 */
export const signs = typedObjectKeys(symbolBySign);
// export const signSymbols: SignSymbol[] = Object.values(symbolBySign);

// #region Decans 🔟

// export const decans = Object.keys(symbolByDecan) as Decan[];
// export const decanSymbols: DecanSymbol[] = Object.values(symbolByDecan);

// #region Planets 🪐

// export const planets = Object.keys(symbolByPlanet) as Planet[];
// export const planetSymbols: PlanetSymbol[] = Object.values(symbolByPlanet);

// #region Asteroids 💫

// export const asteroids = Object.keys(symbolByAsteroid) as Asteroid[];
// export const asteroidSymbols: AsteroidSymbol[] =
//   Object.values(symbolByAsteroid);

// #region Comets ☄️

// export const comets = Object.keys(symbolByComet) as Comet[];
// export const cometSymbols: CometSymbol[] = Object.values(symbolByComet);

// #region Nodes 🌕

/**
 * Array of lunar node names.
 * Includes ascending/descending nodes and apogee/perigee points.
 */
export const nodes = typedObjectKeys(symbolByNode);
// export const nodeSymbols: NodeSymbol[] = Object.values(symbolByNode);

// #region Bodies 🔭

/**
 * Array of all tracked celestial bodies.
 * Combines planets, asteroids, comets, and lunar nodes.
 */
export const bodies = typedObjectKeys(symbolByBody);
// export const bodySymbols: BodySymbol[] = Object.values(symbolByBody);

/**
 * Bodies queried for azimuth/elevation ephemeris.
 * Used for rise, set, and culmination event detection.
 */
export const azimuthElevationBodies: AzimuthElevationEphemerisBody[] = [
  "sun",
  "moon",
];

/**
 * Bodies queried for illumination ephemeris.
 * Used for lunar and inferior planet phase detection.
 */
export const illuminationBodies: IlluminationEphemerisBody[] = [
  "moon",
  "mercury",
  "venus",
  "mars",
];

/**
 * Bodies queried for angular diameter ephemeris.
 * Used for eclipse calculations.
 */
export const diameterBodies: DiameterEphemerisBody[] = ["sun", "moon"];

/**
 * Bodies queried for distance ephemeris.
 * Used for apsis and phase detection.
 */
export const distanceBodies: DistanceEphemerisBody[] = [
  "sun",
  "mercury",
  "venus",
  "mars",
];

// #region Aspects 🧭

// #region Major Aspects 📐

/**
 * Array of major aspect names.
 * The five Ptolemaic aspects: conjunction, sextile, square, trine, opposition.
 */
export const majorAspects = typedObjectKeys(symbolByMajorAspect);
// export const majorAspectSymbols: MajorAspectSymbol[] =
//   Object.values(symbolByMajorAspect);

// #region Minor Aspects 🖇️

/**
 * Array of minor aspect names.
 * Includes semi-sextile, semi-square, sesquiquadrate, quincunx.
 */
export const minorAspects = typedObjectKeys(symbolByMinorAspect);
// export const minorAspectSymbols: MinorAspectSymbol[] =
//   Object.values(symbolByMinorAspect);

// #region Specialty Aspects 🧮

/**
 * Array of specialty aspect names.
 * Harmonic aspects based on divisions by 5, 7, 9, etc.
 */
export const specialtyAspects = typedObjectKeys(symbolBySpecialtyAspect);
// export const specialtyAspectSymbols: SpecialtyAspectSymbol[] = Object.values(
//   symbolBySpecialtyAspect,
// );

// #region Double Aspects 📐

/**
 * Array of all aspect names.
 * Combines major, minor, and specialty aspects.
 */
export const aspects = typedObjectKeys(symbolByAspect);
// export const aspectSymbols: AspectSymbol[] = Object.values(symbolByAspect);

// #region Aspect Orbs 🔮

/**
 * Maps each major aspect to its exact angle in degrees.
 */
const angleByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 0,
  opposite: 180,
  sextile: 60,
  square: 90,
  trine: 120,
};

/**
 * Maps each minor aspect to its exact angle in degrees.
 */
const angleByMinorAspect: Record<MinorAspect, number> = {
  quincunx: 150,
  semisextile: 30,
  semisquare: 45,
  sesquiquadrate: 135,
};

/**
 * Maps each specialty aspect to its exact angle in degrees.
 * Based on harmonic divisions of the circle.
 */
const angleBySpecialtyAspect: Record<SpecialtyAspect, number> = {
  biquintile: 144,
  decile: 36,
  novile: 40,
  quintile: 72,
  septile: 51.428_571_428_571_43,
  tredecile: 108,
  undecile: 32.727_272_727_272_73,
};

/**
 * Complete mapping of all aspects to their exact angles in degrees.
 */
export const angleByAspect: Record<Aspect, number> = {
  ...angleByMajorAspect,
  ...angleByMinorAspect,
  ...angleBySpecialtyAspect,
};

/**
 * Maps each major aspect to its allowable orb (tolerance) in degrees.
 * Larger orbs for more significant aspects.
 */
const orbByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 8,
  opposite: 8,
  sextile: 4,
  square: 6,
  trine: 6,
};

/**
 * Maps each minor aspect to its allowable orb in degrees.
 * Smaller orbs for minor aspects.
 */
const orbByMinorAspect: Record<MinorAspect, number> = {
  quincunx: 3,
  semisextile: 2,
  semisquare: 2,
  sesquiquadrate: 2,
};

/**
 * Maps each specialty aspect to its allowable orb in degrees.
 * Very tight orbs for harmonic aspects.
 */
const orbBySpecialtyAspect: Record<SpecialtyAspect, number> = {
  biquintile: 2,
  decile: 1,
  novile: 1,
  quintile: 2,
  septile: 1,
  tredecile: 1,
  undecile: 1,
};

/**
 * Complete mapping of all aspects to their orb tolerances in degrees.
 * Used in aspect detection algorithms to determine if an aspect is active.
 */
export const orbByAspect: Record<Aspect, number> = {
  ...orbByMajorAspect,
  ...orbByMinorAspect,
  ...orbBySpecialtyAspect,
};

// #region Triple Aspects 🔺

// export const tripleAspects = Object.keys(
//   symbolByTripleAspect,
// ) as TripleAspect[];
// export const tripleAspectSymbols: TripleAspectSymbol[] =
//   Object.values(symbolByTripleAspect);

// #region Quadruple Aspects ✖️

// export const quadrupleAspects = Object.keys(
//   symbolByQuadrupleAspect,
// ) as QuadrupleAspect[];
// export const quadrupleAspectSymbols: QuadrupleAspectSymbol[] = Object.values(
//   symbolByQuadrupleAspect,
// );

// #region Quintuple Aspects ⭐

// export const quintupleAspects = Object.keys(
//   symbolByQuintupleAspect,
// ) as QuintupleAspect[];
// export const quintupleAspectSymbols: QuintupleAspectSymbol[] = Object.values(
//   symbolByQuintupleAspect,
// );

// #region Sextuple Aspects 🔯

// export const sextupleAspects = Object.keys(
//   symbolBySextupleAspect,
// ) as SextupleAspect[];
// export const sextupleAspectSymbols: SextupleAspectSymbol[] = Object.values(
//   symbolBySextupleAspect,
// );

// #region Stellium ✨

// export const stelliums = Object.keys(symbolByStellium) as Stellium[];
// export const stelliumSymbols: StelliumSymbol[] =
//   Object.values(symbolByStellium);

// #region Orbital Directions 🔁

// export const orbitalDirections = Object.keys(
//   symbolByOrbitalDirection,
// ) as OrbitalDirection[];
// export const orbitalDirectionSymbols: OrbitalDirectionSymbol[] = Object.values(
//   symbolByOrbitalDirection,
// );

// #region Planetary Directions ⏫

// export const planetaryDirections = Object.keys(
//   symbolByPlanetaryDirection,
// ) as PlanetaryDirection[];
// export const planetaryDirectionSymbols: PlanetaryDirectionSymbol[] =
//   Object.values(symbolByPlanetaryDirection);

// #region Directions 🧭

// export const directions = Object.keys(symbolByDirection) as Direction[];
// export const directionSymbols: DirectionSymbol[] =
//   Object.values(symbolByDirection);

// #region Positions 🌐

// export const apsides = Object.keys(symbolByApsis) as Apsis[];
// export const apsisSymbols: ApsisSymbol[] = Object.values(symbolByApsis);

// export const positions = Object.keys(symbolByPosition) as Position[];
// export const positionSymbols: PositionSymbol[] =
//   Object.values(symbolByPosition);

// #region Phases 🌓

/**
 * Array of lunar phase names in order through the lunar month.
 */
export const lunarPhases = typedObjectKeys(symbolByLunarPhase);
// export const lunarPhaseSymbols: LunarPhaseSymbol[] =
//   Object.values(symbolByLunarPhase);

// #region Venusian Phases ♀️

// export const venusianPhases = Object.keys(
//   symbolByVenusianPhase,
// ) as VenusianPhase[];
// export const venusianPhaseSymbols: VenusianPhaseSymbol[] = Object.values(
//   symbolByVenusianPhase,
// );

// #region Mercurian Phases ☿️

// export const mercurianPhases = Object.keys(
//   symbolByMercurianPhase,
// ) as MercurianPhase[];
// export const mercurianPhaseSymbols: MercurianPhaseSymbol[] = Object.values(
//   symbolByMercurianPhase,
// );

// #region Martian Phases ♂️

// export const martianPhases = Object.keys(
//   symbolByMartianPhase,
// ) as MartianPhase[];
// export const martianPhaseSymbols: MartianPhaseSymbol[] =
//   Object.values(symbolByMartianPhase);

// export const phases = Object.keys(symbolByPhase) as Phase[];
// export const phaseSymbols: PhaseSymbol[] = Object.values(symbolByPhase);

// #region Houses 🏠

// export const houses = Object.keys(symbolByHouse) as House[];
// export const houseSymbols: HouseSymbol[] = Object.values(symbolByHouse);

// #region Ephemeris ⏱️

/**
 * Margin in minutes added before/after date ranges for ephemeris queries (30).
 */
export const MARGIN_MINUTES = 30;
