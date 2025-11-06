import { z } from "zod";

// #region Latitude
export const latitudeSchema = z.coerce.number().min(-90).max(90);

export type Latitude = z.infer<typeof latitudeSchema>;

// #region Longitude
export const longitudeSchema = z.coerce.number().min(-180).max(180);

export type Longitude = z.infer<typeof longitudeSchema>;

// #region Timezone
export const timezoneSchema = z.string();

export type Timezone = z.infer<typeof timezoneSchema>;

// #region Input
export const inputSchema = z.object({
  latitude: latitudeSchema.optional().default(39.949309),
  longitude: longitudeSchema.optional().default(-75.17169),
  timezone: timezoneSchema.default("America/New_York"),
  start: z.date().min(new Date("1900-01-01")).max(new Date("2100-12-31")),
  end: z.date().min(new Date("1900-01-01")).max(new Date("2100-12-31")),
});

export type Input = z.infer<typeof inputSchema>;
