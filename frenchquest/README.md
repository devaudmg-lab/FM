# FrenchQuest

A structured French course from A1 to B2 for English-speaking adults, built around:

- **A guided CEFR path:** 4 levels × 12 units × 5 core lessons, plus an optional 6th "workshop" lesson per unit that puts the unit together in realistic tasks. Each lesson follows the same six steps: discover → understand → hear → recall → apply → review.
- **Memory that lasts:** FSRS spaced repetition (recognize, produce and listen cards), interleaved review, and answer checking that understands French accents, elision and agreement.
- **All four skills:** listening (device French voice), speaking (local recording plus optional speech recognition), reading and writing, with a portfolio of your work.
- **Exam Lab:** separate TEF Canada and TCF Canada tracks with format-accurate timing, original practice sets and tasks, an honest NCLC *range* estimate, and an official-results log based on the IRCC tables. It has 474 listening and reading questions (including 8 full-length timed mocks) and 68 writing and speaking tasks.
- **Vocabulary decks:** 34 extra decks (about 770 words) chosen by comparing the course with a 50,000-word frequency list, plus 10 exam-theme decks (work, immigration, housing, health, environment, technology, education, society, media, argumentation).
- **Resources:** a curated, link-checked page of the best free YouTube channels, podcasts, news, exam-prep and practice sites.
- **Sounds & alphabet:** the alphabet, accents, vowels, nasal sounds, consonants, silent letters and numbers, each compared with English and Hindi, with lip-shape pictures and listening drills for hard sound pairs.
- **Tap to hear:** tap any French word for its sound and meaning; every speaker has a 🐢 slow button. In exercises, a wrong answer offers **Try again** (the first try still counts), and each lesson ends with a list of your mistakes and a one-tap redo round.
- **Optional AI coach:** bring your own Anthropic API key to get rubric feedback on writing and speaking, and in-lesson answers. Without a key, "Ask about this" builds a detailed question you can paste into any AI assistant.

No accounts, no tracking, no build step. Your progress stays in your browser, and you can download it as a backup file.

## Run it locally

You need Python 3 (for the dev server) and Node 18+ (for the tools and tests only).

```bash
cd frenchquest
python tools/serve.py          # http://localhost:8080 (caching disabled for development)
```

ES modules do not work from `file://`, so always use a local server.

## Project commands

| Command | What it does |
|---|---|
| `node tools/validate.mjs [ids…]` | Checks lesson and exam files against `CONTENT-GUIDE.md` |
| `node tools/build-course.mjs` | Rebuilds `data/course.json`. A lesson is published only once it is `ai-verified` or `reviewed` |
| `node tools/build-sw-manifest.mjs` | Regenerates the offline cache list (run before every deploy) |
| `node --test tests/*.test.mjs` | Unit tests: answer checking, FSRS scheduler, NCLC estimates |
| `npm run build` | Runs validate, course and service-worker manifest in that order |

## Deploy to GitHub Pages

1. Create a repository and push the contents of the `frenchquest/` folder to it.
2. Run `npm run build` and commit the generated `data/course.json` and `sw-manifest.js`.
3. On GitHub, open **Settings → Pages**. Under **Source**, choose *Deploy from a branch*, then pick `main` and `/ (root)`.
4. Open `https://<you>.github.io/<repo>/`. All paths are relative, so project sites work.

Offline support (the service worker) turns on automatically over HTTPS. After a deploy, open users see an "update ready — reload" message.

## Content workflow

- `CONTENT-GUIDE.md` is the lesson JSON contract, and `data/lessons/a1/a1-02-02.json` is the reference lesson.
- `tools/AUTHOR-BRIEF.md`, `tools/WORKSHOP-BRIEF.md`, `tools/DECK-BRIEF.md`, `tools/SOUNDS-BRIEF.md` and `tools/VERIFIER-BRIEF.md` hold the two-pass AI workflow. One agent writes a lesson (`ai-draft`); a separate agent then checks the French, fixes it, and marks it `ai-verified`. Only verified lessons are published.
- Exam data and its schema live in `data/exam/` (see `SCHEMA.md`). `format.json` and `nclc.json` hold the official facts, with `verifiedOn` dates. Re-check them against the official pages before relying on them.
- Audio: lessons use the device's French text-to-speech voice. Edge's "Natural" voices sound best. You can add recorded MP3 files later through the `audio` field, with no code changes.

## Folder map

```
index.html, sw.js, manifest.webmanifest   app shell
css/        tokens (design system), base, app, lesson, exam
js/         app.js, router.js
  ui/       DOM helper, icons, md-lite, shared components
  engine/   content, evaluate (answer checking), srs (FSRS), cards, progress,
            recommend (today plan, forecast), gamification, exam (NCLC)
  exercises/  all 9 exercise types
  views/    home, learn, lesson, review, exam, progress, settings, welcome
  media/    speech (TTS), recorder, stt
  ai/       provider (Anthropic), coach, ask, settings panel
  store/    IndexedDB, prefs, export/import
data/       course.json, lessons/<level>/*.json, exam/<tef|tcf>/*.json
tools/      validator, builders, dev server, author and verifier briefs
tests/      node:test unit tests
```

## Honesty notes

- Practice scores are unofficial. The app always shows an NCLC *range* with a confidence label, never a single "official-looking" score.
- Requirements for immigration programs change. Always check the IRCC website.
- Exam practice material is original. It never copies official sample tests.
