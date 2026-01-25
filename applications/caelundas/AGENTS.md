# Caelundas: Astronomical Calendar Generator

## Architecture Overview

Caelundas is a Node.js CLI application that generates astronomical event calendars using NASA's JPL Horizons API. It computes planetary positions, detects aspect events, and outputs iCalendar files for personal use.

### Core Pipeline

```text
Input (ENV) → Ephemeris Retrieval → Event Detection → Duration Synthesis → iCal Output
     ↓              ↓                      ↓                  ↓                ↓
Validation    NASA JPL API          Exact moments       Pair events      .ics file
              + SQLite Cache        (minute precision)   into periods     + JSON
```

**Pipeline Stages**

1. **Input Validation** ([input.schema.ts](src/input.schema.ts)): Zod schema validates environment variables (date range, location, timezone, event types)
2. **Ephemeris Retrieval** ([ephemeris/](src/ephemeris/)): Fetch planetary positions from NASA JPL Horizons with SQLite caching and temporal margins
3. **Event Detection** ([events/](src/events/)): Calculate exact moments of aspects, phases, eclipses, retrogrades using minute-by-minute precision
4. **Duration Synthesis**: Pair exact events (aspect starts/ends) into duration events for calendar blocking
5. **Output Generation** ([output.utilities.ts](src/output.utilities.ts)): iCalendar format with geographic/timezone metadata

### Key Components

**Ephemeris System** ([src/ephemeris/](src/ephemeris/))

- **Service Layer** ([ephemeris.service.ts](src/ephemeris/ephemeris.service.ts)): NASA JPL Horizons API client with automatic retries
- **Caching Strategy** ([database.utilities.ts](src/database.utilities.ts)): SQLite stores ephemeris data keyed by `(body, moment)` to avoid redundant API calls
- **Temporal Margins**: Fetches data beyond date range boundaries to detect events that straddle boundaries
- **Data Types** ([ephemeris.types.ts](src/ephemeris/ephemeris.types.ts)): Celestial body positions, velocities, distances

**Event Detection** ([src/events/](src/events/))

Event types organized by category:

- **Aspects** ([aspects/](src/events/aspects/)): Major (conjunctions, oppositions, squares, trines, sextiles), minor (semi-sextiles, quincunxes), specialty (quadruple, quintuple, sextuple)
- **Phases** ([phases/](src/events/phases/)): Lunar phases (new, first quarter, full, last quarter)
- **Retrogrades** ([retrogrades/](src/events/retrogrades/)): Planets appearing to move backward from Earth's perspective
- **Eclipses** ([eclipses/](src/events/eclipses/)): Solar and lunar eclipses
- **Ingresses** ([ingresses/](src/events/ingresses/)): Planets entering zodiac signs
- **Cycles** ([annualSolarCycle/](src/events/annualSolarCycle/), [monthlyLunarCycle/](src/events/monthlyLunarCycle/), [dailyCycles/](src/events/dailyCycles/)): Solstices, equinoxes, perihelion/aphelion, moonrise/moonset, sunrise/sunset, twilights

**Database Layer** ([database.utilities.ts](src/database.utilities.ts))

SQLite database with three tables:
- `ephemeris`: Cached planetary positions from NASA API
- `events`: All detected calendar events
- `active_aspects`: Currently active aspect patterns (for compound detection)

Query functions: `getActiveAspectsAt()`, `getAllEvents()`, `upsertEvents()`

**Output Formatters** ([output.utilities.ts](src/output.utilities.ts))

- **iCalendar**: RFC 5545 compliant `.ics` files with VEVENT/VALARM components
- **JSON**: Structured event data for programmatic consumption
- **Metadata**: Geographic coordinates, timezone, generator version

## Domain Knowledge

### Astronomical Concepts

**Aspects**: Angular relationships between celestial bodies as seen from Earth
- Major aspects: 0° (conjunction), 180° (opposition), 90° (square), 120° (trine), 60° (sextile)
- Minor aspects: 30° (semi-sextile), 150° (quincunx)
- Specialty: 45° (semi-square), 135° (sesquiquadrate), 72° (quintile), 144° (biquintile)

