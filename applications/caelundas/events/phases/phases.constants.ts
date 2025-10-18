import {
  VenusianPhaseEventTemplate,
  MercurianPhaseEventTemplate,
  MartianPhaseEventTemplate,
} from "../phases/phases.events.ts";

export const venusianPhases = [
  // { summary: "♀️🌑 Venus New", description: "Venus New" },
  {
    summary: "♀️🌑☌ Venus Inferior conjunction",
    description: "Venus Inferior conjunction",
  },
  { summary: "♀️🌄↥ Venus Morning rise", description: "Venus Morning rise" },
  {
    summary: "♀️🌄⏹️ Venus Morning station",
    description: "Venus Morning station",
  },
  {
    summary: "♀️🔆 Venus Western brightest",
    description: "Venus Western brightest",
  },
  {
    summary: "♀️⬅️📏 Venus Western elongation",
    description: "Venus Western elongation",
  },
  { summary: "♀️🌄↧ Venus Morning set", description: "Venus Morning set" },
  // { summary: "♀️🌕 Venus Full", description: "Venus Full" },
  {
    summary: "♀️🌕☌ Venus Superior conjunction",
    description: "Venus Superior conjunction",
  },
  { summary: "♀️🌇↥ Venus Evening rise", description: "Venus Evening rise" },
  {
    summary: "♀️📏➡️ Venus Eastern elongation",
    description: "Venus Eastern elongation",
  },
  {
    summary: "♀️🔆 Venus Eastern brightest",
    description: "Venus Eastern brightest",
  },
  {
    summary: "♀️🌇⏹️ Venus Evening station",
    description: "Venus Evening station",
  },
  { summary: "♀️🌇↧ Venus Evening set", description: "Venus Evening set" },
] satisfies VenusianPhaseEventTemplate[];

export const mercurianPhases = [
  { summary: "☿🌑 Mercury New", description: "Mercury New" },
  {
    summary: "☿🌑☌ Mercury Inferior conjunction",
    description: "Mercury Inferior conjunction",
  },
  { summary: "☿🌄↥ Mercury Morning rise", description: "Mercury Morning rise" },
  {
    summary: "☿⬅️📏 Mercury Western elongation",
    description: "Mercury Western elongation",
  },
  { summary: "☿🌄↧ Mercury Morning set", description: "Mercury Morning set" },
  { summary: "☿🌕 Mercury Full", description: "Mercury Full" },
  {
    summary: "☿🌕☌ Mercury Superior conjunction",
    description: "Mercury Superior conjunction",
  },
  { summary: "☿🌇↥ Mercury Evening rise", description: "Mercury Evening rise" },
  {
    summary: "☿📏➡️ Mercury Eastern elongation",
    description: "Mercury Eastern elongation",
  },
  { summary: "☿🌇↧ Mercury Evening set", description: "Mercury Evening set" },
] satisfies MercurianPhaseEventTemplate[];

export const martianPhases = [
  { summary: "♂️🌑 Mars New", description: "Mars New" },
  { summary: "♂️🌑☌ Mars Conjunction", description: "Mars Conjunction" },
  { summary: "♂️🌄🌟 Mars Morning star", description: "Mars Morning star" },
  { summary: "♂️🌄🌖 Mars Morning first", description: "Mars Morning first" },
  {
    summary: "♂️🌄⏹️ Mars Morning station",
    description: "Mars Morning station",
  },
  { summary: "♂️🌕 Mars Full", description: "Mars Full" },
  { summary: "♂️🌕☍ Mars Opposition", description: "Mars Opposition" },
  { summary: "♂️🌇🌟 Mars Evening star", description: "Mars Evening star" },
  { summary: "♂️🌟 Mars Evening star", description: "Mars Evening star" },
  {
    summary: "♂️🌇⏹️ Mars Evening station",
    description: "Mars Evening station",
  },
  { summary: "♂️🌇🌘 Mars Evening last", description: "Mars Evening last" },
] satisfies MartianPhaseEventTemplate[];
