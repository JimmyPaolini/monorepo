# Caelundas

NestJS command-line application scaffold generated with `conformance:nestjs-command-application`.

Astronomical calendar generator built as a NestJS command-line application.

Caelundas uses the `sweph` Swiss Ephemeris bindings plus focused event-detection
modules to calculate aspects, phases, eclipses, ingresses, retrogrades, and
other calendar events from local ephemeris data.

## Start

```bash
nx run caelundas:start
```

## Test

```bash
nx run caelundas:test
```

## Quick Start

```bash
cp .env.default .env
pnpm nx run caelundas:download-ephemeris
pnpm nx run caelundas:start
```

## Useful Commands

```bash
pnpm nx run caelundas:start
pnpm nx run caelundas:repl
pnpm nx run caelundas:test --configuration=unit
pnpm nx run caelundas:test --configuration=integration
pnpm nx run caelundas:test --configuration=end-to-end
pnpm nx run caelundas:lint
pnpm nx run caelundas:typecheck
pnpm nx run caelundas:analyze-code --configuration=check
```

## Project Structure

```text
applications/caelundas/
├── scripts/download-ephemeris.ts
├── src/main.ts
├── src/modules/
│   ├── caelundas/          # Root command module
│   ├── ephemeris/          # Swiss Ephemeris access and types
│   ├── perfective/         # Instantaneous event detection
│   ├── progressive/        # Duration-based event synthesis
│   ├── calendar/           # Calendar output formatting
│   ├── input/              # Environment parsing and validation
│   └── <event-modules>/    # Aspects, phases, retrogrades, eclipses, etc.
├── testing/
└── AGENTS.md
```

## Notes

- Local ephemeris files are downloaded into `applications/caelundas/data/` by
  `download-ephemeris`.
- The current Nx project exposes `start`, `repl`, `download-ephemeris`,
  `test`, `lint`, and `typecheck` targets. It does not currently define
  `develop`, Docker, or Helm Nx targets.

For architecture and workflow details, see [AGENTS.md](AGENTS.md).
