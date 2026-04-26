---
name: Caelundas Runtime Performance Optimization
description: Speed up caelundas ephemeris pipeline to generate year-scale datasets efficiently via Swiss Ephemeris local computation, Node.js optimization, Python rewrite, and C/C++ rewrite paths
created: 2026-04-13T12:00:00Z
updated: 2026-04-14T17:00:00Z
status: 'In Progress'
---

# Introduction

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

Caelundas currently processes one day at a time via sequential NASA JPL Horizons API calls and minute-by-minute event detection loops. For a single day, cold-start time is 1–2 minutes (dominated by ~120 sequential HTTP requests to JPL) and warm-start is 10–30 seconds (CPU-bound event detection). For a 365-day dataset, this translates to 8–12 minutes cold or 6–10 minutes warm — too slow for iterative development and dataset generation.

This plan explores four optimization paths:

- **Phase 0** — Replace NASA JPL Horizons HTTP API calls with local Swiss Ephemeris computation via the `sweph` Node.js native addon, eliminating network latency entirely
- **Path A** — Optimize the current Node.js/TypeScript implementation (replace `moment.js` hot paths, batch event detection, add `worker_threads` parallelism, optimize hot loops)
- **Path C** — Rewrite in Python using C-backed astronomy libraries (`Astropy`/`Skyfield` with NumPy vectorization, ERFA C backend)
- **Path D** — Rewrite in C/C++ using ERFA directly for maximum computational throughput

## 1. Requirements & Constraints

- **REQ-001**: Generate a complete 365-day ephemeris + event dataset in under 60 seconds on a modern developer machine (Apple Silicon / x86-64)
- **REQ-002**: Maintain event detection correctness — all events currently detected by the JPL-based pipeline must also be detected by the optimized pipeline (verified by diffing output `.ics` files)
- **REQ-003**: Output format must remain RFC 5545 iCalendar (`.ics`) with identical VEVENT structure
- **REQ-004**: Persistent storage is not required for ephemeris or event data — in-memory computation and accumulation is acceptable given local sweph computation speed

- **SEC-001**: No credentials or API keys stored in source code (current JPL API is unauthenticated; no change needed)

- **CON-001**: Local CLI is the primary deployment target; Kubernetes Job support is secondary
- **CON-002**: Monorepo conventions must be followed — strict TypeScript, Biome/ESLint formatting, Vitest testing, Nx task orchestration
- **CON-003**: caelundas has zero monorepo dependencies (standalone); changes must not affect other projects
- **CON-004**: Current Docker image uses `node:22.22.2-alpine` with native build tools (python3, make, g++) — already supports native addon compilation
- **CON-005**: NASA JPL Horizons API has ~3–10 second latency per request and undocumented rate limits; current implementation makes ~120 sequential requests per day-range

- **GUD-001**: Prefer incremental optimization over full rewrites — Path A should be attempted first to establish a performance baseline before committing to Path C or D
- **GUD-002**: Maintain existing test infrastructure — unit/integration/e2e test patterns must be preserved or equivalently implemented in the target language

- **PAT-001**: Current minute-loop architecture: outer day-loop → ephemeris fetch → inner 1,440-iteration minute-loop → 13 event detection functions per minute → event accumulation
- **PAT-002**: Event detection uses 3-point phase detection (t-1, t, t+1 minute) for identifying exact moments of aspect formation, sign ingress, etc.
- **PAT-003**: Compound aspects (triple, quadruple, quintuple, sextuple, stellium) are detected by querying active 2-body aspects from accumulated event data and computing combinations. During the minute loop, all simple aspect events are instantaneous (start === end), so a `Map<string, Event[]>` keyed by ISO timestamp is sufficient for the compound aspect lookup — no time-range query is needed
- **PAT-004**: Duration synthesis runs after all days are processed — pairs beginning/ending events chronologically

## 2. Implementation Steps

### Phase 0: Swiss Ephemeris Integration (sweph)

- GOAL-000: Replace NASA JPL Horizons HTTP API calls with local Swiss Ephemeris computation via the `sweph` Node.js native addon, eliminating network latency as the primary cold-start bottleneck

