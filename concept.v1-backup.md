# FrenchQuest — The complete blueprint for your French-learning platform

Product strategy · A1–B2 curriculum · TEF Canada + TCF Canada · Learning science · UI/UX · Gamification · Static web architecture

Your answers point toward a specific kind of product: a personalized, self-paced French academy designed for serious learners who need measurable progress toward Canadian immigration language requirements.

It should start with your current knowledge of basic greetings, support 60–90 minutes of daily study, and gradually take you from foundational French to independent B2-level communication and exam-specific practice.

It should also be designed well enough that, once the content has been validated, other learners can use it without needing you to explain how everything works.

The key is to build a learning system first and a website second.

Your HTML, CSS, JavaScript, and JSON stack is sufficient for a sophisticated first version. You do not need a backend, a framework, or paid infrastructure to create the core experience.

## 1. Product identity and positioning

Language Learning App UI Concept by Abu Rayhan on Dribbble

# FrenchQuest

Working title · A French learning journey built around real-world ability and Canadian immigration goals

Learn French. Remember it. Use it. Prove it.

A structured French-learning platform that combines a guided CEFR curriculum, memory-based practice, four-skill training, and dedicated TEF Canada and TCF Canada preparation.

### The product's central promise

At any point, the learner should be able to answer five questions:

1. What am I learning today?
2. Why am I learning it?
3. How do I use it in real French?
4. What have I forgotten and need to review?
5. How does this help me progress toward my language and exam goals?

If every screen helps answer at least one of these questions, the product will have a coherent purpose.

### Your design principles

- Clarity before complexity: explain one concept at a time.
- Practice before passive consumption: every lesson asks learners to retrieve or use French.
- Mastery before unlocking: completion alone does not prove proficiency.
- Consistency before intensity: daily progress matters more than occasional marathons.
- Real French before artificial exercises: use natural conversations, authentic contexts, and meaningful tasks.
- Exam preparation without exam obsession: build language proficiency first while introducing relevant exam skills progressively.
- Accessible by default: mobile-friendly layouts, readable typography, keyboard support, and optional reduced motion.

## 2. One important strategic decision: separate the language goal from the immigration goal

Your platform has two related but distinct objectives.

## Track A — French proficiency

A1 → A2 → B1 → B2 → optional C1

Teach vocabulary, grammar, pronunciation, reading, listening, writing, and speaking in a coherent progression.

## Track B — Immigration exam readiness

TEF Canada + TCF Canada

Introduce exam-style exercises throughout the course, then offer separate preparation paths, timed simulations, score tracking, and targeted remediation.

Why separate them?

A learner can have strong general French but perform poorly on a timed examination. Conversely, someone can learn test-taking strategies without developing sufficiently broad language skills.

Your platform must address both problems.

Important: TEF Canada and TCF Canada are different examinations, with different task formats and scoring systems. Share the common French curriculum, but maintain separate exam-specific modules. Do not reuse one test's task instructions or scoring rubrics for the other.

For Canadian immigration, NCLC/CLB 7 is a useful target, but the exact requirements depend on the immigration pathway. Also, TEF Canada and TCF Canada use their own numerical scoring systems mapped to NCLC levels. The website should store the mapping for each test and each ability independently, based on current official guidance.

Official references:

