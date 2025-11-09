import type {
  Sign,
  SignSymbol,
  Decan,
  DecanSymbol,
  Planet,
  PlanetSymbol,
  Asteroid,
  AsteroidSymbol,
  Comet,
  CometSymbol,
  Node,
  NodeSymbol,
  Body,
  BodySymbol,
  RetrogradeBody,
  RetrogradeBodySymbol,
  PhaseBody,
  PhaseBodySymbol,
  MajorAspect,
  MajorAspectSymbol,
  MinorAspect,
  MinorAspectSymbol,
  SpecialtyAspect,
  SpecialtyAspectSymbol,
  Aspect,
  AspectSymbol,
  TripleAspect,
  TripleAspectSymbol,
  QuadrupleAspect,
  QuadrupleAspectSymbol,
  QuintupleAspect,
  QuintupleAspectSymbol,
  SextupleAspect,
  SextupleAspectSymbol,
  Stellium,
  StelliumSymbol,
  OrbitalDirection,
  OrbitalDirectionSymbol,
  PlanetaryDirection,
  PlanetaryDirectionSymbol,
  Direction,
  DirectionSymbol,
  Apsis,
  ApsisSymbol,
  Position,
  PositionSymbol,
  LunarPhase,
  LunarPhaseSymbol,
  VenusianPhase,
  VenusianPhaseSymbol,
  MercurianPhase,
  MercurianPhaseSymbol,
  MartianPhase,
  MartianPhaseSymbol,
  Phase,
  PhaseSymbol,
  House,
  HouseSymbol,
} from "./types";

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
export const signs = Object.keys(symbolBySign) as Sign[];
export const signSymbols: SignSymbol[] = Object.values(symbolBySign);

// #region Decans 🔟

export const symbolByDecan = {
  "1": "1️⃣",
  "2": "2️⃣",
  "3": "3️⃣",
} as const;
export const decans = Object.keys(symbolByDecan) as Decan[];
export const decanSymbols: DecanSymbol[] = Object.values(symbolByDecan);

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
export const planets = Object.keys(symbolByPlanet) as Planet[];
export const planetSymbols: PlanetSymbol[] = Object.values(symbolByPlanet);

// #region Asteroids 💫

export const symbolByAsteroid = {
  chiron: "⚷",
  lilith: "⚸",
  ceres: "⚳",
  pallas: "⚴",
  juno: "⚵",
  vesta: "⚶",
} as const;
export const asteroids = Object.keys(symbolByAsteroid) as Asteroid[];
export const asteroidSymbols: AsteroidSymbol[] =
  Object.values(symbolByAsteroid);

// #region Comets ☄️

export const symbolByComet = {
  halley: "☄",
} as const;
export const comets = Object.keys(symbolByComet) as Comet[];
export const cometSymbols: CometSymbol[] = Object.values(symbolByComet);

export const symbolByNode = {
  "north lunar node": "☊",
  "south lunar node": "☋",
  "lunar apogee": "🌚",
  "lunar perigee": "🌝",
} as const;
export const nodes = Object.keys(symbolByNode) as Node[];
export const nodeSymbols: NodeSymbol[] = Object.values(symbolByNode);

// #region Bodies 🔭

export const symbolByBody = {
  ...symbolByPlanet,
  ...symbolByAsteroid,
  ...symbolByComet,
  ...symbolByNode,
} as const;
export const bodies = Object.keys(symbolByBody) as Body[];
export const bodySymbols: BodySymbol[] = Object.values(symbolByBody);

// #region Aspects 🧭

// #region Major Aspects 📐

export const symbolByMajorAspect = {
  conjunct: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposite: "☍",
} as const;
export const majorAspects = Object.keys(symbolByMajorAspect) as MajorAspect[];
export const majorAspectSymbols: MajorAspectSymbol[] =
  Object.values(symbolByMajorAspect);

// #region Minor Aspects 🖇️

