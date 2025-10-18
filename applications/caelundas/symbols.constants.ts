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
export type Sign = keyof typeof symbolBySign;
export const signs = Object.keys(symbolBySign) as Sign[];
export const signSymbols = Object.values(symbolBySign);
export type SignSymbol = (typeof signSymbols)[number];

// #region Decans 🔟

export const symbolByDecan = {
  "1": "1️⃣",
  "2": "2️⃣",
  "3": "3️⃣",
} as const;
export type Decan = keyof typeof symbolByDecan;
export const decans = Object.keys(symbolByDecan) as Decan[];
export const decanSymbols = Object.values(symbolByDecan);
export type DecanSymbol = (typeof decanSymbols)[number];

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
export type Planet = keyof typeof symbolByPlanet;
export const planets = Object.keys(symbolByPlanet) as Planet[];
export const planetSymbols = Object.values(symbolByPlanet);
export type PlanetSymbol = (typeof planetSymbols)[number];

// #region Asteroids 💫

export const symbolByAsteroid = {
  chiron: "⚷",
  lilith: "⚸",
  ceres: "⚳",
  pallas: "⚴",
  juno: "⚵",
  vesta: "⚶",
} as const;
export type Asteroid = keyof typeof symbolByAsteroid;
export const asteroids = Object.keys(symbolByAsteroid) as Asteroid[];
export const asteroidSymbols = Object.values(symbolByAsteroid);
export type AsteroidSymbol = (typeof asteroidSymbols)[number];

// #region Comets ☄️

export const symbolByComet = {
  halley: "☄",
} as const;
export type Comet = keyof typeof symbolByComet;
export const comets = Object.keys(symbolByComet) as Comet[];
export const cometSymbols = Object.values(symbolByComet);
export type CometSymbol = (typeof cometSymbols)[number];

export const symbolByNode = {
  "north lunar node": "☊",
  "south lunar node": "☋",
  "lunar apogee": "🌚",
  "lunar perigee": "🌝",
} as const;
export type Node = keyof typeof symbolByNode;
export const nodes = Object.keys(symbolByNode) as Node[];
export const nodeSymbols = Object.values(symbolByNode);
export type NodeSymbol = (typeof nodeSymbols)[number];

// #region Bodies 🔭

export const symbolByBody = {
  ...symbolByPlanet,
  ...symbolByAsteroid,
  ...symbolByComet,
  ...symbolByNode,
} as const;
export type Body = keyof typeof symbolByBody;
export const bodies = Object.keys(symbolByBody) as Body[];
export const bodySymbols = Object.values(symbolByBody);
export type BodySymbol = (typeof bodySymbols)[number];

// #region Retrograde Bodies ↩️

export const retrogradeBodies = [
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  ...asteroids,
] as const;
export type RetrogradeBody = (typeof retrogradeBodies)[number];
export type RetrogradeBodySymbol = (typeof symbolByBody)[RetrogradeBody];
export const retrogradeBodySymbols = retrogradeBodies.map(
  (body) => symbolByBody[body]
) as RetrogradeBodySymbol[];

export const phaseBodies = ["venus", "mercury", "mars"] as const;
export type PhaseBody = (typeof phaseBodies)[number];
export type PhaseBodySymbol = (typeof symbolByBody)[PhaseBody];
export const phaseBodySymbols = phaseBodies.map(
  (body) => symbolByBody[body]
) as PhaseBodySymbol[];

// #region Aspects 🧭

// #region Major Aspects 📐

export const symbolByMajorAspect = {
  conjunct: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposite: "☍",
} as const;
export type MajorAspect = keyof typeof symbolByMajorAspect;
export const majorAspects = Object.keys(symbolByMajorAspect) as MajorAspect[];
export const majorAspectSymbols = Object.values(symbolByMajorAspect);
export type MajorAspectSymbol = (typeof majorAspectSymbols)[number];

// #region Minor Aspects 🖇️

export const symbolByMinorAspect = {
  semisextile: "⚺",
  semisquare: "∠",
  sesquiquadrate: "⚼",
  quincunx: "⚻",
} as const;
export type MinorAspect = keyof typeof symbolByMinorAspect;
export const minorAspects = Object.keys(symbolByMinorAspect) as MinorAspect[];
export const minorAspectSymbols = Object.values(symbolByMinorAspect);
export type MinorAspectSymbol = (typeof minorAspectSymbols)[number];

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
export type SpecialtyAspect = keyof typeof symbolBySpecialtyAspect;
export const specialtyAspects = Object.keys(
  symbolBySpecialtyAspect
) as SpecialtyAspect[];
export const specialtyAspectSymbols = Object.values(symbolBySpecialtyAspect);
export type SpecialtyAspectSymbol = (typeof specialtyAspectSymbols)[number];

// #region Aspects 📐

export const symbolByAspect = {
  ...symbolByMajorAspect,
  ...symbolByMinorAspect,
  ...symbolBySpecialtyAspect,
} as const;
export type Aspect = keyof typeof symbolByAspect;
export const aspects = Object.keys(symbolByAspect) as Aspect[];
export const aspectSymbols = Object.values(symbolByAspect);
export type AspectSymbol = (typeof aspectSymbols)[number];

