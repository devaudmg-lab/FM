import { h, fr } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { bar, minutes, empty, sayButton } from '../ui/components.js';
import { pathStatus, skillScores, dailyRange, SKILL_LABEL } from '../engine/progress.js';
import { cardStats } from '../engine/cards.js';
import { streak, totalXP, BADGES, isActiveDay } from '../engine/gamification.js';
import { getCourse } from '../engine/content.js';
import { playBlob } from '../media/recorder.js';
import { renderFeedback } from '../ai/coach.js';
import * as db from '../store/db.js';

const DONE = new Set(['completed', 'completed-weak', 'tested-out']);

export default async function progress({ tab = 'overview' }, root) {
  const v = h('div', { class: 'view' });
  root.append(v);
  v.append(h('div', { class: 'page-head row between', style: { alignItems: 'flex-end' } },
    h('div', h('h1', 'Progress'), h('p', 'What you can do now, measured by recall — not by clicks.')),
    h('div', { class: 'row', style: { gap: '.4rem' } },
      h('a', { class: 'btn sm', href: '#/vocabulary' }, icon('book'), 'Vocabulary'),
      h('a', { class: 'btn sm', href: '#/resources' }, icon('map'), 'Resources'),
      h('a', { class: 'btn sm', href: '#/settings' }, icon('settings'), 'Settings'))));
  const tabs = [['overview', 'Overview'], ['portfolio', 'Portfolio'], ['badges', 'Badges']];
  v.append(h('nav', { class: 'row', 'aria-label': 'Progress sections', style: { marginBottom: '2rem', gap: '.25rem' } },
    tabs.map(([id, label]) => h('a', { class: ['btn', 'sm', id === tab ? 'primary' : 'ghost'], href: `#/progress/${id}`, 'aria-current': id === tab ? 'page' : null }, label))));
  if (tab === 'portfolio') return portfolio(v);
  if (tab === 'badges') return badges(v);

  const [path, scores, cs, days, st, xp, course] = await Promise.all([pathStatus(), skillScores(), cardStats(), dailyRange(182), streak(), totalXP(), getCourse()]);
  const totalSec = days.reduce((s, d) => s + d.seconds, 0);
  const done = path.filter(l => DONE.has(l.status)).length;
  v.append(h('div', { class: 'grid grid-4' },
    h('div', { class: 'stat' }, h('b', String(done)), h('span', 'lessons done')),
    h('div', { class: 'stat' }, h('b', String(cs.itemsEstablished)), h('span', 'items established')),
    h('div', { class: 'stat' }, h('b', minutes(totalSec)), h('span', 'studied (6 months)')),
    h('div', { class: 'stat' }, h('b', `${st.count} · ${xp}`), h('span', 'day streak · XP'))));

  // Level mastery
  const lv = h('section', { class: 'section' }, h('h2', 'Course mastery'));
  for (const L of course.levels) {
    const ls = path.filter(l => l.level === L.id);
    const d = ls.filter(l => DONE.has(l.status)).length;
    lv.append(h('div', { class: 'skill-row', style: { gridTemplateColumns: '8rem 1fr 4rem' } }, h('span', h('strong', L.id.toUpperCase()), ' ', h('span', { class: 'small muted' }, L.title)), bar((d / ls.length) * 100, 'green'), h('span', { class: 'val' }, `${d}/${ls.length}`)));
  }
  v.append(lv);

  // Skills
  const sk = h('section', { class: 'section' }, h('h2', 'Skills'), h('p', { class: 'small muted' }, 'Recent accuracy, weighted toward your latest answers.'));
  for (const s of Object.keys(SKILL_LABEL)) {
    sk.append(h('div', { class: 'skill-row' }, h('span', SKILL_LABEL[s]), scores[s].score == null ? h('span', { class: 'small faint' }, 'No data yet') : bar(scores[s].score), h('span', { class: 'val' }, scores[s].score == null ? '' : `${scores[s].score}%`)));
  }
  v.append(sk);

  // Heatmap
  const first = new Date(days[0].date + 'T12:00:00').getDay();
  const cells = [...Array(first).fill(null), ...days];
  const goalSec = 60 * 60;
  v.append(h('section', { class: 'section' }, h('h2', 'Study days'),
    h('div', { class: 'heat', role: 'img', 'aria-label': `${days.filter(isActiveDay).length} active days in the last six months` },
      cells.map(d => d ? h('i', { 'data-l': d.seconds === 0 && !isActiveDay(d) ? 0 : d.seconds < goalSec / 3 ? 1 : d.seconds < goalSec ? 2 : 3, title: `${d.date}: ${Math.round(d.seconds / 60)} min` }) : h('i', { style: { visibility: 'hidden' } }))),
    h('p', { class: 'small muted' }, `${days.filter(isActiveDay).length} active days · streaks forgive rest days and up to two missed days a month.`)));

  // Memory
  v.append(h('section', { class: 'section' }, h('h2', 'Memory'),
    h('div', { class: 'grid grid-4' },
      h('div', { class: 'stat' }, h('b', String(cs.new)), h('span', 'new cards')),
      h('div', { class: 'stat' }, h('b', String(cs.learning)), h('span', 'learning')),
      h('div', { class: 'stat' }, h('b', String(cs.review)), h('span', 'in review')),
      h('div', { class: 'stat' }, h('b', String(cs.established)), h('span', 'established cards')))));
}