**Retrogrades**: Apparent backward motion caused by Earth's orbital position (e.g., Mercury retrograde 3-4x/year)

**Eclipses**: Sun-Moon-Earth alignments (solar: Moon between Sun-Earth, lunar: Earth between Sun-Moon)

**Ingresses**: Planet crossing zodiac sign boundaries (e.g., Sun entering Aries = Spring Equinox)

**Phases**: Lunar illumination cycle (new → waxing → full → waning → new, ~29.5 days)

### NASA JPL Horizons API

**API Characteristics**
- REST endpoint: `https://ssd.jpl.nasa.gov/api/horizons.api`
- Ephemeris precision: Sub-arcsecond accuracy for planets, ~1 arcsecond for Moon
- Rate limits: Not documented but generally permissive for personal use
- Data format: Plain text tables requiring custom parsing

**Request Parameters** ([ephemeris.service.ts](src/ephemeris/ephemeris.service.ts))
- `COMMAND`: Body ID (e.g., "10" for Sun, "399" for Earth geocentric)
- `EPHEM_TYPE`: "OBSERVER" for topocentric coordinates
- `CENTER`: Geographic coordinates as `'coord@399'` (Earth surface)
- `START_TIME`, `STOP_TIME`: UTC timestamps in `'YYYY-MM-DD HH:MM'` format
- `STEP_SIZE`: Interval between data points (e.g., "1d" for daily, "1m" for minute-by-minute)
- `QUANTITIES`: "1,2" (astrometric RA/DEC and apparent RA/DEC)

**Caching Strategy** ([database.utilities.ts](src/database.utilities.ts))
- Cache key: `(body, moment)` tuple
- Cache duration: Permanent (ephemeris data is immutable for past dates)
- Cache bypass: Future dates within 24 hours (to catch updated predictions)

### Testing Strategy

Three test types with distinct filenames:

**Unit Tests** (`*.unit.test.ts`)
- Pure functions: angle calculations, time conversions, data transformations
- No I/O: Mocked database, mocked API responses
- Fast execution: < 100ms for full suite
- Example: [math.utilities.unit.test.ts](src/math.utilities.unit.test.ts), [ephemeris.aggregates.unit.test.ts](src/ephemeris/ephemeris.aggregates.unit.test.ts)

**Integration Tests** (`*.integration.test.ts`)
- Database interactions: SQLite queries, upserts, schema validation
- Real database: Temporary `.db` file created per test
- Slower execution: 1-2s per test
- Example: [database.utilities.integration.test.ts](src/database.utilities.integration.test.ts)

**End-to-End Tests** (`*.end-to-end.test.ts`)
- Full pipeline: Input → NASA API → Event detection → Output
- Real external services: NASA JPL Horizons API calls
- Slow execution: 30-60s per test (network latency)
- Example: [main.end-to-end.test.ts](src/main.end-to-end.test.ts)

Run specific test types:
```bash
nx run caelundas:test:unit            # Fast feedback loop
nx run caelundas:test:integration     # Database validation
nx run caelundas:test:end-to-end      # Full system validation
```

## Development Workflows

### Local Development

**Setup**
```bash
cd applications/caelundas
cp .env.example .env  # Edit with your configuration
pnpm install
```

**Environment Variables** ([input.schema.ts](src/input.schema.ts))

Required:
- `START_DATE`: YYYY-MM-DD (inclusive start date)
- `END_DATE`: YYYY-MM-DD (inclusive end date)
- `LATITUDE`: Decimal degrees (-90 to +90)
- `LONGITUDE`: Decimal degrees (-180 to +180)
- `TIMEZONE`: IANA timezone (e.g., "America/New_York")

Optional:
- `EVENT_TYPES`: Comma-separated list (defaults to all types)
  - Available: `majorAspects`, `minorAspects`, `quadrupleAspects`, `quintupleAspects`, `sextupleAspects`, `phases`, `retrogrades`, `eclipses`, `ingresses`, `annualSolarCycle`, `monthlyLunarCycle`, `dailyCycles`, `twilights`
- `OUTPUT_FORMAT`: `ical` or `json` (defaults to `ical`)
- `OUTPUT_PATH`: File path (defaults to `./output_{timestamp}.ics`)

