# Sounds page brief (`data/sounds.json`)

The Sounds page teaches the French sound system to a beginner, an adult Hindi/Urdu speaker who also knows English. **Do not use phonetics jargon.** Never say "bilabial", "fricative", "schwa" and the like without a plain explanation. Every sound needs four things:
- a near-equivalent in English
- a near-equivalent in Hindi, in Devanagari *and* Roman Hinglish
- simple mouth instructions
- something to tap so the learner hears it

**Use Hindi where it helps.** Hindi speakers have real advantages in French. Use them:
- **Nasal vowels:** Hindi has nasal vowels too, written with chandrabindu or anusvara (माँ, हैं, हों). This is the easiest way in.
- **French T, D, P, K:** these are like Hindi त द प क. They are **dental** and **unaspirated**, not English-style. No puff of air: *pas* is "प" not "फ".
- **French R:** close to Urdu/Hindi **ग़** (ग़लत, ग़ज़ल), a soft gargle at the back of the throat. Make it softer and less rough.
- **CH:** = श.
- **GN:** ≈ "न्य" (like the ny in "canyon").
- **J / G before e, i:** the "s" in "measure". Hindi has no exact letter; the closest is ज़ with a soft buzz. Say "like झ़ / ज़ but softer, with buzz".

Be honest when there is no Hindi equivalent: French **u** and **eu** have none. In those cases, give a mouth recipe instead (for u, "say ई, keep your tongue still and round your lips as for ऊ").

## Schema

```json
{
  "schemaVersion": 1,
  "verifiedOn": "2026-10-20",
  "intro": "md-lite text, 2–4 short paragraphs: why French sounds matter, how to use this page (tap anything to hear it; the 🐢 button plays it slower), and a reminder that the mouth guide shows the lip shape.",
  "mouth": [
    { "id": "spread",  "name": "Smile",          "en": "Corners of the lips pulled back, as for a photo smile.", "hi": "Hothon ko smile ki tarah peeche khinchein." },
    { "id": "rounded", "name": "Small circle",   "en": "Lips pushed forward into a small tight circle, as if blowing out a candle.", "hi": "…" },
    { "id": "round-open", "name": "Big circle", "en": "…", "hi": "…" },
    { "id": "open",    "name": "Open",           "en": "…", "hi": "…" },
    { "id": "relaxed", "name": "Relaxed",        "en": "…", "hi": "…" },
    { "id": "nasal",   "name": "Through the nose","en": "…", "hi": "…" }
  ],
  "sections": [
    {
      "id": "alphabet", "title": "The alphabet", "kind": "letters",
      "intro": "md-lite, short",
      "items": [
        { "ch": "A", "say": "a", "name": "a", "en": "like 'a' in 'father'", "hi": "आ", "hiRoman": "aa",
          "example": { "fr": "ami", "en": "friend" }, "tip": "optional short tip" }
      ]
    },
    { "id": "accents", "title": "Accents and special letters", "kind": "cards", "intro": "…",
      "items": [ { "ch": "é", "title": "e with acute accent (accent aigu)", "say": "été", "body": "md-lite: what it does to the sound", "hi": "ए", "hiRoman": "e — jaise 'khel'",
                   "examples": [ { "fr": "café", "en": "coffee" } ] } ] },
    { "id": "vowels", "title": "Vowel sounds", "kind": "sounds", "intro": "…",
      "items": [
        { "id": "ou", "label": "ou", "spellings": ["ou", "où", "oû"], "say": "ou",
          "en": "like 'oo' in 'food'", "hi": "ऊ", "hiRoman": "oo — jaise 'phool'",
          "mouth": "rounded",
          "how": "1–3 short English steps",
          "howHi": "the same in simple Roman Hinglish",
          "examples": [ { "fr": "vous", "en": "you" }, { "fr": "rouge", "en": "red" }, { "fr": "bonjour", "en": "hello" } ],
          "trap": "optional: the most common mistake, e.g. confusing it with u" }
      ] },
    { "id": "nasals", "title": "Nasal sounds", "kind": "sounds", "intro": "…", "items": [ … same shape … ] },
    { "id": "consonants", "title": "Consonants that differ from English", "kind": "sounds", "intro": "…", "items": [ … same shape; mouth may be omitted … ] },
    { "id": "silent", "title": "Silent letters, linking and elision", "kind": "cards", "intro": "…", "items": [ … cards with title, body, examples … ] },
    { "id": "numbers", "title": "Numbers", "kind": "numbers", "intro": "…",
      "groups": [ { "title": "0–20", "note": "optional md-lite", "items": [ { "n": "0", "fr": "zéro" } ] } ] }
  ],
  "drills": [
    { "id": "u-ou", "title": "u or ou?", "explain": "one or two sentences: what to listen for",
      "labels": ["u", "ou"],
      "pairs": [ [ { "fr": "tu", "en": "you" }, { "fr": "tout", "en": "all" } ] ] }
  ]
}
```