| Task     | Description                                                                                                                                                                                                                                                                         | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Install `sweph` as a dependency (`pnpm add --filter caelundas sweph`). Download Swiss Ephemeris data files (`sepl_18.se1`, `semo_18.se1`, `seas_18.se1` covering 1800–2400) into `applications/caelundas/data/ephe/`. Add `data/ephe/*.se1` to `.gitignore`. Create an Nx target `download-ephe` that fetches files from the Astrodienst FTP/HTTPS repository. Update Dockerfile to copy ephemeris data files into the container image (native build tools `python3`, `make`, `g++` are already installed in the build stage for `sqlite3` — they will now be needed for `sweph` N-API addon compilation instead) |           |      |
| TASK-002 | Create `src/ephemeris/sweph.adapter.ts` — initialize Swiss Ephemeris with `swe_set_ephe_path()` pointing to the data directory. Map all caelundas `Body` types to Swiss Ephemeris planet constants: sun→`SE_SUN`(0), moon→`SE_MOON`(1), mercury→`SE_MERCURY`(2), venus→`SE_VENUS`(3), mars→`SE_MARS`(4), jupiter→`SE_JUPITER`(5), saturn→`SE_SATURN`(6), uranus→`SE_URANUS`(7), neptune→`SE_NEPTUNE`(8), pluto→`SE_PLUTO`(9), chiron→`SE_CHIRON`(15), ceres→`SE_CERES`(17), pallas→`SE_PALLAS`(18), juno→`SE_JUNO`(19), vesta→`SE_VESTA`(20), lilith→`SE_MEAN_APOG`(12) (Black Moon Lilith), north lunar node→`SE_TRUE_NODE`(11), south lunar node→`SE_TRUE_NODE` + 180°, lunar apogee→`SE_OSCU_APOG`(13), lunar perigee→derived from `SE_OSCU_APOG`. Export `close()` cleanup function calling `swe_close()` |           |      |
| TASK-003 | Implement local ephemeris computation in `src/ephemeris/sweph.service.ts` replacing all 5 Horizons API query types: (a) ecliptic longitude/latitude via `swe_calc_ut()` with `SEFLG_SWIEPH \| SEFLG_SPEED`, (b) azimuth/elevation via `swe_azalt()` with observer geographic coordinates, (c) illumination fraction via `swe_pheno_ut()`, (d) angular diameter via `swe_pheno_ut()` apparent diameter field, (e) distance via `swe_calc_ut()` distance output. This eliminates the current `OrbitEphemeris` type and `getOrbitEphemeris()` / `getNodeCoordinatesEphemeris()` functions entirely — lunar node positions (north/south nodes, perigee/apogee) are currently derived from Moon's Keplerian orbital elements fetched via a separate ELEMENTS-type Horizons query; sweph computes node positions directly via `SE_TRUE_NODE` and `SE_OSCU_APOG`. Return data in the same types (`CoordinateEphemeris`, `AzimuthElevationEphemeris`, etc.) used by downstream event detection. Note: `ephemeris.types.ts` (type definitions for all ephemeris data structures) is preserved and used by sweph.service.ts |           |      |
| TASK-004 | Refactor `src/ephemeris/ephemeris.aggregates.ts` to call `sweph.service.ts` functions instead of HTTP-based `ephemeris.service.ts`. Maintain identical return types so downstream event detection code (`src/events/`) requires zero changes. Remove the sequential HTTP call pattern — all computation is now local and synchronous. Halley's comet is out of scope — remove `symbolByComet` spread from `symbolByBody` in `src/symbols.ts` (this propagates to `types.ts` `Body` type and `constants.ts` `bodies` array via existing derivation). Also remove `commandIdByComet` from `ephemeris.constants.ts` (deleted in TASK-005) |           |      |
| TASK-005 | Remove SQLite dependency entirely — with local sweph computation, ephemeris caching is unnecessary (recomputation costs milliseconds). Replace event storage (`upsertEvent`, `upsertEvents`, `getAllEvents`) with in-memory arrays accumulated during pipeline execution. Replace compound aspect query (`getActiveAspectsAt`) with an in-memory `Map<string, Event[]>` keyed by ISO timestamp — during the minute loop, all simple aspect events are instantaneous (start === end), so a timestamp-keyed lookup is sufficient (no time-range query needed). Modify `main.ts` to use in-memory event accumulation instead of database calls. Delete `database.utilities.ts` and its test file. Delete `fetch.utilities.ts` and its test file (HTTP retry logic with exponential backoff is no longer needed with local sweph computation). Remove `sqlite`/`sqlite3` dependencies from `package.json`. Delete `output/*.db` references. Note: `input.schema.ts` currently validates dates against 1900–2100 (JPL DE431 range); Swiss Ephemeris data files cover 1800–2400 — date validation range can be expanded as a follow-up improvement |           |      |
| TASK-006 | Regression test — compute ephemeris for a reference 7-day window using both sweph and JPL Horizons, compare all 5 ephemeris types (ecliptic coords, azimuth/elevation, illumination, diameter, distance) for all bodies. Acceptable deviation: <1 arcsecond for planets, <10 arcseconds for asteroids, <0.1° for lunar nodes. Store reference data in `testing/fixtures/` |           |      |
| TASK-007 | Benchmark sweph vs. JPL Horizons for 1-day and 30-day ephemeris computation. Measure cold-start wall-clock time (sweph target: <2 seconds for 1 day vs. 1–2 minutes for Horizons HTTP). Add results to `testing/benchmark.ts` alongside Phase 1 CPU benchmarks |           |      |

