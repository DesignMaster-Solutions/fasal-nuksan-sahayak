# Fasal Nuksan Sahayak (फ़सल नुक़सान सहायक)

A free, open-source helper for Indian farmers insured under the **Pradhan Mantri Fasal Bima
Yojana (PMFBY)**. After hail, a landslide, waterlogging, a cloud burst, a fire from lightning, or
rain on a harvested crop still drying in the field, it tells the farmer, in English or Hindi:

- whether this kind of loss has to be reported by the farmer, quoting the paragraph of the
  PMFBY Operational Guidelines 2023 it relies on;
- the deadline as a date and hour in India time and a live countdown of the 72 hours;
- the fastest channels, in order: **Call 14447** (Krishi Rakshak Portal & Helpline), the Crop
  Insurance app, the WhatsApp chatbot 7065514447, the insurance company of the State (official
  directory), the bank branch or agriculture office;
- what to have ready, and a ready-to-read report with only what the farmer typed (blanks stay
  blank), to read out on the phone, copy, or send on WhatsApp; "Read aloud" when the phone has a
  Hindi or Indian English voice;
- what happens next, the grievance route, and "Did you get a docket / ticket number?".

Built for *Code for a Billion 2026*, track **Agriculture**. Not a government service.

Live app: <https://fasal-nuksan-sahayak.designmaster.workers.dev> · usage numbers: [/stats](https://fasal-nuksan-sahayak.designmaster.workers.dev/stats) · demo video (68 s): <https://youtu.be/gWyG3OXiemE> (file: [video/demo.mp4](video/demo.mp4))

- Static web app: `index.html`, `app.js`, `rules.js`, `i18n.js`, `styles.css`, plus `stats.html`.
  No framework, no dependency, no paid API, no cookies, no account. About 61 KB in total before
  compression (under 25 KB gzipped), so it loads on a cheap phone on 3G. Everything the farmer
  types stays on the phone; the only server code is a tiny Worker (`worker.js`) that counts
  anonymous events.
- One step per screen, 360 px first, big buttons with an icon and a word: what happened, when
  (with "Today, now" and "Yesterday"), where the crop was (standing / cut and lying in the field to
  dry, with the harvest date / already taken home), crop, season and State, how the farmer is
  insured. Language toggle EN / हिंदी on every screen, remembered on the phone; `?lang=hi` works.

## Run it

Requirements: Node.js 20+ (only for the tests and for `wrangler`).

```sh
npm test            # same as: node --test (rules, IST, i18n, report text, counter, ?nostats)
npx wrangler dev    # app + counter at http://localhost:8787
```

The app uses ES modules, so open it through a server, not as `file://`. Add `?nostats` to any URL
to keep your own tests out of the public counter.

### Deploy (Cloudflare Workers static assets)

`wrangler.toml` deploys the folder as static assets under the Worker name `fasal-nuksan-sahayak`,
with `worker.js` answering only `/api/*` (`run_worker_first`) and a SQLite-backed Durable Object
(migration `v1`, class `Counter`) for the counter; both fit the free plan. `.assetsignore` keeps
tests, docs and config out of the upload.

```sh
npx wrangler login
npx wrangler deploy   # -> https://fasal-nuksan-sahayak.designmaster.workers.dev
```

## The rules, and where each one comes from

Source **OG** = *PMFBY Operational Guidelines 2023, effective from Kharif 2023*, Department of
Agriculture & Farmers Welfare, linked from <https://pmfby.gov.in/guidelines> as
<https://pmfby.amnex.co.in/pmfby/pdf/operational_guidelines_pmfby.pdf> (it supersedes the 2020
"Revamped" guidelines). Read and checked on 05/11/2026; the checked text is in `BRIEF.md`,
section "Verified on 05/11/2026". `rules.js` is pure (no DOM) and cites these paragraphs on screen.