export const symbolByMinorAspect = {
  semisextile: "⚺",
  semisquare: "∠",
  sesquiquadrate: "⚼",
  quincunx: "⚻",
} as const;
export const minorAspects = Object.keys(symbolByMinorAspect) as MinorAspect[];
export const minorAspectSymbols: MinorAspectSymbol[] =
  Object.values(symbolByMinorAspect);

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
export const specialtyAspects = Object.keys(
  symbolBySpecialtyAspect
) as SpecialtyAspect[];
export const specialtyAspectSymbols: SpecialtyAspectSymbol[] = Object.values(
  symbolBySpecialtyAspect
);

// #region Double Aspects 📐

export const symbolByAspect = {
  ...symbolByMajorAspect,
  ...symbolByMinorAspect,
  ...symbolBySpecialtyAspect,
} as const;
export const aspects = Object.keys(symbolByAspect) as Aspect[];
export const aspectSymbols: AspectSymbol[] = Object.values(symbolByAspect);

// #region Aspect Orbs 🔮

export const angleByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposite: 180,
};

export const angleByMinorAspect: Record<MinorAspect, number> = {
  semisextile: 30,
  semisquare: 45,
  sesquiquadrate: 135,
  quincunx: 150,
};

export const angleBySpecialtyAspect: Record<SpecialtyAspect, number> = {
  undecile: 32.72727272727273,
  decile: 36,
  novile: 40,
  septile: 51.42857142857143,
  quintile: 72,
  tredecile: 108,
  biquintile: 144,
};

export const angleByAspect: Record<Aspect, number> = {
  ...angleByMajorAspect,
  ...angleByMinorAspect,
  ...angleBySpecialtyAspect,
};

export const orbByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 8,
  opposite: 8,
  trine: 6,
  square: 6,
  sextile: 4,
};

export const orbByMinorAspect: Record<MinorAspect, number> = {
  semisextile: 2,
  quincunx: 3,
  semisquare: 2,
  sesquiquadrate: 2,
};

export const orbBySpecialtyAspect: Record<SpecialtyAspect, number> = {
  quintile: 2,
  biquintile: 2,
  septile: 1,
  novile: 1,
  undecile: 1,
  decile: 1,
  tredecile: 1,
};

export const orbByAspect: Record<Aspect, number> = {
  ...orbByMajorAspect,
  ...orbByMinorAspect,
  ...orbBySpecialtyAspect,
};

// #region Triple Aspects 🔺

export const symbolByTripleAspect = {
  "t-square": "⊤",
  "grand trine": "△",
  yod: "⚛",
  hammer: "🔨",
} as const;
export const tripleAspects = Object.keys(
  symbolByTripleAspect
) as TripleAspect[];
export const tripleAspectSymbols: TripleAspectSymbol[] =
  Object.values(symbolByTripleAspect);

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
export const quadrupleAspects = Object.keys(
  symbolByQuadrupleAspect
) as QuadrupleAspect[];
export const quadrupleAspectSymbols: QuadrupleAspectSymbol[] = Object.values(
  symbolByQuadrupleAspect
);

// #region Quintuple Aspects ⭐

export const symbolByQuintupleAspect = {
  pentagram: "⭐",
} as const;
export const quintupleAspects = Object.keys(
  symbolByQuintupleAspect
) as QuintupleAspect[];
export const quintupleAspectSymbols: QuintupleAspectSymbol[] = Object.values(
  symbolByQuintupleAspect
);

// #region Sextuple Aspects 🔯

export const symbolBySextupleAspect = {
  hexagram: "🔯",
} as const;
export const sextupleAspects = Object.keys(
  symbolBySextupleAspect
) as SextupleAspect[];
export const sextupleAspectSymbols: SextupleAspectSymbol[] = Object.values(
  symbolBySextupleAspect
);

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
export const stelliums = Object.keys(symbolByStellium) as Stellium[];
export const stelliumSymbols: StelliumSymbol[] =
  Object.values(symbolByStellium);

// #region Orbital Directions 🔁

