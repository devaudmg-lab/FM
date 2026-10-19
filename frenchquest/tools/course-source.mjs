// Source of truth for the course map. `node tools/build-course.mjs` writes data/course.json
// (lesson `status` is set from which lesson files exist).
const BASE_LEVELS = [
  { id: 'a1', title: 'Foundation', outcome: 'Introduce yourself, exchange personal information and handle simple, slow conversations.', units: [
    ['Sounds and survival', 'Greetings, the alphabet, key sounds and phrases to get by', [
      ['Bonjour! Greetings and politeness', 'bonjour/bonsoir/salut, au revoir, merci, tu vs vous'],
      ['The alphabet and spelling your name', 'letters, accents é è ê ç, spelling aloud'],
      ['Key vowel sounds', 'u vs ou, é vs è, nasal vowels an/on/in (intro)'],
      ['Silent letters, liaison and élision', 'final consonants, les‿amis, j\', l\''],
      ['Survival phrases', 'je ne comprends pas, pouvez-vous répéter, comment dit-on…, parlez plus lentement'],
    ]],
    ['Introduce yourself', 'Names, nationality, where you live and the languages you speak', [
      ['Je m\'appelle…', 's\'appeler (je/tu/vous), asking names, enchanté(e)'],
      ['Être and nationality', 'être (all persons), nationality adjectives masc/fem'],
      ['Say where you live', 'habiter à + city, en/au/aux + country'],
      ['Languages you speak', 'regular -er verbs in the present, parler + language'],
      ['Your first conversation', 'integration mission: name, origin, city, languages'],
    ]],
    ['Numbers, dates and time', 'Count, give dates and times, and make appointments', [
      ['Numbers 0 to 20', 'numbers 0–20, liaison with numbers'],
      ['Numbers 21 to 100', '21–100 incl. soixante-dix, quatre-vingts, quatre-vingt-dix'],
      ['Days, months and dates', 'jours, mois, le 3 mars, aujourd\'hui, demain'],
      ['Telling the time', 'il est… heures, à quelle heure, appointments'],
      ['Avoir: age, phone number, needs', 'avoir (all persons), j\'ai 30 ans, avoir besoin de — unit mission'],
    ]],
    ['People and family', 'Describe the people in your life', [
      ['My family', 'family vocabulary, possessives mon/ma/mes, ton/ta/tes, son/sa/ses'],
      ['Describing people', 'adjective agreement and position (grand, petit, jeune…)'],
      ['Articles: un, une, des, le, la, les', 'definite vs indefinite articles, gender and plural'],
      ['Être or avoir?', 'contrasting être and avoir in descriptions, il/elle a les yeux bleus'],
      ['Present someone you know', 'integration mission: describe a family member or friend'],
    ]],
    ['Daily routines', 'Talk about your day and how often you do things', [
      ['My day', 'more -er verbs, full present conjugation, daily actions'],
      ['Reflexive verbs', 'se lever, se coucher, s\'habiller, se doucher'],
      ['How often?', 'toujours, souvent, parfois, jamais, le matin, le soir'],
      ['Faire and aller', 'irregular faire and aller, aller au/à la'],
      ['Describe your routine', 'integration mission: write about a typical day'],
    ]],
    ['Food and cafés', 'Order, shop for food and talk about what you eat', [
      ['Food and drinks', 'food vocabulary with gender, j\'aime / je n\'aime pas'],
      ['Some, any, none', 'partitive du/de la/de l\'/des, pas de'],
      ['Ordering politely', 'je voudrais, je vais prendre, l\'addition s\'il vous plaît'],
      ['Quantities and prices', 'combien, un kilo de, une bouteille de, prices in euros/dollars'],
      ['At the café', 'integration mission: role-play ordering at a café'],
    ]],
    ['Home and city', 'Describe your home and find your way around town', [
      ['My home', 'rooms and furniture, il y a, il n\'y a pas de'],
      ['Where is it?', 'prepositions of place: sur, sous, devant, derrière, à côté de'],
      ['Around town', 'places in town, à + le = au, à + les = aux'],
      ['Asking for directions', 'imperative (intro), tournez à gauche, allez tout droit'],
      ['Getting around', 'transport: en bus, à pied, en métro; integration'],
    ]],
    ['Work and study', 'Talk about jobs, schedules and studies', [
      ['Jobs', 'professions masculine/feminine, je suis infirmière (no article)'],
      ['Asking questions', 'est-ce que, qu\'est-ce que, intonation questions'],
      ['-ir and -re verbs', 'finir, choisir, prendre, comprendre, apprendre'],
      ['Schedules and timetables', 'reading timetables, du lundi au vendredi, de 9 h à 17 h'],
      ['Talk about your work or studies', 'integration mission in a Canadian context'],
    ]],
    ['Likes and preferences', 'Say what you like, dislike and prefer — and why', [
      ['I like, I love, I hate', 'aimer, adorer, détester + definite article'],
      ['Negation', 'ne… pas, ne… jamais, ne… plus'],
      ['I prefer', 'préférer (stem change), parce que'],
      ['Hobbies and weather', 'faire du/de la, jouer au/du, il fait beau/froid'],
      ['Say what you like and why', 'integration mission: write about your preferences'],
    ]],
    ['First conversations', 'Ask and answer questions to keep a conversation going', [
      ['Question words', 'où, quand, comment, pourquoi, combien, qui, quel/quelle'],
      ['Can, want, must', 'pouvoir, vouloir, devoir + infinitive'],
      ['What I\'m going to do', 'futur proche: aller + infinitive'],
      ['Messages and voicemails', 'understanding short phone messages'],
      ['Keep a conversation going', 'integration mission: follow-up questions and reactions'],
    ]],
    ['Review and integration', 'Bring A1 together across all four skills', [
      ['Mixed reading', 'signs, forms, short messages, ads'],
      ['Mixed listening', 'short dialogues incl. Canadian French speakers'],
      ['Fill in a form, write a profile', 'personal information forms, short profile'],
      ['One-minute monologue', 'self-presentation for one minute'],
      ['Cumulative grammar review', 'interleaved être/avoir, articles, negation, questions, futur proche'],
    ]],
    ['A1 mastery checkpoint', 'Show what you can do at A1', [
      ['A1 reading check', 'assessment: reading'],
      ['A1 listening check', 'assessment: listening'],
      ['A1 writing check', 'assessment: writing'],
      ['A1 speaking check', 'assessment: speaking'],
      ['A1 real-world mission', 'integrated mission and reflection, plan for A2'],
    ]],
  ] },
  { id: 'a2', title: 'Everyday French', outcome: 'Manage familiar situations, talk about the past and future, and write short practical messages.', units: [
    ['Yesterday and last week', 'Passé composé with avoir and common participles', [
      ['What did you do?', 'passé composé with avoir, -er participles'], ['Irregular past participles', 'fait, pris, vu, eu, été, bu, lu, mis'], ['Time markers for the past', 'hier, la semaine dernière, il y a deux jours'], ['Negation in the past', 'je n\'ai pas…, je n\'ai jamais…'], ['Tell me about your weekend', 'integration mission']]],
    ['Where I went', 'Passé composé with être', [
      ['Verbs that use être', 'aller, venir, partir, arriver, rester, naître…'], ['Agreement with être', 'elle est allée, ils sont partis'], ['Reflexive verbs in the past', 'je me suis levé(e)'], ['Sequencing a day out', 'd\'abord, ensuite, puis, enfin'], ['Recount a trip', 'integration mission']]],
    ['Childhood and habits', 'The imparfait for descriptions and habits', [
      ['When I was a child', 'imparfait formation'], ['Describing the past', 'c\'était, il y avait, il faisait'], ['Habits then and now', 'avant / maintenant, d\'habitude'], ['Feelings and states in the past', 'j\'étais, j\'avais peur'], ['My childhood', 'integration mission']]],
    ['Future plans', 'Futur proche and futur simple', [
      ['Plans with aller + infinitive', 'futur proche review'], ['The futur simple', 'regular forms'], ['Irregular futures', 'ir-, ser-, aur-, fer-, pourr-, viendr-'], ['Making plans together', 'on pourrait, ça te dit de…'], ['My plans for next year', 'integration mission']]],
    ['Travel and transport', 'Tickets, announcements, hotels and help', [
      ['Buying tickets', 'un aller simple, un aller-retour'], ['Station and airport announcements', 'listening to announcements'], ['Asking for help politely', 'pourriez-vous, excusez-moi de vous déranger'], ['Hotels and reservations', 'réserver, une chambre double, compris'], ['Plan a trip in Québec', 'integration mission']]],
    ['Health and appointments', 'Symptoms, advice and appointments', [
      ['The body and symptoms', 'avoir mal à la/au/aux'], ['At the doctor’s', 'consultation dialogue'], ['Giving advice', 'il faut, tu devrais, il vaut mieux'], ['Booking an appointment by phone', 'prendre rendez-vous'], ['Explain a health problem', 'integration mission']]],
    ['Housing and services', 'Apartments, problems and landlords', [
      ['Looking for an apartment', 'ads and abbreviations, 3 1/2 in Québec'], ['Describing problems', 'ne marche pas, fuite, panne'], ['Since, ago, for', 'depuis, il y a, pendant'], ['Writing to a landlord', 'formal message'], ['Solve a housing problem', 'integration mission']]],
    ['Shopping and comparisons', 'Compare, choose and return items', [
      ['Comparing things', 'plus/moins/aussi… que, meilleur'], ['The best and the worst', 'superlatives'], ['Direct object pronouns', 'le, la, l\', les'], ['Clothes, sizes and returns', 'la taille, échanger, rembourser'], ['Choose and justify a purchase', 'integration mission']]],
    ['Social life', 'Invitations, plans and pronouns', [
      ['Inviting someone', 'ça te dit de…, tu es libre…'], ['Accepting and refusing politely', 'avec plaisir, désolé(e), je ne peux pas'], ['Indirect object pronouns', 'lui, leur'], ['The pronouns y and en', 'introduction'], ['Organize an outing', 'integration mission']]],
    ['Stories and experiences', 'Passé composé vs imparfait', [
      ['Passé composé or imparfait?', 'event vs background'], ['Setting the scene', 'il faisait beau quand…'], ['Story connectors', 'pendant que, quand, soudain, tout à coup'], ['Telling an anecdote', 'oral storytelling'], ['Tell a story from your life', 'integration mission']]],
    ['Messages and emails', 'Practical writing with the right tone', [
      ['Formal or informal?', 'tu/vous, salutations and closings'], ['Requests and complaints', 'je voudrais savoir, je vous écris pour'], ['Replying to an ad', 'short formal email'], ['Texts and quick messages', 'abbreviations and informal style'], ['Write three practical messages', 'integration mission']]],
    ['A2 mastery checkpoint', 'Show what you can do at A2', [
      ['A2 reading check', 'assessment: reading'], ['A2 listening check', 'assessment: listening'], ['A2 writing check', 'assessment: writing'], ['A2 speaking check', 'assessment: speaking'], ['First look at TEF and TCF', 'exam familiarization and choosing an exam']]],
  ] },
  { id: 'b1', title: 'Independent French', outcome: 'Explain and justify opinions, narrate in connected speech and follow clear discussions.', units: [
    ['Explain your opinions', 'Opinions, agreement and reasons', [
      ['Giving your opinion', 'à mon avis, je pense que, selon moi'], ['Agreeing and disagreeing', 'je suis d\'accord, pas du tout'], ['Giving reasons', 'parce que, car, puisque, comme'], ['Adding nuance', 'plutôt, assez, vraiment, pas tellement'], ['Defend a simple opinion', 'integration mission']]],
    ['Tell a complete story', 'Narrative tenses and reported speech', [
      ['The plus-que-parfait', 'j\'avais déjà…'], ['Narrative tenses together', 'PC, imparfait, plus-que-parfait'], ['Before and after', 'avant de + inf., après avoir/être + pp'], ['Reported speech', 'il a dit que…, elle m\'a demandé si…'], ['Narrate an event', 'integration mission']]],
    ['Work and careers in Canada', 'Jobs, CVs and interviews', [
      ['Job ads and skills', 'compétences, exigences'], ['The CV and cover letter', 'lettre de motivation'], ['Job interview questions', 'parlez-moi de vous'], ['Workplace communication', 'collègues, réunions, courriels'], ['Mock job interview', 'integration mission']]],
    ['Education and technology', 'Explain processes and compare systems', [
      ['Explaining a process', 'd\'abord, ensuite, il faut'], ['The gerund', 'en + -ant'], ['Pros and cons of technology', 'avantages, inconvénients'], ['Comparing systems', 'ici et là-bas'], ['Present a process', 'integration mission']]],
    ['Society and news', 'News, faits divers and the passive', [
      ['Reading headlines', 'nominal style'], ['Faits divers', 'short news stories (link to TEF writing A)'], ['The passive voice', 'être + pp, par'], ['Main idea and details in audio news', 'listening strategy'], ['Summarize a news story', 'integration mission']]],
    ['Hypotheses and advice', 'Conditionnel and si clauses', [
      ['The conditionnel présent', 'forms'], ['Polite requests and wishes', 'je voudrais, j\'aimerais, pourriez-vous'], ['If I had…', 'si + imparfait → conditionnel'], ['Giving advice', 'à ta place, tu ferais mieux de'], ['What would you do?', 'integration mission']]],
    ['Describe and compare', 'Relative pronouns', [
      ['Qui and que', 'relative pronouns'], ['Où and dont', 'relative pronouns'], ['Ce qui, ce que', 'emphasis'], ['Describing in detail', 'places and people'], ['Compare two cities', 'integration mission']]],
    ['Solve a problem', 'Complaints, negotiation and information calls', [
      ['Making a complaint', 'je souhaiterais signaler'], ['Negotiating a solution', 'proposer, accepter'], ['Calling for information', 'link to TEF speaking A'], ['Polite insistence', 'register'], ['Get what you need', 'integration role-play']]],
    ['Write connected texts', 'Paragraphs, connectors and letters', [
      ['Paragraph structure', 'topic sentence, support'], ['Logical connectors', 'cependant, donc, en effet, par ailleurs'], ['Avoiding repetition', 'pronouns, synonyms'], ['The formal letter', 'structure and formulas'], ['Write an opinion paragraph', 'integration mission']]],
    ['Speak at length', 'Monologues and follow-up questions', [
      ['Organizing a monologue', 'plan in three parts'], ['Gaining time naturally', 'euh, bon, en fait, disons'], ['Handling follow-up questions', 'reformulate, clarify'], ['Describing a situation', 'picture and scenario description'], ['Two-minute talk', 'integration mission']]],
    ['Exam foundations', 'TEF and TCF task strategies', [
      ['Reading strategies', 'skim, scan, paraphrase'], ['Listening strategies', 'anticipate, keywords'], ['Writing tasks under time', 'plan in 5 minutes'], ['Speaking tasks', 'interaction and argument'], ['Timed mini-test', 'mixed timed practice']]],
    ['B1 mastery checkpoint', 'Show what you can do at B1', [
      ['B1 reading check', 'assessment'], ['B1 listening check', 'assessment'], ['B1 writing check', 'assessment'], ['B1 speaking check', 'assessment'], ['Plan your exam preparation', 'reflection and plan']]],
  ] },
  { id: 'b2', title: 'Upper-intermediate', outcome: 'Argue, persuade and synthesize; adapt your register; follow complex speech.', units: [
    ['Defend an argument', 'Claims, concession and counterarguments', [
      ['Structuring an argument', 'thèse, arguments, exemples'], ['Concession', 'bien que, même si, certes… mais'], ['Counterarguments', 'refuting politely'], ['Certainty and doubt', 'je doute que + subjonctif'], ['Debate a question', 'integration mission']]],
    ['Persuade and negotiate', 'Persuasion and register', [
      ['Persuasive language', 'rhetorical devices'], ['Convincing a friend', 'link to TEF speaking B'], ['Formal and familiar registers', 'switching register'], ['Negotiation phrases', 'compromis'], ['Persuade someone to act', 'integration mission']]],
    ['Society and public policy', 'Nuanced positions on complex issues', [
      ['Immigration and integration', 'vocabulary and debate'], ['Environment debates', 'vocabulary and debate'], ['Impersonal structures', 'il est important que, il faut que'], ['Expressing nuance', 'dans une certaine mesure'], ['Take a position on a policy', 'integration mission']]],
    ['Media and information', 'Sources, tone and inference', [
      ['Fact or opinion?', 'distinguishing'], ['Evaluating sources', 'fiabilité'], ['Tone and implicit meaning', 'ironie, sous-entendu'], ['Reported speech in depth', 'tense changes'], ['Analyze an article', 'integration mission']]],
    ['Professional life', 'Formal correspondence and meetings', [
      ['Formal correspondence', 'courriel professionnel'], ['Meetings and presentations', 'animer, présenter'], ['Formal requests', 'je vous saurais gré de'], ['Workplace conflicts', 'diplomacy'], ['Write a professional email', 'integration mission']]],
    ['Advanced grammar in context', 'Subjonctif, double pronouns, past conditional', [
      ['The subjonctif: forms', 'regular and irregular'], ['Subjonctif after emotions and wishes', 'je veux que, je suis content que'], ['Double pronouns', 'je le lui donne'], ['The past conditional', 'j\'aurais dû'], ['Grammar in real texts', 'integration mission']]],
    ['Coherence and precision', 'Reformulation and precise vocabulary', [
      ['Reformulating', 'autrement dit, c\'est-à-dire'], ['Nominalization', 'augmenter → l\'augmentation'], ['Precise verbs', 'beyond faire, dire, avoir'], ['Connectors for complex ideas', 'or, ainsi, en revanche'], ['Rewrite a text precisely', 'integration mission']]],
    ['Authentic listening', 'Interviews, debates and accents', [
      ['Interviews', 'listening'], ['Debates and overlapping speech', 'listening'], ['Québécois French', 'features and vocabulary'], ['Fast speech and contractions', 'chais pas, y\'a'], ['Listening marathon', 'integration mission']]],
    ['Complex reading', 'Argument structure and inference', [
      ['Argument structure in texts', 'reading'], ['Inference', 'reading between the lines'], ['Long texts', 'skimming and scanning'], ['Opinion and literary texts', 'reading'], ['Read and respond', 'integration mission']]],
    ['Structured writing', 'Essays within word limits', [
      ['Introductions', 'accroche, problématique'], ['Developing arguments', 'paragraphs'], ['Conclusions', 'synthèse, ouverture'], ['Writing to a word limit', 'concision'], ['Full essay', 'integration mission']]],
    ['Extended speaking', 'Spontaneous and sustained speech', [
      ['Spontaneous responses', 'thinking on your feet'], ['Sustained argument', 'speaking for 3–4 minutes'], ['Interacting with an examiner', 'exam interaction'], ['Recovering from mistakes', 'self-correction'], ['Extended speaking task', 'integration mission']]],
    ['Four-skill exam readiness', 'Mocks, error analysis and remediation', [
      ['Reading under exam conditions', 'mock'], ['Listening under exam conditions', 'mock'], ['Writing under exam conditions', 'mock'], ['Speaking under exam conditions', 'mock'], ['Final readiness review', 'reflection and plan']]],
  ] },
];

// Every unit gets a 6th lesson: a practice workshop after the unit checkpoint (lesson 5).
export const LEVELS = BASE_LEVELS.map(lv => ({
  ...lv,
  units: lv.units.map(([title, outcome, lessons]) => [title, outcome, [
    ...lessons,
    [`Workshop: ${title}`, 'extra practice on the whole unit: more listening, reading, mixed recall, writing and speaking, with new contexts'],
  ]]),
}));
