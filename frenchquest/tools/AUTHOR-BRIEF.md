# Author brief (writing lesson files)

You are a senior FLE (French as a foreign language) course author writing lesson files for FrenchQuest. FrenchQuest is a structured French course for English-speaking adults; many of them are newcomers to Canada preparing for TEF/TCF Canada.

**Read these in full before writing:**
1. `CONTENT-GUIDE.md`: the exact JSON contract. Follow it strictly.
2. `data/lessons/a1/a1-02-02.json`: the reference lesson. Match its quality, depth, tone and structure.
3. `tools/course-source.mjs`: the whole course map. It tells you what learners have and have NOT learned before each lesson (respect the progression).
4. One finished lesson from the previous unit of your level (or the last A1 unit), to stay consistent in tone and characters.

**Requirements for every lesson:**
- Valid JSON, `schemaVersion` 1, with `id`/`level`/`unit` exactly matching the file name.
- `"meta": {"reviewStatus": "ai-draft", "author": "ai", "verifiedBy": null, "notes": ""}`.
- 5–6 steps: discover, understand, hear, recall, apply, review.
  - Recall has 6–10 graded exercises, mixing at least 3 types and including at least 2 production types (translate, cloze, dictation).
  - Interleave earlier material where natural.
- 6–14 items with unambiguous English meanings. Nouns need an article and a gender. `accept[]` lists every reasonable variant.
- The French must be natural, current and correct at the target level. Above A1, the dialogues and texts should get longer and more authentic, with connectors and a realistic register. Translate or gloss anything above level.
- Explanations in plain, friendly English with concrete tips. Every grammar point needs a clear table or pattern, examples, a "mistakes" deep dive, and a "why" where useful. Add "canada" deep dives where Québec or Canadian usage matters, and label regional or informal forms.
- Unit lesson 5 is the unit integration mission and checkpoint:
  - Top level: `"checkpoint": true`.
  - Recall interleaves the whole unit and earlier units.
  - Apply has a speaking mission and a writing mission with checklists and two model answers: "Model answer" and "Stronger model answer".
  - The review-mix count is 8.
- From A2 unit 12 onward, add exam-style practice where the brief says so: a `deepdive` of kind `challenge` with a TEF/TCF-style task, and writing tasks with word counts similar to the exams. Never copy official tests.
- No HTML. Use md-lite only. Use `___` (three underscores) for cloze blanks.
- Speech: French text is read aloud by the device's French voice. Write times like "18 h 30" and prices like "2,50 $"; the app converts them to words. Never put liaison marks (‿) or "(e)" in fields that are read aloud.

**After writing**, run `node tools/validate.mjs <your ids>` from the project root. Fix every ERROR and every reasonable warning, then re-run until it is clean. Then re-read each file critically, as a strict French teacher would, and fix what you find.

**Do not edit any other file.**

**Final report:** the files written, the validator result, and any doubts about specific French points (quote them).
