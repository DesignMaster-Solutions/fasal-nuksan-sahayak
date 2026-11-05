# Fasal Nuksan Sahayak — brief (Code for a Billion 2026, track Agriculture)

Goal: a free, open-source agent that helps an insured farmer in India report a crop loss to the
Pradhan Mantri Fasal Bima Yojana (PMFBY) in time. The farmer says what happened and when; the
agent says whether this kind of loss has to be reported by the farmer, how many hours are left,
the fastest channel, what to have ready, and gives a ready-to-read report in Hindi or English.
Cheap phone, no account, no install.

Why this one: on 05/11/2026 the hub has one Agriculture entry (KhetCast, issue #45: when to spray,
irrigate and sow from the weather forecast). Nothing in the hub covers what happens after the
weather has already damaged the crop. Under PMFBY, losses from localized calamities and
post-harvest losses are assessed farm by farm, and the farmer (or a designated agency) must lodge
the intimation within 72 hours of the event. Missing that window is how an insured farmer ends up
with no claim. This is the protection layer after the loss.

## Facts we may use (cite each one in the README; nothing else is a fact)

Confirmed from secondary sources on 05/11/2026; VERIFY EACH ONE in the official PMFBY Operational
Guidelines (pmfby.gov.in, "Revamped Operational Guidelines" 2020 and any later revision) or a PIB
release before coding it, and cite that, not the secondary page:

- Localized calamities covered individually: hailstorm, landslide, inundation, cloud burst and
  natural fire (lightning). Intimation within 72 hours of occurrence.
- Post-harvest losses: crop kept in "cut and spread" condition in the field to dry, hit by
  hailstorm, cyclone, cyclonic rains or unseasonal rains, up to 14 days from harvest (VERIFY the
  14 days). Intimation within 72 hours of occurrence.
- Widespread calamities (drought, widespread flood, pest across the area) are assessed area-wide
  through crop-cutting experiments; individual intimation is not essential. The agent must say
  this plainly and still tell the farmer where to check and whom to inform.
- Where to report: the Crop Insurance App, the Krishi Rakshak Portal and Helpline (toll-free
  14447, launched in 2024; the official @pmfby X account confirms the number), the insurance
  company's toll-free number, the bank branch, the agriculture department office. The KRPH
  WhatsApp number shown on the portal (7065514447) only if the official portal shows it.
- After intimation the insurer appoints a surveyor (secondary sources say within 48 hours; VERIFY
  and quote the guideline's own time limits for survey and claim settlement).
- Add-on covers (wild animal attack, etc.) exist only in some states and seasons: do not promise
  them; say "ask your bank or 14447 whether your state notified it".

Size and severity (VERIFY, cite PIB or the Ministry): farmer applications insured per year under
PMFBY, total claims paid since 2016, and any official figure on claims rejected or delayed for
late intimation. If no official figure exists for late intimation, do not invent one: use the
insured base for Size and the per-farm loss (sum insured per hectare for a common crop in a
notified district, with the source) for Severity.

Not allowed: promising a payout, saying a loss "is covered" without the scheme clause, invented
numbers, insurer names per district unless taken from an official list with a date, any paid API,
any tracking beyond the anonymous counter below.

## Build (same pattern as Ghar Ki Hawa and Nyaya Sahayak in ~/Backups/impressora)

- Static web app (index.html + app.js + i18n en/hi), no framework, < 100 KB, works on 3G; one
  Cloudflare Worker for the counter. Read-aloud button for low-literacy users (Web Speech API, hi-IN,
  only if the phone has the voice; never required).
- Flow, one step per screen: what happened (icons + words: hailstorm, landslide, waterlogging,
  cloud burst, fire from lightning, rain/cyclone on harvested crop lying in the field, drought or
  pest across the area, other) -> when (date and hour; "today", "yesterday" shortcuts) -> crop
  and season (kharif / rabi), state -> insured? (loan through bank/KCC, enrolled at CSC or bank,
  enrolled on the portal, not sure) -> for harvested crop: harvest date.
- Result card: the rule that applies, quoted with its clause; the deadline as a date and hour in
  IST and as a countdown; past 72 hours = say so honestly, still give the channels and the
  grievance route, never promise; the channels in order with a "Call 14447" tel: link; the list of
  things to have ready (application/policy number, Aadhaar, bank passbook, survey/khasra number,
  photos with date of the damage, area affected); a ready-to-read intimation text in Hindi and
  English with the blanks filled; a WhatsApp share of that text; what happens next.
- rules.js = pure functions (perilType, needsIndividualIntimation, deadline, postHarvestWindow,
  intimationText) with `node --test` tests: each peril maps to the right rule, the 72-hour edge
  (71:59 inside, 72:01 outside), the post-harvest window edge, IST time-zone handling, the text
  never contains "you will get" or a rupee amount, Hindi and English keys complete. See each test
  fail once against a broken rule before trusting it (mutation check, like Ghar Ki Hawa).
- /stats page and /api/stats JSON like the other two: reports prepared, deadlines still open at
  the time, shares, "Did you get a docket/ticket number?" yes/no, by language and day; no personal
  data. This is the Proven impact evidence.
- README: setup, sources for every rule and number, how AgentFoundry was used, MIT license.

## AgentFoundry requirement (eligibility)

Build inside the AgentFoundry IDE (/Applications, login info@designmastersolutions.com, vault
`agentfoundry:dms`): open this folder in AF and run Claude Code from the AF integrated terminal
against this brief, as Nyaya Sahayak (Impressora R144) and Ghar Ki Hawa were built. Decline the AF
migration wizard (it offers to import paid OpenAI/Gemini keys). R144 notes: keep the screen awake
with `caffeinate -u`; type into the IDE only with `osascript activate` + keystroke in the same call.

## Submission (issue form `submission.yml` in karlmehta/code-for-a-billion)

Title "[Submission] Fasal Nuksan Sahayak (Design Master Solutions)", track Agriculture, team Alan
De Bortolo (@alandebortolo), repo + live URL + a short demo video, problem statement, what you
built (and how AF was used), scale and severity with the sources above, deployment and impact data
with the /stats link. Deadline: deployed and filed before 15/11/2026; target 10/11/2026.
Winners 05/12/2026.

## Judging (JUDGING.md, 25% each)

Size of the problem, Severity, Quality of the solution, Proven impact (also the tie-breaker).
Prizes per track on codeforindia.org/hackathon (read on 05/11/2026): 1st Rs 1,50,000,
2nd Rs 1,00,000, 3rd Rs 50,000 "per track / category"; the hub README (August) and the welcome
e-mail say an overall podium instead. Discussion #52 asks which one applies.
