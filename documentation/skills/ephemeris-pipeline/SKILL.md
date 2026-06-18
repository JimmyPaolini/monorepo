---
name: ephemeris-pipeline
description: Understand the caelundas ephemeris calculation pipeline - Swiss Ephemeris integration, astronomical event detection, and calendar generation. Use this skill when working on caelundas.
license: MIT
---

# Ephemeris Pipeline

Use this skill when working on `applications/caelundas`.

## Current Repository State

Caelundas is a NestJS command-line application that calculates astronomical
calendar events from local Swiss Ephemeris data using focused domain modules.

### Core Stages

1. Parse runtime configuration from environment variables.
2. Load or prepare local ephemeris data.
3. Calculate point-in-time events through domain services.
4. Synthesize duration-based events.
5. Write calendar output.

## Important Modules

- `src/modules/input/` — environment parsing and validation
- `src/modules/ephemeris/` — Swiss Ephemeris integration
- `src/modules/perfective/` — exact event detection
- `src/modules/progressive/` — duration synthesis
- `src/modules/calendar/` — output formatting
- `src/modules/*-aspects`, `phases`, `retrogrades`, `eclipses`, `ingresses`,
  `daily-cycles`, `twilights`, `monthly-lunar-cycle`, `annual-solar-cycle` —
  event families

## Useful Commands

```bash
cp applications/caelundas/.env.default applications/caelundas/.env
pnpm nx run caelundas:download-ephemeris
pnpm nx run caelundas:start
pnpm nx run caelundas:repl
pnpm nx run caelundas:test
pnpm nx run caelundas:test --configuration=integration
```

## Working Notes

- The checked-in project uses local ephemeris files rather than the old NASA
  Horizons workflow.
- Prefer reading the service modules directly when documenting a specific event
  family because each event type has its own constants, types, and tests.
- Do not document Docker, Helm, or Kubernetes Nx targets for Caelundas unless
  they are added back to `applications/caelundas/project.json`.

## Related Documentation

- [applications/caelundas/AGENTS.md](../../../applications/caelundas/AGENTS.md)
- [applications/caelundas/README.md](../../../applications/caelundas/README.md)
