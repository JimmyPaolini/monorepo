import tzLookup from "@photostructure/tz-lookup";
import moment from "moment-timezone";
import { z } from "zod";

/**
 * Minimum allowed start/end date for ephemeris calculations (1900-01-01).
 *
 * Based on NASA JPL DE431 ephemeris data availability.
 */
const minDateString = "1900-01-01";

/**
 * Maximum allowed start/end date for ephemeris calculations (2100-12-31).
 *
 * Based on NASA JPL DE431 ephemeris data availability.
 */
const maxDateString = "2100-12-31";

/**
 * Zod schema for validating and transforming user input for ephemeris calculations.
 *
 * Validates geographic coordinates and date ranges, automatically determines timezone
 * based on location, and transforms string dates into timezone-aware Date objects.
 *
 * **Validation rules:**
 * 1. Latitude must be between -90 and 90
 * 2. Longitude must be between -180 and 180
 * 3. Start date must be \>= 1900-01-01
 * 4. Start date must be \<= 2100-12-31
 * 5. End date must be \>= 1900-01-01
 * 6. End date must be \<= 2100-12-31
 * 7. End date must be strictly after start date
 *
 * **Transformation behavior:**
 * - Uses `@photostructure/tz-lookup` to determine timezone from coordinates
 * - Parses date strings in the determined timezone (not UTC)
 * - Converts to JavaScript Date objects for application use
 *
 * **Coercion:**
 * - Latitude and longitude are coerced from strings to numbers if needed
 * - Date strings must be in ISO format (YYYY-MM-DD)
 *
 * **Default values:**
 * - Location: Philadelphia, PA (39.949309°N, 75.17169°W)
 * - Date range: Previous month to next month (2-month window centered on today)
 *
 * @example
 * ```typescript
 * // Using defaults (Philadelphia, 2-month window)
 * const input1 = inputSchema.parse({});
 * // Result: { latitude: 39.949309, longitude: -75.17169,
 * //           timezone: 'America/New_York', start: Date, end: Date }
 *
 * // Custom location and dates
 * const input2 = inputSchema.parse({
 *   latitude: 51.5074,
 *   longitude: -0.1278,
 *   startDate: '2026-01-01',
 *   endDate: '2026-12-31'
 * });
 * // Result: { latitude: 51.5074, longitude: -0.1278,
 * //           timezone: 'Europe/London', start: Date, end: Date }
 *
 * // Validation errors
 * try {
 *   inputSchema.parse({ latitude: 100 }); // Fails: latitude > 90
 * } catch (error) {
 *   console.error(error); // ZodError with validation details
 * }
 *
 * try {
 *   inputSchema.parse({
 *     startDate: '2026-01-01',
 *     endDate: '2025-12-31' // Before start
 *   });
 * } catch (error) {
 *   console.error(error); // "End date must be after start date"
 * }
 * ```
 *
 * @see {@link https://github.com/photostructure/tz-lookup} for timezone lookup algorithm
 * @see {@link https://zod.dev} for Zod schema documentation
 */
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
