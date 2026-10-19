import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { getData } from '../engine/content.js';
import { empty } from '../ui/components.js';

const LEVELS = [['', 'All levels'], ['a1', 'A1'], ['a2', 'A2'], ['b1', 'B1'], ['b2', 'B2']];
const COST = { free: ['green', 'Free'], freemium: ['amber', 'Free + paid options'], paid: ['red', 'Paid'] };
const REGION = { france: 'France', quebec: 'Québec', canada: 'Canada', international: 'International' };

export default async function resources(params, root) {
  let data;
  try { data = await getData('resources'); } catch { data = null; }
  const v = h('div', { class: 'view' });
  root.append(v);
  v.append(h('div', { class: 'page-head' }, h('h1', 'Resources'),
    h('p', 'The best free channels, podcasts, sites and official exam material to use alongside the course. Daily listening and regular speaking practice with real people are what take you from “I understand the lessons” to NCLC 7.')));
  if (!data) { v.append(empty('Resources are not available', 'The resource list could not be loaded.')); return; }

  let level = '';
  try { level = localStorage.getItem('fq.res.level') || ''; } catch { /* */ }
  const filters = h('nav', { class: 'exam-switch', 'aria-label': 'Filter by level', style: { marginBottom: '1rem' } });
  const jump = h('nav', { class: 'row', 'aria-label': 'Jump to a category', style: { gap: '.4rem', marginBottom: '2rem' } },
    data.categories.map(c => h('a', { class: 'tag', href: `#res-${c.id}`, onclick: e => { e.preventDefault(); document.getElementById(`res-${c.id}`)?.scrollIntoView({ behavior: 'smooth' }); } }, c.title)));
  const list = h('div');
  v.append(filters, jump, list);

  const render = () => {
    clear(filters).append(...LEVELS.map(([id, label]) => h('a', { href: '#/resources', 'aria-current': level === id ? 'page' : null, onclick: e => {
      e.preventDefault(); level = id; try { localStorage.setItem('fq.res.level', id); } catch { /* */ } render();
    } }, label)));
    clear(list);
    for (const c of data.categories) {
      const items = c.items.filter(it => !level || (it.levels || []).includes(level));
      if (!items.length) continue;
      list.append(h('section', { class: 'section', id: `res-${c.id}`, 'aria-labelledby': `res-h-${c.id}`, style: { marginTop: '2.5rem' } },
        h('h2', { id: `res-h-${c.id}` }, c.title),
        c.intro && h('p', { class: 'muted small', style: { maxWidth: '44rem' } }, c.intro),
        h('div', { class: 'grid grid-2', style: { gap: '1rem' } }, items.map(it => {
          const [tone, costLabel] = COST[it.cost] || ['', it.cost];
          return h('article', { class: 'panel resource' },
            h('h3', { style: { margin: 0, fontFamily: 'var(--font-fr)', fontSize: 'var(--fs-lg)' } },
              h('a', { href: it.url, target: '_blank', rel: 'noopener noreferrer' }, it.name, h('span', { class: 'sr-only' }, ' (opens in a new tab)'))),
            h('div', { class: 'row', style: { gap: '.35rem', margin: '.6rem 0' } },
              h('span', { class: `tag ${tone}` }, costLabel),
              it.region && h('span', { class: 'tag' }, REGION[it.region] || it.region),
              (it.levels || []).length && h('span', { class: 'tag blue' }, it.levels.map(x => x.toUpperCase()).join(' · '))),
            h('p', { class: 'small', style: { margin: 0 } }, it.why));
        }))));
    }
    if (!list.children.length) list.append(empty('Nothing for this level', 'Try another level filter.'));
  };
  render();
  v.append(h('p', { class: 'disclaimer', style: { marginTop: '3rem' } }, icon('info'),
    `Links checked ${data.verifiedOn}. These are external sites; FrenchQuest is not affiliated with them. Prices and offers change — check each site.`));
}