async function portfolio(v) {
  const rows = (await db.all('portfolio')).sort((a, b) => b.ts - a.ts);
  if (!rows.length) { v.append(empty('Your portfolio is empty', 'Writing and speaking tasks you complete in lessons are saved here, so you can see how you improve.', h('a', { class: 'btn primary', href: '#/learn' }, 'Go to the course'))); return; }
  const list = h('div', { class: 'stack' });
  for (const e of rows) {
    const card = h('article', { class: 'panel' },
      h('div', { class: 'row between' }, h('span', { class: ['tag', e.kind === 'writing' ? 'blue' : 'violet'] }, e.kind === 'writing' ? 'Writing' : 'Speaking'), h('span', { class: 'small muted' }, new Date(e.ts).toLocaleString())),
      h('p', { style: { margin: '.75rem 0' } }, h('strong', e.prompt)),
      e.text && h('p', { class: 'fr', lang: 'fr', style: { whiteSpace: 'pre-wrap' } }, e.text, ' ', sayButton(e.text)),
      e.text && h('p', { class: 'small muted' }, `${e.words} words`),
      e.transcript && h('p', { class: 'small' }, 'Transcript (experimental): ', fr(e.transcript)),
      e.self && h('p', { class: 'small muted' }, `Self-rating: ${Object.values(e.self).reduce((a, b) => a + b, 0)} / ${Object.keys(e.self).length * 3}`));
    if (e.recordingId) {
      const rec = await db.get('recordings', e.recordingId);
      if (rec) card.append(h('button', { class: 'btn sm', onclick: () => playBlob(rec.blob) }, icon('play'), `Play recording (${Math.round(rec.ms / 1000)} s)`));
    }
    if (e.ai) card.append(renderFeedback(e.ai));
    list.append(card);
  }
  v.append(list);
}

async function badges(v) {
  const [path, cs, port, days, sessions] = await Promise.all([pathStatus(), cardStats(), db.all('portfolio'), dailyRange(400), db.all('examSessions')]);
  const logs = await db.all('reviewLog');
  const byDay = new Map();
  for (const l of logs) { const d = new Date(l.ts).toDateString(); const x = byDay.get(d) || { n: 0, ok: 0 }; x.n++; if (l.status !== 'incorrect') x.ok++; byDay.set(d, x); }
  const unitsDone = new Set();
  const byUnit = new Map();
  for (const l of path) { if (!byUnit.has(l.unitId)) byUnit.set(l.unitId, []); byUnit.get(l.unitId).push(l); }
  for (const [u, ls] of byUnit) if (ls.every(l => DONE.has(l.status))) unitsDone.add(u);
  const s = {
    lessonsDone: path.filter(l => DONE.has(l.status)).length, unitsDone, established: cs.itemsEstablished,
    speaking: port.filter(e => e.kind === 'speaking').length, writing: port.filter(e => e.kind === 'writing').length,
    goodReviewDays: [...byDay.values()].filter(x => x.n >= 10 && x.ok / x.n >= 0.9).length,
    activeDays: days.filter(isActiveDay).length, examSessions: sessions.length,
  };
  v.append(h('div', { class: 'badges' }, BADGES.map(b => {
    const earned = b.test(s);
    return h('div', { class: ['badge', earned && 'earned'] }, h('div', { class: 'seal' }, icon(earned ? 'medal' : 'lock')), h('b', b.name), h('span', b.req), h('span', { class: 'sr-only' }, earned ? 'Earned' : 'Not yet earned'));
  })));
}
