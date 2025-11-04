import { z } from "zod";

// #region Helper to parse comma-separated strings into arrays
const commaSeparatedString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      return val.split(",").map((item) => item.trim());
    }
    return val;
  }, z.array(schema));

// #region Event Type
export const eventTypeSchema = z.enum([
  "ingresses",
  "aspects",
  "retrogrades",
  "planetaryPhases",
  "annualSolarCycle",
  "monthlyLunarCycle",
  "dailySolarCycle",
  "dailyLunarCycle",
  "twilights",
]);

export type EventType = z.infer<typeof eventTypeSchema>;

// #region Ingress
export const ingressSchema = z.enum(["signs", "decans", "peaks"]);

export type Ingress = z.infer<typeof ingressSchema>;

// #region Aspect
export const aspectSchema = z.enum([
  "majorAspects",
  "minorAspects",
  "specialtyAspects",
]);

export type Aspect = z.infer<typeof aspectSchema>;

// #region Body
export const bodySchema = z.enum([
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
  "south lunar node",
  "lunar apogee",
  "lunar perigee",
]);

export type Body = z.infer<typeof bodySchema>;

// #region Retrograde Body
export const retrogradeBodySchema = z.enum([
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
]);

export type RetrogradeBody = z.infer<typeof retrogradeBodySchema>;

// #region Planetary Phase Body
export const planetaryPhaseBodySchema = z.enum(["venus", "mercury", "mars"]);

export type PlanetaryPhaseBody = z.infer<typeof planetaryPhaseBodySchema>;

// #region Latitude
export const latitudeSchema = z.coerce.number().min(-90).max(90);

export type Latitude = z.infer<typeof latitudeSchema>;

// #region Longitude
export const longitudeSchema = z.coerce.number().min(-180).max(180);

export type Longitude = z.infer<typeof longitudeSchema>;

// #region Input
export const inputSchema = z.object({
  eventTypes: commaSeparatedString(eventTypeSchema).default([
    "ingresses",
    "aspects",
    "retrogrades",
    "planetaryPhases",
    "annualSolarCycle",
    "monthlyLunarCycle",
    "dailySolarCycle",
    "dailyLunarCycle",
    "twilights",
  ]),
  ingresses: commaSeparatedString(ingressSchema).default([
    "signs",
    "decans",
    "peaks",
  ]),
  signIngressBodies: commaSeparatedString(bodySchema).default([
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
  ]),
  decanIngressBodies: commaSeparatedString(bodySchema).default([
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
  ]),
  peakIngressBodies: commaSeparatedString(bodySchema).default([
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
  ]),
  aspects: commaSeparatedString(aspectSchema).default([
    "majorAspects",
    "minorAspects",
    "specialtyAspects",
  ]),
  majorAspectBodies: commaSeparatedString(bodySchema).default([
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
  ]),
  minorAspectBodies: commaSeparatedString(bodySchema).default([
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
  ]),
  specialtyAspectBodies: commaSeparatedString(bodySchema).default([
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
  ]),
  retrogradeBodies: commaSeparatedString(retrogradeBodySchema).default([
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
  ]),
  planetaryPhaseBodies: commaSeparatedString(planetaryPhaseBodySchema).default([
    "venus",
    "mercury",
    "mars",
  ]),
  latitude: latitudeSchema.optional().default(39.949309),
  longitude: longitudeSchema.optional().default(-75.17169),
  start: z.date(),
  end: z.date(),
});

export type Choices = z.infer<typeof inputSchema>;
