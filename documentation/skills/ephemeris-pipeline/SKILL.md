---
name: ephemeris-pipeline
description: Understand the caelundas ephemeris calculation pipeline - NASA JPL API integration, astronomical event detection, and calendar generation. Use this skill when working on caelundas.
license: MIT
---

# Ephemeris Pipeline

This skill covers the caelundas astronomical calendar generation pipeline, including NASA JPL Horizons API integration, ephemeris caching, event detection, and output formatting.

## Overview

Caelundas generates astronomical calendars by:

1. **Fetching ephemeris data** from NASA JPL Horizons API
2. **Caching calculations** in SQLite for performance
3. **Detecting events** (aspects, phases, eclipses, etc.)
4. **Generating calendars** in iCal and JSON formats

For comprehensive architecture details, see [applications/caelundas/AGENTS.md](../../applications/caelundas/AGENTS.md).

## Pipeline Architecture

```text
┌─────────────────┐
│  Configuration  │ (dates, location, output format)
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Fetch Data     │ NASA JPL Horizons API
│  ├─ Planets     │ (Sun, Moon, Mercury...Pluto)
│  ├─ Lunar Node  │
│  └─ Chiron      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  SQLite Cache   │ (ephemeris + active aspects)
│  ├─ Check cache │
│  ├─ Store new   │
│  └─ Query       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Event Detection │
│  ├─ Aspects     │ (conjunctions, oppositions, etc.)
│  ├─ Phases      │ (new moon, full moon, quarters)
│  ├─ Stelliums   │ (3+ planets close together)
│  ├─ Eclipses    │
│  └─ Retrogrades │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Output Format   │
│  ├─ iCalendar   │ (.ics)
│  └─ JSON        │
└─────────────────┘
```

## NASA JPL Horizons API

### API Integration

Caelundas uses NASA's JPL Horizons system for high-precision ephemeris data:

```typescript
// Fetch positions for a planet over date range
const response = await fetch("https://ssd.jpl.nasa.gov/api/horizons.api", {
  method: "GET",
  params: {
    COMMAND: "10", // Body ID (Mercury)
    EPHEM_TYPE: "OBSERVER",
    CENTER: "coord@399", // Geocentric
    START_TIME: "2024-01-01",
    STOP_TIME: "2024-12-31",
    STEP_SIZE: "1d", // Daily positions
    QUANTITIES: "1,3", // RA/Dec and distance
    CSV_FORMAT: "YES",
  },
});
```

### Body IDs

- **Sun**: 10
- **Moon**: 301
- **Mercury**: 199
- **Venus**: 299
- **Mars**: 499
- **Jupiter**: 599
- **Saturn**: 699
- **Uranus**: 799
- **Neptune**: 899
- **Pluto**: 999
- **Lunar Node**: calculated from Moon's orbit
- **Chiron**: 2060

### Data Format

JPL returns CSV with columns:

```text
Date, Julian Day, RA (deg), Dec (deg), Distance (AU)
2024-01-01, 2460310.5, 280.5, -23.0, 0.983
```

Caelundas parses and converts to internal format with:

- Ecliptic longitude (0-360°)
- Zodiac sign (Aries-Pisces)
- Degree within sign (0-30°)

### Rate Limiting

API is rate-limited. Caelundas implements:

- **Exponential backoff** on 429 errors
- **Batch requests** for multiple bodies
- **SQLite caching** to minimize API calls

## SQLite Caching Strategy

### Cache Tables

**ephemerides table:**

```sql
CREATE TABLE ephemerides (
  id INTEGER PRIMARY KEY,
  body TEXT NOT NULL,           -- 'Sun', 'Moon', 'Mercury', etc.
  date TEXT NOT NULL,           -- ISO date
  longitude REAL NOT NULL,      -- Ecliptic longitude (0-360)
  latitude REAL,                -- Ecliptic latitude
  distance REAL,                -- Distance from Earth (AU)
  speed REAL,                   -- Daily motion (degrees/day)
  UNIQUE(body, date)
);
```

**active_aspects table:**

