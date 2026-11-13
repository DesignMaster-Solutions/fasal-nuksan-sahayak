import {
  PERILS, CROP_STATES, INSURED, shareUrl, answersFrom, classify, needsIndividualIntimation, status, deadline, formatIST, istToEpoch, istInputs, intimationText,
} from './rules.js';
import { STRINGS, STATES } from './i18n.js';

const $ = (id) => document.getElementById(id);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const params = new URLSearchParams(location.search);

let lang = ['en', 'hi'].includes(params.get('lang')) ? params.get('lang')
  : localStorage.getItem('fns-lang') || (navigator.language?.startsWith('hi') ? 'hi' : 'en');
const t = (key) => STRINGS[lang][key];
// Anonymous usage count for the impact data: event name and language only, never the peril, State or report.
// ?nostats keeps our own tests and demo recordings out of the public impact numbers.
const NOSTATS = new URLSearchParams(location.search).has('nostats');
const count = (event) => NOSTATS || navigator.sendBeacon?.('/api/event', JSON.stringify({ event, lang }));

const STEPS = ['peril', 'when', 'cropstate', 'crop', 'insured'];
const ICON = {
  hail: '🌨️', landslide: '⛰️', inundation: '🌊', cloudburst: '⛈️', lightning_fire: '🔥', fire_other: '🚒', rain_cyclone: '🌀', drought_pest: '🐛', wild_animal: '🐗', other: '❔',
  standing: '🌾', cut_in_field: '✂️', stored: '🏠', loan: '🏦', csc: '🏢', portal: '📱', unsure: '❓',
};

let view = 'intro';
let stepIndex = 0;
let a = {};
let timer;

function show(id) {
  view = id;
  for (const s of ['intro', 'wizard', 'result']) $(s).hidden = s !== id;
  clearInterval(timer);
  if (id === 'result') timer = setInterval(renderClock, 60e3);
  render();
  $(id).querySelector(id === 'wizard' ? `[data-step="${STEPS[stepIndex]}"] h2` : '[tabindex="-1"]')?.focus();
  scrollTo(0, 0);
}

function goStep(i) {
  stepIndex = i;
  if (i < 0) return show('intro');
  if (i >= STEPS.length) return showResult();
  show('wizard');
}

const choice = (key, icon, chosen, onclick) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = chosen ? 'chosen' : '';
  b.innerHTML = `<span aria-hidden="true">${icon}</span> <span data-t="${key}"></span>`;
  b.onclick = onclick;
  return b;
};

function renderWizard() {
  const step = STEPS[stepIndex];
  for (const d of document.querySelectorAll('[data-step]')) d.hidden = d.dataset.step !== step;
  $('step').textContent = fill(t('step'), { n: stepIndex + 1, total: STEPS.length });
  $('bar').style.width = `${(stepIndex / STEPS.length) * 100}%`;
  $('perils').replaceChildren(...PERILS.map((p) => choice(`peril_${p}`, ICON[p], a.peril === p, () => { a.peril = p; goStep(1); })));
  $('cropstates').replaceChildren(...CROP_STATES.map((s) => choice(`cs_${s}`, ICON[s], a.cropState === s, () => {
    a.cropState = s;
    if (s !== 'cut_in_field') return goStep(3);
    $('harvest-box').hidden = false;
    $('harvest').max = $('date').value;
    render();
    $('harvest').focus();
  })));
  $('harvest-box').hidden = a.cropState !== 'cut_in_field';
  $('insured').replaceChildren(...INSURED.map((k) => choice(`ins_${k}`, ICON[k], a.insured === k, () => { a.insured = k; goStep(5); })));
  const sel = $('state');
  const keep = sel.value;
  sel.replaceChildren(new Option(t('choose'), ''), ...STATES.map(([en, hi]) => new Option(lang === 'hi' ? hi : en, en)));
  sel.value = keep;
}

function setWhen(epoch, withTime) {
  const [d, tm] = istInputs(epoch);
  $('date').value = d;
  if (withTime) $('time').value = tm;
  else $('time').focus();
}

function eventEpoch() {
  const d = $('date').value;
  const tm = $('time').value;
  return d && tm ? istToEpoch(d, tm) : NaN;
}

$('when-now').onclick = () => { setWhen(Date.now(), true); $('next-when').focus(); };
$('when-yesterday').onclick = () => setWhen(Date.now() - 864e5, false);
$('next-when').onclick = () => {
  const e = eventEpoch();
  const bad = !(e <= Date.now() + 5 * 60e3);
  $('err-when').hidden = !bad;
  if (!bad) { a.eventEpoch = e; goStep(2); }
};
$('next-harvest').onclick = () => {
  const h = $('harvest').value;
  const bad = !h || h > $('date').value;
  $('err-harvest').hidden = !bad;
  if (!bad) { a.harvestDate = h; goStep(3); }
};
$('next-crop').onclick = () => {
  a.crop = $('crop').value;
  a.season = document.querySelector('input[name="season"]:checked')?.value || '';
  a.state = $('state').value;
  goStep(4);
};

function showResult() {
  if (a.cropState !== 'cut_in_field') delete a.harvestDate;
  a.result = classify(a);
  show('result');
  count('report');
  if (needsIndividualIntimation(a.result.kind) && status(a.eventEpoch, Date.now()).open) count('open');
}

