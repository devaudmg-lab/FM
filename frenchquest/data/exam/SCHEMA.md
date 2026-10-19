# Exam Lab data schema

The data for each exam lives in `data/exam/<tef|tcf>/`. `format.json` and `nclc.json` hold the verified official facts. The other four files are **original practice material**: never copy official sample tests.

Micro-skill tags (use 1–2 per item): `main-idea`, `detail`, `numbers-dates`, `intention`, `paraphrase`, `inference`, `document-type`, `opinion-fact`, `vocabulary`.

## items-co.json (listening)

```json
{ "schemaVersion": 1, "exam": "tef", "ability": "co",
  "sets": [ {
    "id": "tef-co-s1", "title": "Everyday messages", "level": "a2", "minutes": 10,
    "audios": [ { "id": "a1", "context": "Message sur un répondeur", "lines": [ { "speaker": "Femme", "fr": "Bonjour, c'est…" } ] } ],
    "items": [ { "id": "tef-co-001", "audioId": "a1", "prompt": "Pourquoi la femme appelle-t-elle ?",
      "options": ["…", "…", "…", "…"], "answer": 2, "explain": "English explanation quoting the key words.", "microSkills": ["intention"] } ]
  } ] }
```

The app reads `lines` aloud with the device's French voice, one line after another. Each audio is played **once** in timed mode (`format.json` maxPlays). Every audio has 1–3 items.

### Extra packs and full mock tests

The app merges sets and tasks from several files per ability:
- `items-co.json` + `items-co-mocks.json`
- `items-ce.json` + `items-ce-mocks.json`
- `tasks-ee.json` + `tasks-ee-2.json`
- `tasks-eo.json` + `tasks-eo-2.json`

A **full mock** set has `"mock": true`, the official item count (TEF: 40; TCF: 39) and the official time in `"minutes"` (TEF listening 40, TEF reading 60, TCF listening 35, TCF reading 60). Difficulty should rise from A2 to C1 across the set, as on the real test. Set, audio, doc and item ids must be unique across ALL files for that exam (use prefixes such as `tef-co-m1`, `tef-co-m1-a01`, `tef-co-m1-001`).

## items-ce.json (reading)

Same shape, with `docs` in place of `audios`. Each doc is `{ "id", "type": "annonce|courriel|article|affiche|horaire|lettre|forum|publicité", "title", "fr" }`, and each item uses `docId`. `fr` may contain `\n` for paragraphs.

## tasks-ee.json (writing)

```json
{ "schemaVersion": 1, "exam": "tef", "ability": "ee",
  "tasks": [ { "id": "tef-ee-a1", "section": "A", "title": "…", "level": "b1",
    "prompt": "Consigne en français", "promptEn": "English translation of the instructions",
    "document": "optional French source text (e.g. the start of the article)",
    "minWords": 80, "maxWords": 120, "minutes": 25,
    "checklist": ["What a strong answer must do (English)"],
    "tips": ["English strategy tips specific to this task"],
    "models": [ { "label": "Model answer (about NCLC 7)", "fr": "…" } ] } ] }
```

## tasks-eo.json (speaking)

```json
{ "schemaVersion": 1, "exam": "tef", "ability": "eo",
  "tasks": [ { "id": "tef-eo-a1", "section": "A", "title": "…", "level": "b1",
    "prompt": "Consigne en français", "promptEn": "English translation",
    "document": "optional French document (e.g. an ad)",
    "prepSeconds": 0, "speakSeconds": 300,
    "checklist": ["…"], "usefulPhrases": [ { "fr": "…", "en": "…" } ],
    "examinerLines": ["Things the examiner might say or object (French)"],
    "models": [ { "label": "Model performance (about NCLC 7)", "fr": "…", "en": "optional" } ] } ] }
```