- [TEF resources — Le français des affaires](<https://www.lefrancaisdesaffaires.fr/?utm_source=chatgpt.com>)
- [TCF Canada — France Éducation international](<https://www.france-education-international.fr/test/tcf-canada?utm_source=chatgpt.com>)
- [Express Entry language-test requirements — Government of Canada](<https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html?utm_source=chatgpt.com>)

## 3. Define the learning journey around what the learner can do

Use the Common European Framework of Reference for Languages (CEFR) to structure the general course. Its descriptors focus on practical language abilities, rather than simply the amount of grammar a learner has covered.

Reference: [Council of Europe — CEFR descriptors](<https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors?utm_source=chatgpt.com>)

The curriculum should be divided into five levels, with the first four forming the main learning journey.

## A1

## Foundation — understand and introduce yourself

Core outcome: basic communication

- Recognize and pronounce common French sounds.
- Introduce yourself, ask simple questions, and exchange personal information.
- Build basic sentences using common verbs.
- Understand short, slow conversations and simple written messages.
- Write short descriptions and personal messages.

Exit mission: introduce yourself, answer basic questions, and write a short personal profile.

## A2

## Everyday French — manage familiar situations

Core outcome: routine independence

- Describe routines, people, places, and experiences.
- Talk about past events and future plans.
- Handle shopping, travel, appointments, housing, and work situations.
- Write short emails, messages, and simple narratives.
- Understand the main information in clear everyday conversations.

Exit mission: manage a practical everyday scenario and explain a recent experience.

## B1

## Independent French — explain and justify

Core outcome: connected communication

- Explain opinions and give reasons.
- Narrate events and describe plans in connected speech.
- Understand the main points of clear discussions and familiar news topics.
- Write organized paragraphs and practical correspondence.
- Develop arguments and respond to follow-up questions.
- Begin regular timed TEF Canada and TCF Canada drills.

Exit mission: present an opinion, support it with reasons, and respond to objections.

## B2

## Upper-intermediate — argue, persuade, and synthesize

Core outcome: effective independent communication

- Understand more complex texts, discussions, and extended speech.
- Express nuanced opinions and compare different perspectives.
- Develop structured arguments and counterarguments.
- Use appropriate formal and informal language.
- Improve grammatical accuracy, lexical range, fluency, and coherence.
- Practise all four abilities under the relevant exam conditions.

Exit mission: complete an extended speaking task and a structured writing task, then demonstrate consistent performance across the other skills.

## C1

## Advanced extension

Core outcome: precision and flexibility

- Interpret implied meanings, nuanced arguments, and more demanding texts.
- Develop sophisticated arguments and synthesize information.
- Refine register, idiomatic usage, and professional communication.

Exit mission: communicate flexibly in demanding academic, professional, and social situations.

### How long should each level take?

For your intensive plan, use an adaptive schedule rather than promising a fixed graduation date.

You have approximately 30–45 hours available per month if you study for 60–90 minutes daily. Over three to six months, that is roughly 90–270 hours of study, before accounting for missed sessions or the difference between study time and effective practice.

Going from near-beginner to consistent B2 performance in that period is an ambitious stretch goal. It may not be realistic for every learner, particularly when speaking and writing feedback is limited. Build the course to maximize progress, but let performance determine readiness.

Recommended planning principles:

- Start with a diagnostic assessment.
- Use a weekly learning plan rather than a rigid graduation date.
- Reassess skills every two to four weeks.
- Increase the difficulty when the learner demonstrates mastery.
- Extend the schedule when listening, speaking, or writing remains below target.

The platform should communicate progress honestly: “You have mastered these skills” is more useful than “You are 73% fluent.”

## 4. The complete curriculum architecture

The course should be organized in a consistent hierarchy:

Course → Level → Unit → Lesson → Learning block → Exercise → Assessment → Review.

Every level should use the same structure, so learners only have to understand the interface once.

### A1: Suggested units

| Unit | Theme | Key learning outcomes |
| --- | --- | --- |
| 01 | French sounds and survival phrases | Alphabet, pronunciation, greetings |
| 02 | Introduce yourself | Names, nationality, languages, être |
| 03 | Numbers, dates, and time | Counting, days, appointments |
| 04 | People and family | Descriptions, possessives, adjectives |
| 05 | Daily routines | Present tense, reflexive verbs, frequency |
| 06 | Food and cafés | Articles, ordering, quantities |
| 07 | Home and city | Places, prepositions, directions |
| 08 | Work and study | Occupations, schedules, common questions |
| 09 | Likes and preferences | Aimer, préférer, negation |
| 10 | First conversations | Question forms, listening, short dialogues |
| 11 | Review and integration | Cumulative reading, listening, writing, speaking |
| 12 | A1 mastery checkpoint | Mixed assessment and real-world mission |

### A2: Suggested units

| Unit | Theme | Key learning outcomes |
| --- | --- | --- |
| 01 | Yesterday and last week | Passé composé and common participles |
| 02 | Childhood and past habits | Introduction to imparfait |
| 03 | Future plans | Futur proche and future expressions |
| 04 | Travel and transport | Directions, requests, announcements |
| 05 | Health and appointments | Symptoms, advice, polite requests |
| 06 | Housing and services | Descriptions, problems, practical messages |
| 07 | Shopping and comparisons | Comparatives, quantities, pronouns |
| 08 | Social life | Invitations, suggestions, acceptance, refusal |
| 09 | Stories and experiences | Past-tense contrasts and sequencing |
| 10 | Short messages and emails | Tone, structure, practical writing |
| 11 | Listening in daily life | Main ideas, details, speaker intention |
| 12 | A2 mastery checkpoint | Four-skill assessment and practical mission |

### B1: Suggested units

| Unit | Theme | Key learning outcomes |
| --- | --- | --- |
| 01 | Explain your opinions | Opinion structures and supporting reasons |
| 02 | Tell a complete story | Narrative tenses and connectors |
| 03 | Work and careers | Professional vocabulary and interviews |
| 04 | Education and technology | Explain processes and compare ideas |
| 05 | Society and daily news | Identify main ideas and supporting details |
| 06 | Advice and hypothetical situations | Conditionnel and useful structures |
| 07 | Describe and compare | Relative pronouns and comparisons |
| 08 | Solve a problem | Requests, negotiation, proposed solutions |
| 09 | Write connected texts | Paragraphing, coherence, linking words |
| 10 | Speaking at length | Fluency, organization, follow-up questions |
| 11 | Exam task foundations | Introductory TEF and TCF practice |
| 12 | B1 mastery checkpoint | Integrated assessment and timed mini-tests |

### B2: Suggested units

| Unit | Theme | Key learning outcomes |
| --- | --- | --- |
| 01 | Defend an argument | Claims, reasons, evidence, counterarguments |
| 02 | Persuade and negotiate | Persuasive structures and register |
| 03 | Society and public policy | Complex issues and nuanced positions |
| 04 | Media and information | Source evaluation, inference, tone |
| 05 | Work and professional life | Formal correspondence and discussions |
| 06 | Advanced grammar in context | Subjonctif, pronouns, complex clauses |
| 07 | Coherence and precision | Connectors, reformulation, lexical accuracy |
| 08 | Authentic listening | Interviews, discussions, varied speech rates |
| 09 | Complex reading | Argument structure, inference, implied meaning |
| 10 | Structured writing | Clear introductions, development, conclusions |
| 11 | Extended speaking | Spontaneous responses and sustained argument |
| 12 | Four-skill exam readiness | Timed practice, error analysis, mock assessments |

These are curriculum maps, not a finished textbook. Each unit needs multiple lessons, retrieval practice, audio, answer explanations, and assessment items. Avoid publishing a huge curriculum outline and treating the existence of headings as evidence that the course is complete.

## 5. The ideal lesson experience

Your chosen format is a short core lesson followed by optional deep dives. This is an excellent fit for a learner who wants to study seriously without being overwhelmed by textbook-sized explanations.

Every lesson should follow the same predictable pattern.

A1 · UNIT 02 · LESSON 03

# Say where you live

10 minutes

YOUR GOAL

By the end of this lesson, you can say where you live and ask another person the same question.

STEP 1 · DISCOVER

## A natural conversation

Camille

J'habite à Paris.

I live in Paris.

Alex

Tu habites où ?

Where do you live?

STEP 2 · UNDERSTAND

## One simple pattern

## J'habite à + city

J'habite à Lyon.

J'habite à Toronto.

J'habite à New Delhi.

STEP 3 · RECALL

## Build the sentence

Translate: “I live in Montreal.”

 Check my answer

STEP 4 · APPLY

## Make it personal

Write two sentences about where you live and ask a question you could use in a real conversation.

Next: Cities, countries, and prepositions

This is an illustrative lesson prototype. In the actual site, the exercise state should be managed by your JavaScript lesson engine, not independently inside every lesson.

### The standard six-step lesson sequence

1. Discover: see French used in context.
2. Understand: learn one pattern with a concise explanation.
3. Hear: listen to the phrase and notice pronunciation.
4. Recall: produce an answer without looking at the model.
5. Apply: use the concept in a personal or realistic task.
6. Review: retrieve older material and decide what to practise next.

Aim for a 7–12 minute core lesson, with optional grammar explanations, additional examples, pronunciation notes, and harder challenges.

### Optional deep dives

Every lesson can include expandable sections such as:

- Why does this work? A deeper grammar explanation.
- Common mistakes: Incorrect forms and why learners use them.
- Pronunciation clinic: Sound-by-sound guidance.
- More examples: Additional sentences in context.
- Challenge mode: Harder exercises or exam-style applications.

The default lesson should remain simple even when the optional material becomes extensive.

## 6. The design system: a calm, premium digital textbook

The website should not look like a children's game, a corporate analytics portal, or a dense grammar reference.

Aim for a calm editorial interface with subtle gamification and a polished dashboard.

### Visual identity

## FrenchQuest visual tokens

Deep navy

#17263D

Primary text and navigation

Warm ivory

#F6F3ED

Main page background

Soft sage

#DDECE3

Success and mastery

Muted lavender

#E8DDF6

Optional learning hints

Typography and spacing

- Use Inter or DM Sans for interface text, with an optional editorial heading font.
- Body text: approximately 16–18 px on desktop.
- Body line height: 1.6–1.75.
- Lesson content width: approximately 680–800 px.
- Use an 8 px spacing scale.
- Prefer whitespace and clear headings to decorative borders.

### The six main screens

Inaaya AI | Guided Language Lessons and AI Speaking Practice

1. Dashboard

A single prominent “Continue learning” card, today's review queue, weekly study time, progress by skill, and the next recommended activity.

银河智学｜小鹿爱学 AI 学习闭环系统

2. Curriculum

A visual A1–B2 map, expandable units, lesson status, prerequisites, mastery checkpoints, and clear next steps.

Edugo.AI - Create your language course easily

3. Lesson reader

A focused reading column, progress indicator, optional deep dives, audio controls, translation reveal, and interactive exercises.

Français de voyage débutant | The France Travel Kit -…

4. Review room

Due vocabulary, grammar recall, sentence reconstruction, and listening prompts in a focused review session.

Mocko - Realistic Mock Tests with Detailed Feedback

5. Exam Lab

Separate TEF Canada and TCF Canada sections, timed practice, skill-specific history, error categories, and target tracking.

Badges and Streak mobile app by Mohammed Hattab on Dribbble

6. Progress and profile

Mastery records, badges, learning history, personal goals, preferences, and local data export/import.

### Navigation rules

- Desktop: compact left sidebar, centered learning content, optional lesson outline on the right.
- Mobile: bottom navigation for Home, Learn, Review, Exam, and Profile.
- Keep the primary next action visible without making the interface feel crowded.
- Support dark mode, adjustable text size, keyboard navigation, and reduced-motion preferences.
- Save the learner's last location and allow them to resume quickly.
- Avoid unnecessary modals, animations, and notifications.

## 7. The memory system: how French stays in the learner's mind

This should be one of FrenchQuest's strongest features.

Many language apps make it easy to recognize a phrase when it appears on screen. Recognition is useful, but it is not the same as being able to produce that phrase in conversation or an examination.

Build the learning loop around four evidence-based practices:

- Retrieval practice: attempt to recall information before seeing the answer.
- Spaced repetition: revisit information at increasing intervals when it is being recalled successfully.
- Interleaving: mix related concepts so learners practise choosing the right form, rather than repeating one pattern mechanically.
- Feedback: explain why an answer is right or wrong and what to do differently next time.

These approaches are consistent with research on learning and second-language retention. They should guide the design, not be presented as guarantees of a particular exam score.

### A vocabulary card should teach more than a translation

A1 · Daily lifeVocabulary review

# apprendre

verb · to learn

J'apprends le français tous les jours.

I learn French every day.

Recall challenge

Translate into French: “I want to learn French.”

 Reveal model answer

In the real application, each vocabulary item should contain:

- French expression and English meaning.
- Gender and article for nouns, where applicable.
- Verb infinitive and conjugation references, where relevant.
- Example sentence and its translation.
- Pronunciation audio.
- Topic, level, and grammar tags.
- Recall history and next review date.
- Common errors and related expressions.

### Suggested review scheduling

Start with a simple spaced-repetition algorithm. Schedule reviews based on actual performance rather than following one rigid timetable for every learner.

A reasonable initial schedule for a newly learned item might be:

| Review | Example interval |
| --- | --- |
| First revisit | Later that day |
| Second | 1 day later |
| Third | 3 days later |
| Fourth | 7 days later |
| Fifth | 14 days later |
| Sixth | 30 days later |

Treat these as starting values. If an item is forgotten, bring it back sooner. If it is recalled consistently, increase the interval.

Track the following states:

- New.
- Learning.
- Due for review.
- Relearning.
- Established.

Do not mark an item as mastered just because the learner clicks “I know this.” Use successful recall across multiple sessions as evidence.

### How to fit reviews into a 60–90 minute day

Offer a recommended 75-minute routine:

## Daily study plan

A flexible starting point, not a mandatory timer.

Vocabulary and older material

10 min

New lesson and grammar

20 min

Listening and pronunciation

15 min

Writing or speaking production

15 min

Mixed exercises and exam practice

10 min

Review errors and plan tomorrow

5 min

The routine should adapt to the learner's needs. If listening is weak, recommend more listening. If the review queue is unusually large, reduce new vocabulary rather than continually adding material.

## 8. The Exam Lab: separate preparation for TEF Canada and TCF Canada

This is the feature that connects your general French course to your immigration objective.

The Exam Lab should be a distinct area with two selectable examination tracks. Both share the same four broad abilities, but each track must use its own official task instructions, timing, question structures, and scoring guidance.

# Exam Lab

Select an examination to practise its specific format.

How to Improve French Listening for TCF Canada | Ciel

## TEF Canada

Official-format practice, timed tasks, writing and speaking feedback, and score-to-NCLC tracking.

Resources and Continuous TCF Canada Preparation: Complete Ecosystem

## TCF Canada

Separate task bank, exam instructions, timing, assessment rules, and NCLC mapping.

## The four abilities

Reading

Comprehension écrite

Listening

Compréhension orale

Writing

Expression écrite

Speaking

Expression orale

### Stage 1 — Familiarization

Introduce exam-specific task types without time pressure. Explain what the question asks, how to approach it, and what the learner needs to demonstrate.

### Stage 2 — Focused drills

Train one micro-skill at a time.

Examples:

- Identify the main idea of a spoken exchange.
- Recognize paraphrases in a written text.
- Distinguish a speaker's opinion from a factual statement.
- Build a structured argument.
- Ask relevant questions and sustain a conversation.
- Organize a written response for its intended audience.

### Stage 3 — Timed mini-tests

Introduce realistic time constraints. Record accuracy, completion rate, common error types, and time spent where that can be measured reliably.

### Stage 4 — Full mock examinations

Reproduce the applicable official format as closely as your platform can support. Include task-specific instructions, timing, listening playback rules where appropriate, and a realistic sequence of tasks.

Use original or properly licensed content. Do not imply that unofficial practice material is an official test or that a simulated score guarantees an actual result.

### Stage 5 — Error-driven revision

After a test, the learner should see something more useful than a raw percentage.

For example:

## Practice review

Listening comprehension

## 68%

Illustrative practice result, not an official exam score.

### Your three biggest opportunities

- Recognizing numbers and dates in connected speech.
- Understanding a speaker's intention.
- Identifying paraphrases rather than searching for identical words.
  Recommended next step
  Complete a 10-minute listening lesson on identifying key details, then retry a similar set of questions.

### The NCLC target dashboard

Store a separate target for each of the four abilities. For example, TEF Canada uses different raw-score ranges for listening, reading, writing, and speaking when mapping results to NCLC levels.

The published IRCC guidance includes the following TEF Canada NCLC 7 raw-score ranges, which should be checked against the current official table before being hardcoded:

| Ability | NCLC 7 raw-score range |
| --- | --- |
| Speaking | 310–348 |
| Listening | 249–279 |
| Reading | 207–232 |
| Writing | 310–348 |

Reference: [IRCC — Language tests for Express Entry](<https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html?utm_source=chatgpt.com>).

The dashboard should clearly separate:

- Current practice performance.
- Estimated NCLC level.
- Official score target.
- Distance from target.
- Recent trend.
- Recommended training activity.

Do not equate B2 with a guaranteed NCLC 7 result. General proficiency and exam scores are related but not interchangeable. Similarly, never translate a TEF score directly into a TCF score using the same raw-score threshold.

For immigration decisions, always refer learners to current IRCC eligibility and language-test rules. The platform should help people prepare, not promise permanent residence.

## 9. Speaking, listening, and pronunciation on a static website

You selected all available speaking methods, so the platform should provide several levels of support without depending on paid AI services.

### Level 1 — Curated audio

Record or license natural French examples, with a slower version when useful.

Every audio activity should have:

- A play/pause control.
- Replay.
- Optional transcript.
- Optional translation.
- A slower playback option where technically appropriate.
- A comprehension question before revealing the transcript.

Use recorded audio for important learning material. Browser-generated speech can be a useful supplement, but pronunciation, voice quality, and language availability vary by browser and device.

### Level 2 — Listen and repeat

Let learners play a sentence, repeat it aloud, and compare their pronunciation with a model.

Start with short, achievable phrases. Teach sound distinctions, liaison, syllable rhythm, and intonation in context rather than making learners memorize phonetic terminology first.

### Level 3 — Self-recording

Use the browser's `MediaRecorder` API to let learners record short answers, replay their recordings, and compare them with a model response.

This can work without a backend, subject to browser permissions and HTTPS requirements. On GitHub Pages, the published site is served over HTTPS.

Keep recordings local by default, and explain where the files are stored and how to delete them.

### Level 4 — Optional browser speech recognition

Where supported, the Web Speech API can provide experimental speech-to-text feedback. It should be optional because browser support, language handling, accuracy, and privacy behaviour vary.

Speech-to-text is not a reliable measure of French pronunciation or oral-exam performance. A transcript can look correct even when pronunciation, fluency, grammar, or interaction quality is weak.

### Level 5 — Speaking missions

Give learners practical prompts such as:

- Introduce yourself for 30 seconds.
- Describe your daily routine.
- Explain why you prefer one option over another.
- Ask questions to obtain information.
- Defend an opinion and respond to an objection.

Use transparent rubrics to evaluate task completion, organization, fluency, grammar, vocabulary, and pronunciation. Provide example responses at different levels.

## 10. Gamification that rewards genuine progress

Your platform should reward mastery, consistency, and communication skills rather than the number of clicks.

### The four motivation systems

Consistency

Daily practice goals, weekly activity, and gentle streaks. Allow rest days and never shame learners for missing sessions.

Skill badges

Award badges when learners demonstrate abilities, such as completing a speaking mission or recalling vocabulary across multiple sessions.

Mastery milestones

Celebrate successful cumulative reviews, completed learning objectives, and measurable improvement in weaker skills.

Journey progression

Unlock new units as prerequisite skills are demonstrated, with optional challenge paths for learners who progress faster.

### A suggested XP system

| Action | XP |
| --- | --- |
| Complete a lesson and its exercises | 20 |
| Correctly recall a due vocabulary item | 2 |
| Pass a cumulative review | 15 |
| Complete a writing or speaking mission | 15 |
| Pass a unit mastery checkpoint | 50 |
| Complete a level mastery assessment | 150 |

These values are starting defaults. Award XP according to a defined repeat policy so the learner cannot earn unlimited points by repeating trivial exercises.

### Example achievements

- Bonjour! — Complete your first lesson and its recall exercise.
- Sound Explorer — Pass a pronunciation and listening checkpoint.
- Word Collector — Recall 50 vocabulary items across multiple sessions.
- Grammar Builder — Pass a cumulative grammar assessment.
- Conversation Starter — Complete a speaking mission.
- Memory Keeper — Successfully retrieve previously learned material across several days.
- A1 Explorer — Pass the A1 mastery assessment.
- Exam Ready — Meet configured practice criteria across the four abilities.

An achievement should have a visible requirement and a meaningful reason to exist.

### Adaptive difficulty

Use performance to recommend the next step.

- High accuracy and reliable recall? Increase complexity.
- Good recognition but weak production? Add sentence-building and speaking tasks.
- Repeated listening errors? Slow down the material and teach the missing listening skill.
- A large review queue? Reduce new vocabulary temporarily.
- Strong reading but weak writing? Recommend structured writing practice.

The learner should feel that the system understands their needs, even though the first version uses simple rules rather than AI.

## 11. Technical architecture for HTML, CSS, JavaScript, JSON, and GitHub Pages

The right approach is a static, data-driven application.

Store the curriculum as JSON. Build reusable JavaScript modules that render lessons and exercises from that data. Keep progress and preferences in browser storage.

This lets you publish hundreds of lessons without creating hundreds of separate HTML pages.

### Recommended repository structure

text
```
frenchquest/
├── index.html
├── curriculum.html
├── lesson.html
├── review.html
├── exam-lab.html
├── progress.html
├── settings.html
├── assets/
│   ├── icons/
│   ├── illustrations/
│   └── audio/
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── lesson.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── router.js
│   ├── curriculum.js
│   ├── lesson-renderer.js
│   ├── exercises.js
│   ├── audio.js
│   ├── spaced-repetition.js
│   ├── progress.js
│   ├── achievements.js
│   ├── exam-lab.js
│   └── storage.js
├── data/
│   ├── curriculum.json
│   ├── vocabulary.json
│   ├── grammar.json
│   ├── quizzes.json
│   ├── tef-practice.json
│   └── tcf-practice.json
└── README.md
```

Start with only the files you need. Add modules when the code becomes difficult to maintain.

### The core modules

| Module | Responsibility |
| --- | --- |
| `curriculum.js` | Load and navigate levels, units, and lessons |
| `lesson-renderer.js` | Render the correct interface for each content block |
| `exercises.js` | Display exercises, evaluate answers, and show feedback |
| `spaced-repetition.js` | Calculate review intervals and update item status |
| `progress.js` | Record lesson completion and skill evidence |
| `achievements.js` | Evaluate badge and XP requirements |
| `exam-lab.js` | Manage examination-specific practice and reporting |
| `storage.js` | Save, load, export, and import learner data |

### Example: a data-driven lesson

Your JSON should describe the lesson, rather than dictate the exact HTML layout.

json
```
{
  "id": "a1-introductions-03",
  "level": "A1",
  "unit": "introductions",
  "title": "Introduce yourself",
  "durationMinutes": 10,
  "objectives": [
    "Say your name",
    "Say where you live",
    "Say which languages you speak"
  ],
  "sections": [
    {
      "type": "dialogue",
      "title": "Meet Camille",
      "items": [
        {
          "speaker": "Camille",
          "french": "Bonjour, je m'appelle Camille.",
          "english": "Hello, my name is Camille."
        },
        {
          "speaker": "Alex",
          "french": "J'habite à Paris.",
          "english": "I live in Paris."
        }
      ]
    },
    {
      "type": "grammar",
      "title": "Je m'appelle...",
      "explanation": "Use je m'appelle to introduce your name.",
      "examples": [
        {
          "french": "Je m'appelle Alex.",
          "english": "My name is Alex."
        }
      ]
    },
    {
      "type": "quiz",
      "question": "How do you say 'I live in Paris'?",
      "options": [
        "Je suis Paris.",
        "J'habite à Paris.",
        "Je parle Paris."
      ],
      "answerIndex": 1
    }
  ]
}
```

The renderer can display each section according to its `type`: dialogue, grammar, vocabulary, audio, quiz, writing, speaking, or review.

The same component system can support A1 through B2 and both examination-preparation tracks.

### Data design rules

- Give every lesson, unit, vocabulary item, and exercise a stable unique ID.
- Store content separately from learner progress.
- Version your content schema so future changes don't break saved progress.
- Validate JSON before publishing.
- Keep translations and correct answers attached to their exercises.
- Use a consistent schema for audio references and alternative answers.
- Include content source, licensing, and review status where appropriate.

Security limitation: any answer or private assessment data included in public JSON is visible to anyone who inspects the site. This is acceptable for self-study exercises, but not for secure testing. A static application cannot reliably protect exam answers, store API secrets, or provide server-validated scores.

## 12. Save progress without a backend

For version one, use `localStorage` for lightweight preferences and progress.

Example learner record:

json
```
{
  "schemaVersion": 1,
  "currentLevel": "A1",
  "currentLessonId": "a1-introductions-03",
  "completedLessons": [
    "a1-sounds-01",
    "a1-greetings-01"
  ],
  "vocabularyProgress": {},
  "skillProgress": {
    "reading": {},
    "listening": {},
    "writing": {},
    "speaking": {}
  },
  "xp": 120,
  "unlockedBadges": [],
  "preferences": {
    "showTranslations": true,
    "theme": "light"
  }
}
```

This is an example schema, not a requirement to store every field in one object. As the data grows, you may want separate keys or a more suitable browser database such as IndexedDB.

### Persistence rules

- Save progress after meaningful actions, not just when the user leaves a page.
- Handle missing or corrupted data gracefully.
- Offer an export function to download progress as JSON.
- Offer an import function with schema validation.
- Include a reset-progress option with a confirmation step.
- Never store passwords, API keys, or sensitive personal information in local storage.

The major trade-off is that browser-local progress does not automatically synchronize across devices. If a learner clears browser data or changes devices, they need a backup or a future cloud-sync feature.

## 13. GitHub Pages deployment

Your static architecture fits GitHub Pages well.

1. Create a public repository for the initial version.
2. Add the HTML entry points, CSS, JavaScript modules, JSON content, and media assets.
3. Open Settings → Pages.
4. Choose the deployment source and branch or configure GitHub Actions.
5. Publish the site and test the deployed URL, not only your local development environment.

Pay particular attention to project-site paths. A site may be published under `/frenchquest/` instead of the domain root. Avoid hardcoding `/css/style.css` or similar root-relative paths unless you have deliberately configured the application for that deployment.

### Before publishing

- Test on mobile and desktop.
- Test refreshing every page.
- Check internal links and audio paths.
- Verify that the site works when no lesson has been completed.
- Test import/export with malformed data.
- Confirm that keyboard users can complete exercises.
- Check French accents and special characters.
- Verify that the lesson experience remains readable with large text.
- Test the published site in more than one browser.

GitHub Pages can host the entire first version. You do not need a paid hosting plan to start learning from your own platform.

## 14. Build the content as a reusable learning system

The largest part of the project is not writing the JavaScript. It is producing enough accurate, coherent French material for a learner to move through A1–B2 without gaps.

Create a content pipeline rather than writing disconnected lessons.

### Each lesson should have these fields

- Unique ID and level.
- Unit and learning objective.
- Prerequisite concepts.
- Estimated duration.
- French content and English support.
- New vocabulary.
- Grammar patterns.
- Pronunciation or audio material.
- Interactive exercises.
- Answer explanations.
- Review links to earlier material.
- Real-world mission.
- Completion criteria.
- Editorial review status.

### A lesson publishing workflow

1. Define the learner's intended ability.
2. Identify the grammar and vocabulary needed for that ability.
3. Write natural French examples at the appropriate level.
4. Create short explanations and a model conversation.
5. Design recall, listening, and production exercises.
6. Write meaningful feedback for correct and incorrect answers.
7. Link the lesson to previously learned concepts.
8. Validate the French and test the rendered lesson.
9. Publish only when the learning objective and assessment align.

For example, if the goal is “ask for information politely,” the lesson needs more than a grammar explanation. It should include model questions, appropriate intonation, listening examples, a role-play, and a task in which the learner independently constructs relevant questions.

### Quality assurance

Before a lesson is published, verify that:

- The French is accurate and natural.
- The difficulty is appropriate for the stated level.
- New grammar is explained with useful examples.
- Vocabulary includes context and pronunciation where relevant.
- The learner must retrieve or produce French.
- Feedback explains errors rather than simply marking them wrong.
- The lesson connects to earlier material.
- Audio has been checked by a competent French speaker.
- The lesson is accessible and works on mobile.
- Examination content has been checked against the relevant official specifications.

For public use, qualified French teachers or fluent reviewers should validate the material. Automated grammar checks are useful, but they are not a substitute for editorial review.

## 15. The development roadmap: what to build first

Don't attempt to publish the complete A1–B2 course before testing the learning experience. Build a vertical slice: one learner can start, learn, practise, review, and see progress from beginning to end.

## 01

## Week 1 — Foundation

- Define the design system and content schema.
- Create the dashboard, curriculum map, and lesson reader.
- Build five polished A1 lessons.
- Test the navigation and responsive layout.

## 02

## Weeks 2–3 — Learning engine

- Implement reusable exercises and immediate feedback.
- Add progress persistence and lesson completion.
- Implement vocabulary review and spaced repetition.
- Add audio controls and basic speaking missions.

## 03

## Weeks 4–6 — Complete the A1 experience

- Build the A1 curriculum and cumulative checkpoints.
- Add achievements, daily goals, and progress analytics.
- Test the course with beginner learners.
- Fix confusing explanations and ineffective exercises.

## 04

## Next — A2, B1, and B2

- Expand the curriculum using the same lesson engine.
- Build four-skill assessments and writing/speaking rubrics.
- Introduce examination-specific drills.
- Create the TEF and TCF practice banks separately.

## 05

## Public release

- Add onboarding, progress export/import, and learner settings.
- Review content quality, accessibility, and licensing.
- Publish documentation and a feedback mechanism.
- Add cloud accounts only when real user needs justify them.

These are initial development estimates. The curriculum itself will require substantial additional time, especially for audio, original exam-style questions, and reliable speaking and writing feedback.

## 16\. How to know whether FrenchQuest is actually working

Measure learning outcomes, not vanity metrics.

| Metric | What it tells you |
| --- | --- |
| Lesson completion | Can learners get through the material? |
| Delayed recall accuracy | Are they remembering it later? |
| Exercise error patterns | Which concepts cause difficulty? |
| Listening comprehension | Can they understand spoken French? |
| Speaking task performance | Can they communicate independently? |
| Writing rubric results | Are their responses becoming clearer and more accurate? |
| Weekly retention | Are learners returning consistently? |
| Exam practice trends | Are their skills moving toward their chosen targets? |

The most important metric is retained, usable French: what learners can still understand and produce after time has passed.

A learner completing 30 lessons is not necessarily more proficient than someone completing 20 lessons with stronger retention. Use both completion data and actual performance to recommend the next activity.

## 17\. The final product specification

Here is the version I would commit to building.

# FrenchQuest MVP specification

Version 1 · Personal learning first, public-ready architecture

Curriculum

A1 foundation with a defined path to A2, B1, B2, and optional C1.

Learning experience

Short core lessons, optional deep dives, examples, audio, and interactive practice.

Memory

Vocabulary review, retrieval practice, spaced repetition, and cumulative assessments.

Four skills

Reading, listening, writing, and speaking integrated from the beginning.

Examination preparation

Shared French foundations with separate TEF Canada and TCF Canada practice modules.

Motivation

Adaptive goals, XP, mastery badges, milestones, and gentle streaks.

Technology

Semantic HTML, modular CSS, vanilla JavaScript, JSON content, and GitHub Pages.

Data

Local progress, validated export/import, and no account requirement.

Quality

Reviewed French, accessible design, original practice content, and honest score estimates.

## 18\. Your first concrete action

Start by building the A1 learning experience, not the whole course.

Create the repository, define your design tokens, build the dashboard and reusable lesson reader, then implement five complete lessons:

1. French sounds and pronunciation.
2. Greetings and introductions.
3. Être and avoir.
4. Numbers, dates, and basic questions.
5. Building your first everyday conversation.

Each lesson should include a concise explanation, natural examples, audio, recall practice, a short quiz, and a review connection.

Once those five lessons work beautifully, the rest of the curriculum can grow around a tested foundation.

Keep your 3–6 month goal as an ambitious target, not a promise. At 60–90 minutes a day, make every session count, seek speaking and writing feedback, and let demonstrated proficiency guide your pace.

The long-term vision is a platform where a beginner never has to wonder what to study, why it matters, how to remember it, or how it connects to their Canadian immigration language goals.

Build a system that teaches French, proves learning, and recommends what to do next. That's the foundation that can make FrenchQuest genuinely useful to you and eventually to other learners.
