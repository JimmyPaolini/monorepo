# Caelundas: Astronomical Calendar Generator

## Quick Start

**Type**: Node.js CLI batch application

**Purpose**: Generate astronomical event calendars using NASA's JPL Horizons API

**Outputs**: iCalendar (`.ics`) and JSON files

### Run Locally

```bash
cd applications/caelundas
cp .env.example .env  # Configure dates, location, timezone, event types
nx run caelundas:develop
```

### Deploy to Kubernetes

```bash
nx run caelundas:docker-build          # Build for linux/amd64
nx run caelundas:helm-upgrade          # Deploy as K8s Job
nx run caelundas:kubernetes-copy-files # Retrieve output after completion
```

## Architecture Overview

### Pipeline Stages

```text
Input (ENV) → Ephemeris → Event Detection → Duration Synthesis → iCal Output
     ↓          ↓              ↓                  ↓                 ↓
Validation  NASA API      Exact moments      Pair events       .ics/.json
            + SQLite      (minute precision)  into periods
```

**Key Components**:

- **Input Validation** ([input.schema.ts](src/input.schema.ts)): Zod schema for environment variables
- **Ephemeris Retrieval** ([ephemeris/](src/ephemeris/)): NASA JPL Horizons API with SQLite caching
- **Event Detection** ([events/](src/events/)): Aspects, phases, eclipses, retrogrades
- **Duration Synthesis**: Pairs start/end moments into calendar events
- **Output** ([output.utilities.ts](src/output.utilities.ts)): iCal and JSON formatters

### Event Types

- **Aspects**: Conjunctions (0°), oppositions (180°), squares (90°), trines (120°), sextiles (60°)
- **Phases**: New moon, full moon, first/last quarters
- **Retrogrades**: Apparent backward motion of planets
- **Eclipses**: Solar and lunar
- **Ingresses**: Planets entering zodiac signs
- **Cycles**: Solstices, equinoxes, moonrise/moonset, sunrise/sunset, twilights

## Domain Knowledge

See [ephemeris-pipeline skill](../../documentation/skills/ephemeris-pipeline/SKILL.md) for:

- NASA JPL Horizons API details (endpoints, parameters, rate limits)
- Astronomical concepts (aspects, retrogrades, phases explained)
- Caching strategy (SQLite schema, temporal margins)
- Event detection algorithms

## Development

### Environment Variables

Required:

- `START_DATE`, `END_DATE`: YYYY-MM-DD (inclusive range)
- `LATITUDE`, `LONGITUDE`: Decimal degrees
- `TIMEZONE`: IANA timezone (e.g., "America/New_York")

Optional:

- `EVENT_TYPES`: Comma-separated list (defaults to all)
- `OUTPUT_FORMAT`: `ical` or `json` (defaults to `ical`)
- `OUTPUT_PATH`: File path (defaults to `./output_{timestamp}.ics`)

Full schema: [src/input.schema.ts](src/input.schema.ts)

### Testing

```bash
nx run caelundas:test:unit            # Fast (<100ms), mocked I/O
nx run caelundas:test:integration     # Moderate (1-2s), real SQLite
nx run caelundas:test:end-to-end      # Slow (30-60s), real NASA API
```

See [Testing Strategy](../../documentation/code-quality/testing-strategy.md) for patterns.

### Database

SQLite with three tables:

- `ephemeris`: Cached NASA API responses
- `events`: Detected calendar events
- `active_aspects`: Currently active aspect patterns

Inspect: `sqlite3 caelundas.db`

## Kubernetes Deployment

### Architecture

Caelundas runs as a **Kubernetes Job** (not Deployment):

- Single execution, terminates on completion
- Output stored in PersistentVolumeClaim
- No network exposure needed

See [Deployment Models](../../documentation/architecture/deployment-models.md) for Jobs vs. Deployments patterns.

### Workflow

```bash
# 1. Build and push image
nx run caelundas:docker-build
docker push ghcr.io/jimmypaolini/caelundas:latest

# 2. Deploy Job (auto-generated release name)
nx run caelundas:helm-upgrade

# 3. Monitor completion
kubectl wait --for=condition=complete job/<job-name> --timeout=600s

# 4. Retrieve output files
nx run caelundas:kubernetes-copy-files

# 5. Clean up
nx run caelundas:helm-uninstall
kubectl delete pvc caelundas-output
```

### Helm Chart

Uses [infrastructure/helm/kubernetes-job](../../infrastructure/helm/kubernetes-job) - reusable chart for batch jobs with PVC storage.

**Values**: [infrastructure/helm/kubernetes-job/values/caelundas-production.yaml](../../infrastructure/helm/kubernetes-job/values/caelundas-production.yaml)

See [kubernetes-deployment skill](../../documentation/skills/kubernetes-deployment/SKILL.md) for Helm chart details.

### Environment Variables in K8s

Stored as Kubernetes Secret (`caelundas-env-secret`):

```bash
kubectl apply -f applications/caelundas/kubernetes/secret.yaml
```

## Docker Workflow

### Build

```bash
nx run caelundas:docker-build  # Builds for linux/amd64
```

**Platform targeting**: Always use `linux/amd64` for K8s deployment (Apple Silicon compatibility).

See [docker-workflows skill](../../documentation/skills/docker-workflows/SKILL.md) for multi-stage builds and GHCR integration.

### Dockerfile

Single-stage build:

- Base: Node.js 20 Alpine
- Native deps: python3, make, g++ (for sqlite3 compilation)
- Workspace: Full monorepo copied (needed for path resolution)
- Entry: `pnpm start` (runs TypeScript directly via tsx)

## Performance

**Execution times** (1-year range, all event types):

- First run (empty cache): 8-12 minutes (NASA API calls)
- Subsequent runs (warm cache): 1-2 minutes (local computation)

**Optimization strategies**:

- Temporal margins: Fetch beyond date boundaries to catch edge events
- SQLite caching: ~95% hit rate after first run
- Batch API calls: Multiple days per request when possible
- Lazy evaluation: Minute-resolution only for detected event windows

## Troubleshooting

See [Common Gotchas](../../documentation/troubleshooting/gotchas.md) for:

- Docker platform mismatch (exec format error)
- K8s Job not starting (image pull, PVC issues)
- PVC cleanup after job completion

## Key Files

- [src/main.ts](src/main.ts): Pipeline entry point
- [src/input.schema.ts](src/input.schema.ts): Environment variable validation
- [src/ephemeris/ephemeris.service.ts](src/ephemeris/ephemeris.service.ts): NASA API client
- [src/database.utilities.ts](src/database.utilities.ts): SQLite operations
- [src/output.utilities.ts](src/output.utilities.ts): iCal and JSON formatters
- [Dockerfile](Dockerfile): Container build configuration