```sql
CREATE TABLE active_aspects (
  id INTEGER PRIMARY KEY,
  body1 TEXT NOT NULL,
  body2 TEXT NOT NULL,
  aspect_type TEXT NOT NULL,    -- 'conjunction', 'opposition', etc.
  exact_time TEXT NOT NULL,     -- ISO timestamp
  orb REAL NOT NULL,            -- Degrees from exact
  applying BOOLEAN NOT NULL,    -- Approaching (true) or separating (false)
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL
);
```

### Cache Workflow

1. **Check cache** before API request:

   ```typescript
   const cached = await db.get(
     "SELECT * FROM ephemerides WHERE body = ? AND date = ?",
     [body, date],
   );
   if (cached) return cached;
   ```

2. **Fetch from API** if not cached:

   ```typescript
   const data = await fetchFromJPL(body, date)
   await db.run(
     'INSERT INTO ephemerides (body, date, longitude, ...) VALUES (?, ?, ?, ...)',
     [body, date, data.longitude, ...]
   )
   ```

3. **Query cached data** for event detection:

   ```typescript
   const positions = await db.all(
     "SELECT * FROM ephemerides WHERE date BETWEEN ? AND ? ORDER BY date",
     [startDate, endDate],
   );
   ```

### Cache Benefits

- **Reduces API calls** by ~99% on repeat runs
- **Fast local queries** for event detection
- **Offline capability** once data is cached
- **Consistent results** across runs

## Event Detection

### Aspect Types

**Major aspects** (exact angles between planets):

- **Conjunction** (0°): Planets aligned
- **Opposition** (180°): Planets opposite
- **Trine** (120°): Harmonious angle
- **Square** (90°): Challenging angle
- **Sextile** (60°): Opportunity angle

**Minor aspects:**

- Semi-sextile (30°)
- Semi-square (45°)
- Quintile (72°)
- Sesquiquadrate (135°)
- Quincunx (150°)

**Specialty aspects:**

- Bi-quintile (144°)
- Septile (51.43°)
- Novile (40°)

### Orbs

Orbs define how close to exact an aspect must be:

```typescript
const MAJOR_ORB = 8; // ±8° for major aspects
const MINOR_ORB = 3; // ±3° for minor aspects
```

Example: Mars at 45° and Jupiter at 50° form a semi-square (45° aspect) with 5° orb.

### Detection Algorithm

For each date in range:

1. **Get all planet positions** from cache
2. **Calculate angles** between all planet pairs
3. **Check if angle matches aspect** within orb
4. **Determine applying/separating**:
   - Applying: Planets moving toward exact aspect
   - Separating: Planets moving away from exact aspect
5. **Find exact time** using interpolation
6. **Store in active_aspects table**

### Lunar Phases

Special case for Moon phases (Sun-Moon angles):

- **New Moon**: Sun-Moon conjunction (0°)
- **Waxing Crescent**: 0-90°
- **First Quarter**: Sun-Moon square (90°)
- **Waxing Gibbous**: 90-180°
- **Full Moon**: Sun-Moon opposition (180°)
- **Waning Gibbous**: 180-270°
- **Last Quarter**: Sun-Moon square (270°)
- **Waning Crescent**: 270-360°

### Stelliums

A stellium is 3+ planets within 10° in the same zodiac sign:

```typescript
// Group planets by sign
const planetsBySign = positions.reduce((acc, planet) => {
  const sign = getZodiacSign(planet.longitude);
  acc[sign] = acc[sign] || [];
  acc[sign].push(planet);
  return acc;
}, {});

// Find stelliums
const stelliums = Object.entries(planetsBySign)
  .filter(([sign, planets]) => planets.length >= 3)
  .map(([sign, planets]) => ({ sign, planets }));
```

### Eclipses

Solar and lunar eclipses occur when:

**Solar Eclipse** (Sun-Moon conjunction):

- Moon is near lunar node (within ~18°)
- New Moon

**Lunar Eclipse** (Sun-Moon opposition):

- Moon is near lunar node (within ~12°)
- Full Moon

### Retrogrades

A planet is retrograde when its speed (daily motion) is negative:

```typescript
const isRetrograde = planet.speed < 0;
```

