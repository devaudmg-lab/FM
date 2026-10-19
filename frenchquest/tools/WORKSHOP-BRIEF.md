# Workshop brief (lesson 6 of every unit)

A workshop is an **optional extra-practice lesson**. It comes after the unit checkpoint (lesson 5) and uses the same JSON contract as every lesson (`CONTENT-GUIDE.md`). Its id is `<level>-<unit>-06`, for example `a1-03-06`, and its title is `Workshop: <unit title>` (see `tools/course-source.mjs`).

**Purpose:** more exposure and more retrieval on the unit's material, in NEW contexts. This adds volume (more listening, more reading, more production) and broadens vocabulary. It introduces **no new grammar**.

**Before writing**, read `tools/AUTHOR-BRIEF.md`, `CONTENT-GUIDE.md`, and all five lessons of the unit (`<level>-<unit>-01` … `-05`). Use what they teach. Do not contradict their rules or characters.

## Structure (all steps required)

1. **discover:** one longer authentic-style text or dialogue in a new situation that reuses the whole unit: 150–250 words at A1/A2, 250–450 words at B1/B2. Add 2–3 comprehension items (mcq) right after it.
2. **understand:** a short "Unit at a glance" recap (`table` + `explain`, 120 words at most) and a `vocab` block of **8–12 new, useful, high-frequency words or phrases** on the unit's theme that the core lessons did not teach. Check the five lessons' `items` so you don't repeat them. These become review cards, so they must follow the item rules (article and gender for nouns, unambiguous English).
3. **hear:** 2 `listen` blocks (monologue, message or announcement) with 4–6 `listen-mcq` and 1–2 `dictation` items. Each listen-mcq `fr` is one speaker.
4. **recall:** **12 graded exercises** mixing at least 5 types. About two-thirds should drill this unit and one-third should interleave earlier units of the same level. At least 4 should be production (translate / cloze / dictation).
5. **apply:** one `write` mission (A1: 40–70 words · A2: 60–100 · B1: 120–180 · B2: 180–250, or exam ranges where relevant) and one `speak` mission (A1–A2: 45–60 s · B1–B2: 90–180 s), each with a checklist and two models, "Model answer" and "Stronger model answer". Count words the app's way: elisions count as 2 words, hyphenated words as 1.
6. **review:** `{ "type": "review-mix", "count": 8 }`.

Set `"minutes": 20`, no `"checkpoint"`, `"completion": {"threshold": 0.8}`, and meta `ai-draft`. For **unit 12** workshops (the level assessment unit), make it a **level-wide review**: mix every unit of the level, with exam-style items at the end.

Run `node tools/validate.mjs <your ids>` until it reports 0 errors. **Edit only your own files.**