### Phase 1: Node.js/TypeScript Optimization (Path A)

- GOAL-001: Optimize CPU-bound event detection and reduce hot-path overhead to achieve significant speedup for warm-cache runs on the current Node.js stack

| Task     | Description                                                                                                                                                                                                                                                                         | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Replace `moment.js` with native `Date` or `Temporal` API in hot-path code (`src/main.ts` day-loop iteration, all event detection modules). `moment.clone()`, `moment.add()`, `moment.isBefore()` are called ~20,000 times/day — native Date arithmetic is 5–10x faster. Keep `moment-timezone` only for timezone-aware output formatting |  |  |
| TASK-009 | Batch minute-loop event detection: instead of 13 separate function calls per minute (each doing independent lookups), restructure to a single pass that loads all body positions for minute `t` once and runs all detectors against that shared snapshot. Create `src/events/event-detector.ts` that accepts a `MinuteSnapshot` of all body positions and returns all detected events |  |  |
| TASK-010 | Implement `worker_threads` parallelism for day processing. Partition the 365-day range into N chunks (where N = `os.availableParallelism()`), spawn worker threads that each process ephemeris + events for their chunk independently, then merge results. Create `src/worker.ts` (worker entry point) and `src/parallel.ts` (worker pool orchestrator) |  |  |
| TASK-011 | Pre-compute and cache body pair combinations for aspect detection. Currently `getCombinations()` is called per minute for compound aspects — pre-compute all C(n,k) combinations at startup and reuse. Store in `src/events/aspects/aspects.combinations.ts` |  |  |
| TASK-012 | If SQLite was not already removed in Phase 0, replace per-minute SQLite queries in compound aspect detection (`getActiveAspectsAt()`) with an in-memory data structure. Use a `Map<string, ActiveAspect[]>` keyed by ISO timestamp, populated during the minute-loop traversal. (Phase 0 TASK-005 may already address this) |  |  |
| TASK-013 | Optimize `src/math.utilities.ts` — convert `normalizeDegrees()`, `getAngle()`, `normalizeForComparison()` from using modulo/conditionals to bitwise or lookup-table approaches where possible. These functions are called ~500 times/min × 1,440 min = ~720,000 times/day |  |  |
| TASK-014 | Add performance benchmarks: create `applications/caelundas/testing/benchmark.ts` that times the full pipeline for 1-day, 30-day, and 365-day ranges with warm cache. Output wall-clock time, CPU time, memory high-water mark, and events detected. Run before and after each optimization to measure impact |  |  |
| TASK-015 | Update unit tests for all modified modules. Add integration test verifying that optimized event detection produces identical results to the current implementation for a known 7-day window |  |  |

### Phase 2: Python Rewrite with C-Backed Libraries (Path C)

- GOAL-002: Create a Python implementation of the caelundas pipeline using `Astropy` or `Skyfield` with NumPy vectorization, targeting comparable or better performance than optimized Node.js while gaining access to the broader Python astronomy ecosystem