const li = (key) => Object.assign(document.createElement('li'), { textContent: t(key) });

function renderClock() {
  const { kind } = a.result;
  const el = $('clock');
  if (!needsIndividualIntimation(kind)) { el.textContent = t('no_window'); el.className = 'clock'; return; }
  const s = status(a.eventEpoch, Date.now());
  const dl = formatIST(deadline(a.eventEpoch), lang);
  if (!s.open) { el.textContent = fill(t('closed'), { deadline: dl }); el.className = 'clock late'; return; }
  const mins = Math.floor(s.msLeft / 60e3);
  el.innerHTML = '';
  el.append(fill(t('deadline'), { deadline: dl }), document.createElement('br'),
    Object.assign(document.createElement('strong'), { textContent: fill(t('left'), { h: Math.floor(mins / 60), m: mins % 60 }) }));
  el.className = 'clock open';
}

const reportFields = () => ({ ...a, ...Object.fromEntries(new FormData($('fields'))) });
const otherLang = () => (lang === 'hi' ? 'en' : 'hi');

function renderReport() {
  const f = reportFields();
  $('report').textContent = intimationText(f, lang);
  $('report').lang = lang;
  $('report-other').hidden = !$('show-other').checked;
  $('report-other').textContent = intimationText(f, otherLang());
  $('report-other').lang = otherLang();
  $('share').href = `https://wa.me/?text=${encodeURIComponent($('report').textContent)}`;
  $('pass').href = `https://wa.me/?text=${encodeURIComponent(`${t('pass_text')} ${shareUrl(location.origin, a, lang)}`)}`;
}

function renderResult() {
  const { kind, refs, caveats } = a.result;
  $('kind-t').textContent = t(`kind_${kind}_t`);
  $('kind-b').textContent = t(`kind_${kind}_b`);
  $('kind-ref').textContent = fill(t('rule_ref'), { refs: refs.join(', ') });
  $('caveats').replaceChildren(...caveats.map(li));
  $('verdict').className = `card ${needsIndividualIntimation(kind) ? 'act' : 'info'}`;
  $('ready').replaceChildren(...['ready_app', `ready_acct_${a.insured}`, 'ready_survey', 'ready_area', 'ready_mobile', 'ready_photos'].map(li));
  renderClock();
  renderReport();
  updateSpeak();
}

function render() {
  document.documentElement.lang = lang;
  document.title = `${t('title')} · PMFBY 72h`;
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', b.dataset.lang === lang);
  if (view === 'wizard') renderWizard();
  if (view === 'result') renderResult();
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
}

// Read aloud only when the phone has an Indian voice for the language; never required.
const synth = globalThis.speechSynthesis;
const voice = () => synth?.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase() === (lang === 'hi' ? 'hi-in' : 'en-in'));
function updateSpeak() { $('speak').hidden = !voice(); }
if (synth) synth.onvoiceschanged = () => view === 'result' && updateSpeak();
$('speak').onclick = () => {
  if (synth.speaking) { synth.cancel(); return; }
  const u = new SpeechSynthesisUtterance($('report').textContent.replaceAll('______', ''));
  u.voice = voice();
  u.lang = u.voice.lang;
  synth.speak(u);
};

$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('report').textContent); } catch { return; }
  count('share');
  const label = $('copy').querySelector('[data-t]');
  label.textContent = t('copied');
  setTimeout(() => { label.textContent = t('copy'); }, 2000);
};
$('share').onclick = () => count('share');
$('pass').onclick = () => count('share_link');
$('fields').oninput = renderReport;
$('fields').onsubmit = (e) => e.preventDefault();
$('show-other').onchange = renderReport;
for (const b of document.querySelectorAll('[data-docket]')) {
  b.onclick = () => {
    const k = b.dataset.docket;
    if (k !== 'not_yet') count(`docket_${k}`);
    for (const o of document.querySelectorAll('[data-docket]')) o.classList.toggle('chosen', o === b);
    $('docket-msg').dataset.t = `docket_${k}`;
    $('docket-msg').textContent = t(`docket_${k}`);
    $('docket-msg').hidden = false;
  };
}

$('start').onclick = () => { a = {}; goStep(0); };
$('back').onclick = () => goStep(stepIndex - 1);
$('restart').onclick = () => {
  synth?.cancel();
  $('fields').reset();
  $('docket-msg').hidden = true;
  for (const o of document.querySelectorAll('[data-docket]')) o.classList.remove('chosen');
  show('intro');
};
for (const b of document.querySelectorAll('[data-lang]')) {
  b.onclick = () => { lang = b.dataset.lang; localStorage.setItem('fns-lang', lang); synth?.cancel(); render(); };
}
$('date').max = istInputs(Date.now())[0];

// A link sent by a relative opens straight on the result they saw (not counted as a report).
const shared = answersFrom(location.search, Date.now());
if (shared) { a = { ...shared, result: classify(shared) }; show('result'); } else render();

// Opens offline after the first visit (sw.js): the rules and the clock need no network.
navigator.serviceWorker?.register('sw.js').catch(() => {});