| What the farmer says | Result (`classify`) | Rule | OG |
|---|---|---|---|
| Hail, landslide, waterlogging, cloud burst or lightning fire on a **standing** crop | `localized`: report yourself within 72 h | Localized calamities, assessed farm by farm; the intimation is a pre-condition of the localized claim | 5.2.4, 21.5.1, 21.5.2, 21.5.9.2 |
| Hail or rain / cyclone on a crop **cut and lying in the field**, event no more than 14 days after harvest | `post_harvest`: report yourself within 72 h | Post-harvest losses, crop in "cut and spread" or small bundles, up to 14 days from harvesting; a harvested crop in the field falls here, not under localized | 5.2.3, 21.6.1, Table 10 row 1 |
| Same, more than 14 days after harvest | `post_harvest_late`: the cover runs only 14 days; still call 14447 | | 21.6.1 |
| Fire **not from lightning**, or of unknown cause, on a **standing** crop | `fire_other`: report within 72 h anyway; the insurer's survey decides the cause, not the farmer | OG 5.2.4 lists only natural fire from lightning; in Datia (MP SCDRC 2024) farmers told only the police and the Collector and lost the claim ([real cases](evidence/real-cases/README.md)) | 5.2.4, 21.5.1, 21.5.5.6 |
| Landslide, waterlogging, cloud burst or any fire on a **cut** crop in the field | `not_listed_cut`: not a post-harvest peril; still report within 72 h through 14447 and ask | | 21.6.1, 21.5.4.3 |
| Any peril on a crop **already taken home** | `stored`: these covers are for crop lying in the field; call 14447 if in doubt | | 21.6.1 |
| Rain / cyclone on a standing crop; drought, dry spell, pest, disease or flood across the area | `widespread`: individual intimation "is not essential"; claims from the District Level Joint Committee report and yield data; check status via 14447 or the bank; for rain or a cyclone on a standing crop the screen still says to report within 72 hours, because insurers have refused such claims for no notice ([real cases](evidence/real-cases/README.md)) | | 5.1, 5.5 |
| Wild animals, anything else | `other`: optional add-on only some States notify; ask 14447 or the bank | | 5.2.5 |

- **72 hours** (OG 21.5.5.1 B, 21.6.6.1 B, Table 10): `deadline = event + 72 h`; exactly 72:00 is
  still open, 72:01 is closed. Past the window the app says so plainly, never promises, and still
  gives the channels and the grievance route.
- **Post-harvest 14 days** (OG 21.6.1): counted in calendar days in India time; the harvest day is
  day 0, day 14 is inside, day 15 is outside.
- **India time**: IST = UTC+05:30 all year; `istToEpoch` and `formatIST` use `Date.UTC` and never
  the phone's time zone.
- **Add-on caveats on every individual cover result**: "only if your State notified this cover for
  your crop" (21.5.4.1, 21.5.3, 21.6.4.1) and "only if your premium was debited before the event"
  (21.5.4.4, 21.5.9.8). Unseasonal rain counts only above 20% of the long period average (21.6.2):
  said, never computed.
- **Channels** (21.5.5.4, Table 10): Crop Insurance app or the Krishi Rakshak Portal & Helpline
  14447 first; the insurer's toll-free number; the bank branch or agriculture office, which must
  forward within 48 hours (21.5.5.6). pmfby.gov.in shows "WhatsApp ChatBot - 7065514447" and
  "Krishi Rakshak Portal Helpline - 14447" in its header (read 05/11/2026). The Crop Insurance app
  on Google Play is `in.farmguide.farmerapp.central` (DAC&FW). Insurers per State are only linked,
  through <https://pmfby.gov.in/insuranceCompanyDirectory>, never typed by us.
- **What the report contains** (21.5.5.1 C, 21.6.6.1 C): name, survey-number-wise crop and area
  affected, Farmer Application No. on NCIP, mobile, KCC (loanee) or savings account (non-loanee).
  Partial details are accepted; the complete form within 7 days (21.5.6.1). Photos with location
  via the app (21.5.5.1 E). Aadhaar is not listed, because the OG does not require it here.
