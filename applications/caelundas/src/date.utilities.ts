import moment from "moment-timezone";

/**
 * Generates minute-by-minute UTC dates from start to end (inclusive).
 */
export function* generateMinutes(
  start: moment.Moment,
  end: moment.Moment,
): Generator<moment.Moment> {
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
  start: moment.Moment,
  end: moment.Moment,
  timezone: string,
): Generator<moment.Moment> {
  const endDay = end.clone().tz(timezone).startOf("day");
  const current = start.clone().tz(timezone).startOf("day");
  while (!current.isAfter(endDay)) {
    yield current.clone();
    current.add(1, "day");
  }
}
