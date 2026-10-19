# FrenchQuest — Product Blueprint & Build Specification

**Version:** 2.0 · **Date:** 2026-10-17 · **Status:** Ready for build (MVP = Milestones M0–M3)
**Previous version:** `concept.v1-backup.md`

> **Who this document is for.** A developer or AI coding agent who will build FrenchQuest, and the product owner who will use it first. Part I explains *what* and *why*. Part II is the build contract: architecture, schemas, rules, user stories and acceptance criteria.
>
> **Conventions.** **MUST** = required for the milestone in which the feature appears. **SHOULD** = expected unless there is a documented reason not to. **MAY** = optional. Every decision has a short rationale so that a builder can make consistent calls on anything not covered here.

> **Build decisions since v2.0 (2026-10-17).** The implementation lives in `frenchquest/`, and `frenchquest/PLAN.md` tracks its phases.
> - **Content review:** an independent AI verifier replaces the human reviewer. Every lesson goes through an author pass (`ai-draft`) and then a separate verifier pass (`ai-verified`). Only verified lessons are published.
> - **Design:** the "cahier" direction replaces the ivory/navy palette in §16. It uses Seyès ruling on writing surfaces, a red margin line in lessons, corrections in teacher's red pen and *bleu des écoles* ink, with Atkinson Hyperlegible for the interface and Literata for French. The tokens are in `frenchquest/css/tokens.css`.
> - **Audio:** v1 uses the device's French text-to-speech voice. Recorded MP3s can be added later through the existing `audio` fields.
> - **Lesson items:** vocabulary and grammar items are defined inside each lesson file, not in separate item files.

---

## Contents

**Part I — Blueprint**
1. Product summary
2. The primary learner and an honest timeline
3. Design principles
4. Two tracks: French proficiency and exam readiness
5. Verified exam facts (TEF Canada, TCF Canada, NCLC)
6. Curriculum architecture (A1–B2, C1 later)
7. Complete A1 lesson list
8. The lesson experience
9. The memory system
10. Daily study plan
11. Listening, speaking, pronunciation and writing
12. Exam Lab
13. Adaptive engine
14. Motivation and gamification
15. Optional AI Coach
16. Design system
17. Screens and wireframes

**Part II — Build specification**
- A. Architecture and repository
- B. Module contracts
- C. Content schemas
- D. Answer evaluation rules
- E. Learner data and persistence
- F. Spaced-repetition implementation
- G. Audio, recording and speech
- H. Offline support (PWA)
- I. Accessibility requirements
- J. User stories and acceptance criteria
- K. Content pipeline, sourcing and QA
- L. Testing and release checklist
- M. Roadmap and definitions of done
- N. Success metrics
- O. Risks and open questions
- P. Sources

---

# Part I — Blueprint

## 1. Product summary

**FrenchQuest** is a free, static, self-paced French academy for serious adult learners. It is aimed at people who need measurable progress toward Canadian immigration language requirements, NCLC 7 in particular.

**Tagline:** *Learn French. Remember it. Use it. Prove it.*

**What it combines:**

| Pillar | What it means in the product |
|---|---|
| Guided CEFR curriculum | A1 → A2 → B1 → B2 with a fixed unit/lesson structure and mastery checkpoints |
| Memory engine | Retrieval practice and FSRS-based spaced repetition for vocabulary, grammar patterns and sentences |
| Four-skill training | Reading, listening, writing and speaking from the first lesson onward |
| Exam Lab | Separate TEF Canada (primary) and TCF Canada (secondary) tracks with format-accurate practice and honest NCLC estimates |
| Optional AI Coach | Bring-your-own-key feedback on writing and speaking. The app is fully usable without it |

**The five questions every screen helps answer:**

1. What am I learning today?
2. Why am I learning it?
3. How do I use it in real French?
4. What have I forgotten and need to review?
5. How does this move me toward my language and exam goals?

**Non-goals for v1:** user accounts, cloud sync, social features, a secure or proctored testing environment, payments, native mobile apps, or any claim of official scoring.

## 2. The primary learner and an honest timeline

### Primary persona (v1 is built for this person first)

| Attribute | Value |
|---|---|
| Starting level | Knows basic greetings (pre-A1 / early A1) |
| Daily study time | 60–90 minutes, about 30–45 hours/month |
| Goal | NCLC 7 in all four abilities for Canadian immigration (e.g., Express Entry) |
| Target exam | **TEF Canada (provisional).** The TCF Canada track stays available and the decision is revisited at M4 (see §12.6) |
| Stretch timeline | 3–6 months |
| Constraints | Limited access to human feedback on speaking and writing. Builder and learner are the same person |

**Secondary persona (post-MVP):** any self-directed adult learner aiming at TEF or TCF Canada who opens the public site with no explanation.

### Timeline reality check (show this in onboarding, worded kindly)

The commonly cited guided-learning estimates are cumulative and approximate. Individual results vary widely.

| Level | Cumulative guided hours (approx.) | At 75 min/day |
|---|---|---|
| A1 | 60–100 h | ~1–3 months |
| A2 | 160–200 h | ~4–5 months |
| B1 | 350–400 h | ~9–10 months |
| B2 | 550–650 h | ~15–17 months |

*These figures are widely published estimates, e.g. by Alliance Française schools and exam boards. Treat them as planning ranges, not as standards.*

**Implication for the product:**

- 3–6 months at 60–90 min/day is 90–270 hours. That realistically reaches **solid A2 to early B1**. NCLC 7 across all four abilities usually takes longer.
- The product MUST keep the 3–6 month goal as a **stretch target** and MUST NOT promise a date. It projects a **forecast window** from actual measured progress (see §13.4) and updates it weekly.
- Faster progress is possible with more hours per day, real conversation practice, a tutor, or prior exposure to another Romance language. The dashboard SHOULD suggest these levers when the forecast slips.

### The builder–learner paradox

The first user cannot validate French content because they are learning it. The plan MUST account for this:

1. Use open-licensed, native-written sentences and audio where possible (§K.2).
2. Draft new content with AI assistance, then have it reviewed by a fluent speaker (a paid tutor works) before marking it `reviewed`.
3. **Do not let building replace studying.** While M0–M2 are in progress, keep studying with existing resources (§K.2), then switch to FrenchQuest as content becomes available.

## 3. Design principles

1. **Clarity before complexity.** One concept at a time.
2. **Retrieve before you read.** Every lesson makes the learner produce French, not just recognize it.
3. **Mastery before unlocking.** Completion is not proof. Retention across days is.
4. **Consistency over intensity.** Rest days are allowed, and there is no shaming.
5. **Real French.** Natural dialogue, authentic contexts and varied francophone accents, including Canadian French.
6. **Exam skills grow with language skills.** Exam-format items appear early in small doses. Full mocks come later.
7. **Honest measurement.** "You reliably recall 340 items" is better than "You are 73% fluent." Every estimated score is labelled *unofficial estimate*.
8. **Accessible by default.** Keyboard, screen reader, large text, reduced motion and dark mode.
9. **Private by default.** All data stays on the device. Nothing is sent anywhere unless the learner turns on the AI Coach.
10. **Works offline.** After the first visit, studying does not need a connection, except for AI features.

## 4. Two tracks: French proficiency and exam readiness

| | Track A — French proficiency | Track B — Exam readiness |
|---|---|---|
| Path | A1 → A2 → B1 → B2 (C1 post-v1) | TEF Canada, TCF Canada |
| Organized by | CEFR can-do outcomes | Official task types, timing and scoring |
| Content | Shared curriculum | **Separate** task banks, instructions, rubrics and NCLC tables per exam |
| When | From day 1 | Familiarization from A2. Regular timed drills from B1. Mocks from late B1/B2 |

**Why both:** general French without exam technique underperforms under time pressure. Exam technique without broad French plateaus quickly.

**Hard rules:**
- TEF and TCF data MUST be stored separately. Instructions, rubrics, timing and score mappings MUST NOT be shared between the two exams.
- A TEF score MUST NEVER be converted to a TCF score, or the other way round.
- B2 MUST NOT be presented as equal to NCLC 7. They are related but not interchangeable.
- The app MUST link to the current IRCC rules and MUST NOT give immigration advice.

## 5. Verified exam facts

> **Verified on 2026-10-17** against the IRCC Express Entry language-test page and the official TEF Canada page (Le français des affaires / CCI Paris Île-de-France). TCF Canada details come from France Éducation international as quoted by several sources, because the official page blocked automated access. **These values change.** They MUST live in data files with `verifiedOn` and `sourceUrl` fields (§C.8). They MUST NOT be hardcoded in JavaScript. The app SHOULD show "Last verified: <date>" next to every table.

### 5.1 General rules (IRCC, Express Entry)

- Accepted French tests: **TEF Canada** and **TCF Canada**.
- Results must be **less than 2 years old** when the Express Entry profile is created *and* when the PR application is submitted.
- Minimum levels depend on the program. The TEF Canada official page cites **NCLC 7 in all abilities for Express Entry** and **NCLC 5 for Mobilité francophone**, and **NCLC 4 in oral comprehension and oral expression for citizenship**. The app MUST tell learners to confirm the requirement for their specific pathway on IRCC.
- **TEF Canada scale note:** TEF Canada results now show a score out of 699 and an **"Équivalence ancien score"**. IRCC tells candidates to use the *Équivalence ancien score* per ability, **not** the /699 total. The TEF table below uses that equivalent score, so the app MUST store and display both values when a learner logs an official result.

### 5.2 TEF Canada → NCLC (IRCC, "Équivalence ancien score")

| NCLC | Expression orale | Compréhension de l'oral | Compréhension de l'écrit | Expression écrite |
|---|---|---|---|---|
| 10 | 393–450 | 316–360 | 263–300 | 393–450 |
| 9 | 371–392 | 298–315 | 248–262 | 371–392 |
| 8 | 349–370 | 280–297 | 233–247 | 349–370 |
| **7** | **310–348** | **249–279** | **207–232** | **310–348** |
| 6 | 271–309 | 217–248 | 181–206 | 271–309 |
| 5 | 226–270 | 181–216 | 151–180 | 226–270 |
| 4 | 181–225 | 145–180 | 121–150 | 181–225 |

### 5.3 TCF Canada → NCLC (IRCC)

| NCLC | Expression orale (/20) | Compréhension de l'oral (/699) | Compréhension de l'écrit (/699) | Expression écrite (/20) |
|---|---|---|---|---|
| 10 | 16–20 | 549–699 | 549–699 | 16–20 |
| 9 | 14–15 | 523–548 | 524–548 | 14–15 |
| 8 | 12–13 | 503–522 | 499–523 | 12–13 |
| **7** | **10–11** | **458–502** | **453–498** | **10–11** |
| 6 | 7–9 | 398–457 | 406–452 | 7–9 |
| 5 | 6 | 369–397 | 375–405 | 6 |
| 4 | 4–5 | 331–368 | 342–374 | 4–5 |

