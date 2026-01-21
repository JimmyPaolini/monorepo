import tzLookup from "@photostructure/tz-lookup";
import moment from "moment-timezone";
import { z } from "zod";

const minDateString = "1900-01-01";
const maxDateString = "2100-12-31";

export const inputSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90).optional().default(39.949309),
    longitude: z.coerce
      .number()
      .min(-180)
      .max(180)
      .optional()
      .default(-75.17169),
    startDate: z
      .string()
      .optional()
      .default(moment().subtract(1, "month").format("YYYY-MM-DD")),
    endDate: z
      .string()
      .optional()
      .default(moment().add(1, "month").format("YYYY-MM-DD")),
  })
  .transform((data) => {
    const timezone = tzLookup(data.latitude, data.longitude);

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone,
      start: moment.tz(data.startDate, timezone).toDate(),
      end: moment.tz(data.endDate, timezone).toDate(),
    };
  })
  .refine((data) => data.start >= new Date(minDateString), {
    message: `Start date must be on or after ${minDateString}`,
  })
  .refine((data) => data.start <= new Date(maxDateString), {
    message: `Start date must be on or before ${maxDateString}`,
  })
  .refine((data) => data.end >= new Date(minDateString), {
    message: `End date must be on or after ${minDateString}`,
  })
  .refine((data) => data.end <= new Date(maxDateString), {
    message: `End date must be on or before ${maxDateString}`,
  })
  .refine((data) => data.end > data.start, {
    message: "End date must be after start date",
  });
