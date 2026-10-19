# Vocabulary deck brief

Vocabulary decks fill the frequency gaps left by the lessons. A deck is an ordinary lesson file at `data/lessons/vocab/vocab-NN.json`, using the same JSON contract as any lesson (see `CONTENT-GUIDE.md`). It has these differences:

```json
{ "schemaVersion": 1, "id": "vocab-07", "level": "vocab", "unit": "vocab",
  "title": "Everyday verbs (3)",               // short and specific
  "band": "Everyday words 1–2000",             // grouping shown in the app; use the exact band names below
  "cefr": "a2",                                // a2 | b1 | b2: the level at which these words are typically learned
  "theme": "verbs of movement and change",
  "goal": "Recognise and use 24 high-frequency words …",
  "minutes": 15, "items": [ … ], "steps": [ … ], "summary": "…",
  "completion": { "threshold": 0.8 },
  "meta": { "reviewStatus": "ai-draft", "author": "ai", "verifiedBy": null, "notes": "" } }
```

**Band names** (use exactly): `Everyday words 1–2000`, `Everyday words 2000–4000`, `Everyday words 4000–6000`, `Exam themes (TEF/TCF)`.

## Choosing the words

- Start from the frequency gap list: `C:\Users\devau\AppData\Local\Temp\claude\C--dev-Projects-Project-Files-FM\764ec7b5-d240-4c9a-8cc6-bfad16ea9ffc\scratchpad\freq\missing.txt`. Each line is `rank<TAB>word`. These are frequent forms from French film and TV subtitles that never appear anywhere in the course.
- **Skip:** proper names, English words, swear words and vulgar slang, archaic or film-only vocabulary (heavy crime, military or fantasy), and interjections.
- **Lemmatise:** turn an inflected form into its dictionary form (`croyez` → `croire`, `morts` → `mort`). Before using a lemma, check that it is not already taught. Search the lessons for it as an item, for example with grep on `"fr": "croire"` and its inflected forms in `data/lessons/`. If the lemma is already taught as an item, skip it.
- **Gap words in context:** a frequent word that appears in the course only inside texts, never as an item, is still a good card.
- **Grouping:** put 20–25 items in each deck and group them by meaning (people and relationships, feelings, actions, time, places, abstract nouns, connectors…). Do not group them alphabetically.

## Items

Each item follows the CONTENT-GUIDE rules:
- `kind: "vocab"`, or `"phrase"` for multi-word expressions.
- Nouns need an article and a gender.
- The English meaning (`en`) must be unambiguous, for example "to believe", "a guy (informal)". **Never put the French word inside `en`**: the EN→FR card shows `en` as the prompt, so the French would give the answer away.
- Add an `example` (`fr` + `en`): a natural sentence at the right level that shows typical use.
- `accept` holds valid variants: feminine forms, the noun without its article.

## Steps

1. **understand:** 2–3 `vocab` blocks with group titles that together cover every item, plus a short `explain` (60 words at most) with usage tips, false friends and Québec notes where relevant.
2. **hear:** one `repeat` block with 8–10 of the example sentences.
3. **recall:** 10 graded exercises:
   - 2 × `match` (4–6 pairs)
   - 2 × `mcq` (use in context)
   - 2 × `translate` (EN → FR sentence)
   - 2 × `cloze`
   - 1 × `dictation`
   - 1 × `listen-mcq`

   Only use grammar suited to the deck's `cefr` level.
4. **review:** `{ "type": "review-mix", "count": 5 }`

Run `node tools/validate.mjs <your ids>` until it reports 0 errors. Write one deck at a time, validating each before starting the next. **Edit only your own files.**