### 5.4 TEF Canada format (official page)

| Épreuve | Duration | Items | Notes |
|---|---|---|---|
| Compréhension de l'écrit | 60 min | 40 MCQ | 1 point per correct answer, 0 for wrong or blank (no penalty, so never leave a blank) |
| Compréhension de l'oral | 40 min | 40 MCQ | Same scoring |
| Expression écrite | 60 min | 2 tasks | **A** (25 min): continue a news article (*écrire la suite d'un article*), ≥ 80 words. **B** (35 min): express and justify a point of view, ≥ 200 words |
| Expression orale | 15 min | 2 tasks | **A** (5 min): obtain information (*obtenir des renseignements*). **B** (10 min): argue to convince (*argumenter pour convaincre*) |

All épreuves must be taken on the **same day** for the certificate to be recognized. The certificate is valid for 2 years.

### 5.5 TCF Canada format (France Éducation international, as reported)

| Épreuve | Duration | Items | Notes |
|---|---|---|---|
| Compréhension orale | 35 min | 39 MCQ | Scored /699 |
| Compréhension écrite | 60 min | 39 MCQ | Scored /699 |
| Expression écrite | 60 min | 3 tasks | T1: message (60–120 words). T2: account or article (120–150 words). T3: present two viewpoints, take a position (120–180 words) |
| Expression orale | 12 min (incl. 2 min prep) | 3 tasks | Face-to-face with an examiner. Typically T1 guided interview, T2 interaction exercise (with prep), T3 expressing a point of view. **Verify per-task timing on the official page before building timers** |

Total ≈ 2 h 47.

> **Rule for builders:** exam timers, word limits and item counts are read from `data/exam/<exam>/format.json`. If the official format changes, only that file needs editing.

## 6. Curriculum architecture

**Hierarchy:** Course → Level → Unit → Lesson → Block → Exercise. Reviews and assessments sit alongside it.

**Size:** each level has **12 units × 5 lessons = 60 lessons**. Each unit ends with a checkpoint (lesson 5 or a separate assessment). Each level ends with a mastery assessment.

### Level outcomes (can-do statements, CEFR-aligned)

| Level | Core outcome | Exit mission |
|---|---|---|
| **A1** Foundation | Introduce yourself, exchange personal information, handle very simple, slow interactions | Introduce yourself aloud (60 s), answer basic questions, write a short profile |
| **A2** Everyday French | Routine independence: past and future, practical situations, short emails | Handle a practical scenario (appointment, housing problem) and recount a recent experience |
| **B1** Independent | Explain and justify, narrate in connected speech, follow clear discussions | Present an opinion with reasons and respond to objections. First timed TEF/TCF mini-tests |
| **B2** Upper-intermediate | Argue, persuade, synthesize, adapt register, follow complex speech | Extended speaking and structured writing tasks, plus consistent four-skill performance under exam conditions |
| **C1** (post-v1) | Precision, implicit meaning, sophisticated argument | Flexible communication in demanding professional and academic contexts |

### A2 units

| # | Theme | Key outcomes |
|---|---|---|
| 01 | Yesterday and last week | Passé composé with *avoir*, common participles |
| 02 | Where I went | Passé composé with *être*, agreement |
| 03 | Childhood and habits | Imparfait (form + habitual use) |
| 04 | Future plans | Futur proche review, futur simple introduction |
| 05 | Travel and transport | Directions, requests, announcements (listening) |
| 06 | Health and appointments | Symptoms, advice (*il faut*, *devoir*), polite requests |
| 07 | Housing and services | Describing problems, practical messages, *il y a* / *depuis* |
| 08 | Shopping and comparisons | Comparatives/superlatives, COD pronouns *le/la/les* |
| 09 | Social life | Invitations, accepting, refusing, COI pronouns *lui/leur* |
| 10 | Stories and experiences | Passé composé vs imparfait, sequencing connectors |
| 11 | Messages and emails | Register (tu/vous), structure, *pronom y/en* intro |
| 12 | A2 mastery checkpoint | Four-skill assessment + practical mission. **TEF/TCF familiarization begins** |

### B1 units

| # | Theme | Key outcomes |
|---|---|---|
| 01 | Explain your opinions | *Je pense que, à mon avis*, giving reasons, *parce que / car / puisque* |
| 02 | Tell a complete story | Narrative tenses, plus-que-parfait, connectors |
| 03 | Work and careers in Canada | Professional vocabulary, interviews, CV language |
| 04 | Education and technology | Explaining processes, comparing ideas |
| 05 | Society and news | Main idea vs supporting detail, *faits divers* (TEF EE-A link) |
| 06 | Hypotheses and advice | Conditionnel présent, *si* + imparfait |
| 07 | Describe and compare | Relative pronouns *qui, que, où, dont* |
| 08 | Solve a problem | Requests, negotiation, proposing solutions (TEF EO-A link) |
| 09 | Write connected texts | Paragraphing, coherence, linking words |
| 10 | Speak at length | Fluency strategies, organization, follow-up questions |
| 11 | Exam foundations | Task-type drills for TEF and TCF, timed |
| 12 | B1 mastery checkpoint | Integrated assessment + timed mini-tests |

### B2 units

| # | Theme | Key outcomes |
|---|---|---|
| 01 | Defend an argument | Claim, reasons, evidence, counterargument, concession |
| 02 | Persuade and negotiate | Persuasive structures, register (TEF EO-B link) |
| 03 | Society and public policy | Nuanced positions, impersonal structures |
| 04 | Media and information | Source evaluation, inference, tone |
| 05 | Professional life | Formal correspondence, meetings |
| 06 | Advanced grammar in context | Subjonctif (uses), double pronouns, complex clauses |
| 07 | Coherence and precision | Reformulation, lexical precision, nominalization |
| 08 | Authentic listening | Interviews and debates, varied accents and speech rates (incl. Québécois) |
| 09 | Complex reading | Argument structure, implicit meaning |
| 10 | Structured writing | Introduction, development and conclusion within word limits |
| 11 | Extended speaking | Spontaneous response, sustained argument |
| 12 | Four-skill exam readiness | Full mocks, error analysis, targeted remediation |

> Outlines are not content. A unit only counts as complete when all its lessons are `published` (§K.4).

## 7. Complete A1 lesson list

IDs follow `a1-UU-LL`. ★ marks the **vertical slice** (M1). Since the primary learner already knows greetings, the diagnostic (§13.1) MAY let them test out of `a1-01-01`.

| ID | Lesson | Grammar / focus | Skill emphasis |
|---|---|---|---|
| **Unit 01 — Sounds and survival** |||
| ★ a1-01-01 | Bonjour ! Greetings and politeness | *bonjour/bonsoir/salut*, *tu* vs *vous* | Listening, speaking |
| a1-01-02 | The alphabet and spelling your name | Letters, accents (é è ê ç) | Listening, writing |
| ★ a1-01-03 | Key vowel sounds | *u/ou*, *é/è*, nasal vowels (intro) | Pronunciation |
| a1-01-04 | Silent letters, liaison, élision | *les‿amis*, *j'*, *l'* | Pronunciation |
| a1-01-05 | Survival phrases | *Je ne comprends pas. Pouvez-vous répéter ?* | Speaking |
| **Unit 02 — Introduce yourself** |||
| ★ a1-02-01 | Je m'appelle… | *s'appeler* (je/tu/vous), questions | Speaking |
| ★ a1-02-02 | Être and nationality | *être* (all persons), adjective gender | Grammar, writing |
| a1-02-03 | Say where you live | *habiter à* + city, *en/au* + country | Speaking, listening |
| a1-02-04 | Languages you speak | *-er* verbs (present), *parler* | Grammar |
| ★ a1-02-05 | Your first conversation | Integration: name, origin, city, languages | Speaking mission |
| **Unit 03 — Numbers, dates, time** |||
| a1-03-01 | Numbers 0–20 | Counting, liaison with numbers | Listening |
| a1-03-02 | Numbers 21–100 | *soixante-dix, quatre-vingts* | Listening (dictation) |
| a1-03-03 | Days, months, dates | *le 3 mars*, *aujourd'hui* | Reading |
| a1-03-04 | Telling time and appointments | *Il est…*, *à quelle heure* | Listening |
| a1-03-05 | Avoir: age, phone, needs | *avoir* (all persons), *avoir besoin de* | Grammar, speaking |
| **Unit 04 — People and family** |||
| a1-04-01 | My family | Possessives *mon/ma/mes* | Vocabulary |
| a1-04-02 | Describing people | Adjective agreement and position | Writing |
| a1-04-03 | Articles | *un/une/des*, *le/la/les* | Grammar |
| a1-04-04 | Être or avoir? | Contrast in descriptions | Grammar, recall |
| a1-04-05 | Present someone you know | Integration | Speaking mission |
| **Unit 05 — Daily routines** |||
| a1-05-01 | My day | *-er* verbs, full conjugation | Grammar |
| a1-05-02 | Reflexive verbs | *se lever, se coucher* | Grammar |
| a1-05-03 | How often? | Frequency adverbs, time expressions | Speaking |
| a1-05-04 | Faire and aller | Irregular verbs, *aller à* | Grammar |
| a1-05-05 | Describe your routine | Integration | Writing mission |
| **Unit 06 — Food and cafés** |||
| a1-06-01 | Food and gender | Food vocabulary | Vocabulary |
| a1-06-02 | Some, any, none | Partitive *du/de la/des*, *pas de* | Grammar |
| a1-06-03 | Ordering politely | *Je voudrais…*, *s'il vous plaît* | Speaking |
| a1-06-04 | Quantities and prices | *combien*, *un kilo de* | Listening |
| a1-06-05 | At the café | Role-play | Speaking mission |
| **Unit 07 — Home and city** |||
| a1-07-01 | My home | Rooms, *il y a* | Vocabulary |
| a1-07-02 | Where is it? | Prepositions of place | Grammar |
| a1-07-03 | Around town | *à + le = au*, places | Vocabulary |
| a1-07-04 | Directions | Imperative (intro), *tournez à gauche* | Listening |
| a1-07-05 | Getting around | Transport, *en/à* + vehicle | Reading |
| **Unit 08 — Work and study** |||
| a1-08-01 | Jobs | Masculine/feminine job names | Vocabulary |
| a1-08-02 | Asking questions | *est-ce que*, *qu'est-ce que*, intonation | Grammar |
| a1-08-03 | -ir and -re verbs | *finir, prendre, comprendre* | Grammar |
| a1-08-04 | Schedules | Work and school timetables | Reading |
| a1-08-05 | Talk about your work or studies | Integration (Canadian context) | Speaking mission |
| **Unit 09 — Likes and preferences** |||
| a1-09-01 | I like, I love | *aimer/adorer/détester* + definite article | Speaking |
| a1-09-02 | Negation | *ne… pas*, *ne… jamais* | Grammar |
| a1-09-03 | I prefer | *préférer* (stem change), *parce que* | Grammar |
| a1-09-04 | Hobbies and weather | *faire du/de la*, *il fait beau* | Vocabulary |
| a1-09-05 | Say what you like and why | Integration | Writing mission |
| **Unit 10 — First conversations** |||
| a1-10-01 | Question words | *où, quand, comment, pourquoi, combien* | Grammar |
| a1-10-02 | Can, want, must | *pouvoir, vouloir, devoir* | Grammar |
| a1-10-03 | What I'm going to do | Futur proche (intro) | Speaking |
| a1-10-04 | Messages and voicemails | Short real-life audio | Listening |
| a1-10-05 | Keep a conversation going | Follow-up questions, fillers | Speaking mission |
| **Unit 11 — Review and integration** |||
| a1-11-01 | Mixed reading | Signs, forms, short messages | Reading |
| a1-11-02 | Mixed listening | Incl. Canadian French speakers | Listening |
| a1-11-03 | Fill in a form, write a profile | Personal information | Writing |
| a1-11-04 | One-minute monologue | Self-presentation | Speaking |
| a1-11-05 | Cumulative grammar review | Interleaved | Recall |
| **Unit 12 — A1 mastery checkpoint** |||
| a1-12-01 | Reading assessment | | Reading |
| a1-12-02 | Listening assessment | | Listening |
| a1-12-03 | Writing assessment | | Writing |
| a1-12-04 | Speaking assessment | | Speaking |
| a1-12-05 | Real-world mission and reflection | Plan for A2 | All |

**Vertical slice rationale:** five lessons covering pronunciation, greetings, *être*, a grammar point and a speaking mission. Together they exercise every block type and every core engine (lesson, exercises, review, audio, recording, progress).

## 8. The lesson experience

### 8.1 Standard sequence (7–12 min core)

| Step | Purpose | Typical block types |
|---|---|---|
| 1. **Discover** | See French in context | `dialogue`, `text`, `audio` |
| 2. **Understand** | One pattern, concise explanation | `grammar`, `vocab` |
| 3. **Hear** | Notice pronunciation | `audio`, `listen-repeat` |
| 4. **Recall** | Produce without looking | `translate`, `cloze`, `reorder`, `dictation` |
| 5. **Apply** | Personal or realistic task | `write`, `speak`, `roleplay` |
| 6. **Review** | Interleave older material, then next step | `review-mix` (auto-generated from due cards) |

Each lesson has: a goal sentence ("By the end, you can…"), an estimated duration, a progress bar and a "Next" recommendation.

### 8.2 Optional deep dives (collapsed by default)

- **Why does this work?** Deeper grammar
- **Common mistakes.** Wrong form, why learners make it, and the fix
- **Pronunciation clinic.** Sound-by-sound guidance
- **More examples**
- **Challenge mode.** Harder or exam-style items
- **Canadian corner** (MAY). Québécois usage notes where relevant (e.g., *char*, *magasiner*, *tu* informality)

The core lesson stays short however much deep-dive material exists.

### 8.3 Lesson completion rule

A lesson is **complete** when every required block has been viewed and the Recall exercises reach **≥ 80% correct on first attempt** across the lesson. Below 80% shows "Practise again" (which reshuffles and offers fresh items when available) and still lets the learner move on. The lesson is then recorded as `completed-weak`, and its items enter review sooner.

## 9. The memory system

### 9.1 Principles

- **Retrieval practice:** recall before seeing the answer.
- **Spaced repetition:** intervals grow with successful recall.
- **Interleaving:** mix related forms (e.g., *être/avoir*, *du/de la/des*) so learners practise *choosing*.
- **Elaborated feedback:** why it is right or wrong, and what to do next time.

These are evidence-based learning practices. They MUST NOT be marketed as guarantees of exam results.

### 9.2 What gets reviewed

**Review cards** are generated from **items** in several **directions**:

| Item type | Directions (card types) |
|---|---|
| Vocabulary | FR→EN (recognition), EN→FR typed (production), audio→meaning (listening) |
| Grammar pattern | Cloze in a new sentence, transform (e.g., present → passé composé) |
| Sentence / chunk | Rebuild from tiles, translate EN→FR, dictation |

Production and listening cards unlock only after the learner succeeds on the recognition card twice, to avoid frustration early on.

### 9.3 Scheduling

- **Algorithm:** **FSRS** (Free Spaced Repetition Scheduler, open source). Default desired retention is **0.90**, adjustable from 0.80 to 0.95 in Settings, with a note that higher retention means many more reviews. Details in §F.
- **Grades** are inferred from the answer, so the learner does not have to self-rate: wrong → *Again*, correct after a hint or accent fix → *Hard*, correct → *Good*, correct and fast on a production card → *Easy*. Self-rated flashcards MAY offer the four buttons explicitly.
- **Card states:** `new`, `learning`, `review`, `relearning`. The UI also shows **Established** (stability ≥ 21 days with ≥ 3 successful reviews on ≥ 3 different days).
- **"I know this" never marks an item mastered.** At most it schedules one confirmation review the next day.

### 9.4 Review load management

- New cards per day: default 15 (adjustable 5–40).
- If due reviews exceed **2× the daily average**, new cards pause automatically. The dashboard explains why ("Clearing your backlog first").
- Daily review cap: default 150. Overflow cards roll over, overdue first and lowest retrievability first.

## 10. Daily study plan

The recommended 75-minute routine is a starting point, not a mandatory timer. The adaptive engine (§13) reshapes it.

| Block | Default | Adapts when… |
|---|---|---|
| Reviews (due cards) | 10 min | Backlog grows → up to 25 min, new lesson time shrinks |
| New lesson | 20 min | Review backlog or a weak skill → shorter |
| Listening and pronunciation | 15 min | Listening is the weakest skill → 25 min |
| Production (writing or speaking mission) | 15 min | Production lags recognition → 20 min |
| Mixed / exam practice | 10 min | From A2 onward. Grows at B1+ |
| Error review and plan for tomorrow | 5 min | Always |

The learner sets their daily target (30 / 45 / 60 / 75 / 90 min) in onboarding. Each day the app builds a **Today plan** checklist. Rest days are configurable (e.g., one per week) and do not break streaks.

## 11. Listening, speaking, pronunciation and writing

### 11.1 Five levels of speaking support (none requires a server)

| Level | Feature | Tech | Notes |
|---|---|---|---|
| 1 | Curated audio | `<audio>` + recorded files | Native recordings for all core material. Slow (0.75×) version via `playbackRate` or a separate file |
| 2 | Listen and repeat | Audio + self-rating | Focus on sounds, liaison, rhythm and intonation |
| 3 | Self-recording | `MediaRecorder` | Record, replay, A/B compare with the model. Stored locally (IndexedDB) |
| 4 | Speech-to-text (optional) | Web Speech API (`SpeechRecognition`, `fr-FR`/`fr-CA`) | Labelled *experimental*. Checks content words only, **never** pronunciation quality. Feature-detected and hidden when unsupported |
| 5 | Speaking missions | Prompt + timer + recording + rubric | Self-assessment rubric. Optional AI feedback (§15) |

**Every audio player MUST have:** play/pause, replay last 5 s, speed (0.75× / 1×), transcript (hidden until the comprehension question is answered), and translation toggle.

**Browser TTS** (`speechSynthesis`) MAY be used as a fallback for non-core items (e.g., extra examples) and MUST be labelled. It MUST prefer `fr-FR` or `fr-CA` voices and MUST NOT be used for exam-practice audio.

### 11.2 Writing

- Writing tasks show: prompt, required word range, a live word counter (French counting rules, §D.4), a timer in exam mode, and a checklist of task requirements.
- After submitting, the learner gets a **model answer at two levels** (e.g., NCLC 5 and NCLC 7 style), a **self-assessment rubric**, and an optional **AI Coach** evaluation.
- All submissions are saved in a **portfolio** for tracking progress over time.

### 11.3 Generic rubric (used when no exam-specific rubric applies)

| Criterion | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Task completion | Off-task | Partly | Mostly | Fully, all points covered |
| Organization / coherence | No structure | Some sequencing | Clear, with connectors | Clear, varied connectors, logical progression |
| Vocabulary range and accuracy | Very limited | Basic, frequent errors | Adequate | Varied and precise |
| Grammar control | Errors block meaning | Frequent errors | Occasional errors | Rare errors, some complex structures |
| Register / sociolinguistic fit | Inappropriate | Inconsistent | Mostly appropriate | Consistently appropriate |
| Pronunciation and fluency (speaking only) | Hard to understand | Effortful | Generally clear | Clear and natural |

Exam-specific rubrics MUST be derived from the official candidate documentation for each exam and stored separately (`data/exam/tef/rubrics.json`, `data/exam/tcf/rubrics.json`).

## 12. Exam Lab

### 12.1 Structure

Exam Lab has an **exam switcher (TEF Canada | TCF Canada)**. TEF Canada is the default for the primary persona. Each exam has its own:
`format.json` (timings, counts), task bank, instructions, rubrics, NCLC table and result history.

### 12.2 Five stages

| Stage | Unlock | What happens |
|---|---|---|
| 1. Familiarization | A2 unit 12 | Untimed walkthrough of each task type: what is asked, strategy, a worked example |
| 2. Focused drills | A2 complete | One micro-skill at a time (§12.3), untimed then timed |
| 3. Timed mini-tests | B1 unit 6 | 10–15 items or a single task under official per-item timing |
| 4. Full mock | B1 complete (MAY be unlocked manually earlier) | Full épreuve or full exam with official timing, playback rules and sequence |
| 5. Error-driven revision | After any test | Error categories, recommended lessons and a retry set |

Every stage can be unlocked early with a warning ("This may feel hard, which is normal").

### 12.3 Micro-skill catalogue (tag every exam item with ≥ 1)

**Comprehension:** main idea · specific detail (numbers, dates, places) · speaker intention/attitude · paraphrase recognition · inference · document type/context · opinion vs fact.
**Writing:** task fulfilment · narrative continuation (TEF A) · argumentation (TEF B / TCF T3) · register · coherence · word-limit control.
**Speaking:** asking for information (TEF A) · persuading (TEF B) · interaction (TCF T2) · expressing a viewpoint (TCF T3) · fluency · handling follow-ups.

### 12.4 Practice result screen

```
Practice review — TEF Canada · Compréhension de l'oral (mini-test)
Score: 27 / 40 correct                     ⚠ Unofficial practice estimate
Estimated level: ~NCLC 6 (low confidence: 1 test, non-official items)

Your three biggest opportunities
1. Numbers and dates in connected speech      6 errors
2. Speaker intention                           4 errors
3. Paraphrase vs identical words               3 errors

Recommended next step
→ 10-min lesson: "Catching numbers in fast speech" then retry a similar set
```

### 12.5 NCLC target dashboard

For each of the 4 abilities, show: target (default NCLC 7) · latest practice estimate with a confidence label · official result if logged (both the /699 and the *équivalence ancien score* for TEF) · distance to target · 4-week trend · recommended activity.

**Estimation rule:** practice raw scores map to an NCLC **range** using item-count proportions calibrated against the official tables. They are always shown with a confidence label (`low` < 3 tests, `medium` 3–5, `higher` ≥ 6 tests in the last 30 days). The app MUST NOT show a single precise "official-looking" score.

### 12.6 TEF vs TCF decision helper (shown at M4 / A2 end)

A comparison card based on `format.json` data: number of tasks, durations, oral format (TEF 2 tasks/15 min vs TCF 3 tasks/12 min), writing (TEF 2 longer texts vs TCF 3 shorter ones), and the learner's own drill performance in each. The recommendation is the learner's choice, and the app only presents data.

### 12.7 Content integrity

- Only original or properly licensed items. Never copy official sample tests into the bank.
- Label all practice as unofficial. Never imply a simulated score predicts an actual result.
- Public JSON exposes answers, so this is **self-study practice, not secure testing** (§A.4).

## 13. Adaptive engine (rule-based in v1)

### 13.1 Onboarding diagnostic (≈ 10 min)

1. Goal, exam choice (TEF / TCF / undecided), daily minutes, target date (optional).
2. Self-reported level.
3. A short adaptive check: 12 listening + 12 reading items moving from A1 to B1, plus a 3-sentence written self-introduction (self-rated, or AI-rated if enabled).
4. Result: a starting lesson and a suggested daily plan. Lessons below the placement are marked `tested-out`. Their vocabulary is seeded into review as `learning`, not `review`, so the learner confirms it.

### 13.2 Skill evidence model

Every exercise attempt records `{skill, level, microSkills[], correct, latencyMs, hintUsed, timestamp}`. Each skill (reading, listening, writing, speaking, plus vocabulary and grammar) gets a **rolling score**: an exponentially weighted accuracy over the last 50 attempts at the current level.

### 13.3 Recommendation rules (evaluated in order, first 3 matches become "Recommended next")

| Condition | Recommendation |
|---|---|
| Due reviews > 0 and today's reviews not done | Do reviews first |
| Review backlog > 2× daily average | Pause new cards and run a backlog session |
| Last lesson `completed-weak` | Retry the weak exercises of that lesson |
| Production accuracy < recognition accuracy − 20 pts | Sentence-building and speaking tasks |
| Listening rolling score < 60% | Slower-audio listening lesson plus dictation |
| Weakest skill is ≥ 15 pts below the average | Insert a 15-min block for that skill |
| Rolling accuracy ≥ 90% on the last 3 lessons | Offer Challenge mode or a skip-ahead test |
| No speaking recorded in 3 days | Speaking mission |
| Exam stage unlocked and none done this week | Exam drill |
| Otherwise | Next lesson in the path |

### 13.4 Forecast

Weekly: `hoursStudied`, `lessonsMastered`, and the share of each level's lessons mastered. The current pace is projected onto the remaining lessons, and a **window** is shown (e.g., "B1 likely between March and May 2027 at your current pace"). A single date is never shown. Below 2 weeks of data the app says "Not enough data yet."

## 14. Motivation and gamification

Reward mastery, consistency and communication, never clicks.

### 14.1 Systems

| System | Mechanic |
|---|---|
| Consistency | Daily goal ring, weekly activity heatmap, gentle streak with **rest days** and 2 **streak freezes**/month. Never shaming language |
| Skill badges | Earned by demonstrated ability |
| Mastery milestones | Unit checkpoints, level assessments, "items established" counts |
| Journey | Map of the levels. Units unlock on checkpoint pass or test-out |

### 14.2 XP (defaults; stored in `data/gamification.json`)

| Action | XP | Repeat policy |
|---|---|---|
| Complete a lesson (≥ 80% first try) | 20 | First completion only. A retry gives 5, max once per day |
| Correct due review | 2 | Only for cards that were **due** |
| Pass a cumulative review | 15 | Once per review set per day |
| Writing or speaking mission | 15 | Once per mission per day |
| Unit checkpoint pass | 50 | Once |
| Level mastery pass | 150 | Once |
| Exam mini-test | 20 | Max 3 per day |
| Full mock | 60 | Max 1 per day |

XP has no levels-for-levels' sake. It feeds a weekly XP chart and a few badges.

### 14.3 Achievements (each has a visible requirement)

| Badge | Requirement |
|---|---|
| Bonjour ! | Complete the first lesson and its recall |
| Sound Explorer | Pass the Unit 01 pronunciation and listening checkpoint |
| Word Collector | 50 vocabulary items **Established** |
| Memory Keeper | 7 different days with ≥ 90% review accuracy |
| Grammar Builder | Pass a cumulative grammar review with ≥ 85% |
| Conversation Starter | Complete the first speaking mission |
| Storyteller | Complete 5 writing missions |
| A1 / A2 / B1 / B2 Explorer | Pass the level mastery assessment |
| Exam Ready (TEF or TCF) | Practice estimates ≥ target in all 4 abilities on ≥ 3 tests within 30 days |

## 15. Optional AI Coach

**Off by default.** Without it, everything works through model answers, rubrics and self-assessment.

### 15.1 Capabilities

| Feature | Input | Output |
|---|---|---|
| Writing feedback | Learner text + task + rubric | Rubric scores, 3 strengths, 3 priority fixes, corrected version with changes highlighted, estimated NCLC band (labelled unofficial) |
| Speaking feedback | Transcript (Web Speech API or typed) + task | Content, organization and language feedback. **Explicitly no pronunciation judgment** |
| Conversation partner | Text chat role-play (e.g., TEF EO-A phone enquiry, EO-B persuasion) | Level-appropriate French replies, optional corrections after the exchange |
| Explain my mistake | A wrong answer + item | A short explanation and 2 new similar items |
| Author assistant (dev-only) | Lesson spec | Draft blocks, marked `reviewStatus: "ai-draft"`, **never auto-published** |

### 15.2 Implementation rules

- A **provider adapter** (`js/ai/provider.js`) defines `complete({system, messages, schema}) → JSON`. v1 ships an **Anthropic** adapter. Others MAY be added.
- **Bring your own key.** The key is entered in Settings. By default it is held **in memory only** for the session. An explicit "Remember on this device" checkbox stores it in `localStorage`, with a warning that anyone using this browser profile can read it. This is the single documented exception to "never store secrets locally", because the key belongs to the learner and never leaves their device except to the provider.
- Browser-direct calls to the Anthropic Messages API require the `anthropic-dangerous-direct-browser-access: true` header. This is acceptable only because the key is the user's own.
- **Model IDs are configurable.** Defaults: `claude-sonnet-5-5` for writing and speaking evaluation, `claude-haiku-5-5` for quick hints and conversation. Do not hardcode them in feature code.
- All prompts live in `data/ai/prompts.json`, versioned. Responses are requested as JSON and validated, and a malformed response shows "Feedback unavailable" and never crashes.
- **Every AI output carries the label:** *"AI feedback — may contain mistakes. Not an official score."*
- **Privacy notice before first use:** what is sent (text or transcript only, never audio files in v1), to whom, and that it is the learner's choice.
- A cost guard: show an estimated token count per request and a daily request cap (default 50).

## 16. Design system

**Mood:** a calm, premium digital textbook. Not a children's game, not an analytics portal, not a dense grammar reference.

### 16.1 Tokens (`css/tokens.css`)

```css
:root {
  /* Brand */
  --navy-900: #17263D;   /* primary text, nav */
  --ivory-50: #F6F3ED;   /* page background */
  --sage-100: #DDECE3;   /* success / mastery surface */
  --sage-700: #2F6B4F;   /* success text on sage */
  --lavender-100: #E8DDF6; /* hint surface */
  --lavender-700: #5B3F8C; /* hint text */
  --coral-600: #C2512F;  /* primary action accent */

  /* Semantic */
  --bg: var(--ivory-50);
  --surface: #FFFFFF;
  --surface-2: #EFEAE1;
  --text: var(--navy-900);
  --text-muted: #4A5568;
  --border: #DDD6CA;
  --accent: var(--coral-600);
  --accent-text: #FFFFFF;
  --success-bg: var(--sage-100);  --success-fg: var(--sage-700);
  --hint-bg: var(--lavender-100); --hint-fg: var(--lavender-700);
  --warning-bg: #FBEFD5;          --warning-fg: #7A4E00;
  --error-bg: #FBE4E1;            --error-fg: #A12A1E;
  --focus: #2B6CB0;

  /* Type */
  --font-ui: "Inter", system-ui, sans-serif;
  --font-fr: "Source Serif 4", Georgia, serif; /* French text stands out */
  --fs-base: 1.0625rem;  /* 17px */
  --lh-body: 1.65;
  --measure: 44rem;      /* ~700px lesson column */

  /* Space: 8px scale */
  --s-1: .25rem; --s-2: .5rem; --s-3: 1rem; --s-4: 1.5rem; --s-5: 2rem; --s-6: 3rem;
  --radius: 12px;
}
:root[data-theme="dark"] {
  --bg: #0F1724; --surface: #172234; --surface-2: #1E2B40;
  --text: #ECE8E0; --text-muted: #A9B4C4; --border: #2A3A52;
  --accent: #E07A5A; --accent-text: #10131A;
  --success-bg: #1C3A2D; --success-fg: #A7D8BE;
  --hint-bg: #2D2442;    --hint-fg: #D4C2F0;
  --warning-bg: #3A2E14; --warning-fg: #F2CF8A;
  --error-bg: #3D1C1A;   --error-fg: #F4A9A0;
  --focus: #7FB2F0;
}
```

- Theme: `system` (default, via `prefers-color-scheme`), `light` or `dark`, set on `<html data-theme>`.
- All text/background pairs MUST meet WCAG 2.2 AA (4.5:1 body, 3:1 large text and UI). Verify in CI or manually (§L).
- **French text** (examples, dialogue lines, answers) uses `--font-fr` and `lang="fr"`. English support text uses `--font-ui`, muted, `lang="en"`.
- Fonts are **self-hosted** (woff2, subset to Latin + Latin-1 + Latin Extended-A for œ) so the app works offline.
- Text size setting: 100% / 112.5% / 125% / 150% via root font-size.
- Motion: transitions ≤ 200 ms, all disabled under `prefers-reduced-motion` or the in-app setting.

### 16.2 Core components

Button (primary/secondary/ghost) · Card · ProgressBar · ProgressRing · Tag/Chip · AudioPlayer · Recorder · ExerciseShell (prompt / input / feedback) · FeedbackBanner (correct / almost / incorrect + explanation) · Collapsible (deep dives) · Timer · WordCounter · Toast (polite, `aria-live`) · Modal (confirmations only) · Tabs · EmptyState.

### 16.3 Navigation

- **Desktop (≥ 960 px):** left sidebar (Home, Learn, Review, Exam Lab, Progress, Settings), centered content, optional right outline in lessons.
- **Mobile:** bottom nav with 5 items (Home, Learn, Review, Exam, Profile). Settings sits inside Profile.
- The last location is saved, and "Continue" resumes the exact block.
- No unnecessary modals, autoplaying media or push notifications.

## 17. Screens and wireframes

### 17.1 Dashboard (desktop)

```
┌────────────┬──────────────────────────────────────────────────────────┐
│ FrenchQuest│  Bonjour ! · Day 23 · 🔥 9-day streak (1 rest day used)  │
│            │ ┌──────────────────────────────────────────────────────┐ │
│ ● Home     │ │ CONTINUE LEARNING                                    │ │
│ ○ Learn    │ │ A1 · Unit 03 · Lesson 4 — Telling time               │ │
│ ○ Review 32│ │ Step 3 of 6 · ~6 min left            [ Continue → ]  │ │
│ ○ Exam Lab │ └──────────────────────────────────────────────────────┘ │
│ ○ Progress │  TODAY'S PLAN (75 min)        │  REVIEW QUEUE            │
│ ○ Settings │  ☑ Reviews        10 min      │  32 due · ~9 min         │
│            │  ☐ New lesson     20 min      │  [ Start review ]        │
│            │  ☐ Listening      15 min      ├──────────────────────────┤
│            │  ☐ Speaking       15 min      │  SKILLS (rolling)        │
│            │  ☐ Mixed practice 10 min      │  Reading    ██████░ 78%  │
│            │  ☐ Error review    5 min      │  Listening  ████░░░ 58% ⚠│
│            │                               │  Writing    █████░░ 66%  │
│            │  RECOMMENDED NEXT             │  Speaking   ████░░░ 61%  │
│            │  → Slower listening + dictation (listening is weakest)   │
│            │  WEEK: ▇▇▅▇░▇▆  6h 40m · Forecast: A2 by Jan–Feb 2027    │
└────────────┴──────────────────────────────────────────────────────────┘
```

### 17.2 Dashboard (mobile)

```
┌──────────────────────────┐
│ Bonjour ! 🔥 9           │
│ ┌──────────────────────┐ │
│ │ CONTINUE             │ │
│ │ A1·U03·L4 Time       │ │
│ │ [ Continue → ]       │ │
│ └──────────────────────┘ │
│ Reviews due: 32 [Start]  │
│ Today ◔ 25/75 min        │
│ Next: Listening drill    │
├──────────────────────────┤
│ 🏠  📘  🔁  📝  👤        │
│ Home Learn Review Exam Me│
└──────────────────────────┘
```

### 17.3 Curriculum map

```
A1 Foundation ███████░░░ 7/12 units         [A1 checkpoint 🔒]
 ├ 01 Sounds & survival         ✓ mastered
 ├ 02 Introduce yourself        ✓ mastered
 ├ 03 Numbers, dates, time      ◐ 3/5   ▸ expand
 │    ├ 03-01 Numbers 0–20      ✓
 │    ├ 03-04 Telling time      ● in progress
 │    └ 03-05 Avoir             ○ available
 ├ 04 People & family           🔒 needs: Unit 03 checkpoint  [Test out]
A2 Everyday French              🔒
B1 · B2                         🔒
```

### 17.4 Lesson reader

```
← A1 · U02 · L02 Être and nationality          ▓▓▓▓▓░░░ Step 4/6   ⚙
──────────────────────────────────────────────────────────────────────
 YOUR GOAL: Say your nationality and ask someone else's.

 STEP 4 · RECALL
 Translate: "She is Canadian."
 ┌────────────────────────────────────────────┐
 │ Elle est canadienne.                       │
 └────────────────────────────────────────────┘
 [é è ê à ç ô œ]  ← accent bar      [ Check ]   [ Hint ]

 ✓ Correct! canadien → canadienne: add -ne in the feminine.
 ▸ Common mistakes   ▸ Pronunciation clinic
──────────────────────────────────────────────────────────────────────
                                                         [ Next → ]
```

### 17.5 Review session

```
Review · 12 / 32                                    ~6 min left   ✕
───────────────────────────────────────────────────────────────────
  🔊 (audio → meaning)
  What did you hear?
  ( ) I'm learning French      (•) I want to learn French
  ( ) I learned French         ( ) I'm going to learn French
                                                  [ Check ]
───────────────────────────────────────────────────────────────────
  Due today: vocab 20 · grammar 8 · sentences 4
```

### 17.6 Exam Lab

```
Exam Lab        [ TEF Canada ▾ ]  (TCF Canada)
Target: NCLC 7 in all four · Last verified tables: 2026-10-17
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ CO Listening  │ CE Reading    │ EE Writing    │ EO Speaking   │
│ est. NCLC 5–6 │ est. NCLC 6   │ est. NCLC 5   │ est. NCLC 5   │
│ conf: low     │ conf: medium  │ conf: low     │ conf: low     │
│ [Drill][Mock] │ [Drill][Mock] │ [Task A][B]   │ [Task A][B]   │
└───────────────┴───────────────┴───────────────┴───────────────┘
Stages: ✓ Familiarize  ● Drills  🔒 Mini-tests (B1·U6)  🔒 Mocks
Recent: CO mini-test 27/40 (Oct 15) · EE Task B 212 words (Oct 14)
⚠ Practice estimates are unofficial. Check IRCC for your program's requirements.
```

### 17.7 Timed exam task (TEF EE Section B)

```
TEF Canada · Expression écrite · Section B            ⏱ 28:14   ✕
Express and justify your point of view (≥ 200 words)
┌─────────────────────────────────────────────────────────────────┐
│ Prompt text…                                                    │
├─────────────────────────────────────────────────────────────────┤
│ [learner writing area]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
Words: 143 / ≥200   ☐ Position stated ☐ 2+ arguments ☐ Conclusion
                                         [ Submit ]
```

### 17.8 Progress and profile

Mastery by level and unit · items established over time (line) · weekly hours (bar) · skill trends (4 lines) · badges grid · writing/speaking portfolio · official results log · goals · data export/import/reset.

### 17.9 Settings

Theme · text size · reduced motion · show translations (always / on tap / never) · accent strictness (lenient / strict) · daily minutes · new cards/day · desired retention · rest days · audio speed default · speech recognition (on/off, fr-FR/fr-CA) · AI Coach (key, model, daily cap, privacy notice) · storage usage and "persist storage" · export/import/reset.

---

# Part II — Build specification

## A. Architecture and repository

### A.1 Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Stack | Semantic HTML, modern CSS, vanilla JS **ES modules**, JSON | No build step, runs straight from GitHub Pages, low maintenance |
| App shape | **Single `index.html` + hash router** (`#/lesson/a1-02-02`) | Avoids GitHub Pages 404s on refresh and deep links, and allows one service worker scope |
| Rendering | Small helper `h(tag, attrs, ...children)` + template literals with escaping | No framework, safe against injection from content |
| Storage | **IndexedDB** for learner data, `localStorage` for tiny UI prefs | Capacity, structured data and audio blobs |
| SRS | **FSRS** via a vendored, pinned ESM build of `ts-fsrs` (MIT) behind an adapter, falling back to an internal implementation | Proven algorithm, swappable |
| Hosting | GitHub Pages, project site (`/frenchquest/`) | Free HTTPS. All paths **relative** |
| Offline | Service worker (§H) | Study on the bus |
| Dev tooling | Optional Node scripts with **no dependencies** (`node --test`, a JSON validator) | Quality without a bundler |

### A.2 Repository layout

```
frenchquest/
├── index.html                  # app shell
├── manifest.webmanifest
├── sw.js                       # service worker (must sit at root for scope)
├── css/
│   ├── tokens.css  base.css  layout.css  components.css  lesson.css  exam.css
├── js/
│   ├── app.js                  # bootstrap, router init, migrations
│   ├── router.js
│   ├── ui/                     # h.js, components/*.js
│   ├── views/                  # home.js learn.js lesson.js review.js exam.js progress.js settings.js onboarding.js
│   ├── engine/
│   │   ├── content.js          # fetch + cache + validate content JSON
│   │   ├── lesson-runner.js    # step/block state machine
│   │   ├── exercises/          # one module per exercise type + registry.js
│   │   ├── evaluate.js         # answer normalization & matching (§D)
│   │   ├── srs.js              # FSRS adapter (§F)
│   │   ├── progress.js         # evidence, mastery, unlocking
│   │   ├── recommend.js        # rules (§13.3) + forecast
│   │   ├── gamification.js     # XP, streaks, badges
│   │   └── exam.js             # exam sessions, timing, NCLC estimation
│   ├── media/  audio.js  recorder.js  speech.js
│   ├── ai/     provider.js  anthropic.js  coach.js
│   ├── store/  db.js  migrations.js  export-import.js  prefs.js
│   └── vendor/ ts-fsrs.mjs (pinned, with LICENSE)
├── data/
│   ├── course.json             # level → unit → lesson index (IDs, titles, prerequisites)
│   ├── lessons/a1/a1-01-01.json …
│   ├── items/vocab-a1.json  grammar-a1.json  sentences-a1.json …
│   ├── exam/
│   │   ├── tef/ format.json  nclc.json  rubrics.json  items-co.json  items-ce.json  tasks-ee.json  tasks-eo.json
│   │   └── tcf/ (same files)
│   ├── gamification.json  diagnostic.json
│   └── ai/prompts.json
├── assets/ audio/a1/…  fonts/  icons/  img/
├── tools/  validate.mjs  build-sw-manifest.mjs  audio-check.mjs
├── tests/  *.test.mjs  (node --test) + tests/browser.html
├── CONTENT-GUIDE.md  LICENSES.md  README.md
```

### A.3 Routes

`#/` home · `#/onboarding` · `#/learn` · `#/learn/:level` · `#/lesson/:lessonId[/:step]` · `#/review` · `#/exam/:exam` · `#/exam/:exam/:ability/:mode/:setId` · `#/progress` · `#/portfolio/:entryId` · `#/settings`.
Unknown routes go to home with a toast. When a route changes, focus moves to the view's `<h1>` (accessibility).

### A.4 Security model (state it in the README)

- Content JSON is public, so answers are visible. This is acceptable for self-study, **not for secure testing**.
- No server, so there are no server-validated scores and no accounts.
- All content strings are rendered as **text** unless a field is explicitly `"format": "md-lite"`, which is passed through a whitelist renderer (bold, italic, line breaks only). No `innerHTML` with raw content.
- A Content Security Policy via `<meta http-equiv>`: `default-src 'self'; connect-src 'self' https://api.anthropic.com; media-src 'self' blob:; img-src 'self' data:; style-src 'self'; script-src 'self'`.

## B. Module contracts

| Module | Public API (sketch) |
|---|---|
| `content.js` | `getCourse()`, `getLesson(id)`, `getItems(ids)`, `getExam(exam, file)`. Caches results in memory, validates `schemaVersion` |
| `lesson-runner.js` | `start(lessonId, resumeAt?)` → runner, then `runner.next()`, `runner.submit(answer)`, `runner.state`, and events `blockchange`, `complete` |
| `exercises/registry.js` | `register(type, {render, evaluate})`, `get(type)`. Each type module exports `render(exercise, ctx) → HTMLElement` and `evaluate(exercise, answer) → Result` |
| `evaluate.js` | `normalize(str, opts)`, `matchText(answer, accepted[], opts) → {status: 'correct'|'almost'|'incorrect', diff, note}` |
| `srs.js` | `newCard(itemId, cardType)`, `grade(card, rating, now) → {card, log}`, `due(now, limit)`, `retrievability(card, now)` |
| `progress.js` | `recordAttempt(attempt)`, `lessonStatus(id)`, `unitStatus(id)`, `isUnlocked(id)`, `skillScores()` |
| `recommend.js` | `todayPlan(date)`, `nextActions(n)`, `forecast()` |
| `gamification.js` | `award(event)`, `streak()`, `checkBadges()` |
| `exam.js` | `startSession(exam, ability, mode, setId)`, `submit()`, `estimateNCLC(exam, ability, raw, total)` → `{range:[lo,hi], confidence}` |
| `db.js` | `get/put/delete/query(store, …)`, `tx(stores, fn)` |
| `export-import.js` | `exportAll({includeRecordings})` → Blob, `importFile(file)` → validation report, then a confirm step |
| `ai/coach.js` | `evaluateWriting(task, text)`, `evaluateSpeaking(task, transcript)`, `converse(scenario, history)`, `explain(item, answer)` |

**Rule:** views never touch IndexedDB directly. They go through engine modules.

## C. Content schemas

Every content file has `"schemaVersion": 1`. Every entity has a stable `id`. IDs are **never reused or renamed** after publishing: learner data references them.

### C.1 `course.json`

```json
{
  "schemaVersion": 1,
  "levels": [{
    "id": "a1", "title": "Foundation", "outcome": "Basic communication",
    "units": [{
      "id": "a1-02", "title": "Introduce yourself",
      "prerequisites": ["a1-01"],
      "checkpointLessonId": "a1-02-05",
      "lessons": [
        {"id": "a1-02-01", "title": "Je m'appelle…", "minutes": 10, "status": "published"}
      ]
    }]
  }]
}
```

### C.2 Lesson file

```json
{
  "schemaVersion": 1,
  "id": "a1-02-02",
  "level": "a1", "unitId": "a1-02",
  "title": "Être and nationality",
  "goal": "Say your nationality and ask someone else's.",
  "minutes": 10,
  "prerequisites": ["a1-02-01"],
  "skills": ["grammar", "writing", "speaking"],
  "newItems": ["v-etre", "v-canadien", "g-etre-present", "g-adj-nationality-gender"],
  "reviewLinks": ["a1-02-01"],
  "steps": [
    {"step": "discover", "blocks": [
      {"id": "b1", "type": "dialogue", "audio": "audio/a1/a1-02-02-d1.mp3",
       "lines": [
         {"speaker": "Camille", "fr": "Tu es canadien ?", "en": "Are you Canadian?", "audioStart": 0.0},
         {"speaker": "Alex", "fr": "Non, je suis indien. Et toi ?", "en": "No, I'm Indian. And you?", "audioStart": 1.8}
       ]}
    ]},
    {"step": "understand", "blocks": [
      {"id": "b2", "type": "grammar", "grammarId": "g-etre-present",
       "summary": "Être = to be. It is irregular, so learn it as a chunk.",
       "table": {"rows": [["je", "suis"], ["tu", "es"], ["il/elle/on", "est"], ["nous", "sommes"], ["vous", "êtes"], ["ils/elles", "sont"]]},
       "deepDives": [{"kind": "mistakes", "title": "Common mistakes", "body": "…"}]}
    ]},
    {"step": "hear", "blocks": [{"id": "b3", "type": "listen-repeat", "itemIds": ["s-je-suis-indien"]}]},
    {"step": "recall", "blocks": [
      {"id": "ex1", "type": "translate", "skill": "writing",
       "prompt": "She is Canadian.",
       "accept": ["Elle est canadienne."],
       "hints": ["Feminine adjective: add -ne"],
       "feedback": {"incorrect": "Canadien becomes canadienne in the feminine."},
       "itemIds": ["v-canadien", "g-adj-nationality-gender"]}
    ]},
    {"step": "apply", "blocks": [
      {"id": "ex2", "type": "write", "prompt": "Write 2 sentences: your nationality and where you live. Then ask a question.",
       "wordRange": [10, 40], "rubricId": "generic", "modelAnswers": [{"label": "A1", "fr": "Je suis indien. J'habite à Toronto. Et toi, tu es de quelle nationalité ?"}]}
    ]},
    {"step": "review", "blocks": [{"id": "b9", "type": "review-mix", "count": 6}]}
  ],
  "completion": {"recallFirstTryThreshold": 0.8},
  "meta": {"author": "…", "reviewStatus": "reviewed", "reviewedBy": "…", "reviewedOn": "2026-11-02", "sources": []}
}
```

**Block types:** `dialogue`, `text`, `audio`, `vocab`, `grammar`, `listen-repeat`, `note`, `review-mix`, plus every exercise type below.

### C.3 Exercise types (all share `id`, `type`, `skill`, `itemIds[]`, `feedback`, optional `hints[]`, `microSkills[]`)

| Type | Specific fields | Evaluation |
|---|---|---|
| `mcq` | `prompt`, `options[]`, `answer` (index or indices), `optionFeedback[]` | Exact |
| `cloze` | `text` with `{{1}}` gaps, `gaps: [{accept[], options?[]}]` | Per-gap text match |
| `translate` | `prompt` (EN), `accept[]` (FR) | Text match (§D) |
| `reorder` | `tiles[]`, `accept[]` (sentences) | Join + text match |
| `match` | `pairs: [[fr, en]]` | All pairs correct, partial credit recorded |
| `listen-mcq` | `audio`, `prompt`, `options[]`, `answer`, `maxPlays?` | Exact |
| `dictation` | `audio`, `accept[]` | Text match, lenient on punctuation |
| `speak` | `prompt`, `seconds`, `modelAudio?`, `rubricId`, `expectedKeywords?[]` | Self-rubric, optional STT keyword check, optional AI |
| `write` | `prompt`, `wordRange`, `rubricId`, `modelAnswers[]`, `checklist[]` | Self-rubric, optional AI |
| `roleplay` | `scenario`, `turns[]` (scripted) or `aiScenarioId` | Scripted: per-turn match. AI: coach |

### C.4 Vocabulary item

```json
{
  "id": "v-apprendre", "type": "vocab",
  "fr": "apprendre", "en": ["to learn"], "pos": "verb",
  "gender": null, "article": null,
  "conjugationRef": "c-prendre-family",
  "examples": [{"fr": "J'apprends le français tous les jours.", "en": "I learn French every day.", "audio": "audio/items/v-apprendre-ex1.mp3", "source": "original"}],
  "audio": "audio/items/v-apprendre.mp3",
  "ipa": "/a.pʁɑ̃dʁ/",
  "level": "a1", "topics": ["daily-life", "education"], "grammarTags": ["irregular-re"],
  "commonErrors": ["*j'apprend* → j'apprends"],
  "related": ["v-comprendre", "v-prendre"],
  "frequencyRank": 412,
  "cardTypes": ["fr-en", "en-fr", "audio-en"]
}
```

Nouns MUST have `gender` (`m`/`f`) and `article`. Learners see "le livre (m)" and never a bare "livre".

### C.5 Grammar item

`{id, type: "grammar", title, level, summary, rules[], examples[], commonErrors[], drillTemplates: [{type: "cloze", text, accept}], related[]}`. Drill templates generate review cards with fresh sentences.

### C.6 Sentence item

`{id, type: "sentence", fr, en, audio, level, tags, source, license}`. Tatoeba-sourced sentences carry `source: "tatoeba:<id>"` and `license: "CC BY 2.0 FR"` (§K.2).

### C.7 Exam item and task

```json
{
  "id": "tef-co-0001", "exam": "tef", "ability": "co",
  "formatSection": "co", "level": "b1", "microSkills": ["speaker-intention"],
  "audio": "audio/exam/tef/co-0001.mp3", "maxPlays": 1,
  "prompt": "…", "options": ["…", "…", "…", "…"], "answer": 2,
  "explanation": "…", "transcript": "…",
  "meta": {"origin": "original", "reviewStatus": "reviewed"}
}
```

Writing and speaking tasks: `{id, exam, ability: "ee"|"eo", section: "A"|"B"|"T1"|"T2"|"T3", prompt, documents[], timeMinutes, wordMin, wordMax, rubricId, modelAnswers[{nclcBand, text}], strategyNotes}`.

### C.8 Exam format and NCLC table (data, not code)

```json
{
  "schemaVersion": 1, "exam": "tef",
  "verifiedOn": "2026-10-17",
  "sourceUrl": "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html",
  "scoreBasis": "equivalence-ancien-score",
  "abilities": {
    "eo": [{"nclc": 7, "min": 310, "max": 348}],
    "co": [{"nclc": 7, "min": 249, "max": 279}],
    "ce": [{"nclc": 7, "min": 207, "max": 232}],
    "ee": [{"nclc": 7, "min": 310, "max": 348}]
  }
}
```

(The real file contains NCLC 4–10 for each ability, from §5.2 and §5.3.) `format.json` holds per-épreuve duration, item counts, sections, word limits and playback rules.

### C.9 Validation (`tools/validate.mjs`, zero dependencies)

It checks: JSON parses · `schemaVersion` present · IDs are unique across all files · every referenced ID exists (items, lessons, prerequisites, audio files on disk) · every `accept[]` is non-empty · every `mcq.answer` is in range · nouns have gender · NFC-normalized strings · no straight `'` in French where the content style requires `’` (configurable) · `reviewStatus` is `reviewed` for anything with `status: "published"`. It exits non-zero on error and runs before every commit and deploy.

## D. Answer evaluation rules (`evaluate.js`)

### D.1 Normalization pipeline (applied to both answer and accepted strings)

1. Unicode **NFC** normalization.
2. Trim. Collapse whitespace, including NBSP and narrow NBSP (U+00A0, U+202F), to a single space.
3. Map `’ ‘ ʼ` → `'`. Map `« »` and `“ ”` → `"`. Map `œ` ↔ `oe` and `æ` ↔ `ae` as equivalent.
4. Remove the space before `? ! : ;` (French typography differs, so it is never penalized).
5. Case-insensitive.
6. Ignore final punctuation. Internal punctuation is ignored unless the item sets `strictPunctuation`.

### D.2 Match outcomes

| Outcome | Condition | Grade for SRS |
|---|---|---|
| `correct` | Matches an accepted answer after normalization | Good (Easy if fast production) |
| `almost` | Matches only after **removing diacritics** (accent error) **or** has one typo (Damerau–Levenshtein distance 1 on words ≥ 5 letters) | Hard. Counted correct in **lenient** mode, incorrect in **strict** mode. Always shows the exact correction |
| `incorrect` | Anything else | Again |

- Accent errors that change meaning (e.g., *a* vs *à*, *ou* vs *où*, *du* vs *dû*) are on a **minimal-pair list** and are always `incorrect`.
- Elision is required: `je ai` is incorrect for `j'ai`, with targeted feedback.
- Show a word-level diff for `almost` and `incorrect`.

### D.3 Accepted answers

Authors list all reasonable variants (`tu`/`vous`, inversion vs *est-ce que*, optional *ne* not accepted in written answers). The validator warns when a `translate` exercise has only one accepted answer and its prompt contains *you*.

### D.4 Word counting (writing tasks)

A word is a sequence of letters separated by spaces. Elided forms count as 2 (`l'homme` = 2), hyphenated compounds count as 1, numbers count as 1, and punctuation is not counted. Show the rule in a tooltip. (Exam bodies may count differently, so the app warns near the limits.)

### D.5 Accent input

An on-screen accent bar (é è ê ë à â î ï ô û ù ü ç œ, plus capitals with Shift) sits under every text input. Typing shortcuts are listed in a tooltip.

## E. Learner data and persistence

### E.1 Stores (IndexedDB `frenchquest`, version 1)

| Store | Key | Contents |
|---|---|---|
| `meta` | `key` | `schemaVersion`, `createdAt`, `lastOpened`, onboarding result, goals, `examChoice` |
| `lessonProgress` | `lessonId` | `status` (`locked`/`available`/`in-progress`/`completed`/`completed-weak`/`tested-out`), `currentStep`, `firstTryAccuracy`, `completedAt`, `attempts` |
| `cards` | `cardId` (`itemId:cardType`) | FSRS fields (`due`, `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`, `last_review`) |
| `reviewLog` | auto | `cardId`, `rating`, `reviewedAt`, `elapsedDays`, `latencyMs` |
| `attempts` | auto | Exercise attempts (§13.2), indexed by `skill` and `timestamp` |
| `portfolio` | `id` | Writing/speaking submissions, self-scores, AI feedback (if any) |
| `recordings` | `id` | Audio blobs + `mimeType`, `durationMs`, linked `portfolioId`/`exerciseId` |
| `examSessions` | `id` | Exam, ability, mode, answers, raw score, timing, estimate |
| `officialResults` | `id` | Learner-entered official scores (both TEF scales), test date, expiry (date + 2 years) |
| `gamification` | `key` | XP ledger, streak, freezes, badges |
| `daily` | `date` | Minutes studied per block, plan completion |

`localStorage` holds **only** `fq.prefs` (theme, text size, motion, translation mode). It is read synchronously so the first paint has no flash of the wrong theme.

### E.2 Rules

- Save after every meaningful action: exercise submit, step change, review grade, recording stop.
- On boot, call `navigator.storage.persist()` and show storage status in Settings, because browsers may evict non-persistent storage.
- Corrupted or missing data: catch, log, and offer "Restore from backup file" or "Start fresh". The app never shows a white screen.
- **Migrations:** `migrations.js` holds ordered `{from, to, up(db)}` steps, run on `onupgradeneeded`. Before running, it auto-exports a backup into the `meta` store, keeping the last one.
- **Export:** a single JSON file `frenchquest-backup-YYYY-MM-DD.json` with `{app: "frenchquest", schemaVersion, exportedAt, stores: {...}}`. Recordings are optional (base64 can be large, so show the size first).
- **Import:** validate the app name, schemaVersion (≤ current, migrate up), types and ID references. Show a summary ("1,240 cards, 37 lessons, 12 recordings") and require confirmation. The choice is **replace**, or **merge** (newer timestamp wins per record).
- **Reset:** type `RESET` to confirm, and an export is offered first.
- **Reminder:** if there has been no export for 14 days, show a gentle banner once per week ("Back up your progress").

## F. Spaced-repetition implementation

- `srs.js` wraps FSRS (via a vendored, pinned `ts-fsrs` ESM build) behind the API in §B. If the vendor module fails to load, it falls back to a minimal internal scheduler (SM-2-style: interval × ease, ease 1.3–2.5, lapses reset to 1 day) so that reviews never break. The fallback is logged and shown in Settings → Diagnostics.
- Parameters: library defaults, `request_retention` from Settings (default 0.9), `maximum_interval` 365 days, fuzz on.
- **Learning steps for new cards:** 1 min → 10 min (same session) → then FSRS takes over. This replaces v1's fixed "later today / 1 / 3 / 7 / 14 / 30 days" table, which FSRS's adaptive intervals supersede.
- **Optimizer (post-MVP, MAY):** after ≥ 1,000 reviews, offer "Personalize my schedule", which fits FSRS weights from `reviewLog` (in a Web Worker).
- **Session building:** due cards sorted by lowest retrievability, interleaved by item type and topic (never > 3 consecutive cards from the same lesson), then new cards up to the daily limit, mixed into the second half.
- **Sibling burying:** cards of the same item in different directions are never shown on the same day unless the learner asks.

## G. Audio, recording and speech

- **Format:** `.mp3`, mono, 64–96 kbps, 44.1 kHz, loudness-normalized (around −16 LUFS), ≤ 300 ms of leading silence. Name files after IDs (`a1-02-02-d1.mp3`, `v-apprendre.mp3`).
- **Voices:** at least 2 speakers (female/male). From A2, include Canadian French speakers. From B1, include other francophone accents.
- **Slow version:** `playbackRate = 0.75` with `preservesPitch = true`. For key dialogues in Unit 01 a separately recorded slow file MAY be provided (`-slow.mp3`).
- **Dialogue sync:** `audioStart` per line enables tap-to-play-line and highlighting.
- **Recorder:** `MediaRecorder` with feature-detected MIME type (`audio/webm;codecs=opus`, falling back to `audio/mp4`). Max 3 min per recording. Show a level meter. Ask for permission only on first use, with an explanation. Recordings stay in IndexedDB, and each one can be deleted individually or all at once.
- **Speech recognition:** feature-detect `SpeechRecognition || webkitSpeechRecognition`. When unavailable, hide the feature rather than showing it disabled. Explain that some browsers process speech on remote servers. Off by default.
- **Exam audio rules:** `maxPlays` is enforced, there is no seeking, and the transcript is hidden until the session ends.

## H. Offline support (PWA)

- `manifest.webmanifest` with relative `start_url: "./"`, `scope: "./"`, icons 192/512 and theme colors.
- `sw.js`: the app shell (HTML, CSS, JS, fonts, `course.json`) is **precached** with a versioned cache name generated by `tools/build-sw-manifest.mjs`. Lesson JSON and audio use **stale-while-revalidate**, cached on first use. A "Download this unit for offline" button prefetches a unit's lessons and audio.
- Updates: a new SW waits. A toast says "Update available — reload". The app never reloads mid-lesson automatically.
- AI calls are never cached. Offline, AI buttons show "Needs internet".

## I. Accessibility requirements (WCAG 2.2 AA)

- Semantic landmarks (`header`, `nav`, `main`). One `<h1>` per view. A skip link.
- Every interactive element is reachable and operable by keyboard. Visible focus ring (`--focus`, 3:1 contrast).
- Exercise keyboard map: `Enter` = check/next, `1–4` = choose an option, `Space` = play audio, `H` = hint, `R` = replay. Listed under `?`.
- Feedback is announced through an `aria-live="polite"` region. Correct/incorrect is never shown by color alone (icon + text).
- `lang="fr"` on all French text, so screen readers switch voice.
- Reorder (tiles) has a keyboard alternative (select a tile, then a position) as well as drag.
- Timers: in practice mode, the learner can **pause or extend** them (WCAG 2.2.1). Exam-simulation mode states that timing is strict and offers an "accessibility: extended time ×1.5" toggle, marked on results.
- Target size ≥ 24×24 px (44×44 on mobile). Text resizable to 200% without horizontal scroll at 320 px width.
- Every audio item has a transcript (hidden only during comprehension questions).

## J. User stories and acceptance criteria

Format: **Story** → *Acceptance criteria* (testable). Milestone in brackets.

### J.1 Onboarding [M1]
- **As a new learner, I want a short setup so that the app plans my study.**
  - First visit with no data → onboarding route.
  - It captures goal, exam (TEF/TCF/undecided), daily minutes and optional target date. It can be finished in under 3 minutes without the diagnostic.
  - The diagnostic is optional (and can be skipped). If taken, the start lesson is set and lower lessons become `tested-out`.
  - The honest timeline card (§2) is shown with numbers computed from the learner's own daily minutes.

### J.2 Dashboard [M1]
- **I want to see what to do next in one glance.**
  - Exactly one primary "Continue" button. It resumes the exact lesson step.
  - Today's plan sums to the chosen daily minutes, and each item links to its activity.
  - Review count and estimated minutes (average seconds per card from `reviewLog`, default 15 s).
  - With zero data, the dashboard shows a welcoming empty state with a "Start lesson 1" CTA and no zeros or blank charts.

### J.3 Curriculum [M1]
- Levels, units and lessons with status icons. Locked units show their prerequisite and a "Test out" action (from M3).
- Expanding and collapsing works by keyboard. The current lesson is auto-scrolled into view.

### J.4 Lesson reader [M1]
- It renders every block type in §C.2 from JSON alone. Adding a lesson requires **no code change**.
- Progress bar by step. Deep dives are collapsed by default. A translation toggle respects the settings.
- Leaving mid-lesson and returning resumes at the same block.
- The completion rule in §8.3 is applied, and the result screen shows accuracy, new items added to review, XP and the next recommendation.

### J.5 Exercises [M1: mcq, translate, cloze, reorder, listen-mcq · M2: match, dictation, speak, write · M4: roleplay]
- Each type works with keyboard and touch and announces feedback.
- `translate`/`cloze`/`dictation` follow §D. The `almost` state shows an exact correction.
- Every incorrect answer shows the authored explanation, with a generic fallback if none was authored.
- The attempt is recorded with skill, microSkills, latency and hint usage.

### J.6 Review [M2]
- Cards are generated for `newItems` on lesson completion.
- Sessions follow §F (ordering, interleaving, burying, limits).
- Grades are inferred (§9.3), and the FSRS state is updated and persisted after **each** card.
- Backlog protection (§9.4) triggers and is explained.
- An "Established" count is visible in Progress.

### J.7 Audio and speaking [M1: player · M2: recorder, listen-repeat, speaking missions · M3: STT]
- The player has every control in §11.1. Speed changes keep pitch.
- The recorder works on Chrome, Edge, Firefox and Safari (latest). A denied permission shows recovery instructions.
- A/B compare plays the model, then the learner's recording.
- STT is hidden when unsupported and labelled experimental when shown.

### J.8 Writing [M2]
- Live word count (§D.4), a checklist and model answers after submission. The self-rubric is saved to the portfolio.
- Portfolio entries list by date and task and can be reopened and compared.

### J.9 Progress and gamification [M3]
- XP follows `data/gamification.json`, and the repeat policies are enforced (a test proves you cannot farm XP).
- Streaks respect rest days and freezes. Badges show their requirement before they are earned.
- Charts have text alternatives (summary sentence + data table toggle).

### J.10 Exam Lab [M4: TEF stages 1–3 · M5: TEF mocks, TCF track]
- Exam switcher. All format values are read from `format.json`, and changing that file changes the timers without code edits.
- CO mock: `maxPlays` is enforced, there is no seeking, and the timer matches the format.
- The results screen follows §12.4, with error categories by microSkill and a linked remediation lesson.
- The NCLC estimate is shown as a range with a confidence label and an "unofficial" notice. Unit test: no code path outputs a single precise score.
- Official result entry stores both TEF scales and computes the expiry date (+2 years), with a warning 90 days before expiry.

### J.11 Settings and data [M2]
- Export → import round-trip reproduces identical data (automated test).
- Importing malformed, older or newer-schema files gives a clear message and never partially writes data (all-or-nothing transaction).
- Reset requires typed confirmation.
- Storage usage and persistence status are displayed.

### J.12 AI Coach [M4]
- Off by default, and every feature works without it.
- The key is held in memory unless "Remember on this device" is checked. The privacy notice is shown before the first request.
- Writing feedback returns schema-valid JSON, rendered as rubric + fixes + corrected text. Invalid JSON → graceful message.
- Every output carries the AI disclaimer. The daily cap is enforced.

### J.13 Offline [M3]
- After one full visit, airplane mode still allows home, curriculum, cached lessons and reviews.
- "Download unit" caches every file the unit references (verified by the asset checker).

## K. Content pipeline, sourcing and QA

### K.1 Lesson publishing workflow

1. Write the can-do objective ("Learner can ask for and give a phone number").
2. List the required vocabulary and grammar, and check prerequisites against `course.json`.
3. Write natural French examples at the level (native-sourced or reviewed).
4. Write a short explanation and a model dialogue.
5. Design recall, listening and production exercises (≥ 6 recall items, ≥ 1 production).
6. Write feedback for every likely wrong answer.
7. Link to earlier items (`reviewLinks`, `itemIds`).
8. Record or source the audio, then run `audio-check.mjs`.
9. Run `validate.mjs`, render it locally and work through it on mobile.
10. Get a fluent-speaker review → `reviewStatus: "reviewed"` → `status: "published"`.

### K.2 Sources and licensing

| Need | Option | License note |
|---|---|---|
| Example sentences (+ some audio) | **Tatoeba** | Sentences CC BY 2.0 FR. Audio licenses vary per contributor, so check each one. Attribute in `LICENSES.md` |
| Frequency lists | **Lexique** (lexique.org) | Check the current license terms before redistributing |
| Definitions/IPA reference | Wiktionary | CC BY-SA, so derived text must be share-alike. Prefer using it as a reference only |
| Original dialogues, exam items | Written in-house (AI-drafted allowed) | Must be reviewed by a fluent speaker. Mark `origin` |
| Audio | Self-recorded native speakers (tutor, volunteers) | Get written recording consent and a license grant |
| Learner's parallel study while building | TV5MONDE *Apprendre le français*, RFI *Journal en français facile*, official TEF/TCF sample tests (for familiarization only, **not** copied into the bank) | Use on their own sites |

Never scrape copyrighted textbooks or official exam papers into the repository.

### K.3 QA checklist (per lesson)

French accurate and natural · level-appropriate · grammar explained with examples · vocabulary has context, audio and gender · the learner must produce French · feedback explains errors · links to earlier material · audio checked by a fluent speaker · accessible and mobile-tested · exam items checked against `format.json` and the official specs.

### K.4 Status lifecycle

`draft` → `ai-draft` (if AI-generated) → `in-review` → `reviewed` → `published` → `deprecated` (kept for ID stability, hidden from the path). Only `published` lessons appear in the path. A dev toggle in Settings → Diagnostics shows drafts for the builder.

## L. Testing and release checklist

**Automated (Node, no dependencies, `node --test`):** `evaluate.js` (normalization, minimal pairs, elision, word count) · `srs.js` (scheduling monotonicity, fallback) · `progress.js` (completion and unlock rules) · `gamification.js` (repeat policies, streak with rest days and freezes) · `exam.js` (NCLC range lookup against fixture tables, confidence labels) · export/import round-trip · `validate.mjs` on all content.

**Manual, before each release:**
- Chrome, Firefox and Safari (macOS + iOS), Edge. Android Chrome.
- Refresh on every route, and deep links from a cold start on the deployed URL (`/frenchquest/`).
- First-run with empty storage. Run with corrupted storage (manually break a record).
- Keyboard-only run through a full lesson and review. Screen reader smoke test (NVDA or VoiceOver).
- 200% text and 320 px width. Dark mode contrast spot check.
- Offline run after a cached visit.
- Accents and special characters (œ, «  », ’) render and match correctly.
- Microphone permission denied and granted paths.
- Run a Lighthouse audit (target ≥ 90 for accessibility, best practices and PWA).

## M. Roadmap and definitions of done

Estimates assume one part-time builder. **Content production dominates the timeline**, especially reviewed audio.

| Milestone | Scope | Definition of done |
|---|---|---|
| **M0 — Setup** (week 1) | Repo, Pages deploy, tokens, app shell, router, `db.js`, `validate.mjs`, README | The deployed URL loads the shell offline-capable. Validator runs |
| **M1 — Vertical slice** (weeks 1–3) | Onboarding (no diagnostic), dashboard, curriculum, lesson runner, 5 exercise types, audio player, the **5 ★ lessons**, basic progress | A learner completes all 5 lessons on mobile and desktop. Progress survives a reload. J.1–J.5 pass for the M1 scope |
| **M2 — Learning engine** (weeks 3–6) | FSRS review, remaining core exercise types, recorder, speaking and writing missions, portfolio, export/import/reset, settings | J.5–J.8 and J.11 pass. Export/import round-trip test is green |
| **M3 — Complete A1** (weeks 6–12) | All 60 A1 lessons published, unit checkpoints, A1 mastery assessment, diagnostic, gamification, adaptive rules, PWA offline, STT (experimental) | The first learner can study A1 end-to-end in FrenchQuest. J.9 and J.13 pass. Lighthouse targets met. **This is the MVP** |
| **M4 — A2 + Exam Lab (TEF)** (months 3–5) | A2 content, Exam Lab stages 1–3 for TEF, AI Coach, roleplay, TEF/TCF decision helper | J.10 (M4 scope) and J.12 pass. The exam choice is confirmed |
| **M5 — B1 + mocks + TCF** (months 5–9) | B1 content, TEF full mocks, TCF track stages 1–4, NCLC dashboard, official results log | J.10 fully passes |
| **M6 — B2 + public release** | B2 content, polish, licensing audit, onboarding for strangers, feedback link (e.g., GitHub Issues), docs | A stranger can onboard and study without help (tested with ≥ 3 users) |
| Later | C1, FSRS optimizer, cloud sync (only if real demand), more accents and exam types | — |

**Re-plan triggers:** content review is unavailable for more than 2 weeks · the M1 slice reveals a confusing lesson structure · official exam formats change.

## N. Success metrics (computed locally; no tracking in v1)

| Metric | Signal |
|---|---|
| Delayed recall accuracy (reviews on cards ≥ 7 days old) | Is it sticking? Target ≥ 85% |
| Items Established over time | Durable vocabulary growth |
| First-try accuracy by lesson | Which lessons are too hard or badly written (flag < 60%) |
| Error patterns by microSkill | Where to add content |
| Skill rolling scores and gaps | Balanced four-skill progress |
| Writing/speaking rubric trend | Production quality |
| Weekly study minutes vs target | Consistency |
| Exam practice estimates vs target | Distance to NCLC 7 |

**The key metric is retained, usable French.** Twenty well-retained lessons beat thirty forgotten ones.

For public release, any analytics MUST be opt-in, anonymous and documented.

## O. Risks and open questions

| Risk | Impact | Mitigation |
|---|---|---|
| Content volume (240 lessons + exam banks) | Very high | Vertical slice first, an AI-drafted plus human-reviewed pipeline, reuse of open sentence corpora, and publish level by level |
| No fluent reviewer available | High | Budget a tutor for review hours. Keep unreviewed content hidden behind the dev toggle |
| Audio production effort | High | Record in batches per unit with a script sheet. TTS only for non-core extras |
| Exam formats or IRCC tables change | Medium | Everything lives in data files with `verifiedOn`. Re-verify quarterly and before mocks |
| Browser storage eviction or device loss | Medium | `storage.persist()`, export reminders, import/merge |
| Safari quirks (IndexedDB, MediaRecorder MIME, no STT) | Medium | Feature detection, fallbacks, test on iOS every release |
| Overconfidence from practice estimates | Medium | Ranges, confidence labels, unofficial notices |
| Builder spends all study time building | High (for the goal) | Fixed study block daily regardless of build progress (§2) |
| AI feedback errors | Medium | Disclaimers, rubric grounding, never used for scoring official-looking results |

**Open questions (resolve by the milestone noted):**
1. TEF vs TCF final choice. [M4, using the decision helper]
2. Who reviews content, and what is the budget? [Before M1 content is published]
3. Exact TCF oral per-task timings from the official manual. [Before the TCF build in M5]
4. Should the app include optional English UI → French UI immersion mode? [M4]
5. Licensing of any third-party audio. [Per source, before use]

## P. Sources (verified 2026-10-17)

- IRCC — Language test equivalency charts and Express Entry rules: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html>
- TEF Canada — official page (Le français des affaires, CCI Paris Île-de-France): <https://www.lefrancaisdesaffaires.fr/tests-diplomes/test-evaluation-francais-tef/tef-canada/>
- TCF Canada — France Éducation international: <https://www.france-education-international.fr/test/tcf-canada>
- Council of Europe — CEFR descriptors: <https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors>
- FSRS — Open Spaced Repetition project: <https://github.com/open-spaced-repetition>
- Tatoeba (sentence corpus, CC BY 2.0 FR): <https://tatoeba.org>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>

---

*Learn French. Remember it. Use it. Prove it.* Build the system that teaches, proves learning, and always knows what you should do next.
