# FrenchQuest content guide (lesson JSON contract)

This guide is for anyone, human or AI, who writes or verifies a lesson. A lesson is one JSON file: `data/lessons/<level>/<id>.json`, for example `data/lessons/a1/a1-02-02.json`. The app renders it without any code changes, so **the schema must be followed exactly**. Run `node tools/validate.mjs` after editing.

The reference lesson is `data/lessons/a1/a1-02-02.json`. Copy its style.

## 1. Top level

```json
{
  "schemaVersion": 1,
  "id": "a1-02-02",                // must match the file name and course map
  "level": "a1",
  "unit": "a1-02",
  "title": "Être and nationality",  // English, sentence case, short
  "goal": "Say your nationality and ask someone else's.",   // "By the end you can…" without that prefix
  "minutes": 12,                    // realistic core time, 7–15
  "items": [ ... ],                 // words/phrases/grammar that enter spaced review
  "steps": [ ... ],                 // 5–6 steps, in order
  "summary": "md-lite: what the learner can now do (2–4 bullet lines)",
  "completion": { "threshold": 0.8 },
  "meta": { "reviewStatus": "ai-draft", "author": "ai", "verifiedBy": null, "notes": "" }
}
```

`reviewStatus` lifecycle: `ai-draft` (author) → `ai-verified` (an independent verifier checked and fixed it) → `reviewed` (a human checked it). Only `ai-verified` and `reviewed` lessons are published.

## 2. Items: what gets reviewed later

Every item gets spaced-review cards automatically (recognize FR→EN, produce EN→FR, listen). **6–14 items per lesson.** Items are scoped to the lesson, so their ids only need to be unique inside the file.

```json
{ "id": "canadien", "kind": "vocab", "fr": "canadien", "fem": "canadienne", "en": "Canadian", "pos": "adjective",
  "example": { "fr": "Je suis canadien.", "en": "I'm Canadian." }, "accept": ["canadienne"], "note": "Feminine: canadienne." }
{ "id": "livre", "kind": "vocab", "fr": "livre", "article": "le", "gender": "m", "en": "book", "pos": "noun" }
{ "id": "je-suis", "kind": "phrase", "fr": "Je suis canadienne.", "en": "I'm Canadian (woman speaking).", "accept": ["Je suis canadien."] }
{ "id": "g-etre", "kind": "grammar", "fr": "être", "en": "to be (present)",
  "drills": [ { "type": "cloze", "text": "Nous ___ à Montréal.", "answers": [["sommes"]], "en": "We are in Montreal." } ] }
```

Rules:
- `kind`: `vocab` (single words), `phrase` (useful chunks or sentences), `grammar` (needs `drills`: 2–4 exercises of type `cloze`, `translate` or `mcq`).
- Nouns MUST have `article` (`le`, `la`, `l'`, `les`, `un`, `une`) and `gender` (`m`/`f`). The card shows "le livre".
- `en` is the English meaning used as the prompt for EN→FR cards, so make it **unambiguous**: "Canadian (woman speaking)", "you (formal)", "see you soon".
- `accept`: other correct French answers for the EN→FR card (feminine forms, tu/vous variants, with or without article).
- `say` (optional): text for the speech engine if it should differ from `fr`.

## 3. Steps

Each step: `{ "type": "...", "title": "optional English heading", "intro": "optional md-lite", "blocks": [ ... ] }`

| type | purpose | typical blocks |
|---|---|---|
| `discover` | see French in context | `dialogue`, `text`, `listen` |
| `understand` | one pattern, short explanation | `explain`, `pattern`, `table`, `vocab`, `deepdive` |
| `hear` | pronunciation and listening | `repeat`, `listen-mcq`, `dictation` |
| `recall` | produce without looking (**graded**, at least 6 exercises) | `translate`, `cloze`, `reorder`, `mcq`, `match`, `dictation`, `listen-mcq` |
| `apply` | personal, realistic production (ungraded mission) | `write`, `speak` |
| `review` | older material comes back | `{ "type": "review-mix", "count": 5 }` |

Standard order: discover → understand → hear → recall → apply → review. Unit checkpoints (lesson 5) and assessments MAY use `assess` steps with exercises.

## 4. Content blocks

```json
{ "type": "dialogue", "title": "At a welcome event in Montréal", "context": "Two newcomers meet.",
  "lines": [ { "speaker": "Camille", "fr": "Bonjour ! Tu es canadien ?", "en": "Hi! Are you Canadian?" } ] }
{ "type": "text", "title": "…", "fr": "Paragraph one.\nParagraph two.", "en": "Translation" }
{ "type": "listen", "title": "…", "context": "…", "fr": "Transcript (hidden until revealed)", "en": "…" }
{ "type": "explain", "title": "…", "body": "md-lite text" }
{ "type": "pattern", "title": "…", "pattern": "je suis + nationality", "note": "md-lite", "examples": [ { "fr": "Je suis indien.", "en": "I'm Indian." } ] }
{ "type": "table", "title": "…", "head": ["", "être"], "rows": [["je", "suis"]], "frCols": [0, 1], "sayCol": true, "note": "md-lite" }
{ "type": "vocab", "title": "New words", "itemIds": ["canadien", "francais"] }
{ "type": "repeat", "title": "Listen and repeat", "note": "md-lite", "lines": [ { "fr": "Je suis", "en": "I am", "tip": "Say [ʒə sɥi]; the s is silent." } ] }
{ "type": "deepdive", "kind": "why|mistakes|pronunciation|examples|challenge|canada|culture", "title": "optional", "body": "md-lite", "examples": [ {"fr": "…", "en": "…"} ] }
{ "type": "note", "tone": "info|warning", "body": "md-lite" }
```

