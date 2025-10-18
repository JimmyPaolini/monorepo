import _ from "npm:lodash";
import {
  bodies,
  retrogradeBodies,
  symbolByBody,
} from "../symbols.constants.ts";

export const eventTypeChoices = [
  { title: "Ingresses 💫", value: "ingresses" },
  { title: "Aspects 🧭", value: "aspects" },
  { title: "Retrogrades ↩️", value: "retrogrades" },
  {
    title: "Planetary Phases 🌓",
    value: "planetaryPhases",
    description: "venusian, mercurian, martian",
  },
  {
    title: "Annual Solar Cycle 📏",
    value: "annualSolarCycle",
    description: "solstices, equinoxes, quarter days, perihelion, aphelion",
  },
  {
    title: "Monthly Lunar Cycle 🌒",
    value: "monthlyLunarCycle",
    description: "lunar phases, eclipses, perigee, apogee",
  },
  {
    title: "Daily Solar Cycle ☀️",
    value: "dailySolarCycle",
    description: "sunrise, sunset, solar zenith & nadir",
  },
  {
    title: "Daily Lunar Cycle 🌙",
    value: "dailyLunarCycle",
    description: "moonrise, moonset, lunar zenith & nadir",
  },
  {
    title: "Twilights 🌄",
    value: "twilights",
    description: "civil, nautical, and astronomical twilights",
  },
] as const;

export const bodyChoices = bodies.map((body) => ({
  title: `${_.startCase(body)} ${symbolByBody[body]}`,
  value: body,
}));

export const ingressChoices = [
  { title: "Signs 🪧", value: "signs" },
  { title: "Decans 🔟", value: "decans" },
  { title: "Peaks ⛰️", value: "peaks" },
] as const;

export const aspectChoices = [
  { title: "Major Aspects ☌", value: "majorAspects" },
  { title: "Minor Aspects ⚼", value: "minorAspects" },
  { title: "Specialty Aspects Q²", value: "specialtyAspects" },
] as const;

export const retrogradeBodyChoices = retrogradeBodies.map((retrogradeBody) => ({
  title: `${_.startCase(retrogradeBody)} ${symbolByBody[retrogradeBody]}`,
  value: retrogradeBody,
}));

export const planetaryPhaseBodyChoices = [
  { title: "Venusian Phases ♀️", value: "venus" },
  { title: "Mercurian Phases ☿", value: "mercury" },
  { title: "Martian Phases ♂", value: "mars" },
] as const;
