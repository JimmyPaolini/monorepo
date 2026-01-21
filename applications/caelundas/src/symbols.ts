// #region Signs 🪧

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

export const symbolByDecan = {
  "1": "1️⃣",
  "2": "2️⃣",
  "3": "3️⃣",
} as const;

// #region Planets 🪐

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

export const symbolByAsteroid = {
  chiron: "⚷",
  lilith: "⚸",
  ceres: "⚳",
  pallas: "⚴",
  juno: "⚵",
  vesta: "⚶",
} as const;

// #region Comets ☄️

export const symbolByComet = {
  halley: "☄",
} as const;

// #region Nodes 🌕

export const symbolByNode = {
  "north lunar node": "☊",
  "south lunar node": "☋",
  "lunar apogee": "🌚",
  "lunar perigee": "🌝",
} as const;

// #region Bodies 🔭

export const symbolByBody = {
  ...symbolByPlanet,
  ...symbolByAsteroid,
  ...symbolByComet,
  ...symbolByNode,
} as const;

// #region Aspects 🧭

// #region Major Aspects 📐

export const symbolByMajorAspect = {
  conjunct: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposite: "☍",
} as const;

// #region Minor Aspects 🖇️

export const symbolByMinorAspect = {
  semisextile: "⚺",
  semisquare: "∠",
  sesquiquadrate: "⚼",
  quincunx: "⚻",
} as const;

// #region Specialty Aspects 🧮

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

export const symbolByAspect = {
  ...symbolByMajorAspect,
  ...symbolByMinorAspect,
  ...symbolBySpecialtyAspect,
} as const;

// #region Triple Aspects 🔺

export const symbolByTripleAspect = {
  "t-square": "⊤",
  "grand trine": "△",
  yod: "⚛",
  hammer: "🔨",
} as const;

// #region Quadruple Aspects ✖️

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

export const symbolByQuintupleAspect = {
  pentagram: "⭐",
} as const;

// #region Sextuple Aspects 🔯

export const symbolBySextupleAspect = {
  hexagram: "🔯",
} as const;

// #region Stellium ✨

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

export const aspectPhases = ["forming", "exact", "dissolving"] as const;
export const eclipsePhases = ["beginning", "maximum", "ending"] as const;

// #region Body Arrays 🔭

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

export const phaseBodies = ["venus", "mercury", "mars"] as const;

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

export const aspectBodies = [
  "sun",
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
