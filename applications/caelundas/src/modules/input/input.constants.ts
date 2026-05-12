import tzLookup from "@photostructure/tz-lookup";
import moment from "moment-timezone";
import { z } from "zod";

/**
 * Earliest supported date for ephemeris calculations, based on NASA JPL DE431 data.
 */
export const minDate = "1900-01-01";

/**
 * Latest supported date for ephemeris calculations, based on NASA JPL DE431 data.
 */
export const maxDate = "2100-12-31";

/**
 * Zod schema for raw environment variable validation.
 *
 * Validates the shape and format of env vars at application startup via
 * {@link ConfigModule.forRoot} `validate` option. Business-logic validation
 * (date ranges, end-after-start) is handled downstream in {@link inputSchema}.
 *
 * **Variables:**
 * - `LATITUDE` — Observer latitude in decimal degrees (-90 to 90)
 * - `LONGITUDE` — Observer longitude in decimal degrees (-180 to 180)
 * - `START_DATE` — Ephemeris start date in `YYYY-MM-DD` format
 * - `END_DATE` — Ephemeris end date in `YYYY-MM-DD` format
 * - `OUTPUT_DIRECTORY` — Directory path for generated calendar files (default: `./output`)
 */
export const environmentSchema = z.object({
  LATITUDE: z.coerce.number().min(-90).max(90).optional(),
  LONGITUDE: z.coerce.number().min(-180).max(180).optional(),
  START_DATE: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "START_DATE must be in YYYY-MM-DD format")
    .optional(),
  END_DATE: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "END_DATE must be in YYYY-MM-DD format")
    .optional(),
  OUTPUT_DIRECTORY: z.string().optional().default("./output"),
});

/**
 * Zod schema for validating and transforming user input for ephemeris calculations.
 *
 * Validates geographic coordinates and date ranges, automatically determines timezone
 * based on location, and transforms string dates into timezone-aware Moment objects.
 *
 * **Validation rules:**
 * 1. Latitude must be between -90 and 90
 * 2. Longitude must be between -180 and 180
 * 3. Start date must be \>= {@link minDate}
 * 4. Start date must be \<= {@link maxDate}
 * 5. End date must be \>= {@link minDate}
 * 6. End date must be \<= {@link maxDate}
 * 7. End date must be strictly after start date
 *
 * **Default values:**
 * - Location: Philadelphia, PA (39.949309°N, 75.17169°W)
 * - Date range: Previous month to next month (2-month window centered on today)
 *
 * @see {@link https://github.com/photostructure/tz-lookup} for timezone lookup algorithm
 * @see {@link https://zod.dev} for Zod schema documentation
 */
export const inputSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90).optional().default(39.949_309),
    longitude: z.coerce
      .number()
      .min(-180)
      .max(180)
      .optional()
      .default(-75.171_69),
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
      start: moment.tz(data.startDate, timezone),
      end: moment.tz(data.endDate, timezone),
    };
  })
  .refine((data) => data.start.isSameOrAfter(moment(minDate)), {
    message: `Start date must be on or after ${minDate}`,
  })
  .refine((data) => data.start.isSameOrBefore(moment(maxDate)), {
    message: `Start date must be on or before ${maxDate}`,
  })
  .refine((data) => data.end.isSameOrAfter(moment(minDate)), {
    message: `End date must be on or after ${minDate}`,
  })
  .refine((data) => data.end.isSameOrBefore(moment(maxDate)), {
    message: `End date must be on or before ${maxDate}`,
  })
  .refine((data) => data.end.isAfter(data.start), {
    message: "End date must be after start date",
  });