- **After intimation** (21.5.8, Table 10): loss assessor within 48 hours, assessment within the
  next 10 days, settlement in the next 15 days subject to premium and first instalment of subsidy;
  joint survey with the farmer present (21.5.7.3).
- **Grievance** (30.2, 30.3, 30.6.1): Taluka / District grievance redressal officer within 7 days;
  appeal to the District Level Grievance Redressal Committee headed by the Collector, 15 days;
  14447 registers every complaint against a ticket number.
- **Never**: a promise of payment ("you will get", "will be paid", "guaranteed") or any rupee
  amount. Tests check every string and both report texts for these.

## Size and severity (official figures)

- PIB release 2304549, 29/08/2026 (Ministry of Agriculture & Farmers Welfare):
  <https://www.pib.gov.in/PressReleasePage.aspx?PRID=2304549>. From Kharif 2016 to Rabi 2025-26,
  more than **92.46 crore farmer applications** insured and over **26.33 crore** applications paid
  claims exceeding **Rs 2.06 lakh crore**; 2024-25 record of more than 15.23 crore farmer
  applications covering more than 4 crore farmers; Kharif 2026: 241.38 lakh farmers insured as of
  27/08/2026; KRPH toll-free 14447 confirmed; post-harvest cover "up to 14 days after harvesting".
- PIB release 2151351, 01/08/2025 (Rajya Sabha written reply):
  <https://www.pib.gov.in/PressReleasePage.aspx?PRID=2151351>. Non-loanee farmer applications
  rose from 20 lakh in 2014-15 to 522 lakh in 2024-25: farmers with no bank officer following
  their claim.
- No official figure was found for claims rejected for late intimation, so this project does not
  claim one. Severity: without the intimation there is no localized claim (OG 21.5.9.2), and the
  claim is computed on the sum insured of the affected area (OG 21.5.5.2), so the whole sum insured
  of the damaged area is at stake when the 72 hours are missed.

## Real cases

8 published court and consumer-commission decisions (3,57,384 farmers, 6 States) where the insurer refused a
claim over the 72-hour (earlier 48-hour) notice. 2 farmers' groups lost on it; 5 won, but only after 2 to 10
years in court, and in Osmanabad 357,287 farmers were still owed Rs 225.75 crore in 2025. Each case is
replayed through `rules.js` and the quotes are checked against the saved decisions. Details, numbers, where the
app reads a case differently, and limits: [`evidence/real-cases`](evidence/real-cases/README.md).

## Privacy and the usage numbers

Live, public and anonymous at `/stats` (JSON at `/api/stats`). The app sends, with
`navigator.sendBeacon`, only `{event, lang}` for five events: `report` (result card shown),
`open` (result shown while an individual 72-hour window was still open), `share` (report copied
or WhatsApp tapped), `docket_yes` and `docket_no` (answers to the docket question; "Not yet" is
not sent). The Worker rejects anything else, including any extra field, and stores totals, per
language and per day (UTC) in one Durable Object. Nothing else: no peril, no State, no report
text, no names or numbers, no IP. `?nostats` in the URL sends nothing (tested on the shipped
lines of `app.js`).

## Tests and mutation check

`npm test` runs 64 tests with `node --test`; the first 43 were written before the code they test:

- `tests/rules.test.mjs`: every peril x crop state maps to the right result; the 72-hour edge
  (71:59 open, 72:00 open, 72:01 closed); the post-harvest edge (day 14 inside, day 15 outside);
  IST with `process.env.TZ` set to America/Sao_Paulo, UTC and Asia/Kolkata gives the same epoch
  and the same printed hour; the report text in both languages has the facts typed, keeps blanks
  as `______`, adds the harvest date only for a cut crop, and never contains a promise or a rupee
  amount.