**Run Locally**
```bash
nx run caelundas:develop    # Loads .env and runs pipeline
nx run caelundas:start      # Direct execution without .env
```

**Debugging**
- Set breakpoints in [main.ts](src/main.ts) entry point
- Use VSCode debugger with `.vscode/launch.json` configuration
- Inspect SQLite database: `sqlite3 caelundas.db` (created after first run)

### Docker Workflows

**Build Image**
```bash
nx run caelundas:docker-build    # Builds for linux/amd64, loads locally
```

**Multi-stage Dockerfile** ([Dockerfile](Dockerfile))
1. **Base**: Node.js 20 Alpine with pnpm
2. **Dependencies**: Install production packages only
3. **Build**: Compile TypeScript (outputs not needed for interpreted code)
4. **Runtime**: Copy source + node_modules, set CMD to `pnpm start`

**Platform Targeting**
- Always build for `linux/amd64` (Kubernetes cluster architecture)
- Apple Silicon Macs default to `linux/arm64` - must override with `--platform` flag
- Push to GHCR: `nx run caelundas:docker-push`

### Kubernetes Deployment

**Architecture**

Caelundas runs as a Kubernetes **Job** (not Deployment) because it's a batch process:
- Single execution: Job completes and terminates
- Output persistence: PersistentVolumeClaim stores `.ics` files
- No network exposure: No Service/Ingress needed

**Helm Chart** ([infrastructure/helm/kubernetes-job/](../../infrastructure/helm/kubernetes-job/))

Reusable chart for any batch job with PVC output:
- `values.yaml`: Image, command, environment variables, PVC size
- Auto-generated release name: `caelundas-{timestamp}` (avoids conflicts)
- Job cleanup: Manual deletion required (use `helm-uninstall` target)

**Deployment Workflow**

```bash
# 1. Build and push Docker image
nx run caelundas:docker-build
nx run caelundas:docker-push

# 2. Deploy to Kubernetes with auto-generated name
nx run caelundas:helm-upgrade

# 3. Wait for job completion (monitor with kubectl)
kubectl get jobs -l app.kubernetes.io/name=caelundas

# 4. Copy output files from PVC
nx run caelundas:kubernetes-copy-files -- --release-name=caelundas-20260125-123456

# 5. Clean up resources
nx run caelundas:helm-uninstall -- --release-name=caelundas-20260125-123456
```

**Helper Scripts** ([scripts/](scripts/))

- [helm-upgrade.sh](scripts/helm-upgrade.sh): Deploy with timestamped release name, sets environment variables from Kubernetes secret
- [kubernetes-copy-files.sh](scripts/kubernetes-copy-files.sh): Copy files from completed job's PVC to local `output/` directory
- [kubernetes-list-files.sh](scripts/kubernetes-list-files.sh): List files in PVC (for verification)
- [helm-uninstall.sh](scripts/helm-uninstall.sh): Delete Helm release and PVC

**PersistentVolumeClaim Strategy**

- **Storage Class**: Default cluster storage class (usually dynamic provisioning)
- **Access Mode**: ReadWriteOnce (single node access)
- **Size**: 1Gi (configurable in `values.yaml`)
- **Mount Path**: `/app/output` (hardcoded in Dockerfile CMD)
- **Lifecycle**: Manually deleted after file retrieval (not auto-deleted with Job)

**Environment Variables in Kubernetes**

Stored as Kubernetes Secret (`caelundas-env-secret`):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: caelundas-env-secret
stringData:
  START_DATE: "2026-01-01"
  END_DATE: "2026-12-31"
  LATITUDE: "40.7128"
  LONGITUDE: "-74.0060"
  TIMEZONE: "America/New_York"
  EVENT_TYPES: "majorAspects,phases"
  OUTPUT_PATH: "/app/output/calendar.ics"
