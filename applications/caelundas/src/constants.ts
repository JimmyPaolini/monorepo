import {
  symbolByAspect,
  symbolByBody,
  symbolByLunarPhase,
  symbolByMajorAspect,
  symbolByMinorAspect,
  symbolByNode,
  symbolBySign,
  symbolBySpecialtyAspect,
} from "./symbols";

import type {
  Aspect,
  Body,
  LunarPhase,
  MajorAspect,
  MinorAspect,
  Node,
  Sign,
  SpecialtyAspect,
} from "./types";

// #region Signs 🪧

export const signs = Object.keys(symbolBySign) as Sign[];
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

export const nodes = Object.keys(symbolByNode) as Node[];
// export const nodeSymbols: NodeSymbol[] = Object.values(symbolByNode);

// #region Bodies 🔭

export const bodies = Object.keys(symbolByBody) as Body[];
// export const bodySymbols: BodySymbol[] = Object.values(symbolByBody);

// #region Aspects 🧭

// #region Major Aspects 📐

export const majorAspects = Object.keys(symbolByMajorAspect) as MajorAspect[];
// export const majorAspectSymbols: MajorAspectSymbol[] =
//   Object.values(symbolByMajorAspect);

// #region Minor Aspects 🖇️

export const minorAspects = Object.keys(symbolByMinorAspect) as MinorAspect[];
// export const minorAspectSymbols: MinorAspectSymbol[] =
//   Object.values(symbolByMinorAspect);

// #region Specialty Aspects 🧮

export const specialtyAspects = Object.keys(
  symbolBySpecialtyAspect,
) as SpecialtyAspect[];
// export const specialtyAspectSymbols: SpecialtyAspectSymbol[] = Object.values(
//   symbolBySpecialtyAspect,
// );

// #region Double Aspects 📐

export const aspects = Object.keys(symbolByAspect) as Aspect[];
// export const aspectSymbols: AspectSymbol[] = Object.values(symbolByAspect);

// #region Aspect Orbs 🔮

const angleByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposite: 180,
};

const angleByMinorAspect: Record<MinorAspect, number> = {
  semisextile: 30,
  semisquare: 45,
  sesquiquadrate: 135,
  quincunx: 150,
};

const angleBySpecialtyAspect: Record<SpecialtyAspect, number> = {
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

const orbByMajorAspect: Record<MajorAspect, number> = {
  conjunct: 8,
  opposite: 8,
  trine: 6,
  square: 6,
  sextile: 4,
};

const orbByMinorAspect: Record<MinorAspect, number> = {
  semisextile: 2,
  quincunx: 3,
  semisquare: 2,
  sesquiquadrate: 2,
};

const orbBySpecialtyAspect: Record<SpecialtyAspect, number> = {
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

export const lunarPhases = Object.keys(symbolByLunarPhase) as LunarPhase[];
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
