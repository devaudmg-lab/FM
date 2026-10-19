# FrenchQuest build plan

The source of truth for *what* to build is `../concept.md`. This file tracks *how* and *in what order* it gets built.

## Content review policy (decided 2026-10-17)

The reviewer is an AI agent. Each lesson goes through two separate passes:
1. **Author pass.** An agent writes the lesson JSON from the lesson spec.
2. **Verifier pass.** A different agent checks the French (grammar, naturalness, level, accepted-answer coverage) and fixes it. When the file passes, it gets `reviewStatus: "ai-verified"`.

The learner can always ask an AI to explain anything (the in-app "Ask AI" uses the optional AI Coach).

## Audio policy (v1)

There are no recorded files yet. All French audio uses the browser's speech engine (`speechSynthesis`), preferring natural or neural fr-FR or fr-CA voices. The `audio` field stays in the schema, so recorded MP3s can replace TTS later without any change to the content.

## Phases

| Phase | Scope | Status |
|---|---|---|
| P0 Foundation | Shell, design tokens, router, IndexedDB, prefs, components, validator | done |
| P1 Lesson engine | Lesson runner, all block and exercise types, answer evaluation, TTS | done |
| P2 Memory engine | FSRS scheduler, review sessions, card generation, recorder, writing and speaking missions, portfolio | done |
| P3 Product shell | Onboarding, dashboard plan, curriculum map, progress, gamification, settings, export/import, PWA, unit test-out | done |
| P4 A1 content | All 60 A1 lessons (author and verify) | done |
| P5 Exam Lab | TEF and TCF formats, NCLC tables, 160 MCQ items + 34 tasks (verified), timed runners, estimates, official result log | done |
| P6 AI Coach | BYO key, writing and speaking feedback, "Ask about this" (works without a key too) | done |
| P7 A2 → B2 content | 180 lessons, author and verify | done (240/240 published) |
| P8 Release | Mobile responsive pass (320–1280 px), README, deploy guide, 29 unit tests, full render check | done |
| P9 Expansion | 48 optional workshops (6th lesson per unit), Exam Lab ×2.4 (8 full mocks), 34 vocabulary decks from a frequency-gap analysis, Resources page | done (288/288 lessons, 34/34 decks verified) |

Final check (2026-10-19, after P9): 288 lessons and 34 vocabulary decks (8,156 blocks, 11,672 review cards) render without errors; all 24 listening/reading sets (474 questions, including 8 full timed mocks) and 68 writing/speaking tasks open without errors. The validator reports 0 errors and 0 warnings across 322 files, all 29 unit tests pass, and no page overflows at 360 px. Frequency coverage (OpenSubtitles list, exact word forms): top 1,000 97.0%, top 2,000 93.8%, top 5,000 84.3%; most of the remainder is names, profanity and inflections.

**Possible next steps:** record native audio (the `audio` fields are ready), have a human French teacher spot-check the content, and deploy to GitHub Pages (see README).

## Run locally

```
cd frenchquest
python -m http.server 8080
# open http://localhost:8080
```

`node tools/validate.mjs` validates all content. `node --test tests/` runs the unit tests.