```

Create secret: `kubectl apply -f applications/caelundas/kubernetes/secret.yaml`

## Performance Characteristics

**Execution Times** (for 1-year date range, all event types)

- **First run** (empty cache): 8-12 minutes (dominated by NASA API calls)
- **Subsequent runs** (warm cache): 1-2 minutes (local computation only)
- **Minute resolution**: 525,600 data points/year (1 minute × 365 days)

**API Call Volume**

- Daily ephemeris: 365 body-days × 10 bodies = 3,650 API calls
- Minute ephemeris (for exact events): Variable (10,000-50,000 calls depending on event density)
- Cache hit rate: ~95% after first run for same date range

**Memory Usage**

- Ephemeris cache: ~50MB for 1-year daily data
- Event database: ~5MB for 10,000 events
- Peak memory: ~200MB during event detection

**Optimization Strategies**

1. **Temporal margins**: Fetch ±MARGIN_MINUTES beyond date range to catch boundary events
2. **Batch API calls**: Request multiple days per call when possible
3. **SQLite indexing**: Composite index on `(body, moment)` for cache lookups
4. **Lazy evaluation**: Only compute minute-resolution ephemeris for detected event windows

## Troubleshooting

**Common Issues**

**NASA API Timeouts**
- Symptom: `Error: ETIMEDOUT` or `Error: ESOCKETTIMEDOUT`
- Cause: JPL Horizons server overload or network issues
- Solution: Retry with exponential backoff (built into `fetch.utilities.ts`)

**Invalid Ephemeris Data**
- Symptom: `Error: Failed to parse ephemeris response`
- Cause: Unexpected NASA API response format (rare, usually during maintenance)
- Solution: Check API endpoint status at https://ssd.jpl.nasa.gov/api/horizons.api

**SQLite Lock Errors**
- Symptom: `Error: SQLITE_BUSY: database is locked`
- Cause: Multiple processes accessing same database file
- Solution: Run only one instance at a time, delete `.db-journal` file if stuck

**Missing Events**
- Symptom: Expected event not in output calendar
- Cause: Event outside date range + margins, or tight orb thresholds
- Solution: Expand date range, check `MARGIN_MINUTES` constant

**Dockerfile Build Failures on Apple Silicon**
- Symptom: Docker build succeeds but image fails to run in Kubernetes
- Cause: Built for `linux/arm64` instead of `linux/amd64`
- Solution: Always use `--platform linux/amd64` flag in `docker buildx build` command

**Kubernetes Job Never Completes**
- Symptom: Job pod stuck in `Running` or `Error` state
- Cause: Environment variables not set, invalid date range, or insufficient memory
- Solution: Check pod logs with `kubectl logs <pod-name>`, verify secret exists

**PVC File Retrieval Fails**
- Symptom: `kubernetes-copy-files.sh` script errors
- Cause: Job still running, or PVC not mounted correctly
- Solution: Wait for job completion (`kubectl get jobs`), verify PVC exists (`kubectl get pvc`)

## Code Patterns & Conventions

**File Organization**
- One module per domain concept (e.g., `majorAspects.events.ts`, `phases.events.ts`)
- Colocate tests with source: `*.unit.test.ts`, `*.integration.test.ts`, `*.end-to-end.test.ts`
- Utilities in root `src/`: math, database, fetch, calendar, output

**Type Safety**
- Zod schemas for runtime validation ([input.schema.ts](src/input.schema.ts))
- Explicit return types for all functions
- No `any` types - use `unknown` or proper types
- Strict null checks enabled (`noUncheckedIndexedAccess`)

**Error Handling**
- Throw errors for invalid state (programming errors)
- Return `null` for expected absence (e.g., no event detected)
- Wrap external API calls in try-catch with retries

**Astronomy Calculations**
- Angular distance: Modulo arithmetic to handle 360° wraparound
- Angle normalization: Map to \[-180°, +180°\] for aspect detection
- Temporal precision: Use `moment.utc()` to avoid timezone ambiguities

## Related Documentation

- [Main AGENTS.md](../../AGENTS.md): Monorepo architecture, Nx workflows, TypeScript conventions
- [infrastructure/AGENTS.md](../../infrastructure/AGENTS.md): Helm charts, Kubernetes patterns, Docker strategies
- [NASA JPL Horizons Documentation](https://ssd.jpl.nasa.gov/horizons/manual.html): API reference, ephemeris format
- [RFC 5545 iCalendar](https://tools.ietf.org/html/rfc5545): Calendar file format specification