| Task     | Description                                                                                                                                                                                                                                                                  | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-016 | Scaffold `applications/caelundas-py/` project directory following monorepo Python conventions (see `documentation/conventions/python.md`). No existing Nx generator handles Python apps, so scaffold manually matching the `applications/affirmations/` pattern: create `src/caelundas/__init__.py`, `testing/__init__.py`, `output/.gitkeep`, `AGENTS.md`, `README.md`, `.gitignore` (`.venv/`, `__pycache__/`, `output/`, `.ruff_cache/`, `.coverage`) |           |      |
| TASK-017 | Create `applications/caelundas-py/pyproject.toml` following the monorepo Python project pattern: `[project]` with name/version/description/requires-python, `[build-system]` using hatchling, `[tool.hatch.build.targets.wheel]` with `packages = ["src"]`, `[tool.ruff]` extending root config (`extend = "../../pyproject.toml"`), `[tool.pyright]` with `venvPath = "."`, `venv = ".venv"`, `[tool.ty.environment]` with `python-version = "3.11"`, `[tool.bandit]` excluding `testing/output`, `[tool.pytest.ini_options]` with `testpaths = ["testing"]`. Dependencies: `astropy>=7.0`, `skyfield>=1.49`, `numpy>=2.0`, `sqlite-utils>=3.37`, `pydantic>=2.0`. Dev dependencies: `pyright`, `ruff`, `ty`, `bandit[toml]`, `pytest`, `pytest-cov`, `vulture` |           |      |
| TASK-018 | Create `applications/caelundas-py/project.json` matching the Python `project.json` pattern from `applications/affirmations/`: set `tags: ["language:python", "scope:caelundas-py", "type:application"]`, override composite targets (`format` → `ruff-format`, `lint` → `ruff-lint`, `typecheck` → `pyright` + `ty` parallel, `test` → `py-test` with unit/integration/coverage configurations), declare all sub-targets as `{}` (`ruff-format`, `ruff-lint`, `pyright`, `py-test`, `ty`, `bandit`, `vulture`), add `develop` target running `uv run python -m caelundas`, add `code-analysis` composite target, add `markdown-lint`, `spell-check`, `yaml-lint` targets |           |      |
| TASK-019 | Create `applications/caelundas-py/package.json` (minimal: `{"name": "caelundas-py", "version": "0.0.0", "private": true}`) — required for Nx project detection in pnpm workspace. Run `uv sync` from the project directory to generate `uv.lock` and create the `.venv/` virtual environment. Verify scaffolding: `pnpm nx run caelundas-py:code-analysis` |           |      |
| TASK-020 | Implement ephemeris computation module `src/caelundas/ephemeris.py` using Astropy's `solar_system_ephemeris` with DE430 data file. Compute ecliptic longitude, azimuth/elevation, illumination fraction, angular diameter, and distance for all ~24 bodies. Use NumPy vectorized operations to compute all 1,440 minutes at once per body (instead of minute-by-minute loop) |           |      |
| TASK-021 | Implement event detection module `src/caelundas/events.py`. Port all 13 event detection algorithms from TypeScript to Python. Use NumPy array operations for 3-point phase detection across the full 1,440-element time array — find sign changes / zero crossings in vectorized form instead of per-minute iteration |           |      |
| TASK-022 | Implement compound aspect detection `src/caelundas/compound_aspects.py`. Use `itertools.combinations` for pattern enumeration. Build active-aspect index as a NumPy structured array for fast slicing by timestamp                                                            |           |      |
| TASK-023 | Implement duration synthesis `src/caelundas/duration.py` — port `pairDurationEvents()` algorithm. Use Pandas or NumPy for chronological event pairing                                                                                                                        |           |      |
| TASK-024 | Implement iCalendar output `src/caelundas/calendar.py` — port RFC 5545 VCALENDAR/VEVENT generation. Use `icalendar` Python package or string templating                                                                                                                      |           |      |
| TASK-025 | Implement multiprocessing parallelism using `multiprocessing.Pool` or `concurrent.futures.ProcessPoolExecutor` to parallelize across day ranges (Python's GIL is released during NumPy/ERFA C computations)                                                                   |           |      |
| TASK-026 | Create `applications/caelundas-py/AGENTS.md` documenting project architecture, key commands, project structure, and conventions. Model after `applications/affirmations/AGENTS.md`. Wire up to root `AGENTS.md` projects list                                                  |           |      |
| TASK-027 | Create accuracy comparison test: run both Node.js and Python pipelines for the same 30-day range, diff the output `.ics` files, and verify event-for-event parity                                                                                                             |           |      |
| TASK-028 | Benchmark Python pipeline for 1-day, 30-day, and 365-day ranges. Compare wall-clock time, memory usage, and event count against the optimized Node.js implementation from Phase 1                                                                                             |           |      |

### Phase 3: C/C++ Rewrite with ERFA (Path D)

- GOAL-003: Create a C implementation of the caelundas computation core using ERFA for maximum throughput, suitable for processing decade-scale or century-scale date ranges

| Task     | Description                                                                                                                                                                                                                                                     | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-029 | Scaffold `applications/caelundas-c/` project directory. No existing Nx generator handles C projects, so scaffold manually: create `src/`, `include/`, `testing/`, `lib/` (for vendored ERFA), `output/.gitkeep`, `AGENTS.md`, `README.md`, `.gitignore` (build artifacts, `*.o`, `*.a`, `build/`) |
| TASK-030 | Create `applications/caelundas-c/CMakeLists.txt` — set `cmake_minimum_required(VERSION 3.20)`, `project(caelundas-c C)`, enable C99, add ERFA as subdirectory, set include/link paths, add executable target, configure CTest for test discovery, add install target |
| TASK-031 | Create `applications/caelundas-c/project.json` for Nx integration: set `tags: ["language:c", "scope:caelundas-c", "type:application"]`, add targets: `build` (`cmake --build build/`), `test` (`ctest --test-dir build/`), `develop` (run compiled binary), `clean` (`rm -rf build/`). Use `executor: "nx:run-commands"` with `cwd: "{projectRoot}"` for all. Add `configure` target for `cmake -B build -S .` as a dependency of `build` |
| TASK-032 | Create `applications/caelundas-c/package.json` (minimal: `{"name": "caelundas-c", "version": "0.0.0", "private": true}`) — required for Nx project detection. Verify scaffolding: `pnpm nx run caelundas-c:build` |
| TASK-033 | Vendor ERFA C library (`liberfa/erfa` v2.0.1, BSD-3-Clause) into `applications/caelundas-c/lib/erfa/`. Add as CMake subdirectory. Configure CMake to build ERFA as a static library |
| TASK-034 | Implement ephemeris computation in `src/ephemeris.c` using ERFA coordinate transformation functions (`eraAtciq`, `eraAticq`, `eraApio13`, etc.) for planetary positions. Compute all 5 ephemeris types for ~24 bodies             |
| TASK-035 | Implement angle calculations in `src/math_utils.c` — port `normalizeDegrees()`, `getAngle()`, `normalizeForComparison()`, `isMaximum()`, `isMinimum()`, `getCombinations()` to C. Use `double` precision throughout                                              |
| TASK-036 | Implement event detection in `src/events.c` — port all 13 event detection algorithms to C. Use pre-allocated arrays for ephemeris data (1,440 × N_BODIES × 5 doubles per day). Process entire day arrays without per-minute function call overhead                |
| TASK-037 | Implement compound aspect detection in `src/compound_aspects.c`. Pre-allocate combination buffers. Use bitfield representation for active aspects (efficient intersection testing for triple/quadruple patterns)                                                  |
| TASK-038 | Implement SQLite storage in `src/database.c` using `sqlite3.h` directly. Prepare all SQL statements once at startup. Use `sqlite3_exec()` with transaction batching (BEGIN/COMMIT around each day's events)                                                      |
| TASK-039 | Implement iCalendar output in `src/calendar.c` — RFC 5545 string generation using `snprintf()` into a pre-allocated buffer. Write directly to file descriptor                                                                                                    |
| TASK-040 | Implement OpenMP parallelism (`#pragma omp parallel for`) over day ranges. Each thread gets independent SQLite connection (SQLite supports concurrent reads, serialized writes). Alternatively use pthreads with work-stealing queue                               |
| TASK-041 | Create `applications/caelundas-c/AGENTS.md` documenting project architecture, build instructions, key commands, and directory structure. Wire up to root `AGENTS.md` projects list |
| TASK-042 | Create accuracy comparison test: run C pipeline for the same 30-day reference range, diff output `.ics` against Node.js reference, verify event parity                                                                                                           |
| TASK-043 | Benchmark C pipeline for 1-day, 30-day, 365-day, and 3,650-day (10-year) ranges. Compare against Node.js and Python implementations. Measure wall-clock time, memory usage, binary size                                                                          |

### Phase 4: Evaluation and Final Integration

- GOAL-004: Compare all implementations, select the best path forward, and integrate the chosen implementation into the monorepo deployment pipeline

| Task     | Description                                                                                                                                                                                                                     | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-044 | Create comparison report at `applications/caelundas/testing/performance-comparison.md` with a matrix of: implementation × dataset size × wall-clock time × memory × accuracy × lines of code × maintenance burden               |           |      |
| TASK-045 | Based on comparison results, select primary implementation and archive alternatives. Update `applications/caelundas/AGENTS.md` with chosen architecture and performance characteristics                                          |           |      |
| TASK-046 | Update Dockerfile for chosen implementation (Node.js: no change needed; Python: switch to `python:3.12-slim`; C: add CMake build stage)                                                                                         |           |      |
| TASK-047 | Update Helm chart and Kubernetes Job configuration if container image or entrypoint changed                                                                                                                                      |           |      |
| TASK-048 | Update CI/CD pipeline — ensure `nx affected` correctly triggers build/test for the chosen implementation                                                                                                                         |           |      |

## 3. Alternatives

- **ALT-001**: Keep JPL Horizons API but parallelize requests with `Promise.all()` (limited concurrency to avoid rate limits). Superseded by Phase 0 (sweph integration) which eliminates HTTP calls entirely. May still be useful as a validation/comparison tool.
- **ALT-002**: Use Skyfield (Python) instead of Astropy. Skyfield has simpler API and 0.5 mas accuracy but lacks Astropy's vectorized batch operations and `ErfaAstromInterpolator` (100x AltAz speedup). Skyfield is the better choice if only ecliptic coordinates are needed; Astropy is better for the full 5-type ephemeris suite.
- **ALT-003**: Use SpiceyPy (Python CSPICE wrapper) with Cyice Cython extension for mission-grade accuracy. Rejected because SPICE kernel management adds operational complexity disproportionate to caelundas' astrological calendar use case.
- **ALT-004**: Reduce sampling interval from 1-minute to 5-minute or 10-minute intervals. This would provide a linear 5–10x speedup for the minute-loop but may miss short-duration events (e.g., fast-moving Moon aspects lasting <10 minutes). Could be offered as a configurable `SAMPLE_INTERVAL_MINUTES` environment variable with 1 as default.
- **ALT-005**: Pre-compute and distribute ephemeris databases for common date ranges (e.g., 2020–2030) so cold-start time is eliminated entirely. Rejected because it locks in specific bodies/configurations and doesn't help with custom date ranges, but could be useful for distribution.

## 4. Dependencies

- **DEP-001**: ERFA C library v2.0.1 — BSD-3-Clause licensed fork of IAU SOFA. [GitHub: liberfa/erfa](https://github.com/liberfa/erfa). Required only for Path D.
- **DEP-002**: Astropy v7.0+ — Python astronomy library with NumPy vectorization and PyERFA backend. Required only for Path C.
- **DEP-003**: JPL DE430 ephemeris data file (115 MB) — required by Astropy/Skyfield for sub-arcsecond accuracy. Auto-downloaded and cached on first use. Required for Path C.
- **DEP-004**: Node.js `worker_threads` — built-in module, no additional dependency. Required for Path A parallelism.
- **DEP-005**: CMake 3.20+ — build system for Path D. Already available in most CI environments.
- **DEP-006**: `sweph` v2.10.3+ — Node.js Swiss Ephemeris bindings via N-API native addon. [npm: sweph](https://www.npmjs.com/package/sweph), [GitHub: timotejroiko/sweph](https://github.com/timotejroiko/sweph). AGPL-3.0 (or LGPL-3.0 with professional license). Requires native build tools (python3, make, g++) — already present in caelundas Docker image (`node:22.22.2-alpine`). Required for Phase 0.
- **DEP-007**: Swiss Ephemeris data files — `sepl_18.se1` (planets, ~1.5 MB), `semo_18.se1` (moon, ~1.5 MB), `seas_18.se1` (main asteroids, ~0.5 MB). 600-year coverage (1800–2400). Downloaded from Astrodienst. Required for Phase 0.

## 5. Files

### Phase 0 (Swiss Ephemeris Integration)

- **FILE-001**: `applications/caelundas/src/ephemeris/sweph.adapter.ts` — Body-to-SwissEphemeris constant mapping, initialization, and cleanup
- **FILE-002**: `applications/caelundas/src/ephemeris/sweph.service.ts` — Local ephemeris computation (ecliptic coords, azimuth/elevation, illumination, diameter, distance)
- **FILE-003**: `applications/caelundas/data/ephe/` — Swiss Ephemeris data files directory (`.gitignore`'d)
- **FILE-004**: `applications/caelundas/src/ephemeris/ephemeris.aggregates.ts` — Modified to use sweph.service instead of HTTP-based ephemeris.service
- **FILE-005**: `applications/caelundas/src/ephemeris/ephemeris.service.ts` — Deleted (all ephemeris computation handled by sweph.service.ts)
- **FILE-006**: `applications/caelundas/src/ephemeris/ephemeris.constants.ts` — Deleted (Horizons URL and command ID constants no longer needed)
- **FILE-007**: `applications/caelundas/src/database.utilities.ts` — Deleted (SQLite dependency removed; events accumulated in memory)
- **FILE-008**: `applications/caelundas/src/fetch.utilities.ts` — Deleted (HTTP retry logic no longer needed with local sweph computation)
- **FILE-009**: `applications/caelundas/src/main.ts` — Modified to replace database calls (`upsertEvents`, `getAllEvents`, `getActiveAspectsAt`) with in-memory event accumulation
- **FILE-010**: `applications/caelundas/src/symbols.ts` — Modified to remove `symbolByComet` (Halley) from `symbolByBody`
- **FILE-011**: `applications/caelundas/src/ephemeris/ephemeris.types.ts` — Preserved (type definitions used by sweph.service.ts and downstream event detection)
- **FILE-012**: `applications/caelundas/Dockerfile` — Modified to copy ephemeris data files and ensure native build tools
- **FILE-013**: `applications/caelundas/testing/fixtures/` — Reference ephemeris data for regression testing

### Phase 1 (Node.js Optimization)

- **FILE-014**: `applications/caelundas/src/events/event-detector.ts` — New batched event detection orchestrator
- **FILE-015**: `applications/caelundas/src/worker.ts` — Worker thread entry point
- **FILE-016**: `applications/caelundas/src/parallel.ts` — Worker pool orchestrator
- **FILE-017**: `applications/caelundas/src/events/aspects/aspects.combinations.ts` — Pre-computed combination cache
- **FILE-018**: `applications/caelundas/src/math.utilities.ts` — Optimized math functions (modified)
- **FILE-019**: `applications/caelundas/src/main.ts` — Modified to support parallel execution
- **FILE-020**: `applications/caelundas/testing/benchmark.ts` — Performance benchmark harness
- **FILE-021**: All event detection modules under `src/events/` — Modified to accept `MinuteSnapshot` instead of individual lookups; `moment` replaced with native `Date`

### Phase 2 (Python Rewrite)

- **FILE-022**: `applications/caelundas-py/pyproject.toml` — Python project configuration (extends root `pyproject.toml`)
- **FILE-023**: `applications/caelundas-py/project.json` — Nx project configuration with Python composite targets
- **FILE-024**: `applications/caelundas-py/package.json` — Minimal package.json for Nx detection
- **FILE-025**: `applications/caelundas-py/AGENTS.md` — Project documentation for Copilot agents
- **FILE-026**: `applications/caelundas-py/src/caelundas/__init__.py` — Package marker
- **FILE-027**: `applications/caelundas-py/src/caelundas/ephemeris.py` — Vectorized ephemeris computation
- **FILE-028**: `applications/caelundas-py/src/caelundas/events.py` — NumPy-based event detection
- **FILE-029**: `applications/caelundas-py/src/caelundas/compound_aspects.py` — Compound aspect detection
- **FILE-030**: `applications/caelundas-py/src/caelundas/duration.py` — Duration synthesis
- **FILE-031**: `applications/caelundas-py/src/caelundas/calendar.py` — iCalendar output
- **FILE-032**: `applications/caelundas-py/src/caelundas/main.py` — Pipeline entry point with multiprocessing

### Phase 3 (C/C++ Rewrite)

- **FILE-033**: `applications/caelundas-c/CMakeLists.txt` — CMake build configuration
- **FILE-034**: `applications/caelundas-c/project.json` — Nx project configuration with CMake targets
- **FILE-035**: `applications/caelundas-c/package.json` — Minimal package.json for Nx detection
- **FILE-036**: `applications/caelundas-c/AGENTS.md` — Project documentation for Copilot agents
- **FILE-037**: `applications/caelundas-c/lib/erfa/` — Vendored ERFA library
- **FILE-038**: `applications/caelundas-c/src/ephemeris.c` — ERFA-based ephemeris computation
- **FILE-039**: `applications/caelundas-c/src/math_utils.c` — Optimized angle math
- **FILE-040**: `applications/caelundas-c/src/events.c` — Array-based event detection
- **FILE-041**: `applications/caelundas-c/src/compound_aspects.c` — Bitfield-based compound pattern detection
- **FILE-042**: `applications/caelundas-c/src/database.c` — Direct SQLite3 integration
- **FILE-043**: `applications/caelundas-c/src/calendar.c` — snprintf-based iCal generation
- **FILE-044**: `applications/caelundas-c/src/main.c` — Pipeline entry point with OpenMP parallelism

## 6. Testing
- **TEST-001**: Regression test (Phase 0) — compute ecliptic longitude, azimuth/elevation, illumination, angular diameter, and distance for all 20 bodies (excluding Halley) using both sweph and JPL Horizons for a 7-day reference window. Pass criteria: <1 arcsecond deviation for planets, <10 arcseconds for asteroids, <0.1° for lunar nodes
- **TEST-002**: Benchmark (Phase 0) — sweph 1-day cold-start must complete in <2 seconds (vs. 1–2 minutes for Horizons HTTP). 30-day range must complete ephemeris computation in <30 seconds
- **TEST-003**: Unit test for sweph.adapter.ts — verify all 20 bodies map to valid Swiss Ephemeris constants and return non-error results for a sample Julian date
- **TEST-004**: Integration test for sweph.service.ts — verify all 5 ephemeris types return valid data for all bodies across a 3-day range
- **TEST-005**: End-to-end test (Phase 0) — run the full caelundas pipeline (ephemeris + event detection + calendar) for a 7-day range using sweph and verify output `.ics` matches the JPL Horizons-based output event-for-event (excluding Halley events)
- **TEST-006**: Docker build test — verify the Docker image builds successfully with native `sweph` addon compilation and includes ephemeris data files
- **TEST-007**: Cleanup test — verify `swe_close()` is called on process exit, no file descriptor leaks from ephemeris data files- **TEST-008**: Unit tests for `event-detector.ts` — verify batched detection produces identical results to per-minute detection for a 1-day sample
- **TEST-009**: Regression test (Phase 1) — generate `.ics` output for a known 7-day reference window using the optimized pipeline. Diff VEVENT records against the current implementation. Pass criteria: identical event set (type, body, timestamp within ±1 minute)
- **TEST-010**: Integration test for `worker_threads` parallelism — verify that parallel execution produces identical output to sequential for a 30-day range (order-independent comparison)
- **TEST-011**: Performance benchmark (Phase 1) — 365-day pipeline must show measurable speedup over the current warm-cache implementation on Apple Silicon (M1 or later)
- **TEST-012**: Cross-implementation parity (Phase 2/3) — Python and C pipelines must produce identical `.ics` output to the Node.js reference for the same 30-day window
- **TEST-013**: Performance benchmark (Phase 2) — Python 365-day pipeline timing to compare against Node.js
- **TEST-014**: Performance benchmark (Phase 3) — C 365-day and 3,650-day pipeline timing. Target: 365 days in <10 seconds, 3,650 days in <120 seconds
- **TEST-015**: Memory usage profiling — all implementations must complete a 365-day run within 512 MB RSS (Kubernetes Job memory limit consideration)

## 7. Risks & Assumptions

- **RISK-001**: Replacing `moment.js` with native `Date` across all event detection modules is a large surface-area change with high regression risk. **Mitigation**: Comprehensive unit test coverage and the 7-day regression test (TEST-009) will catch any date-handling bugs.
- **RISK-002**: `worker_threads` parallelism requires thread-safe event accumulation. **Mitigation**: Each worker computes events in memory and returns results to the main thread for sequential merging into the shared in-memory event store.
- **RISK-003**: Python and C rewrites represent significant engineering effort (weeks to months) with uncertain ROI if Node.js optimization achieves sufficient speedup alone. **Mitigation**: Gate Phase 2 and Phase 3 on Phase 1 results — only proceed if Node.js optimization is insufficient.
- **RISK-004**: Data file downloads (DE430 at 115 MB) may fail or be slow in CI/containerized environments. **Mitigation**: Cache data files in Docker layer or pre-download during image build.

- **ASSUMPTION-001**: The primary performance bottleneck for cold starts is NASA JPL API network latency (~120 sequential HTTP requests × 3–10s each). Phase 0 (sweph integration) eliminates this bottleneck by replacing HTTP calls with local Swiss Ephemeris computation. After Phase 0, the remaining bottleneck is CPU-bound event detection (addressed by Phase 1).
- **ASSUMPTION-002**: For warm starts (cached ephemeris), the CPU bottleneck is the 1,440 × 13 event detection loops with `moment.js` date manipulation overhead.
- **ASSUMPTION-003**: Node.js `worker_threads` can achieve near-linear scaling up to physical core count for CPU-bound event detection work, since each day-range chunk is independent.
- **ASSUMPTION-004**: Removing SQLite and using in-memory data structures for event accumulation will not increase memory usage beyond acceptable limits — a full 365-day run should remain within 512 MB RSS.

- **RISK-005**: `sweph` native addon build may fail on some CI environments or Docker base images lacking `python3`, `make`, or `g++`. **Mitigation**: caelundas already uses `node:22.22.2-alpine` which includes native build tools. Pin `sweph` version in `package.json` to avoid unexpected build breakage.
- **RISK-006**: Swiss Ephemeris AGPL-3.0 license may conflict with monorepo licensing. **Mitigation**: LGPL-3.0 license available via professional license from Astrodienst. Alternatively, sweph is used as a dependency (not embedded), which may not trigger copyleft. Review with legal if needed before merging.

## 8. Related Specifications / Further Reading

- [ERFA C library](https://github.com/liberfa/erfa) — BSD-licensed IAU SOFA fork for fundamental astronomy routines
- [Astropy solar system ephemerides](https://docs.astropy.org/en/stable/coordinates/solarsystem.html) — Python vectorized ephemeris computation
- [Skyfield documentation](https://rhodesmill.org/skyfield/) — Python astronomy library by Brandon Rhodes
- [JPL Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) — current NASA API used by caelundas
- [Node.js worker_threads](https://nodejs.org/api/worker_threads.html) — built-in parallelism for CPU-bound work
- [Node-API (N-API)](https://nodejs.org/api/n-api.html) — ABI-stable C addon interface for Node.js
- [Caelundas AGENTS.md](applications/caelundas/AGENTS.md) — current architecture and deployment documentation
- [Ephemeris Pipeline Skill](documentation/skills/ephemeris-pipeline/) — domain knowledge for caelundas development
- [sweph npm package](https://www.npmjs.com/package/sweph) — Node.js Swiss Ephemeris bindings via N-API
- [sweph GitHub](https://github.com/timotejroiko/sweph) — source code, API docs, and examples
- [Swiss Ephemeris documentation](https://www.astro.com/swisseph/swephprg.htm) — programming reference for Swiss Ephemeris C library
- [Swiss Ephemeris data files](https://www.astro.com/ftp/swisseph/ephe/) — download source for `.se1` ephemeris data files
