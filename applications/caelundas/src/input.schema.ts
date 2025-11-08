import { z } from "zod";
import moment from "moment-timezone";
import tzLookup from "@photostructure/tz-lookup";

// #region Input
export const inputSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90).optional().default(39.949309),
    longitude: z.coerce
      .number()
      .min(-180)
      .max(180)
      .optional()
      .default(-75.17169),
    startDate: z.string().optional().default("2025-01-01"),
    endDate: z.string().optional().default("2025-12-31"),
  })
  .transform((data) => {
    const timezone = tzLookup(data.latitude, data.longitude);

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: timezone,
      start: moment.tz(data.startDate, timezone).toDate(),
      end: moment.tz(data.endDate, timezone).toDate(),
    };
  })
  .refine((data) => data.start >= new Date("1900-01-01"), {
    message: "Start date must be on or after 1900-01-01",
  })
  .refine((data) => data.start <= new Date("2100-12-31"), {
    message: "Start date must be on or before 2100-12-31",
  })
  .refine((data) => data.end >= new Date("1900-01-01"), {
    message: "End date must be on or after 1900-01-01",
  })
  .refine((data) => data.end <= new Date("2100-12-31"), {
    message: "End date must be on or before 2100-12-31",
  })
  .refine((data) => data.end > data.start, {
    message: "End date must be after start date",
  });

export type Input = z.infer<typeof inputSchema>;