// #region Orbital Directions 🔁

export const symbolByOrbitalDirection = {
  retrograde: "↩️",
  direct: "↪️",
  prograde: "↪️",
} as const;
export type OrbitalDirection = keyof typeof symbolByOrbitalDirection;
export const orbitalDirections = Object.keys(
  symbolByOrbitalDirection
) as OrbitalDirection[];
export const orbitalDirectionSymbols = Object.values(symbolByOrbitalDirection);
export type OrbitalDirectionSymbol = (typeof orbitalDirectionSymbols)[number];

// #region Planetary Directions ⏫

export const symbolByPlanetaryDirection = {
  rise: "🔼",
  ascendant: "🔼",

  zenith: "⏫",
  "medium coeli": "⏫",
  culmination: "⏫",

  set: "🔽",
  descendant: "🔽",

  nadir: "⏬",
  "imum coeli": "⏬",
  declination: "⏬",
} as const;
export type PlanetaryDirection = keyof typeof symbolByPlanetaryDirection;
export const planetaryDirections = Object.keys(
  symbolByPlanetaryDirection
) as PlanetaryDirection[];
export const planetaryDirectionSymbols = Object.values(
  symbolByPlanetaryDirection
);
export type PlanetaryDirectionSymbol =
  (typeof planetaryDirectionSymbols)[number];

// #region Directions 🧭

export const symbolByDirection = {
  ...symbolByOrbitalDirection,
  ...symbolByPlanetaryDirection,
};
export type Direction = keyof typeof symbolByDirection;
export const directions = Object.keys(symbolByDirection) as Direction[];
export const directionSymbols = Object.values(symbolByDirection);
export type DirectionSymbol = (typeof directionSymbols)[number];

// #region Positions 🌐

export const symbolByApsis = {
  perihelion: "🔥",
  aphelion: "❄️",
  perigee: "🔥",
  apogee: "❄️",
  periapsis: "🔥",
  apoapsis: "❄️",
} as const;
export type Apsis = keyof typeof symbolByApsis;
export const apsides = Object.keys(symbolByApsis) as Apsis[];
export const apsisSymbols = Object.values(symbolByApsis);
export type ApsisSymbol = (typeof apsisSymbols)[number];

export const symbolByPosition = {
  ...symbolByApsis,
  "vernal equinox": "🌸",
  beltane: "🌼",
  "summer solstice": "🌞",
  lammas: "🌾",
  "autumn equinox": "🍂",
  samhain: "🎃",
  "winter solstice": "☃️",
  imbolc: "🐑",
} as const;
export type Position = keyof typeof symbolByPosition;
export const positions = Object.keys(symbolByPosition) as Position[];
export const positionSymbols = Object.values(symbolByPosition);
export type PositionSymbol = (typeof positionSymbols)[number];

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
export type LunarPhase = keyof typeof symbolByLunarPhase;
export const lunarPhases = Object.keys(symbolByLunarPhase) as LunarPhase[];
export const lunarPhaseSymbols = Object.values(symbolByLunarPhase);
export type LunarPhaseSymbol = (typeof lunarPhaseSymbols)[number];

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
export type VenusianPhase = keyof typeof symbolByVenusianPhase;
export const venusianPhases = Object.keys(
  symbolByVenusianPhase
) as VenusianPhase[];
export const venusianPhaseSymbols = Object.values(symbolByVenusianPhase);
export type VenusianPhaseSymbol = (typeof venusianPhaseSymbols)[number];

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
export type MercurianPhase = keyof typeof symbolByMercurianPhase;
export const mercurianPhases = Object.keys(
  symbolByMercurianPhase
) as MercurianPhase[];
export const mercurianPhaseSymbols = Object.values(symbolByMercurianPhase);
export type MercurianPhaseSymbol = (typeof mercurianPhaseSymbols)[number];

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
export type MartianPhase = keyof typeof symbolByMartianPhase;
export const martianPhases = Object.keys(
  symbolByMartianPhase
) as MartianPhase[];
export const martianPhaseSymbols = Object.values(symbolByMartianPhase);
export type MartianPhaseSymbol = (typeof martianPhaseSymbols)[number];

export const symbolByPhase = {
  ...symbolByLunarPhase,
  ...symbolByVenusianPhase,
  ...symbolByMercurianPhase,
  ...symbolByMartianPhase,
} as const;
export type Phase = keyof typeof symbolByPhase;
export const phases = Object.keys(symbolByPhase) as Phase[];
export const phaseSymbols = Object.values(symbolByPhase);
export type PhaseSymbol = (typeof phaseSymbols)[number];

// #region Houses 🏠

export const symbolByHouse = {
  first: "1",
  second: "2",
  third: "3",
  fourth: "4",
  fifth: "5",
  sixth: "6",
  seventh: "7",
  eighth: "8",
  ninth: "9",
  tenth: "10",
  eleventh: "11",
  twelfth: "12",
} as const;
export type House = keyof typeof symbolByHouse;
export const houses = Object.keys(symbolByHouse) as House[];
export const houseSymbols = Object.values(symbolByHouse);
export type HouseSymbol = (typeof houseSymbols)[number];
