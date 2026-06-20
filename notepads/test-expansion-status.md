# Lexico-Ingestion Test Coverage Expansion - Session Status

## Current Coverage: 32.58% → Target: 96%

### Modules Already at Good Coverage
- manual: 98.63%
- words: 98.18%
- numerals: 96.87%
- principal-parts: 95%
- part-of-speech: 78.98% (near target)
- translations: 86.79%

### Critical Gaps - Priority Order

**Tier 1 (Start Here)**
1. **wiktionary** - 15.62%
   - File: wiktionary.command.ts (12.9%)
   - Status: Needs comprehensive test creation

2. **pronunciation** - 26.97% (has partial tests)
   - pronunciation.service.ts: 8.19%
   - pronunciation-phonemes.service.ts: 18.18%
   - pronunciation-ecclesiastical.service.ts: 27.27%
   - pronunciation-classical.service.ts: 40.81%
   - Status: Has 5 test files but low coverage - needs expansion

3. **perseus** - 21.56%
   - File: perseus.command.ts (18.36%)
   - Status: Needs comprehensive test creation

4. **literature** - 21.73%
   - literature.service.ts: 0.62%
   - literature.command.ts: 5.05%
   - Status: Needs comprehensive test creation

**Tier 2 (Secondary)**
5. **etymology** - 28.36%
6. **forms** - 42.85%

## Implementation Strategy

1. Start with pronunciation services - they have existing tests to build on
2. Expand forms and etymology services next
3. Commands are lower priority - focus on services first
4. Use service architecture to understand what to test

## Key Constraint
- Need to reach 96% overall - currently 32.58%
- This requires MASSIVE test expansion across multiple modules
- Focus on services with the most impact

## Detailed Next Steps

### Phase 1: Pronunciation Module (26.97% → target ~60%)
**Files to expand (in order):**
1. pronunciation.service.ts (8.19% currently)
   - Methods: buildDefaultPronunciation, buildPronunciations, getClassicalPhonemes, parsePronunciations (main), ingestLexemePronunciations (main)
   
2. pronunciation-phonemes.service.ts (18.18%)
3. pronunciation-ecclesiastical.service.ts (27.27%)
4. pronunciation-classical.service.ts (40.81%)

### Phase 2: Forms Module (42.85% → target ~75%)
1. forms-builder.ts (1.39%)
2. forms-parser.ts (68.57%)
3. Various form providers

### Phase 3: Etymology Module (28.36% → target ~65%)
1. etymology.service.ts (16.51%)
2. etymology-builder.ts (1.39%)

### Phase 4: Remaining Critical Modules
1. literature.service.ts (0.62%)
2. wiktionary.command.ts (12.9%)
3. perseus.command.ts (18.36%)

## Key Pattern for Test Expansion
- Replace "is defined" checks with behavior tests
- Use vi.fn() mocks for all dependencies  
- Create HTML fixtures with cheerio for parsing tests
- Test all code paths, edge cases, and error conditions
- Cover private methods indirectly via public methods
- No eslint disable needed for test files - they use `any` for mocks

## Commands to Monitor Progress
```bash
# Run coverage
pnpm exec nx run lexico-ingestion:test:unit --coverage 2>&1 | tail -40

# Run tests only
pnpm exec nx run lexico-ingestion:test:unit 2>&1 | tail -10
```