- `tests/i18n.test.mjs`: English and Hindi have exactly the same keys, no empty string, and no
  string promises a payout or names a rupee amount.
- `tests/worker.test.mjs`: valid events counted in total, per language and per day; unknown
  events, languages, extra fields and broken JSON rejected (400) and not stored; wrong method 405;
  unknown `/api/*` path 404; every other path served as a static file.
- `tests/nostats.test.mjs`: runs the real `const NOSTATS =` / `const count =` lines of `app.js`
  with a fake browser: a normal visit sends `{event, lang}`, `?nostats` sends nothing.
- `tests/real-cases.test.mjs`: every quote in `evidence/real-cases/cases.json` is word for word in
  the saved decision; each real case gives the kind and the IST deadline written for it; the numbers
  in `evidence/real-cases/README.md` match the data.

Mutation check (05/11/2026): one rule changed at a time in `rules.js`, tests run, change restored.

| Mutation | Test that failed |
|---|---|
| `WINDOW` 72 h -> 71 h | 72-hour edge: 71:59 open, exactly 72:00 open, 72:01 closed |
| `POST_HARVEST_DAYS` 14 -> 15 | post-harvest window: day 14 after harvest is inside, day 15 is outside |
| `IST_OFFSET` 5:30 -> 5:00 | IST handling does not depend on the phone time zone |
| `cloudburst` dropped from the localized perils | cloudburst on a standing crop -> localized |
| window check `msLeft >= 0` -> `msLeft > 0` | 72-hour edge: 71:59 open, exactly 72:00 open, 72:01 closed |
| `hail` dropped from the post-harvest perils | hail on a cut_in_field crop -> post_harvest; post-harvest window day 14 / day 15 |
| `WINDOW` 72 h -> 96 h | real cases: the 72-hour window the app would show (Parbhani x2, Datia, Odisha) |
| `hail` dropped from the localized perils | real cases: the expected kind (Rajnandgaon, Chudawa, Changephal) |
| `rain_cyclone` dropped from the post-harvest perils | real cases: the expected kind (Doddaballapura, Osmanabad, Odisha) |
| one word changed in a saved quote | real cases: the quote is verbatim in the saved decision |

The deployed app was also driven end to end in a real Chrome (05/11/2026) at 360 px and at
1440 px with `?nostats`: hail on a standing wheat crop, rabi, a loanee farmer, the result with
the countdown, the report in English and Hindi with blanks kept as `______`, and `/api/stats`
still empty afterwards. The demo video ([`video/demo.json`](video/demo.json)) uses those screens.

## Limits

- PMFBY covers are notified **State by State, crop by crop and season by season**; localized and
  post-harvest covers are add-ons. The app says "only if your State notified this cover for your
  crop" and never "you are covered". It does not know your State's notification.
- Unseasonal rain is covered only above 20% of the long period average (OG 21.6.2); the app does
  not compute it.
- The app does not file anything: the farmer still has to call 14447 or use the app.
- **The Hindi was written by an AI agent and needs review by a native speaker** before wide use.

## How it was built

Built in the **AgentFoundry IDE** with **Claude Code** as the coding agent, run from the
AgentFoundry integrated terminal against [`BRIEF.md`](BRIEF.md) (scope, verified rules and
figures) and the single prompt in [`AGENT_PROMPT.md`](AGENT_PROMPT.md). Before any code, every
rule and number in the brief was checked against the PMFBY Operational Guidelines 2023 and PIB,
and written into the "Verified on 05/11/2026" section, the only source the agent was allowed to
use. Claude Code then wrote the tests first and saw them fail, implemented `rules.js` and the
bilingual strings until they passed, added the counter Worker, the screens and `/stats`, ran the
mutation check above, drove the app on a real phone, and committed each working step with
conventional commits.

## License

MIT, see [LICENSE](LICENSE).