Retrograde periods are when a planet appears to move backward in the sky from Earth's perspective.

## Output Formats

### iCalendar (.ics)

Standard calendar format compatible with Google Calendar, Apple Calendar, Outlook, etc.

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//caelundas//astronomical-calendar//EN
BEGIN:VEVENT
UID:mars-square-saturn-2024-01-15@caelundas
DTSTART:20240115T143000Z
SUMMARY:Mars square Saturn
DESCRIPTION:Exact aspect at 14:30 UTC
LOCATION:Geocentric
END:VEVENT
END:VCALENDAR
```

Event properties:

- **UID**: Unique identifier
- **DTSTART**: Exact time of aspect
- **SUMMARY**: Human-readable event name
- **DESCRIPTION**: Additional details (orb, planets, etc.)

### JSON

Structured data for programmatic access:

```json
{
  "events": [
    {
      "type": "aspect",
      "aspect": "square",
      "body1": "Mars",
      "body2": "Saturn",
      "exactTime": "2024-01-15T14:30:00Z",
      "orb": 0.5,
      "applying": false,
      "longitude1": 45.5,
      "longitude2": 135.5
    }
  ]
}
```

More flexible for custom processing and analysis.

## Configuration

### Environment Variables

```bash
# Date range
START_DATE=2024-01-01
END_DATE=2024-12-31

# Location (for local coordinates)
LATITUDE=40.7128
LONGITUDE=-74.0060
TIMEZONE=America/New_York

# Output format
OUTPUT_FORMAT=ical  # or 'json' or 'both'
OUTPUT_PATH=/app/output/calendar.ics

# Event types to include
INCLUDE_MAJOR_ASPECTS=true
INCLUDE_MINOR_ASPECTS=true
INCLUDE_PHASES=true
INCLUDE_ECLIPSES=true
INCLUDE_RETROGRADES=true
INCLUDE_STELLIUMS=true
```

### Custom Orbs

Override default orbs in configuration:

```typescript
const customOrbs = {
  conjunction: 10,
  opposition: 10,
  trine: 8,
  square: 8,
  sextile: 6,
  // ...minor aspects
};
```

## Performance

### Optimization Strategies

1. **Parallel API requests** for different bodies
2. **SQLite indexing** on (body, date) columns
3. **Batch inserts** for cache updates
4. **Lazy loading** of event detection
5. **Incremental updates** for overlapping date ranges

### Typical Runtime

For full year calendar (365 days, 11 bodies):

- **First run** (no cache): ~5-10 minutes
- **Subsequent runs** (cached): ~30 seconds
- **Incremental update** (7 days): ~5 seconds

## Testing

### Test Types

**Unit tests** (`*.unit.test.ts`):

- Angle calculations
- Zodiac sign conversions
- Orb checking
- Date utilities

**Integration tests** (`*.integration.test.ts`):

- NASA API requests
- SQLite caching
- Event detection algorithms

**End-to-end tests** (`*.end-to-end.test.ts`):

- Full pipeline execution
- Output file generation
- Multi-day processing

## Common Tasks

### Generate Calendar

```bash
nx run caelundas:develop
```

### Clear Cache

```bash
rm applications/caelundas/ephemeris.db
```

### Debug API Requests

```bash
# Enable debug logging
DEBUG=nasa-api nx run caelundas:develop
```

### Validate Output

```bash
# Check iCal syntax
icalendar-validate output/calendar.ics

# Parse JSON
jq . output/calendar.json
```

## Related Documentation

- [applications/caelundas/AGENTS.md](../../applications/caelundas/AGENTS.md) - Full architecture
- [applications/caelundas/README.md](../../applications/caelundas/README.md) - Usage guide
- [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) - API documentation

## Astronomical Resources

- [Ephemeris](https://en.wikipedia.org/wiki/Ephemeris) - Table of planetary positions
- [Ecliptic coordinate system](https://en.wikipedia.org/wiki/Ecliptic_coordinate_system)
- [Astrological aspects](https://en.wikipedia.org/wiki/Astrological_aspect)
- [Zodiac](https://en.wikipedia.org/wiki/Zodiac)
