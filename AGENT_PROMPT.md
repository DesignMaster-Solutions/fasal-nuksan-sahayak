# Prompt given to Claude Code inside the AgentFoundry terminal

Build Fasal Nuksan Sahayak in this folder, following BRIEF.md. The section "Verified on
05/11/2026" of BRIEF.md is the only source of rules and numbers: where it differs from the text
above it, it wins. Never invent a rule, number, deadline or insurer name. Copy the structure and
style of the sibling projects ../nyaya-sahayak and ../ghar-ki-hawa (read their worker.js,
stats.html, app.js counter lines with ?nostats, tests/, .assetsignore, wrangler.toml, README),
but do not modify those folders. Do not deploy and do not open any issue: stop after the last
commit and push.

## Files

index.html, styles.css, app.js, rules.js, i18n.js (en + hi), worker.js, stats.html,
package.json ({"type":"module","scripts":{"test":"node --test"}}), wrangler.toml (name
"fasal-nuksan-sahayak", same account_id, assets + Durable Object Counter, run_worker_first
["/api/*"]), .assetsignore, .gitignore, tests/*.test.mjs, README.md. No framework, no
dependency, total under 100 KB, works on 3G.

## rules.js (pure, no DOM)

- India time is IST = UTC+05:30 all year. `istToEpoch(date "YYYY-MM-DD", time "HH:MM")` and
  `formatIST(epoch, lang)` never depend on the phone's time zone.
- Perils: hail, landslide, inundation (waterlogging), cloudburst, lightning_fire,
  rain_cyclone (rain or cyclone), drought_pest (drought, dry spell, pest or disease, flood across
  the whole area), other (wild animals, theft, anything else).
- Crop state: standing | cut_in_field (cut and left in the field to dry) | stored (taken home or
  to a store).
- `classify({peril, cropState, eventEpoch, harvestDate})` returns one of:
  - `localized` (OG 5.2.4, 21.5): hail/landslide/inundation/cloudburst/lightning_fire on a
    standing crop. Individual intimation needed within 72 h.
  - `post_harvest` (OG 5.2.3, 21.6): hail or rain_cyclone on a crop cut_in_field, with the event no
    more than 14 days after the harvest date (calendar days in IST: day 14 inside, day 15 outside).
    Individual intimation within 72 h.
  - `post_harvest_late`: same perils but more than 14 days after harvest: say the post-harvest
    cover only runs 14 days (21.6.1); still call 14447 to register.
  - `not_listed_cut`: landslide/inundation/cloudburst/lightning_fire on a crop cut_in_field: not
    one of the post-harvest perils in 21.6.1; still report within 72 h through 14447 and ask.
  - `stored`: any peril on a crop already taken home: neither cover applies (21.6.1 covers only
    crop lying in the field); call 14447 if in doubt.
  - `widespread` (OG 5.1, 5.5): rain_cyclone on a standing crop, or drought_pest: individual
    intimation "is not essential"; claims come from the District Level Joint Committee report and
    yield data. Still give 14447 and the bank to check the status.
  - `other`: wild animal etc. (OG 5.2.5 add-on only in some States): "ask 14447 or your bank
    whether your State notified it", report quickly, no 72 h claim.
- `needsIndividualIntimation(kind)` true for localized, post_harvest, not_listed_cut.
- `deadline(eventEpoch)` = eventEpoch + 72 h. `status(eventEpoch, nowEpoch)` returns
  {open: bool, msLeft}. Exactly 72 h is still open; 72 h + 1 min is closed.
- Every result carries the OG paragraph numbers it relies on, and every individual cover result
  carries the add-on caveat: "only if your State notified this cover for your crop" (21.5.4.1,
  21.6.4.1) and "premium must have been debited before the event" (21.5.4.4).
- `intimationText(fields, lang)` builds the ready-to-read report (Hindi or English) with the
  blanks the farmer typed: name, mobile, Farmer Application No. (NCIP), KCC or savings account
  no., State, district, village, survey/khasra no., crop, season (kharif/rabi), area affected,
  what happened, date and hour (IST), and for cut crop the harvest date. Empty fields stay as a
  visible blank line ("______"), never invented. It must never contain "you will get", "will be
  paid", "guaranteed" or any rupee amount (₹, Rs, rupee, रुपये).

## Screens (one step per screen, big buttons with an icon + word, 360 px first)

1. What happened (8 choices above). 2. When: date + hour, shortcuts "Today, now" and
"Yesterday". 3. Crop state: standing / cut and lying in the field to dry / already taken home;
if cut: harvest date. 4. Crop name (free text), season kharif/rabi, State (select of the 28
States + 8 UTs). 5. How are you insured: crop loan / KCC through bank, enrolled at CSC or bank,
enrolled myself on the portal or app, not sure (changes only the "what to have ready" line about
which account number).
Result card: the rule in plain words with its OG paragraph; deadline as date and hour IST and a
live countdown (hours and minutes, updates every minute); if past 72 h, say so honestly, never
promise, still give the channels and the grievance route (OG 30.2, 30.3: Taluka/District
grievance officer, 7 days; DGRC headed by the Collector, 15 days; 14447 gives a ticket number,
30.6.1). Channels in order: "Call 14447" (tel:14447), Crop Insurance app (Play link
https://play.google.com/store/apps/details?id=in.farmguide.farmerapp.central), WhatsApp chatbot
7065514447 (https://wa.me/917065514447), the insurance company of your State
(https://pmfby.gov.in/insuranceCompanyDirectory), bank branch / agriculture office (they must
forward within 48 h, 21.5.5.6). Things to have ready (21.5.5.1 C): application no., Aadhaar
not required by the OG so do not list it as required, KCC/savings account no., survey/khasra
no., crop and area affected, mobile number, photos of the damage with date (the app takes them
with location, 21.5.5.1 E); partial details are fine now, complete form within 7 days (21.5.6.1).
Then optional fields for the report, the report text in the chosen language plus a toggle to show
the other language, "Read aloud" (speechSynthesis, hi-IN or en-IN, button hidden when the phone has
no such voice), "Copy", "Send on WhatsApp" (wa.me/?text=). What happens next (21.5.8): assessor
within 48 h, assessment within 10 days, settlement in the next 15 days subject to premium and
subsidy, joint survey with you present. Then "Did you get a docket / ticket number from 14447 or the
app?" Yes / No / Not yet. Footer: "Not a government service. Rules from the PMFBY Operational
Guidelines 2023." with the link.
Language toggle EN / हिंदी on every screen, remembered in localStorage; ?lang=hi works.

## Counter and /stats

worker.js like ../ghar-ki-hawa: POST /api/event {event, lang}, events: report (result card shown),
open (result shown while an individual 72 h window was still open), share (WhatsApp or copy),
docket_yes, docket_no; stored as total / per language / per day in one Durable Object; GET
/api/stats; nothing else stored (no peril, no State, no text, no IP). app.js sends with
navigator.sendBeacon and sends nothing when the URL has ?nostats (same `const NOSTATS =` /
`const count =` lines as ../nyaya-sahayak so the nostats test can run them). stats.html shows
totals, by language, by day, and "reports prepared while the 72 h window was still open".

## Tests (node --test), written before the code they test

Each peril x crop state maps to the right kind; 72 h edge (71:59 open, 72:00 open, 72:01 closed);
post-harvest edge (day 14 inside, day 15 outside); IST handling with process.env.TZ set to
America/Sao_Paulo and to UTC giving the same epoch; intimationText never contains the forbidden
phrases or a rupee amount in either language and keeps blanks; en and hi have exactly the same
keys and no empty string; worker counts valid events and rejects bad ones (405, 400, 404);
?nostats sends nothing. After the tests pass, do a mutation check: change one rule at a time
(72 h -> 71 h, 14 days -> 15, IST offset 5:30 -> 5:00, drop one peril from localized), run the
tests, confirm a test fails, restore. Write what you mutated and which test caught it in README.

## README

What it does, run it (npm test, npx wrangler dev), deploy, every rule with its OG paragraph and
the PIB figures from BRIEF.md with links, privacy (what is counted, nothing else), limits (State
notifications vary; the Hindi was written by an AI agent and needs a native speaker review), how
it was built in AgentFoundry with Claude Code against BRIEF.md and this prompt, MIT license.
Commit after each working step with conventional commits and push to origin main.