**md-lite:** `**bold**`, `*italic*`, `[[French text]]` (shown in the French style), `` `code` ``. A blank line starts a new paragraph. Lines starting with `- ` make a list. No HTML.

## 5. Exercises (every exercise needs a unique `id` inside the lesson, e.g. `ex1`)

```json
{ "id": "ex1", "type": "mcq", "prompt": "How do you say “I am Canadian” (man speaking)?", "options": ["Je suis canadien.", "J'ai canadien.", "Je canadien."], "optionsFr": true, "answer": 0,
  "explain": "Use être for nationality.", "optionFeedback": [null, "Avoir is “to have”.", "A verb is missing."] }
{ "id": "ex2", "type": "translate", "prompt": "She is French.", "accept": ["Elle est française."], "hint": "Feminine: add -e.", "explain": "français → française" }
{ "id": "ex3", "type": "cloze", "text": "Vous ___ mexicain ?", "answers": [["êtes"]], "choices": ["êtes", "es", "est"], "en": "Are you Mexican?", "explain": "vous → êtes" }
{ "id": "ex4", "type": "reorder", "prompt": "Where are you from?", "accept": ["Tu viens d'où ?", "D'où tu viens ?"], "extra": ["es"] }
{ "id": "ex5", "type": "match", "prompt": "Match the nationalities.", "pairs": [["canadienne", "Canadian (f.)"], ["indien", "Indian (m.)"]] }
{ "id": "ex6", "type": "dictation", "fr": "Nous sommes à Toronto.", "accept": [] }
{ "id": "ex7", "type": "listen-mcq", "fr": "Elle est italienne.", "en": "She's Italian.", "prompt": "What is her nationality?", "options": ["Italian", "Indian", "Irish"], "answer": 0 }
{ "id": "w1", "type": "write", "prompt": "English task instructions", "promptFr": "optional French version",
  "wordRange": [15, 40], "checklist": ["State your nationality", "Ask a question"],
  "models": [ { "label": "Model answer", "fr": "…", "en": "…" } ] }
{ "id": "s1", "type": "speak", "prompt": "Introduce yourself: name, nationality, city.", "seconds": 30,
  "checklist": ["Name", "Nationality", "City"], "models": [ { "label": "Model", "fr": "…", "en": "…" } ] }
```

Exercise rules:
- **`accept` must list every reasonable correct answer**: tu/vous when the English "you" is ambiguous, masculine/feminine when the gender is unspecified, inversion vs est-ce que vs intonation questions, contractions. The checker already ignores case, final punctuation, spacing before `? !` and apostrophe style, and treats accent slips as "almost".
- English prompts in `translate` should pin down ambiguity, e.g. "(to a friend)", "(formal)", "(woman speaking)".
- `reorder`: the tiles are the words of `accept[0]` (punctuation removed) plus `extra` distractors. Each correct order must be in `accept`. Keep it to 3–9 tiles.
- `cloze`: use `___` (three underscores) for each blank. `answers` has one array of accepted strings per blank. `choices` is optional.
- `mcq`: 3–4 options. The answer index is into the original `options` order (the app shuffles). `optionsFr: true` when the options are French.
- `explain` is shown after an answer: one or two sentences saying **why**, not just the answer.
- `recall` steps: **6–10 graded exercises**, mixing at least 3 types, with at least 2 production types (`translate`/`cloze`/`dictation`), and interleaving earlier lessons' material where natural.
- `apply`: one `speak` and/or one `write` mission with a checklist and 1–2 model answers at the target level.

## 6. Language quality rules

- French must be natural, current, and correct, with standard spelling (rectifications de 1990 are accepted but not required). Use proper accents and `’` or `'` consistently (the app normalizes them).
- Stay **within the level**: only grammar already taught, or taught in this lesson. Use vocabulary from this lesson and earlier ones, plus at most a few obvious cognates.
- Context: adults, newcomers to Canada, work, family, daily life. Use Canadian place names (Montréal, Québec, Toronto, Ottawa, Vancouver, Gatineau, Moncton) alongside France. Add a `canada` deep dive where Québec usage differs (e.g. *magasiner*, *fin de semaine*, *déjeuner/dîner/souper*, *courriel*).
- Explanations are in English: short, friendly, concrete, with no jargon unless it is explained.
- Use a variety of people's names (Camille, Alex, Amira, Nguyen, Sofia, Karim, Mei, Raj, Lucie, Olivier).
- Never copy textbook or official exam material.
