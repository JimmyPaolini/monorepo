import moment, { type Moment } from "moment-timezone";

/**
 * Generates minute-by-minute UTC dates from start to end (inclusive).
 */
export function* generateMinutes(
  start: Moment,
  end: Moment,
): Generator<Moment> {
  const endMs = end.valueOf();
  let currentMs = start.valueOf();
  while (currentMs <= endMs) {
    yield moment.utc(currentMs);
    currentMs += 60_000;
  }
}

/**
 * Generates day-by-day timezone-aware dates from start to end (inclusive).
 *
 * Each yielded moment represents the start of a calendar day in the given timezone.
 */
export function* generateDays(
  start: Moment,
  end: Moment,
  timezone: string,
): Generator<Moment> {
  const endDay = end.clone().tz(timezone).startOf("day");
  const current = start.clone().tz(timezone).startOf("day");
  while (!current.isAfter(endDay)) {
    yield current.clone();
    current.add(1, "day");
  }
}
