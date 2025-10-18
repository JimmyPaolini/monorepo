import { Body, RetrogradeBody } from "../symbols.constants.ts";

import { Latitude, Longitude } from "../ephemeris/ephemeris.types.ts";
import {
  aspectChoices,
  ingressChoices,
  eventTypeChoices,
  planetaryPhaseBodyChoices,
} from "../choices/choices.constants.ts";

export type EventTypeChoice = (typeof eventTypeChoices)[number]["value"];
export type IngressChoice = (typeof ingressChoices)[number]["value"];
export type AspectChoice = (typeof aspectChoices)[number]["value"];
export type PlanetaryPhaseBodyChoice =
  (typeof planetaryPhaseBodyChoices)[number]["value"];

export type Choices = {
  aspects: AspectChoice[];
  decanIngressBodies: Body[];
  end: Date;
  eventTypes: EventTypeChoice[];
  ingresses: IngressChoice[];
  latitude?: Latitude;
  longitude?: Longitude;
  majorAspectBodies: Body[];
  minorAspectBodies: Body[];
  peakIngressBodies: Body[];
  planetaryPhaseBodies: PlanetaryPhaseBodyChoice[];
  retrogradeBodies: RetrogradeBody[];
  signIngressBodies: Body[];
  specialtyAspectBodies: Body[];
  start: Date;
};

export interface ChoicesProps extends Choices {}
