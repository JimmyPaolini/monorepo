import prompts from "npm:prompts";
import yargs from "npm:yargs";
import _ from "npm:lodash";
import moment from "npm:moment-timezone";
import type { Body, RetrogradeBody } from "../symbols.constants.ts";
import type { Latitude, Longitude } from "../ephemeris/ephemeris.types.ts";
import type {
  AspectChoice,
  Choices,
  EventTypeChoice,
  IngressChoice,
  PlanetaryPhaseBodyChoice,
} from "./choices.types.ts";
import { initialChoices } from "./choices.input.ts";
import {
  aspectChoices,
  bodyChoices,
  eventTypeChoices,
  planetaryPhaseBodyChoices,
  retrogradeBodyChoices,
  ingressChoices,
} from "./choices.constants.ts";

export async function getChoices() {
  prompts.override(yargs.argv);
  prompts.override(initialChoices);

  const eventTypesResponse = await prompts({
    type: "multiselect",
    name: "eventTypes",
    message: "📅 What events would you like?",
    choices: eventTypeChoices,
  });

  const eventTypes: EventTypeChoice[] = eventTypesResponse.eventTypes;

  if (_.isEmpty(eventTypes)) {
    console.error("🚫 No events selected.");
    Deno.exit(1);
  }

  let ingresses: IngressChoice[] = [];
  let signIngressBodies: Body[] = [];
  let decanIngressBodies: Body[] = [];
  let peakIngressBodies: Body[] = [];
  let aspects: AspectChoice[] = [];
  let majorAspectBodies: Body[] = [];
  let minorAspectBodies: Body[] = [];
  let specialtyAspectBodies: Body[] = [];
  let retrogradeBodies: RetrogradeBody[] = [];
  let planetaryPhaseBodies: PlanetaryPhaseBodyChoice[] = [];
  let longitude: Longitude | undefined = undefined;
  let latitude: Latitude | undefined = undefined;

  if (eventTypes.includes("ingresses")) {
    ({ ingresses } = await prompts({
      choices: ingressChoices,
      message: "💫 Which ingresses would you like?",
      name: "ingresses",
      type: "multiselect",
    }));

    if (_.isEmpty(ingresses)) {
      console.error("🚫 No ingresses selected.");
      Deno.exit(1);
    }

    if (ingresses.includes("signs")) {
      ({ signIngressBodies } = await prompts({
        choices: bodyChoices,
        message: "🪧 Which sign ingress bodies would you like?",
        name: "signIngressBodies",
        type: "multiselect",
      }));

      if (ingresses.includes("signs") && _.isEmpty(signIngressBodies)) {
        console.error("🚫 No sign ingress bodies selected.");
        Deno.exit(1);
      }
    }

    if (ingresses.includes("decans")) {
      ({ decanIngressBodies } = await prompts({
        choices: bodyChoices,
        message: "🔟 Which decan ingress bodies would you like?",
        name: "decanIngressBodies",
        type: "multiselect",
      }));

      if (ingresses.includes("decans") && _.isEmpty(decanIngressBodies)) {
        console.error("🚫 No decan ingress bodies selected.");
        Deno.exit(1);
      }
    }

    if (ingresses.includes("peaks")) {
      ({ peakIngressBodies } = await prompts({
        choices: bodyChoices,
        message: "⛰️ Which peak ingress bodies would you like?",
        name: "peakIngressBodies",
        type: "multiselect",
      }));

      if (ingresses.includes("peaks") && _.isEmpty(peakIngressBodies)) {
        console.error("🚫 No peak ingress bodies selected.");
        Deno.exit(1);
      }
    }
  }

  if (eventTypes.includes("aspects")) {
    ({ aspects } = await prompts({
      choices: aspectChoices,
      message: "🧭 Which aspects would you like?",
      name: "aspects",
      type: "multiselect",
    }));

    if (_.isEmpty(aspects)) {
      console.error("🚫 No aspects selected.");
      Deno.exit(1);
    }
    if (aspects.includes("majorAspects")) {
      ({ majorAspectBodies } = await prompts({
        choices: bodyChoices,
        message: "📐 Which major aspect bodies would you like?",
        name: "majorAspectBodies",
        type: "multiselect",
      }));

      if (aspects.includes("majorAspects") && _.isEmpty(majorAspectBodies)) {
        console.error("🚫 No major aspect bodies selected.");
        Deno.exit(1);
      }
    }

    if (aspects.includes("minorAspects")) {
      ({ minorAspectBodies } = await prompts({
        choices: bodyChoices,
        message: "🖇️ Which minor aspect bodies would you like?",
        name: "minorAspectBodies",
        type: "multiselect",
      }));

      if (aspects.includes("minorAspects") && _.isEmpty(minorAspectBodies)) {
        console.error("🚫 No minor aspect bodies selected.");
        Deno.exit(1);
      }
    }

    if (aspects.includes("specialtyAspects")) {
      ({ specialtyAspectBodies } = await prompts({
        choices: bodyChoices,
        message: "🧮 Which specialty aspect bodies would you like?",
        name: "specialtyAspectBodies",
        type: "multiselect",
      }));

      if (
        aspects.includes("specialtyAspects") &&
        _.isEmpty(specialtyAspectBodies)
      ) {
        console.error("🚫 No specialty aspect bodies selected.");
        Deno.exit(1);
      }
    }
  }

  if (eventTypes.includes("retrogrades")) {
    ({ retrogradeBodies } = await prompts({
      choices: retrogradeBodyChoices,
      message: "↩️ Which retrograde bodies would you like?",
      name: "retrogradeBodies",
      type: "multiselect",
    }));

    if (_.isEmpty(retrogradeBodies)) {
      console.error("🚫 No retrograde bodies selected.");
      Deno.exit(1);
    }
  }

  if (eventTypes.includes("planetaryPhases")) {
    ({ planetaryPhaseBodies } = await prompts({
      choices: planetaryPhaseBodyChoices,
      message: "🌓 Which planetary phases would you like?",
      name: "planetaryPhaseBodies",
      type: "multiselect",
    }));

    if (_.isEmpty(planetaryPhaseBodies)) {
      console.error("🚫 No planetary phases selected.");
      Deno.exit(1);
    }
  }

  if (
    eventTypes.includes("dailySolarCycle") ||
    eventTypes.includes("dailyLunarCycle") ||
    eventTypes.includes("monthlyLunarCycle") ||
    eventTypes.includes("twilights")
  ) {
    ({ latitude } = await prompts({
      message: "📍 What latitude would you like?",
      name: "latitude",
      type: "number",
    }));

    if (!latitude) {
      console.error("🚫 No latitude input.");
      Deno.exit(1);
    }

    ({ longitude } = await prompts({
      message: "📍 What longitude would you like?",
      name: "longitude",
      type: "number",
    }));

    if (!longitude) {
      console.error("🚫 No longitude input.");
      Deno.exit(1);
    }
  }

  const mask = "YYYY-MM-DD";

  const { start } = await prompts({
    initial: moment().startOf("month").toDate(),
    mask,
    message: "📅 When would you like to start?",
    name: "start",
    type: "date",
  });

  if (!start) {
    console.error("🚫 No start date input.");
    Deno.exit(1);
  }

  const { end } = await prompts({
    initial: moment().startOf("month").add(1, "month").toDate(),
    mask,
    message: "📅 When would you like to end?",
    name: "end",
    type: "date",
    validate: (end: Date) => {
      if (moment(end).isBefore(start)) {
        return "🚫 End date must be after the start date.";
      }

      return true;
    },
  });

  if (!end) {
    console.error("🚫 No end date input.");
    Deno.exit(1);
  }

  const choices: Choices = {
    aspects,
    decanIngressBodies,
    end,
    eventTypes,
    ingresses,
    latitude,
    longitude,
    majorAspectBodies,
    minorAspectBodies,
    peakIngressBodies,
    planetaryPhaseBodies,
    retrogradeBodies,
    signIngressBodies,
    specialtyAspectBodies,
    start,
  };

  return choices;
}