export const symbolByOrbitalDirection = {
  retrograde: "↩️",
  direct: "↪️",
  prograde: "↪️",
} as const;
export const orbitalDirections = Object.keys(
  symbolByOrbitalDirection
) as OrbitalDirection[];
export const orbitalDirectionSymbols: OrbitalDirectionSymbol[] = Object.values(
  symbolByOrbitalDirection
);

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
export const planetaryDirections = Object.keys(
  symbolByPlanetaryDirection
) as PlanetaryDirection[];
export const planetaryDirectionSymbols: PlanetaryDirectionSymbol[] =
  Object.values(symbolByPlanetaryDirection);

// #region Directions 🧭

export const symbolByDirection = {
  ...symbolByOrbitalDirection,
  ...symbolByPlanetaryDirection,
};
export const directions = Object.keys(symbolByDirection) as Direction[];
export const directionSymbols: DirectionSymbol[] =
  Object.values(symbolByDirection);

// #region Positions 🌐

export const symbolByApsis = {
  perihelion: "🔥",
  aphelion: "❄️",
  perigee: "🔥",
  apogee: "❄️",
  periapsis: "🔥",
  apoapsis: "❄️",
} as const;
export const apsides = Object.keys(symbolByApsis) as Apsis[];
export const apsisSymbols: ApsisSymbol[] = Object.values(symbolByApsis);

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
export const positions = Object.keys(symbolByPosition) as Position[];
export const positionSymbols: PositionSymbol[] =
  Object.values(symbolByPosition);

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
export const lunarPhases = Object.keys(symbolByLunarPhase) as LunarPhase[];
export const lunarPhaseSymbols: LunarPhaseSymbol[] =
  Object.values(symbolByLunarPhase);

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
export const venusianPhases = Object.keys(
  symbolByVenusianPhase
) as VenusianPhase[];
export const venusianPhaseSymbols: VenusianPhaseSymbol[] = Object.values(
  symbolByVenusianPhase
);

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
export const mercurianPhases = Object.keys(
  symbolByMercurianPhase
) as MercurianPhase[];
export const mercurianPhaseSymbols: MercurianPhaseSymbol[] = Object.values(
  symbolByMercurianPhase
);

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
export const martianPhases = Object.keys(
  symbolByMartianPhase
) as MartianPhase[];
export const martianPhaseSymbols: MartianPhaseSymbol[] =
  Object.values(symbolByMartianPhase);

export const symbolByPhase = {
  ...symbolByLunarPhase,
  ...symbolByVenusianPhase,
  ...symbolByMercurianPhase,
  ...symbolByMartianPhase,
} as const;
export const phases = Object.keys(symbolByPhase) as Phase[];
export const phaseSymbols: PhaseSymbol[] = Object.values(symbolByPhase);

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
export const houses = Object.keys(symbolByHouse) as House[];
export const houseSymbols: HouseSymbol[] = Object.values(symbolByHouse);

// #region Event Phase Types 🔄

export const aspectPhases = ["forming", "exact", "dissolving"] as const;

export const eclipsePhases = ["beginning", "maximum", "ending"] as const;

// #region Body Arrays 🔭

export const signIngressBodies = [
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
] as Body[];

export const decanIngressBodies = [
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
] as Body[];

export const peakIngressBodies = [
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
] as Body[];

export const majorAspectBodies = [
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
] as Body[];

export const minorAspectBodies = [
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
] as Body[];

export const specialtyAspectBodies = [
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
] as Body[];

export const planetaryPhaseBodies = ["venus", "mercury", "mars"] as PhaseBody[];

export const tripleAspectBodies = [
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
] as Body[];

export const quadrupleAspectBodies = [
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
] as Body[];

export const quintupleAspectBodies = [
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
] as Body[];

export const sextupleAspectBodies = [
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
] as Body[];

export const stelliumBodies = [
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
] as Body[];

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

export const phaseBodies = ["venus", "mercury", "mars"] as const;
