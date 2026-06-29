
> nx run monorepo:fallow-duplicates:markdown  [existing outputs match the cache, left as is]

> fallow dupes --config configuration/fallow.config.jsonc --format=markdown

note: hid 120 clone groups below minOccurrences=3 (lower --min-occurrences to see them)
note: module wiring excluded from clone detection (--no-ignore-imports to include it)
## Fallow: 79 clone groups found (7.8% duplication)

### Duplicates

**Clone group 1** (40 lines, 11 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts:8-14`
- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:19-25`
- `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts:14-25`
- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:20-42`
- `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts:10-16`
- `applications/caelundas/src/modules/major-aspects/major-aspect-progressive.service.unit.test.ts:13-19`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:20-26`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:22-28`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts:19-58`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts:16-22`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:21-27`

**Clone group 2** (114 lines, 43 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts:14-19`
- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:25-37`
- `applications/caelundas/src/modules/aspects/aspect-calculation-support.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/aspects/aspect-ephemeris.service.unit.test.ts:8-19`
- `applications/caelundas/src/modules/aspects/aspect-event-formatting.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/aspects/aspect-graph.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/aspects/aspect-phase-emoji.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/aspects/aspects-utilities.service.unit.test.ts:7-12`
- `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts:56-169`
- `applications/caelundas/src/modules/aspects/compound-phase.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/aspects/progressive-compound-event.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/daily-cycles/daily-cycles-builder.service.unit.test.ts:11-21`
- `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts:7-12`
- `applications/caelundas/src/modules/eclipses/eclipse-geometry.service.unit.test.ts:12-25`
- `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts:22-27`
- `applications/caelundas/src/modules/ingresses/ingresses-composer.service.unit.test.ts:10-19`
- `applications/caelundas/src/modules/input/input.service.unit.test.ts:12-23`
- `applications/caelundas/src/modules/logger/logger.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/math/math.service.unit.test.ts:6-11`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects-event.service.unit.test.ts:12-32`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects-progressive.service.unit.test.ts:13-25`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:28-45`
- `applications/caelundas/src/modules/progressive/progressive-aspect.service.unit.test.ts:8-13`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects-base.service.unit.test.ts:13-22`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects-composer.service.unit.test.ts:14-34`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects-composer.service.unit.test.ts:10-19`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-event.service.unit.test.ts:12-29`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-progressive.service.unit.test.ts:13-25`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:27-43`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts:15-25`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts:16-29`
- `applications/caelundas/src/modules/twilights/twilights-builder.service.unit.test.ts:12-20`
- `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts:13-23`
- `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts:18-32`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:23-28`
- `applications/lexico-ingestion/src/modules/forms/forms-builder-guards.service.unit.test.ts:6-11`
- `applications/lexico-ingestion/src/modules/forms/forms-transient-words.service.unit.test.ts:8-13`
- `applications/lexico-ingestion/src/modules/numerals/numerals.service.unit.test.ts:6-11`
- `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-classical.service.unit.test.ts:6-11`
- `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-phonemes.service.unit.test.ts:6-11`
- `packages/lexico-entities/src/modules/database/database.service.unit.test.ts:6-11`
- `packages/lexico-entities/src/modules/entities/entities.service.unit.test.ts:1104-1109`

**Clone group 3** (56 lines, 53 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts:199-214`
- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:84-110`
- `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts:422-452`
- `applications/caelundas/src/modules/calendar/calendar.service.unit.test.ts:144-159`
- `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts:256-277`
- `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts:47-60`
- `applications/caelundas/src/modules/eclipses/eclipse-calculation.service.unit.test.ts:54-61`
- `applications/caelundas/src/modules/eclipses/eclipse-event.service.unit.test.ts:37-44`
- `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts:68-75`
- `applications/caelundas/src/modules/ephemeris/ephemeris-aggregation.service.unit.test.ts:95-102`
- `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts:24-34`
- `applications/caelundas/src/modules/ephemeris/ephemeris-coordinate.service.unit.test.ts:89-100`
- `applications/caelundas/src/modules/ephemeris/ephemeris-horizon.service.unit.test.ts:74-93`
- `applications/caelundas/src/modules/ephemeris/ephemeris-phenomena.service.unit.test.ts:84-101`
- `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts:43-60`
- `applications/caelundas/src/modules/ephemeris/ephemeris.service.unit.test.ts:334-345`
- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:59-66`
- `applications/caelundas/src/modules/input/input.service.unit.test.ts:25-32`
- `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts:155-174`
- `applications/caelundas/src/modules/major-aspects/major-aspect-progressive.service.unit.test.ts:47-70`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:282-327`
- `applications/caelundas/src/modules/math/math.service.unit.test.ts:17-28`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:642-673`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts:128-154`
- `applications/caelundas/src/modules/perfective/perfective.service.unit.test.ts:108-115`
- `applications/caelundas/src/modules/phases/martian-phase.service.unit.test.ts:104-111`
- `applications/caelundas/src/modules/phases/mercurian-phase.service.unit.test.ts:108-115`
- `applications/caelundas/src/modules/phases/phases.service.unit.test.ts:136-143`
- `applications/caelundas/src/modules/phases/venusian-phase.service.unit.test.ts:108-115`
- `applications/caelundas/src/modules/progressive/progressive.service.unit.test.ts:125-164`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:713-767`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:188-221`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts:125-172`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:34-41`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:707-762`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:31-38`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts:33-40`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-detector.service.unit.test.ts:63-70`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts:31-38`
- `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts:31-38`
- `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts:42-49`
- `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts:34-41`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:31-38`
- `applications/lexico-ingestion/src/modules/forms/forms.service.unit.test.ts:67-74`
- `applications/lexico-ingestion/src/modules/literature/literature-library-scan.service.unit.test.ts:46-53`
- `applications/lexico-ingestion/src/modules/logger/logger.service.unit.test.ts:91-110`
- `applications/lexico-ingestion/src/modules/manual/manual.service.unit.test.ts:137-157`
- `applications/lexico-ingestion/src/modules/numerals/numerals.service.unit.test.ts:14-21`
- `applications/lexico-ingestion/src/modules/part-of-speech/part-of-speech.service.unit.test.ts:102-109`
- `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-classical.service.unit.test.ts:14-21`
- `applications/lexico-ingestion/src/modules/pronunciation/pronunciation.service.unit.test.ts:101-108`
- `applications/lexico-ingestion/src/modules/translations/translations.service.unit.test.ts:35-42`
- `applications/lexico-ingestion/src/modules/words/words.service.unit.test.ts:56-63`

**Clone group 4** (13 lines, 20 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts:206-214`
- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:102-110`
- `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts:444-452`
- `applications/caelundas/src/modules/calendar/calendar.service.unit.test.ts:151-159`
- `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts:269-277`
- `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts:52-60`
- `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts:26-34`
- `applications/caelundas/src/modules/ephemeris/ephemeris-coordinate.service.unit.test.ts:92-100`
- `applications/caelundas/src/modules/ephemeris/ephemeris-horizon.service.unit.test.ts:85-93`
- `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts:52-60`
- `applications/caelundas/src/modules/ephemeris/ephemeris.service.unit.test.ts:337-345`
- `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts:166-174`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:315-327`
- `applications/caelundas/src/modules/math/math.service.unit.test.ts:20-28`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:665-673`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts:146-154`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:759-767`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:213-221`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts:164-172`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:754-762`

**Clone group 5** (12 lines, 36 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts:207-214`
- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:103-110`
- `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts:445-452`
- `applications/caelundas/src/modules/calendar/calendar.service.unit.test.ts:152-159`
- `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts:270-277`
- `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts:53-60`
- `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts:27-34`
- `applications/caelundas/src/modules/ephemeris/ephemeris-coordinate.service.unit.test.ts:93-100`
- `applications/caelundas/src/modules/ephemeris/ephemeris-horizon.service.unit.test.ts:86-93`
- `applications/caelundas/src/modules/ephemeris/ephemeris-phenomena.service.unit.test.ts:94-101`
- `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts:53-60`
- `applications/caelundas/src/modules/ephemeris/ephemeris.service.unit.test.ts:338-345`
- `applications/caelundas/src/modules/input/input.service.unit.test.ts:25-32`
- `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts:167-174`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:316-327`
- `applications/caelundas/src/modules/math/math.service.unit.test.ts:21-28`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:666-673`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts:147-154`
- `applications/caelundas/src/modules/progressive/progressive.service.unit.test.ts:157-164`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:760-767`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:214-221`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts:165-172`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:34-41`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:755-762`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts:31-38`
- `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts:34-41`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:31-38`
- `applications/lexico-ingestion/src/modules/forms/forms.service.unit.test.ts:67-74`
- `applications/lexico-ingestion/src/modules/logger/logger.service.unit.test.ts:103-110`
- `applications/lexico-ingestion/src/modules/manual/manual.service.unit.test.ts:150-157`
- `applications/lexico-ingestion/src/modules/numerals/numerals.service.unit.test.ts:14-21`
- `applications/lexico-ingestion/src/modules/part-of-speech/part-of-speech.service.unit.test.ts:102-109`
- `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-classical.service.unit.test.ts:14-21`
- `applications/lexico-ingestion/src/modules/pronunciation/pronunciation.service.unit.test.ts:101-108`
- `applications/lexico-ingestion/src/modules/translations/translations.service.unit.test.ts:35-42`
- `applications/lexico-ingestion/src/modules/words/words.service.unit.test.ts:56-63`

**Clone group 6** (16 lines, 4 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:97-110`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts:141-154`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:206-221`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts:159-172`

**Clone group 7** (13 lines, 3 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:193-203`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:260-272`
- `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts:67-77`

**Clone group 8** (13 lines, 10 instances)

- `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts:193-202`
- `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts:116-125`
- `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts:161-171`
- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:158-167`
- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:239-248`
- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:320-329`
- `applications/caelundas/src/modules/phases/phases.service.integration.test.ts:210-222`
- `applications/caelundas/src/modules/phases/phases.service.integration.test.ts:314-326`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:260-271`
- `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts:67-76`

**Clone group 9** (25 lines, 3 instances)

- `applications/caelundas/src/modules/calendar/calendar.service.ts:187-198`
- `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts:36-60`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts:69-93`

**Clone group 10** (13 lines, 20 instances)

- `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts:122-132`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:81-90`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:164-173`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:203-212`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:249-261`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:282-291`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:84-93`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:124-133`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:163-172`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:213-222`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:262-274`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:295-304`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:330-338`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:88-97`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:128-137`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:170-179`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:212-221`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:261-272`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:293-302`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:328-336`

**Clone group 11** (13 lines, 12 instances)

- `applications/caelundas/src/modules/eclipses/eclipse-calculation.service.unit.test.ts:50-61`
- `applications/caelundas/src/modules/eclipses/eclipse-event.service.unit.test.ts:32-44`
- `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts:64-75`
- `applications/caelundas/src/modules/ephemeris/ephemeris-aggregation.service.unit.test.ts:90-102`
- `applications/caelundas/src/modules/perfective/perfective.service.unit.test.ts:104-115`
- `applications/caelundas/src/modules/phases/martian-phase.service.unit.test.ts:100-111`
- `applications/caelundas/src/modules/phases/mercurian-phase.service.unit.test.ts:104-115`
- `applications/caelundas/src/modules/phases/phases.service.unit.test.ts:132-143`
- `applications/caelundas/src/modules/phases/venusian-phase.service.unit.test.ts:104-115`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts:29-40`
- `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts:27-38`
- `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts:37-49`

**Clone group 12** (22 lines, 13 instances)

- `applications/caelundas/src/modules/eclipses/eclipse-calculation.service.unit.test.ts:50-61`
- `applications/caelundas/src/modules/eclipses/eclipse-event.service.unit.test.ts:31-44`
- `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts:64-75`
- `applications/caelundas/src/modules/ephemeris/ephemeris-aggregation.service.unit.test.ts:81-102`
- `applications/caelundas/src/modules/perfective/perfective.service.unit.test.ts:104-115`
- `applications/caelundas/src/modules/phases/martian-phase.service.unit.test.ts:100-111`
- `applications/caelundas/src/modules/phases/mercurian-phase.service.unit.test.ts:104-115`
- `applications/caelundas/src/modules/phases/phases.service.unit.test.ts:132-143`
- `applications/caelundas/src/modules/phases/venusian-phase.service.unit.test.ts:104-115`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts:29-40`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-detector.service.unit.test.ts:59-70`
- `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts:27-38`
- `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts:31-49`

**Clone group 13** (33 lines, 6 instances)

- `applications/caelundas/src/modules/eclipses/eclipse-geometry.service.unit.test.ts:51-65`
- `applications/caelundas/src/modules/eclipses/eclipse-topocentric.service.unit.test.ts:76-93`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects-progressive.service.unit.test.ts:39-61`
- `applications/caelundas/src/modules/phases/phase-calculation.service.unit.test.ts:25-49`
- `applications/caelundas/src/modules/progressive/progressive-utilities.service.unit.test.ts:24-44`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service.unit.test.ts:18-50`

**Clone group 14** (12 lines, 4 instances)

- `applications/caelundas/src/modules/eclipses/eclipse-geometry.service.unit.test.ts:54-65`
- `applications/caelundas/src/modules/phases/phase-calculation.service.unit.test.ts:39-49`
- `applications/caelundas/src/modules/progressive/progressive-utilities.service.unit.test.ts:34-44`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service.unit.test.ts:40-50`

**Clone group 15** (24 lines, 4 instances)

- `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts:42-61`
- `applications/caelundas/src/modules/phases/phases.service.unit.test.ts:106-129`
- `applications/caelundas/src/modules/progressive/progressive.service.unit.test.ts:55-72`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:54-69`

**Clone group 16** (28 lines, 3 instances)

- `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts:213-227`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:489-516`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:561-584`

**Clone group 17** (27 lines, 7 instances)

- `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts:213-224`
- `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts:268-280`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:489-515`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:600-626`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:561-583`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:656-679`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:746-770`

**Clone group 18** (17 lines, 3 instances)

- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:331-347`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:509-513`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:658-662`

**Clone group 19** (16 lines, 4 instances)

- `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts:331-346`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:509-512`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:626-633`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:658-661`

**Clone group 20** (31 lines, 3 instances)

- `applications/caelundas/src/modules/logger/logger.service.ts:44-74`
- `applications/lexico-ingestion/src/modules/logger/logger.service.ts:74-104`
- `tools/synchronization/src/modules/logger/logger.service.ts:30-60`

**Clone group 21** (64 lines, 4 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.integration.test.ts:52-94`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.integration.test.ts:51-93`
- `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.integration.test.ts:31-63`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.integration.test.ts:35-98`

**Clone group 22** (19 lines, 6 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:81-98`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:164-181`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:203-219`
- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:282-298`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:124-141`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:170-188`

**Clone group 23** (25 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:93-116`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:95-119`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:99-123`

**Clone group 24** (20 lines, 5 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:98-116`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:100-119`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:104-123`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:146-165`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:188-207`

**Clone group 25** (13 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:161-173`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:160-172`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:167-179`

**Clone group 26** (12 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:172-182`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:183-192`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:178-189`

**Clone group 27** (19 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:200-215`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:210-228`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:209-227`

**Clone group 28** (38 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:224-261`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:237-274`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:236-272`

**Clone group 29** (33 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:262-294`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:275-307`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:273-305`

**Clone group 30** (27 lines, 4 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:265-280`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:278-293`
- `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts:139-165`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:276-291`

**Clone group 31** (16 lines, 3 instances)

- `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts:298-313`
- `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts:311-325`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:309-323`

**Clone group 32** (12 lines, 3 instances)

- `applications/caelundas/src/modules/phases/phase-calculation.service.unit.test.ts:38-49`
- `applications/caelundas/src/modules/progressive/progressive-utilities.service.unit.test.ts:33-44`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service.unit.test.ts:39-50`

**Clone group 33** (12 lines, 3 instances)

- `applications/caelundas/src/modules/phases/phases.service.integration.test.ts:418-429`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts:262-271`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts:337-346`

**Clone group 34** (30 lines, 9 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts:144-170`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts:293-320`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:292-317`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts:135-162`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:243-269`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:321-350`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:418-443`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:135-161`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:341-365`

**Clone group 35** (30 lines, 19 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts:144-170`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts:293-320`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:292-317`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:598-620`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:640-662`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:685-709`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts:135-162`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:243-269`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:467-483`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:596-619`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:640-663`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts:177-206`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:321-350`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:496-518`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:722-742`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:418-443`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:135-161`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:341-365`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts:90-115`

**Clone group 36** (13 lines, 3 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts:370-380`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:139-151`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:410-422`

**Clone group 37** (12 lines, 3 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:213-224`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:161-172`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts:39-50`

**Clone group 38** (19 lines, 16 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:229-240`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts:227-243`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:49-67`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:177-188`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts:303-314`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:67-79`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:125-136`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:154-165`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:176-187`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:228-239`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:53-65`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:109-120`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:133-144`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:157-168`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:172-183`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:391-404`

**Clone group 39** (13 lines, 3 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:257-269`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts:259-270`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:203-215`

**Clone group 40** (12 lines, 5 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:388-397`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:469-480`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:346-357`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:583-592`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:650-661`

**Clone group 41** (13 lines, 3 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:469-481`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:346-358`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:650-661`

**Clone group 42** (12 lines, 3 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:529-540`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:409-420`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:696-707`

**Clone group 43** (25 lines, 3 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:640-662`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:685-709`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:640-663`

**Clone group 44** (26 lines, 4 instances)

- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:640-662`
- `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts:685-709`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:640-663`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts:90-115`

**Clone group 45** (14 lines, 3 instances)

- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts:231-243`
- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:54-67`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts:392-404`

**Clone group 46** (12 lines, 3 instances)

- `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts:22-32`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:22-30`
- `applications/caelundas/src/modules/triple-aspects/triple-aspects-detector.service.unit.test.ts:46-57`

**Clone group 47** (31 lines, 3 instances)

- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts:177-207`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:496-519`
- `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts:722-744`

**Clone group 48** (16 lines, 8 instances)

- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts:300-314`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:122-136`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:151-165`
- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:173-187`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:50-65`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:106-120`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:130-144`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:153-168`

**Clone group 49** (28 lines, 3 instances)

- `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts:600-627`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:656-680`
- `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts:746-771`

**Clone group 50** (16 lines, 5 instances)

- `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts:22-27`
- `applications/lexico-ingestion/src/modules/lexemes/lexemes.service.unit.test.ts:132-147`
- `applications/lexico-ingestion/src/modules/literature/literature.service.unit.test.ts:119-130`
- `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts:38-49`
- `applications/lexico-ingestion/src/modules/translations/translations.service.unit.test.ts:23-34`

**Clone group 51** (69 lines, 14 instances)

- `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts:94-142`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:58-103`
- `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts:98-166`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:56-91`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:71-111`
- `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts:93-126`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:76-98`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:52-86`
- `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts:55-75`
- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:63-81`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:57-74`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:60-77`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:63-80`
- `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts:60-78`

**Clone group 52** (47 lines, 4 instances)

- `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts:96-142`
- `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts:135-166`
- `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts:103-126`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:79-98`

**Clone group 53** (47 lines, 13 instances)

- `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts:96-142`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:87-103`
- `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts:132-166`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:75-91`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:76-111`
- `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts:100-126`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:79-98`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:70-86`
- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:66-81`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:59-74`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:62-77`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:65-80`
- `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts:61-78`

**Clone group 54** (44 lines, 5 instances)

- `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts:99-142`
- `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts:139-166`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:96-111`
- `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts:107-126`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:79-98`

**Clone group 55** (40 lines, 15 instances)

- `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts:103-142`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:92-103`
- `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts:143-166`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:80-91`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:100-111`
- `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts:111-126`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:83-98`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:75-86`
- `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts:64-75`
- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:70-81`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:63-74`
- `tools/synchronization/src/modules/conventional-config/conventional-config-validators.service.unit.test.ts:65-80`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:66-77`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:69-80`
- `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts:65-78`

**Clone group 56** (40 lines, 13 instances)

- `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts:108-147`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:97-108`
- `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts:148-171`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:85-96`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:105-116`
- `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts:116-131`
- `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts:88-103`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:80-91`
- `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts:69-80`
- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:75-86`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:68-79`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:71-82`
- `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts:70-83`

**Clone group 57** (20 lines, 3 instances)

- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:25-37`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:25-37`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:14-33`

**Clone group 58** (13 lines, 5 instances)

- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:37-49`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:37-49`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:33-45`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:33-45`
- `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts:29-41`

**Clone group 59** (15 lines, 10 instances)

- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:136-144`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:162-176`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:194-202`
- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:222-230`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:124-132`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:146-154`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:168-176`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:94-99`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:237-242`
- `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts:271-275`

**Clone group 60** (13 lines, 3 instances)

- `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts:162-174`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:124-130`
- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:146-152`

**Clone group 61** (12 lines, 3 instances)

- `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts:65-76`
- `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts:57-68`
- `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts:60-71`

**Clone group 62** (20 lines, 11 instances)

- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:39-46`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:51-58`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:63-71`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:76-84`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:91-98`
- `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts:110-118`
- `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts:119-134`
- `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts:146-161`
- `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts:171-184`
- `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts:192-205`
- `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts:212-231`

**Clone group 63** (17 lines, 3 instances)

- `tools/conformance/src/generators/nestjs-command-application/generator.unit.test.ts:27-43`
- `tools/conformance/src/generators/nestjs-graphql-application/generator.unit.test.ts:23-35`
- `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts:38-49`

**Clone group 64** (13 lines, 8 instances)

- `tools/conformance/src/generators/nestjs-command-application/generator.unit.test.ts:31-43`
- `tools/conformance/src/generators/nestjs-command-application/generator.unit.test.ts:49-56`
- `tools/conformance/src/generators/nestjs-command-application/generator.unit.test.ts:62-69`
- `tools/conformance/src/generators/nestjs-command-module/generator.unit.test.ts:41-47`
- `tools/conformance/src/generators/nestjs-dataloader-module/generator.unit.test.ts:35-41`
- `tools/conformance/src/generators/nestjs-graphql-application/generator.unit.test.ts:27-35`
- `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts:43-49`
- `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts:41-47`

**Clone group 65** (13 lines, 3 instances)

- `tools/conformance/src/generators/nestjs-command-module/generator.unit.test.ts:35-47`
- `tools/conformance/src/generators/nestjs-dataloader-module/generator.unit.test.ts:29-41`
- `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts:35-47`

**Clone group 66** (14 lines, 3 instances)

- `tools/conformance/src/generators/nestjs-command-module/generator.unit.test.ts:50-63`
- `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts:52-65`
- `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts:50-63`

**Clone group 67** (14 lines, 3 instances)

- `tools/conformance/src/generators/nestjs-dataloader-module/generator.unit.test.ts:13-26`
- `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts:19-32`
- `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts:19-32`

**Clone group 68** (12 lines, 3 instances)

- `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts:143-154`
- `tools/conformance/src/generators/nestjs-service-file/generator.unit.test.ts:87-98`
- `tools/conformance/src/validators/typescript/json/validator.unit.test.ts:198-209`

**Clone group 69** (15 lines, 6 instances)

- `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts:143-152`
- `tools/conformance/src/generators/nestjs-service-file/generator.unit.test.ts:87-96`
- `tools/conformance/src/validators/typescript/json/validator.unit.test.ts:198-207`
- `tools/conformance/src/validators/typescript/json/validator.unit.test.ts:530-544`
- `tools/conformance/src/validators/typescript/text/validator.unit.test.ts:139-148`
- `tools/conformance/src/validators/typescript/validator.unit.test.ts:717-725`

**Clone group 70** (15 lines, 5 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.ts:179-192`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.ts:147-161`
- `tools/synchronization/src/modules/conventional-config/conventional-config.command.ts:26-37`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.ts:194-207`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.ts:165-178`

**Clone group 71** (16 lines, 4 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:25-40`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:16-31`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:16-31`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:20-35`

**Clone group 72** (17 lines, 4 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:65-81`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:58-74`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:61-77`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:64-80`

**Clone group 73** (18 lines, 5 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:66-81`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:59-74`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:62-77`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:65-80`
- `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts:61-78`

**Clone group 74** (19 lines, 6 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:66-82`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:59-75`
- `tools/synchronization/src/modules/conventional-config/conventional-config.command.unit.test.ts:41-49`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:62-78`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:65-81`
- `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts:61-79`

**Clone group 75** (13 lines, 3 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:161-167`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:169-180`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:159-171`

**Clone group 76** (12 lines, 3 instances)

- `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts:253-264`
- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:260-271`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:236-247`

**Clone group 77** (20 lines, 3 instances)

- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:12-31`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:12-31`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:16-35`

**Clone group 78** (18 lines, 4 instances)

- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:12-29`
- `tools/synchronization/src/modules/conventional-config/conventional-config-io.service.unit.test.ts:15-32`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:12-29`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:16-33`

**Clone group 79** (22 lines, 3 instances)

- `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts:53-74`
- `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts:56-77`
- `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts:59-80`

### Clone Families

**Family 1** (1 group, 114 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts`, `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspect-calculation-support.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspect-ephemeris.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspect-event-formatting.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspect-graph.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspect-phase-emoji.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspects-utilities.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/compound-phase.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/progressive-compound-event.service.unit.test.ts`, `applications/caelundas/src/modules/daily-cycles/daily-cycles-builder.service.unit.test.ts`, `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipse-geometry.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts`, `applications/caelundas/src/modules/ingresses/ingresses-composer.service.unit.test.ts`, `applications/caelundas/src/modules/input/input.service.unit.test.ts`, `applications/caelundas/src/modules/logger/logger.service.unit.test.ts`, `applications/caelundas/src/modules/math/math.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects-event.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects-progressive.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive-aspect.service.unit.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects-base.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects-composer.service.unit.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects-composer.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-event.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-progressive.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-builder.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/forms/forms-builder-guards.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/forms/forms-transient-words.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/numerals/numerals.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-classical.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-phonemes.service.unit.test.ts`, `packages/lexico-entities/src/modules/database/database.service.unit.test.ts`, `packages/lexico-entities/src/modules/entities/entities.service.unit.test.ts`)

- Extract 1 shared clone group (114 lines) from annual-solar-cycle-events.service.unit.test.ts, annual-solar-cycle.service.unit.test.ts, aspect-calculation-support.service.unit.test.ts, aspect-ephemeris.service.unit.test.ts, aspect-event-formatting.service.unit.test.ts, aspect-graph.service.unit.test.ts, aspect-phase-emoji.service.unit.test.ts, aspects-utilities.service.unit.test.ts, aspects.service.unit.test.ts, compound-phase.service.unit.test.ts, progressive-compound-event.service.unit.test.ts, daily-cycles-builder.service.unit.test.ts, datetime.service.unit.test.ts, eclipse-geometry.service.unit.test.ts, ephemeris-constants.service.unit.test.ts, ephemeris-time.service.unit.test.ts, ingresses-composer.service.unit.test.ts, input.service.unit.test.ts, logger.service.unit.test.ts, math.service.unit.test.ts, minor-aspects-event.service.unit.test.ts, minor-aspects-progressive.service.unit.test.ts, minor-aspects.service.unit.test.ts, progressive-aspect.service.unit.test.ts, quadruple-aspects-base.service.unit.test.ts, quintuple-aspects-composer.service.unit.test.ts, sextuple-aspects-composer.service.unit.test.ts, specialty-aspects-event.service.unit.test.ts, specialty-aspects-progressive.service.unit.test.ts, specialty-aspects.service.unit.test.ts, triple-aspects-composer.service.unit.test.ts, triple-aspects.service.unit.test.ts, twilights-builder.service.unit.test.ts, twilights-composer.service.unit.test.ts, twilights.service.unit.test.ts, etymology.service.unit.test.ts, forms-builder-guards.service.unit.test.ts, forms-transient-words.service.unit.test.ts, numerals.service.unit.test.ts, pronunciation-classical.service.unit.test.ts, pronunciation-phonemes.service.unit.test.ts, database.service.unit.test.ts, entities.service.unit.test.ts into a shared directory (~4788 lines saved)

**Family 2** (1 group, 56 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts`, `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts`, `applications/caelundas/src/modules/calendar/calendar.service.unit.test.ts`, `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts`, `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipse-calculation.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipse-event.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-aggregation.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-coordinate.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-horizon.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-phenomena.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris.service.unit.test.ts`, `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts`, `applications/caelundas/src/modules/input/input.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspect-progressive.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/math/math.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/perfective/perfective.service.unit.test.ts`, `applications/caelundas/src/modules/phases/martian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/phases/mercurian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phases.service.unit.test.ts`, `applications/caelundas/src/modules/phases/venusian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive.service.unit.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-detector.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/forms/forms.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature-library-scan.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/logger/logger.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/manual/manual.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/numerals/numerals.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/part-of-speech/part-of-speech.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-classical.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/pronunciation/pronunciation.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/translations/translations.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/words/words.service.unit.test.ts`)

- Extract 1 shared clone group (56 lines) from annual-solar-cycle-events.service.unit.test.ts, annual-solar-cycle.service.unit.test.ts, aspects.service.unit.test.ts, calendar.service.unit.test.ts, daily-cycles.service.unit.test.ts, datetime.service.unit.test.ts, eclipse-calculation.service.unit.test.ts, eclipse-event.service.unit.test.ts, eclipses.service.unit.test.ts, ephemeris-aggregation.service.unit.test.ts, ephemeris-constants.service.unit.test.ts, ephemeris-coordinate.service.unit.test.ts, ephemeris-horizon.service.unit.test.ts, ephemeris-phenomena.service.unit.test.ts, ephemeris-time.service.unit.test.ts, ephemeris.service.unit.test.ts, ingresses.service.unit.test.ts, input.service.unit.test.ts, major-aspect-event.service.unit.test.ts, major-aspect-progressive.service.unit.test.ts, major-aspects.service.unit.test.ts, math.service.unit.test.ts, minor-aspects.service.unit.test.ts, monthly-lunar-cycle.service.unit.test.ts, perfective.service.unit.test.ts, martian-phase.service.unit.test.ts, mercurian-phase.service.unit.test.ts, phases.service.unit.test.ts, venusian-phase.service.unit.test.ts, progressive.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, retrogrades.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, stellium.service.unit.test.ts, triple-aspects-composer.service.unit.test.ts, triple-aspects-detector.service.unit.test.ts, triple-aspects.service.unit.test.ts, twilights-composer.service.unit.test.ts, twilights-detector.service.unit.test.ts, twilights.service.unit.test.ts, etymology.service.unit.test.ts, forms.service.unit.test.ts, literature-library-scan.service.unit.test.ts, logger.service.unit.test.ts, manual.service.unit.test.ts, numerals.service.unit.test.ts, part-of-speech.service.unit.test.ts, pronunciation-classical.service.unit.test.ts, pronunciation.service.unit.test.ts, translations.service.unit.test.ts, words.service.unit.test.ts into a shared directory (~2912 lines saved)

**Family 3** (1 group, 12 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts`, `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts`, `applications/caelundas/src/modules/calendar/calendar.service.unit.test.ts`, `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts`, `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-coordinate.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-horizon.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-phenomena.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris.service.unit.test.ts`, `applications/caelundas/src/modules/input/input.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/math/math.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive.service.unit.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/forms/forms.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/logger/logger.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/manual/manual.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/numerals/numerals.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/part-of-speech/part-of-speech.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/pronunciation/pronunciation-classical.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/pronunciation/pronunciation.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/translations/translations.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/words/words.service.unit.test.ts`)

- Extract shared function (12 lines) from annual-solar-cycle-events.service.unit.test.ts, annual-solar-cycle.service.unit.test.ts, aspects.service.unit.test.ts, calendar.service.unit.test.ts, daily-cycles.service.unit.test.ts, datetime.service.unit.test.ts, ephemeris-constants.service.unit.test.ts, ephemeris-coordinate.service.unit.test.ts, ephemeris-horizon.service.unit.test.ts, ephemeris-phenomena.service.unit.test.ts, ephemeris-time.service.unit.test.ts, ephemeris.service.unit.test.ts, input.service.unit.test.ts, major-aspect-event.service.unit.test.ts, major-aspects.service.unit.test.ts, math.service.unit.test.ts, minor-aspects.service.unit.test.ts, monthly-lunar-cycle.service.unit.test.ts, progressive.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, retrogrades.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, triple-aspects.service.unit.test.ts, twilights.service.unit.test.ts, etymology.service.unit.test.ts, forms.service.unit.test.ts, logger.service.unit.test.ts, manual.service.unit.test.ts, numerals.service.unit.test.ts, part-of-speech.service.unit.test.ts, pronunciation-classical.service.unit.test.ts, pronunciation.service.unit.test.ts, translations.service.unit.test.ts, words.service.unit.test.ts (~420 lines saved)

**Family 4** (1 group, 13 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts`, `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/aspects/aspects.service.unit.test.ts`, `applications/caelundas/src/modules/calendar/calendar.service.unit.test.ts`, `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts`, `applications/caelundas/src/modules/datetime/datetime.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-constants.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-coordinate.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-horizon.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-time.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/math/math.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract shared function (13 lines) from annual-solar-cycle-events.service.unit.test.ts, annual-solar-cycle.service.unit.test.ts, aspects.service.unit.test.ts, calendar.service.unit.test.ts, daily-cycles.service.unit.test.ts, datetime.service.unit.test.ts, ephemeris-constants.service.unit.test.ts, ephemeris-coordinate.service.unit.test.ts, ephemeris-horizon.service.unit.test.ts, ephemeris-time.service.unit.test.ts, ephemeris.service.unit.test.ts, major-aspect-event.service.unit.test.ts, major-aspects.service.unit.test.ts, math.service.unit.test.ts, minor-aspects.service.unit.test.ts, monthly-lunar-cycle.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, retrogrades.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~247 lines saved)

**Family 5** (1 group, 40 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle-events.service.unit.test.ts`, `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts`, `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspect-event.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspect-progressive.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract shared function (40 lines) from annual-solar-cycle-events.service.unit.test.ts, annual-solar-cycle.service.unit.test.ts, daily-cycles.service.unit.test.ts, ingresses.service.unit.test.ts, major-aspect-event.service.unit.test.ts, major-aspect-progressive.service.unit.test.ts, major-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, monthly-lunar-cycle.service.unit.test.ts, retrogrades.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~400 lines saved)

**Family 6** (1 group, 13 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts`, `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phases.service.integration.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts`)

- Extract shared function (13 lines) from annual-solar-cycle.service.unit.test.ts, ingresses.service.integration.test.ts, ingresses.service.integration.test.ts, ingresses.service.unit.test.ts, ingresses.service.unit.test.ts, ingresses.service.unit.test.ts, phases.service.integration.test.ts, phases.service.integration.test.ts, quadruple-aspects.service.unit.test.ts, twilights.service.unit.test.ts (~117 lines saved)

**Family 7** (1 group, 16 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts`)

- Extract shared function (16 lines) from annual-solar-cycle.service.unit.test.ts, monthly-lunar-cycle.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, retrogrades.service.unit.test.ts (~48 lines saved)

**Family 8** (1 group, 13 lines across `applications/caelundas/src/modules/annual-solar-cycle/annual-solar-cycle.service.unit.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights.service.unit.test.ts`)

- Extract shared function (13 lines) from annual-solar-cycle.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, twilights.service.unit.test.ts (~26 lines saved)

**Family 9** (1 group, 25 lines across `applications/caelundas/src/modules/calendar/calendar.service.ts`, `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.unit.test.ts`)

- Extract shared function (25 lines) from calendar.service.ts, daily-cycles.service.unit.test.ts, monthly-lunar-cycle.service.unit.test.ts (~50 lines saved)

**Family 10** (1 group, 13 lines across `applications/caelundas/src/modules/daily-cycles/daily-cycles.service.unit.test.ts`, `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract shared function (13 lines) from daily-cycles.service.unit.test.ts, major-aspects.service.unit.test.ts, major-aspects.service.unit.test.ts, major-aspects.service.unit.test.ts, major-aspects.service.unit.test.ts, major-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~247 lines saved)

**Family 11** (1 group, 22 lines across `applications/caelundas/src/modules/eclipses/eclipse-calculation.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipse-event.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-aggregation.service.unit.test.ts`, `applications/caelundas/src/modules/perfective/perfective.service.unit.test.ts`, `applications/caelundas/src/modules/phases/martian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/phases/mercurian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phases.service.unit.test.ts`, `applications/caelundas/src/modules/phases/venusian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-detector.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts`)

- Extract shared function (22 lines) from eclipse-calculation.service.unit.test.ts, eclipse-event.service.unit.test.ts, eclipses.service.unit.test.ts, ephemeris-aggregation.service.unit.test.ts, perfective.service.unit.test.ts, martian-phase.service.unit.test.ts, mercurian-phase.service.unit.test.ts, phases.service.unit.test.ts, venusian-phase.service.unit.test.ts, triple-aspects-composer.service.unit.test.ts, triple-aspects-detector.service.unit.test.ts, twilights-composer.service.unit.test.ts, twilights-detector.service.unit.test.ts (~264 lines saved)

**Family 12** (1 group, 13 lines across `applications/caelundas/src/modules/eclipses/eclipse-calculation.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipse-event.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts`, `applications/caelundas/src/modules/ephemeris/ephemeris-aggregation.service.unit.test.ts`, `applications/caelundas/src/modules/perfective/perfective.service.unit.test.ts`, `applications/caelundas/src/modules/phases/martian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/phases/mercurian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phases.service.unit.test.ts`, `applications/caelundas/src/modules/phases/venusian-phase.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-composer.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-composer.service.unit.test.ts`, `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts`)

- Extract shared function (13 lines) from eclipse-calculation.service.unit.test.ts, eclipse-event.service.unit.test.ts, eclipses.service.unit.test.ts, ephemeris-aggregation.service.unit.test.ts, perfective.service.unit.test.ts, martian-phase.service.unit.test.ts, mercurian-phase.service.unit.test.ts, phases.service.unit.test.ts, venusian-phase.service.unit.test.ts, triple-aspects-composer.service.unit.test.ts, twilights-composer.service.unit.test.ts, twilights-detector.service.unit.test.ts (~143 lines saved)

**Family 13** (1 group, 33 lines across `applications/caelundas/src/modules/eclipses/eclipse-geometry.service.unit.test.ts`, `applications/caelundas/src/modules/eclipses/eclipse-topocentric.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects-progressive.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phase-calculation.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive-utilities.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service.unit.test.ts`)

- Extract shared function (33 lines) from eclipse-geometry.service.unit.test.ts, eclipse-topocentric.service.unit.test.ts, minor-aspects-progressive.service.unit.test.ts, phase-calculation.service.unit.test.ts, progressive-utilities.service.unit.test.ts, specialty-aspects-composer.service.unit.test.ts (~165 lines saved)

**Family 14** (1 group, 12 lines across `applications/caelundas/src/modules/eclipses/eclipse-geometry.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phase-calculation.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive-utilities.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service.unit.test.ts`)

- Extract shared function (12 lines) from eclipse-geometry.service.unit.test.ts, phase-calculation.service.unit.test.ts, progressive-utilities.service.unit.test.ts, specialty-aspects-composer.service.unit.test.ts (~36 lines saved)

**Family 15** (1 group, 24 lines across `applications/caelundas/src/modules/eclipses/eclipses.service.unit.test.ts`, `applications/caelundas/src/modules/phases/phases.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`)

- Extract shared function (24 lines) from eclipses.service.unit.test.ts, phases.service.unit.test.ts, progressive.service.unit.test.ts, literature.command.unit.test.ts (~72 lines saved)

**Family 16** (2 groups, 55 lines across `applications/caelundas/src/modules/ingresses/ingresses.service.integration.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`)

- Extract 2 shared clone groups (55 lines) from ingresses.service.integration.test.ts, sextuple-aspects.service.unit.test.ts, stellium.service.unit.test.ts into a shared directory (~218 lines saved)

**Family 17** (2 groups, 33 lines across `applications/caelundas/src/modules/ingresses/ingresses.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`)

- Extract shared function (17 lines) from ingresses.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts (~34 lines saved)
- Extract shared function (16 lines) from ingresses.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts (~48 lines saved)

**Family 18** (1 group, 31 lines across `applications/caelundas/src/modules/logger/logger.service.ts`, `applications/lexico-ingestion/src/modules/logger/logger.service.ts`, `tools/synchronization/src/modules/logger/logger.service.ts`)

- Extract shared function (31 lines) from logger.service.ts, logger.service.ts, logger.service.ts (~62 lines saved)

**Family 19** (1 group, 64 lines across `applications/caelundas/src/modules/major-aspects/major-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/monthly-lunar-cycle/monthly-lunar-cycle.service.integration.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.integration.test.ts`)

- Extract 1 shared clone group (64 lines) from major-aspects.service.integration.test.ts, minor-aspects.service.integration.test.ts, monthly-lunar-cycle.service.integration.test.ts, retrogrades.service.integration.test.ts into a shared directory (~192 lines saved)

**Family 20** (1 group, 27 lines across `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/retrogrades/retrogrades.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract shared function (27 lines) from major-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, retrogrades.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~81 lines saved)

**Family 21** (9 groups, 195 lines across `applications/caelundas/src/modules/major-aspects/major-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/minor-aspects/minor-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract 9 shared clone groups (195 lines) from major-aspects.service.unit.test.ts, minor-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts into a shared directory (~487 lines saved)

**Family 22** (1 group, 12 lines across `applications/caelundas/src/modules/phases/phase-calculation.service.unit.test.ts`, `applications/caelundas/src/modules/progressive/progressive-utilities.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects-composer.service.unit.test.ts`)

- Extract shared function (12 lines) from phase-calculation.service.unit.test.ts, progressive-utilities.service.unit.test.ts, specialty-aspects-composer.service.unit.test.ts (~24 lines saved)

**Family 23** (1 group, 12 lines across `applications/caelundas/src/modules/phases/phases.service.integration.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts`)

- Extract shared function (12 lines) from phases.service.integration.test.ts, quintuple-aspects.service.integration.test.ts, sextuple-aspects.service.integration.test.ts (~24 lines saved)

**Family 24** (1 group, 30 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts`)

- Extract shared function (30 lines) from quadruple-aspects.service.integration.test.ts, quadruple-aspects.service.integration.test.ts, quadruple-aspects.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.integration.test.ts, quintuple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, sextuple-aspects.service.integration.test.ts, sextuple-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, stellium.service.unit.test.ts, triple-aspects.service.integration.test.ts, triple-aspects.service.integration.test.ts, triple-aspects.service.unit.test.ts (~540 lines saved)

**Family 25** (1 group, 30 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts`)

- Extract shared function (30 lines) from quadruple-aspects.service.integration.test.ts, quadruple-aspects.service.integration.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.integration.test.ts, quintuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, stellium.service.unit.test.ts, triple-aspects.service.integration.test.ts, triple-aspects.service.integration.test.ts (~240 lines saved)

**Family 26** (1 group, 13 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts`)

- Extract shared function (13 lines) from quadruple-aspects.service.integration.test.ts, quadruple-aspects.service.unit.test.ts, triple-aspects.service.integration.test.ts (~26 lines saved)

**Family 27** (1 group, 13 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`)

- Extract shared function (13 lines) from quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.integration.test.ts, quintuple-aspects.service.unit.test.ts (~26 lines saved)

**Family 28** (1 group, 19 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts`)

- Extract shared function (19 lines) from quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.integration.test.ts, quintuple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, sextuple-aspects.service.integration.test.ts, sextuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts, triple-aspects.service.integration.test.ts (~285 lines saved)

**Family 29** (1 group, 25 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`)

- Extract shared function (25 lines) from quadruple-aspects.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts (~50 lines saved)

**Family 30** (3 groups, 37 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract shared function (12 lines) from quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~24 lines saved)
- Extract shared function (13 lines) from quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~26 lines saved)
- Extract shared function (12 lines) from quadruple-aspects.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~48 lines saved)

**Family 31** (2 groups, 38 lines across `applications/caelundas/src/modules/quadruple-aspects/quadruple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.unit.test.ts`)

- Extract shared function (12 lines) from quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, triple-aspects.service.unit.test.ts (~24 lines saved)
- Extract shared function (26 lines) from quadruple-aspects.service.unit.test.ts, quadruple-aspects.service.unit.test.ts, quintuple-aspects.service.unit.test.ts, triple-aspects.service.unit.test.ts (~78 lines saved)

**Family 32** (1 group, 14 lines across `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects.service.integration.test.ts`)

- Extract shared function (14 lines) from quintuple-aspects.service.integration.test.ts, quintuple-aspects.service.unit.test.ts, triple-aspects.service.integration.test.ts (~28 lines saved)

**Family 33** (1 group, 12 lines across `applications/caelundas/src/modules/quintuple-aspects/quintuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`, `applications/caelundas/src/modules/triple-aspects/triple-aspects-detector.service.unit.test.ts`)

- Extract shared function (12 lines) from quintuple-aspects.service.unit.test.ts, stellium.service.unit.test.ts, triple-aspects-detector.service.unit.test.ts (~24 lines saved)

**Family 34** (1 group, 16 lines across `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`)

- Extract shared function (16 lines) from sextuple-aspects.service.integration.test.ts, sextuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, sextuple-aspects.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts (~112 lines saved)

**Family 35** (1 group, 31 lines across `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.integration.test.ts`, `applications/caelundas/src/modules/specialty-aspects/specialty-aspects.service.unit.test.ts`)

- Extract shared function (31 lines) from sextuple-aspects.service.integration.test.ts, specialty-aspects.service.unit.test.ts, specialty-aspects.service.unit.test.ts (~62 lines saved)

**Family 36** (1 group, 28 lines across `applications/caelundas/src/modules/sextuple-aspects/sextuple-aspects.service.unit.test.ts`, `applications/caelundas/src/modules/stellium/stellium.service.unit.test.ts`)

- Extract shared function (28 lines) from sextuple-aspects.service.unit.test.ts, stellium.service.unit.test.ts, stellium.service.unit.test.ts (~56 lines saved)

**Family 37** (1 group, 16 lines across `applications/caelundas/src/modules/twilights/twilights-detector.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/lexemes/lexemes.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/translations/translations.service.unit.test.ts`)

- Extract shared function (16 lines) from twilights-detector.service.unit.test.ts, lexemes.service.unit.test.ts, literature.service.unit.test.ts, principal-parts.service.unit.test.ts, translations.service.unit.test.ts (~64 lines saved)

**Family 38** (1 group, 40 lines across `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts`, `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/conventional-config/conventional-config-validators.service.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`, `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts`)

- Extract shared function (40 lines) from clear.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, dictionary.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, latin-library.command.unit.test.ts, library.command.unit.test.ts, literature.command.unit.test.ts, perseus.command.unit.test.ts, wiktionary.command.unit.test.ts, agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, conventional-config-validators.service.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts, synchronization.command.unit.test.ts (~560 lines saved)

**Family 39** (1 group, 69 lines across `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts`, `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`, `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts`)

- Extract 1 shared clone group (69 lines) from clear.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, dictionary.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, latin-library.command.unit.test.ts, library.command.unit.test.ts, literature.command.unit.test.ts, perseus.command.unit.test.ts, wiktionary.command.unit.test.ts, agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts, synchronization.command.unit.test.ts into a shared directory (~897 lines saved)

**Family 40** (1 group, 40 lines across `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts`, `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts`)

- Extract shared function (40 lines) from clear.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, dictionary.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, latin-library.command.unit.test.ts, library.command.unit.test.ts, literature.command.unit.test.ts, perseus.command.unit.test.ts, wiktionary.command.unit.test.ts, agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, synchronization.command.unit.test.ts (~480 lines saved)

**Family 41** (1 group, 47 lines across `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`, `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`, `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts`)

- Extract shared function (47 lines) from clear.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, dictionary.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, latin-library.command.unit.test.ts, library.command.unit.test.ts, literature.command.unit.test.ts, perseus.command.unit.test.ts, agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts, synchronization.command.unit.test.ts (~564 lines saved)

**Family 42** (1 group, 44 lines across `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`)

- Extract shared function (44 lines) from clear.command.unit.test.ts, dictionary.command.unit.test.ts, latin-library.command.unit.test.ts, library.command.unit.test.ts, literature.command.unit.test.ts (~176 lines saved)

**Family 43** (1 group, 47 lines across `applications/lexico-ingestion/src/modules/clear/clear.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/dictionary/dictionary.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/library/library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/literature/literature.command.unit.test.ts`)

- Extract shared function (47 lines) from clear.command.unit.test.ts, dictionary.command.unit.test.ts, library.command.unit.test.ts, literature.command.unit.test.ts (~141 lines saved)

**Family 44** (1 group, 13 lines across `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`)

- Extract shared function (13 lines) from corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts (~26 lines saved)

**Family 45** (1 group, 13 lines across `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts`)

- Extract shared function (13 lines) from corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, latin-library.command.unit.test.ts, perseus.command.unit.test.ts, wiktionary.command.unit.test.ts (~52 lines saved)

**Family 46** (1 group, 20 lines across `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`)

- Extract shared function (20 lines) from corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, perseus.command.unit.test.ts (~40 lines saved)

**Family 47** (1 group, 15 lines across `applications/lexico-ingestion/src/modules/corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/wiktionary/wiktionary.command.unit.test.ts`)

- Extract shared function (15 lines) from corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, corpus-scriptorum-ecclesiasticorum-latinorum.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, epigraphik-datenbank-clauss-slaby.command.unit.test.ts, perseus.command.unit.test.ts, perseus.command.unit.test.ts, wiktionary.command.unit.test.ts (~135 lines saved)

**Family 48** (1 group, 12 lines across `applications/lexico-ingestion/src/modules/epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/latin-library/latin-library.command.unit.test.ts`, `applications/lexico-ingestion/src/modules/perseus/perseus.command.unit.test.ts`)

- Extract shared function (12 lines) from epigraphik-datenbank-clauss-slaby.command.unit.test.ts, latin-library.command.unit.test.ts, perseus.command.unit.test.ts (~24 lines saved)

**Family 49** (1 group, 20 lines across `applications/lexico-ingestion/src/modules/etymology/etymology.service.unit.test.ts`, `applications/lexico-ingestion/src/modules/principal-parts/principal-parts.service.unit.test.ts`)

- Extract shared function (20 lines) from etymology.service.unit.test.ts, etymology.service.unit.test.ts, etymology.service.unit.test.ts, etymology.service.unit.test.ts, etymology.service.unit.test.ts, etymology.service.unit.test.ts, principal-parts.service.unit.test.ts, principal-parts.service.unit.test.ts, principal-parts.service.unit.test.ts, principal-parts.service.unit.test.ts, principal-parts.service.unit.test.ts (~200 lines saved)

**Family 50** (1 group, 13 lines across `tools/conformance/src/generators/nestjs-command-application/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-command-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-dataloader-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-graphql-application/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts`)

- Extract shared function (13 lines) from generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts (~91 lines saved)

**Family 51** (1 group, 17 lines across `tools/conformance/src/generators/nestjs-command-application/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-graphql-application/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts`)

- Extract shared function (17 lines) from generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts (~34 lines saved)

**Family 52** (1 group, 13 lines across `tools/conformance/src/generators/nestjs-command-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-dataloader-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts`)

- Extract shared function (13 lines) from generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts (~26 lines saved)

**Family 53** (1 group, 14 lines across `tools/conformance/src/generators/nestjs-command-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts`)

- Extract shared function (14 lines) from generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts (~28 lines saved)

**Family 54** (1 group, 14 lines across `tools/conformance/src/generators/nestjs-dataloader-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-service-module/generator.unit.test.ts`)

- Extract shared function (14 lines) from generator.unit.test.ts, generator.unit.test.ts, generator.unit.test.ts (~28 lines saved)

**Family 55** (1 group, 12 lines across `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-service-file/generator.unit.test.ts`, `tools/conformance/src/validators/typescript/json/validator.unit.test.ts`)

- Extract shared function (12 lines) from generator.unit.test.ts, generator.unit.test.ts, validator.unit.test.ts (~24 lines saved)

**Family 56** (1 group, 15 lines across `tools/conformance/src/generators/nestjs-graphql-module/generator.unit.test.ts`, `tools/conformance/src/generators/nestjs-service-file/generator.unit.test.ts`, `tools/conformance/src/validators/typescript/json/validator.unit.test.ts`, `tools/conformance/src/validators/typescript/text/validator.unit.test.ts`, `tools/conformance/src/validators/typescript/validator.unit.test.ts`)

- Extract shared function (15 lines) from generator.unit.test.ts, generator.unit.test.ts, validator.unit.test.ts, validator.unit.test.ts, validator.unit.test.ts, validator.unit.test.ts (~75 lines saved)

**Family 57** (1 group, 15 lines across `tools/synchronization/src/modules/agent-skills/agent-skills.command.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.ts`, `tools/synchronization/src/modules/conventional-config/conventional-config.command.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.ts`)

- Extract shared function (15 lines) from agent-skills.command.ts, conformance-generators.command.ts, conventional-config.command.ts, devcontainer-configuration.command.ts, pull-request-template.command.ts (~60 lines saved)

**Family 58** (1 group, 19 lines across `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/conventional-config/conventional-config.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`, `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts`)

- Extract shared function (19 lines) from agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, conventional-config.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts, synchronization.command.unit.test.ts (~95 lines saved)

**Family 59** (1 group, 12 lines across `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`)

- Extract shared function (12 lines) from agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts (~24 lines saved)

**Family 60** (2 groups, 33 lines across `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`)

- Extract shared function (16 lines) from agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts (~48 lines saved)
- Extract shared function (17 lines) from agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts (~51 lines saved)

**Family 61** (1 group, 18 lines across `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`, `tools/synchronization/src/modules/synchronization/synchronization.command.unit.test.ts`)

- Extract shared function (18 lines) from agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts, synchronization.command.unit.test.ts (~72 lines saved)

**Family 62** (1 group, 13 lines across `tools/synchronization/src/modules/agent-skills/agent-skills.command.unit.test.ts`, `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`)

- Extract shared function (13 lines) from agent-skills.command.unit.test.ts, conformance-generators.command.unit.test.ts, pull-request-template.command.unit.test.ts (~26 lines saved)

**Family 63** (1 group, 18 lines across `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/conventional-config/conventional-config-io.service.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`)

- Extract shared function (18 lines) from conformance-generators.command.unit.test.ts, conventional-config-io.service.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts (~54 lines saved)

**Family 64** (2 groups, 42 lines across `tools/synchronization/src/modules/conformance-generators/conformance-generators.command.unit.test.ts`, `tools/synchronization/src/modules/devcontainer-configuration/devcontainer-configuration.command.unit.test.ts`, `tools/synchronization/src/modules/pull-request-template/pull-request-template.command.unit.test.ts`)

- Extract shared function (20 lines) from conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts (~40 lines saved)
- Extract shared function (22 lines) from conformance-generators.command.unit.test.ts, devcontainer-configuration.command.unit.test.ts, pull-request-template.command.unit.test.ts (~44 lines saved)

**Summary:** 8192 duplicated lines (7.8%) across 168 files




 NX   Successfully ran target fallow-duplicates for project monorepo

Nx read the output from the cache instead of running the command for 1 out of 1 tasks.

