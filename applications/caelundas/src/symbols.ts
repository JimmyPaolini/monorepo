// #region Signs 🪧

/**
 * Maps each zodiac sign to its Unicode symbol.
 * Uses standard astrological glyphs from the Unicode Miscellaneous Symbols block.
 */
export const symbolBySign = {
  aries: "♈",
  taurus: "♉︎",
  gemini: "♊︎",
  cancer: "♋︎",
  leo: "♌︎",
  virgo: "♍︎",
  libra: "♎︎",
  scorpio: "♏︎",
  sagittarius: "♐︎",
  capricorn: "♑︎",
  aquarius: "♒︎",
  pisces: "♓︎",
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
  sun: "☀️",
  moon: "🌙",
  mercury: "☿",
  venus: "♀️",
  mars: "♂️",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
} as const;

// #region Asteroids 💫

/**
 * Maps each asteroid to its Unicode symbol.
 * Includes Chiron (centaur) and the four main belt asteroids used in modern astrology.
 */
export const symbolByAsteroid = {
  chiron: "⚷",
  lilith: "⚸",
  ceres: "⚳",
  pallas: "⚴",
  juno: "⚵",
  vesta: "⚶",
} as const;

// #region Comets ☄️

/**
 * Maps each comet to its emoji representation.
 * Currently includes Halley's comet as the most notable periodic comet.
 */
export const symbolByComet = {
  halley: "☄",
} as const;

// #region Nodes 🌕

/**
 * Maps lunar nodes and lunar apsides to their symbols.
 * Nodes mark lunar orbit crossings with the ecliptic; apsides mark near/far points from Earth.
 */
export const symbolByNode = {
  "north lunar node": "☊",
  "south lunar node": "☋",
  "lunar apogee": "🌚",
  "lunar perigee": "🌝",
} as const;

// #region Bodies 🔭

/**
 * Complete mapping of all celestial bodies to their symbols.
 * Combines planets, asteroids, comets, and lunar nodes.
 */
export const symbolByBody = {
  ...symbolByPlanet,
  ...symbolByAsteroid,
  ...symbolByComet,
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
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposite: "☍",
} as const;

// #region Minor Aspects 🖇️

/**
 * Maps each minor aspect to its Unicode symbol.
 * Minor aspects are used in modern psychological astrology.
 */
export const symbolByMinorAspect = {
  semisextile: "⚺",
  semisquare: "∠",
  sesquiquadrate: "⚼",
  quincunx: "⚻",
} as const;

// #region Specialty Aspects 🧮

/**
 * Maps each harmonic aspect to its symbol.
 * Based on harmonic divisions (5ths, 7ths, 9ths) of the zodiac circle.
 */
export const symbolBySpecialtyAspect = {
  quintile: "⬠",
  septile: "S",
  decile: "⊥",
  biquintile: "±",
  undecile: "U",
  novile: "N",
  tredecile: "∓",
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
  "t-square": "⊤",
  "grand trine": "△",
  yod: "⚛",
  hammer: "🔨",
} as const;

// #region Quadruple Aspects ✖️

/**
 * Maps four-planet aspect patterns to their symbols.
 * Includes grand cross, kite, mystic rectangle, and other complex configurations.
 */
export const symbolByQuadrupleAspect = {
  "grand cross": "➕",
  kite: "🪁",
  "mystic rectangle": "🚪",
  cradle: "🛏",
  boomerang: "🪃",
  butterfly: "🦋",
  hourglass: "⏳",
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
  "triple stellium": "✨",
  "quadruple stellium": "🌟",
  "quintuple stellium": "⭐",
  "sextuple stellium": "💫",
  "septuple stellium": "🌠",
  "octuple stellium": "✴️",
  "nonuple stellium": "🔆",
  "decuple stellium": "☀️",
  "undecuple stellium": "🌞",
  "duodecuple stellium": "🔥",
} as const;

// #region Orbital Directions 🔁

/**
 * Maps orbital motion directions to their emoji symbols.
 * Retrograde indicates apparent backward motion from Earth's perspective.
 */
export const symbolByOrbitalDirection = {
  retrograde: "↩️",
  direct: "↪️",
  prograde: "↪️",
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
  new: "🌑",
  "waxing crescent": "🌒",
  "first quarter": "🌓",
  "waxing gibbous": "🌔",
  full: "🌕",
  "waning gibbous": "🌖",
  "last quarter": "🌗",
  "waning crescent": "🌘",
} as const;

// #region Venusian Phases ♀️

/**
 * Maps Venus's phases and synodic cycle events to their emoji combinations.
 * Tracks Venus as morning/evening star with stations, elongations, and brightest points.
 */
export const symbolByVenusianPhase = {
  new: "🌑",
  "inferior conjunction": "🌑☌",

  "morning rise": "🌄↥",
  "morning station": "🌄⏹️",
  "western brightest": "🔆",
  "western elongation": "⬅️📏",
  "morning set": "🌄↧",

  full: "🌕",
  "superior conjunction": "🌕☌",

  "evening rise": "🌇↥",
  "eastern elongation": "📏➡️",
  "eastern brightest": "🔆",
  "evening station": "🌇⏹️",
  "evening set": "🌇↧",
} as const;

// #region Mercurian Phases ☿️

/**
 * Maps Mercury's phases and synodic cycle events to their emoji combinations.
 * Includes Promethean (morning) and Epimethean (evening) conjunctions in Hellenistic tradition.
 */
export const symbolByMercurianPhase = {
  new: "🌑",
  "inferior conjunction": "🌑☌",
  "promethian conjunction": "🌑☌",

  "morning rise": "🌄↥",
  "western brightest": "🔆",
  "western elongation": "⬅️📏",
  "morning set": "🌄↧",

  full: "🌕",
  "superior conjunction": "🌕☌",
  "epimethian conjunction": "🌕☌",

  "evening rise": "🌇↥",
  "eastern elongation": "📏➡️",
  "eastern brightest": "🔆",
  "evening set": "🌇↧",
} as const;

// #region Martian Phases ♂️

/**
 * Maps Mars's phases and synodic cycle events to their emoji combinations.
 * Tracks visibility as morning/evening star with retrograde stations.
 */
export const symbolByMartianPhase = {
  new: "🌑",
  conjunction: "🌑☌",
  "morning star": "🌄🌟",

  "morning first": "🌄🌖",
  "morning rise": "🌄↥",
  "morning station": "🌄⏹️",
  "morning set": "🌄↧",

  full: "🌕",
  opposition: "🌕☍",
  "evening star": "🌇🌟",

  brightest: "🌟",

  "evening rise": "🌇↥",
  "evening station": "🌇⏹️",
  "evening set": "🌇↧",
  "evening last": "🌇🌘",
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
 * Aspects form as bodies approach, become exact at peak, then dissolve as bodies separate.
 */
export const aspectPhases = ["forming", "exact", "dissolving"] as const;
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
  "halley",
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
  "halley",
  "north lunar node",
  "lunar apogee",
] as const;
