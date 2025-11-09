import {
  symbolBySign,
  symbolByDecan,
  symbolByPlanet,
  symbolByAsteroid,
  symbolByComet,
  symbolByNode,
  symbolByBody,
  retrogradeBodies,
  phaseBodies,
  symbolByMajorAspect,
  symbolByMinorAspect,
  symbolBySpecialtyAspect,
  symbolByAspect,
  symbolByTripleAspect,
  symbolByQuadrupleAspect,
  symbolByQuintupleAspect,
  symbolBySextupleAspect,
  symbolByStellium,
  symbolByOrbitalDirection,
  symbolByPlanetaryDirection,
  symbolByDirection,
  symbolByApsis,
  symbolByPosition,
  symbolByLunarPhase,
  symbolByVenusianPhase,
  symbolByMercurianPhase,
  symbolByMartianPhase,
  symbolByPhase,
  symbolByHouse,
  aspectPhases,
  eclipsePhases,
} from "./constants";

// #region Signs 🪧

export type Sign = keyof typeof symbolBySign;
export type SignSymbol = (typeof symbolBySign)[Sign];

// #region Decans 🔟

export type Decan = keyof typeof symbolByDecan;
export type DecanSymbol = (typeof symbolByDecan)[Decan];

// #region Planets 🪐

export type Planet = keyof typeof symbolByPlanet;
export type PlanetSymbol = (typeof symbolByPlanet)[Planet];

// #region Asteroids 💫

export type Asteroid = keyof typeof symbolByAsteroid;
export type AsteroidSymbol = (typeof symbolByAsteroid)[Asteroid];

// #region Comets ☄️

export type Comet = keyof typeof symbolByComet;
export type CometSymbol = (typeof symbolByComet)[Comet];

// #region Nodes 🌑

export type Node = keyof typeof symbolByNode;
export type NodeSymbol = (typeof symbolByNode)[Node];

// #region Bodies 🔭

export type Body = keyof typeof symbolByBody;
export type BodySymbol = (typeof symbolByBody)[Body];

// #region Retrograde Bodies ↩️

export type RetrogradeBody = (typeof retrogradeBodies)[number];
export type RetrogradeBodySymbol = (typeof symbolByBody)[RetrogradeBody];

// #region Phase Bodies 🌓

export type PhaseBody = (typeof phaseBodies)[number];
export type PhaseBodySymbol = (typeof symbolByBody)[PhaseBody];

// #region Aspects 🧭

// #region Major Aspects 📐

export type MajorAspect = keyof typeof symbolByMajorAspect;
export type MajorAspectSymbol = (typeof symbolByMajorAspect)[MajorAspect];

// #region Minor Aspects 🖇️

export type MinorAspect = keyof typeof symbolByMinorAspect;
export type MinorAspectSymbol = (typeof symbolByMinorAspect)[MinorAspect];

// #region Specialty Aspects 🧮

export type SpecialtyAspect = keyof typeof symbolBySpecialtyAspect;
export type SpecialtyAspectSymbol =
  (typeof symbolBySpecialtyAspect)[SpecialtyAspect];

// #region Double Aspects 📐

export type Aspect = keyof typeof symbolByAspect;
export type AspectSymbol = (typeof symbolByAspect)[Aspect];

// #region Triple Aspects 🔺

export type TripleAspect = keyof typeof symbolByTripleAspect;
export type TripleAspectSymbol = (typeof symbolByTripleAspect)[TripleAspect];

// #region Quadruple Aspects ✖️

export type QuadrupleAspect = keyof typeof symbolByQuadrupleAspect;
export type QuadrupleAspectSymbol =
  (typeof symbolByQuadrupleAspect)[QuadrupleAspect];

// #region Quintuple Aspects ⭐

export type QuintupleAspect = keyof typeof symbolByQuintupleAspect;
export type QuintupleAspectSymbol =
  (typeof symbolByQuintupleAspect)[QuintupleAspect];

// #region Sextuple Aspects 🔯

export type SextupleAspect = keyof typeof symbolBySextupleAspect;
export type SextupleAspectSymbol =
  (typeof symbolBySextupleAspect)[SextupleAspect];

// #region Stellium ✨

export type Stellium = keyof typeof symbolByStellium;
export type StelliumSymbol = (typeof symbolByStellium)[Stellium];

// #region Orbital Directions 🔁

export type OrbitalDirection = keyof typeof symbolByOrbitalDirection;
export type OrbitalDirectionSymbol =
  (typeof symbolByOrbitalDirection)[OrbitalDirection];

// #region Planetary Directions ⏫

export type PlanetaryDirection = keyof typeof symbolByPlanetaryDirection;
export type PlanetaryDirectionSymbol =
  (typeof symbolByPlanetaryDirection)[PlanetaryDirection];

// #region Directions 🧭

export type Direction = keyof typeof symbolByDirection;
export type DirectionSymbol = (typeof symbolByDirection)[Direction];

// #region Positions 🌐

export type Apsis = keyof typeof symbolByApsis;
export type ApsisSymbol = (typeof symbolByApsis)[Apsis];

export type Position = keyof typeof symbolByPosition;
export type PositionSymbol = (typeof symbolByPosition)[Position];

// #region Phases 🌓

export type LunarPhase = keyof typeof symbolByLunarPhase;
export type LunarPhaseSymbol = (typeof symbolByLunarPhase)[LunarPhase];

// #region Venusian Phases ♀️

export type VenusianPhase = keyof typeof symbolByVenusianPhase;
export type VenusianPhaseSymbol = (typeof symbolByVenusianPhase)[VenusianPhase];

// #region Mercurian Phases ☿️

export type MercurianPhase = keyof typeof symbolByMercurianPhase;
export type MercurianPhaseSymbol =
  (typeof symbolByMercurianPhase)[MercurianPhase];

// #region Martian Phases ♂️

export type MartianPhase = keyof typeof symbolByMartianPhase;
export type MartianPhaseSymbol = (typeof symbolByMartianPhase)[MartianPhase];

export type Phase = keyof typeof symbolByPhase;
export type PhaseSymbol = (typeof symbolByPhase)[Phase];

// #region Event Phase Types 🔄

export type AspectPhase = (typeof aspectPhases)[number];

export type EclipsePhase = (typeof eclipsePhases)[number];

// #region Houses 🏠

export type House = keyof typeof symbolByHouse;
export type HouseSymbol = (typeof symbolByHouse)[House];
