// PMFBY loss-intimation rules. Pure functions, no DOM. Every rule cites the paragraph of the
// PMFBY Operational Guidelines 2023 (OG) it comes from; see README for the source.
import { STRINGS, STATES } from './i18n.js';

const MIN = 60e3;
const DAY = 24 * 60 * MIN;
export const IST_OFFSET = (5 * 60 + 30) * MIN; // India has no daylight saving time
export const WINDOW = 72 * 60 * MIN; // OG 21.5.5.1 B, 21.6.6.1 B, Table 10
export const POST_HARVEST_DAYS = 14; // OG 21.6.1

export const PERILS = ['hail', 'landslide', 'inundation', 'cloudburst', 'lightning_fire', 'rain_cyclone', 'drought_pest', 'other'];
export const CROP_STATES = ['standing', 'cut_in_field', 'stored'];
const LOCALIZED = ['hail', 'landslide', 'inundation', 'cloudburst', 'lightning_fire']; // OG 5.2.4, 21.5.1
const POST_HARVEST = ['hail', 'rain_cyclone']; // OG 5.2.3, 21.6.1

const REFS = {
  localized: ['5.2.4', '21.5.1', '21.5.4.1', '21.5.4.4', '21.5.5.1', '21.5.9.2'],
  post_harvest: ['5.2.3', '21.6.1', '21.6.2', '21.6.4.1', '21.5.4.4', '21.6.6.1'],
  post_harvest_late: ['21.6.1'],
  not_listed_cut: ['21.6.1', '21.5.4.3', 'Table 10'],
  stored: ['21.6.1'],
  widespread: ['5.1', '5.5'],
  other: ['5.2.5'],
};

// "YYYY-MM-DD" + "HH:MM" read as India time -> epoch ms. Date.UTC never looks at the phone's zone.
export function istToEpoch(date, time = '00:00') {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, mi) - IST_OFFSET;
}

const istDay = (epoch) => Math.floor((epoch + IST_OFFSET) / DAY);
const pad = (n) => String(n).padStart(2, '0');

// Calendar date + clock of an epoch in India time, as numbers.
function istParts(epoch) {
  const d = new Date(epoch + IST_OFFSET);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
}

const dateText = (p, lang) => `${p.d} ${STRINGS[lang].months.split(',')[p.m]} ${p.y}`;
export const formatIST = (epoch, lang) => { const p = istParts(epoch); return `${dateText(p, lang)}, ${pad(p.h)}:${pad(p.mi)} IST`; };
export const formatDate = (iso, lang) => dateText(istParts(istToEpoch(iso)), lang);
// "YYYY-MM-DD" and "HH:MM" of an epoch in India time, for the date and time inputs.
export const istInputs = (epoch) => { const p = istParts(epoch); return [`${p.y}-${pad(p.m + 1)}-${pad(p.d)}`, `${pad(p.h)}:${pad(p.mi)}`]; };

export function classify({ peril, cropState, eventEpoch, harvestDate }) {
  let kind;
  if (cropState === 'stored') kind = 'stored';
  else if (peril === 'other') kind = 'other';
  else if (peril === 'drought_pest') kind = 'widespread';
  else if (cropState === 'standing') kind = LOCALIZED.includes(peril) ? 'localized' : 'widespread';
  else if (!POST_HARVEST.includes(peril)) kind = 'not_listed_cut';
  else {
    // Harvest day is day 0; day 14 is still inside. No harvest date given: not judged late.
    const days = harvestDate ? istDay(eventEpoch) - istDay(istToEpoch(harvestDate)) : 0;
    kind = days <= POST_HARVEST_DAYS ? 'post_harvest' : 'post_harvest_late';
  }
  const caveats = kind === 'localized' || kind === 'post_harvest' ? ['caveat_notified', 'caveat_premium'] : [];
  if (kind === 'post_harvest' && peril === 'rain_cyclone') caveats.push('caveat_unseasonal');
  return { kind, refs: REFS[kind], caveats };
}

export const needsIndividualIntimation = (kind) => ['localized', 'post_harvest', 'not_listed_cut'].includes(kind);
export const deadline = (eventEpoch) => eventEpoch + WINDOW;
export function status(eventEpoch, nowEpoch) {
  const msLeft = deadline(eventEpoch) - nowEpoch;
  return { open: msLeft >= 0, msLeft };
}

const BLANK = '______';

// The report the farmer reads out on 14447 or sends. Only what the farmer typed; blanks stay blank.
export function intimationText(f, lang) {
  const t = STRINGS[lang];
  const v = (x) => (x == null || x === false || String(x).trim() === '' ? BLANK : String(x).trim());
  const state = STATES.find((s) => s[0] === f.state)?.[lang === 'hi' ? 1 : 0] ?? f.state;
  const lines = [
    t.r_to,
    t.r_subject,
    '',
    `${t.r_name}: ${v(f.name)}`,
    `${t.r_mobile}: ${v(f.mobile)}`,
    `${t.r_appno}: ${v(f.appNo)}`,
    `${t.r_account}: ${v(f.account)}`,
    `${t.r_state}: ${v(state)}`,
    `${t.r_district}: ${v(f.district)}`,
    `${t.r_village}: ${v(f.village)}`,
    `${t.r_survey}: ${v(f.survey)}`,
    `${t.r_crop}: ${v(f.crop)}`,
    `${t.r_season}: ${v(f.season && t[`season_${f.season}`])}`,
    `${t.r_area}: ${v(f.area)}`,
    `${t.r_what}: ${v(f.peril && t[`peril_${f.peril}`])}`,
    `${t.r_when}: ${v(Number.isFinite(f.eventEpoch) && formatIST(f.eventEpoch, lang))}`,
    `${t.r_condition}: ${v(f.cropState && t[`cond_${f.cropState}`])}`,
  ];
  if (f.cropState === 'cut_in_field') lines.push(`${t.r_harvest}: ${v(f.harvestDate && formatDate(f.harvestDate, lang))}`);
  lines.push('', t.r_request, '', `${t.r_sign}: ${v(f.name)}`);
  return lines.join('\n');
}