`md-lite` allows `**bold**`, `*italic*` and `[[French]]` (French words in [[ ]] can be tapped to hear them), with a blank line between paragraphs and `- ` for bullets. No HTML.

## Content to cover

- **mouth:** exactly the 6 ids above, with very short `en`, and `hi` in Roman Hinglish.
- **alphabet:**
  - All 26 letters, in order.
  - `say` is what the speech engine reads aloud for the letter's French name. Use spellings that TTS reads correctly: a, bé, cé, dé, euh, effe, gé, hache, i, ji, ka, elle, emme, enne, o, pé, cu, erre, esse, té, u, vé, double vé, ixe, i grec, zède.
  - `name` is how to write the name for the learner, e.g. "bé".
  - Each letter has an example word that starts with it, if one exists at A1.
  - Tips are needed for letters a learner would get wrong, e.g. "E is named euh, I is named i (ee), G and J swap compared with English".
- **accents:** é, è, ê, ë, à, â, î, ï, ô, û, ù, ç, œ and the apostrophe. Keep it practical: "è/ê = open e like in 'bed'". Say which accents change the sound and which only change the meaning or spelling (à vs a, où vs ou).
- **vowels:** 10–12 sounds, each with lip shape:
  - a
  - é (closed e)
  - è/ê/ai (open e)
  - i
  - o closed (eau, au, ô)
  - o open (bol, porte)
  - ou
  - u
  - eu closed (deux, peu)
  - eu open (heure, sœur)
  - the "light e" in le, de, je (call it "the light e (e muet)")
  - optionally the oi sound (wa)
- **nasals:** an/en/am/em, on/om, in/ain/ein/un/im (note that most speakers today merge un with in). Use the Hindi nasal-vowel comparison, plus the hum test: "pinch your nose: if the sound changes, you're doing it". Add a **trap** for each: "the n is NOT pronounced: *bon* is not 'bonn'", and note that a nasal stops being nasal before a vowel (bon / bonne, un / une).
- **consonants:**
  - R
  - J / soft G
  - CH
  - GN
  - ILL / IL (fille, travail)
  - H (always silent)
  - TH = t
  - QU = k
  - C and G before e/i vs a/o/u, and ç
  - S between two vowels = z
  - T and D dental (Hindi त द)
  - P/T/K without a puff of air
  - L always clear (no dark English l)
  - final consonants usually silent, with the CaReFuL tip: final c, r, f, l are often pronounced
- **silent:** 5–6 cards:
  - silent final letters (petit, grand, les)
  - final -e
  - -ent in verbs (ils parlent)
  - liaison (les amis, vous avez, un ami)
  - elision (l'ami, j'ai, c'est)
  - enchaînement (il a → i-la)

  Examples everywhere.
- **numbers:** 0–20; 21–29 (et un); tens 30–60; 70–79 (soixante-dix…); 80–99 (quatre-vingts…); 100, 200, 1000, 2026; plus a note that Belgium and Switzerland say septante/nonante but **Canada and France do not**. Add pronunciation notes:
  - six, dix: final x silent before a consonant, z before a vowel, s at the end
  - huit, cent: the t is silent before a consonant
  - vingt: the t is pronounced in 21–29
  - quatre-vingts takes an s, but quatre-vingt-un does not
- **drills:** 6–8 drills of 8–12 real-word pairs each, with labels:
  - u/ou
  - é/è (or é vs ai in the future/conditional, e.g. j'irai/j'irais; keep it simple)
  - le/les
  - an/on
  - in/an
  - nasal vs not (bon/bonne, un/une, plein/pleine)
  - eu/ou

  Every word must be a real, common French word, and the two words in a pair must differ only in the target sound. Give each word an `en` gloss.

## Rules

- Use accurate French. Use real, common example words. Translations must be correct.
- **TTS-safe `say` values.** `say` is read by the device's French speech engine. It must be a real French word or syllable that TTS pronounces as the target sound. Never use a lone accented letter, which TTS would read as "e accent aigu". Good: "ou", "u", "eux", "eau", "été", "un", "vin", "vent", "bon", "rue".
- **Short text.** Users are on phones. `how` and `howHi` should be 1–3 short sentences each.
- `howHi` is natural Roman Hinglish, as an Indian learner would write it, e.g. "Pehle 'ee' bolo, jeebh wahin rakho, phir hothon ko 'oo' jaisa gol karo."
- Write valid JSON (UTF-8). Check that it parses: `node -e "JSON.parse(require('fs').readFileSync('data/sounds.json','utf8'))"`.
