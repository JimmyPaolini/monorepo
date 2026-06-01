// ♟️ Constants

export const MANUAL_ENTRIES_TO_DELETE = [
  "qui:0",
  "quis:0",
  "latinitas:0",
  "ille:0",
  "ille:1",
  "omnis:0",
];

// Data sourced from https://en.wikipedia.org/wiki/Praenomen
export const PRAENOMEN_ABBREVIATIONS: Record<
  string,
  { masculine?: string; feminine?: string }
> = {
  a: { masculine: "aulus", feminine: "aula" },
  agr: { masculine: "agrippa" },
  ap: { masculine: "appius", feminine: "appia" },
  d: { masculine: "decimo", feminine: "decima" },
  f: { masculine: "faustus", feminine: "fausta" },
  c: { masculine: "gaius", feminine: "gaia" },
  gn: { masculine: "gnaeus", feminine: "gnaea" },
  h: { feminine: "hosta" },
  k: { masculine: "caeso" },
  l: { masculine: "lucius", feminine: "lucia" },
  m: { masculine: "marcus", feminine: "marcia" },
  "m'": { masculine: "manius", feminine: "mania" },
  mai: { feminine: "maio" },
  mam: { masculine: "mamercus", feminine: "mamerca" },
  min: { feminine: "mino" },
  n: { masculine: "numerius", feminine: "numeria" },
  o: { masculine: "octavius" },
  oct: { feminine: "octavia" },
  opet: { masculine: "opiter" },
  post: { masculine: "postumus", feminine: "postuma" },
  p: { masculine: "publius" },
  pro: { masculine: "proculus", feminine: "procula" },
  q: { masculine: "quintus", feminine: "quinta" },
  s: { masculine: "spurius" },
  sp: { feminine: "spuria" },
  st: { masculine: "statius", feminine: "statia" },
  sec: { feminine: "secunda" },
  seq: { feminine: "secunda" },
  ser: { masculine: "servius", feminine: "servia" },
  sert: { masculine: "sertor" },
  sex: { masculine: "sextus", feminine: "sexta" },
  t: { masculine: "titus", feminine: "titia" },
  ti: { masculine: "tiberius", feminine: "tiberia" },
  v: { masculine: "vibius", feminine: "vibia" },
  vol: { masculine: "volesus", feminine: "volusa" },
  vop: { masculine: "vopiscus", feminine: "vopisca" },
};
