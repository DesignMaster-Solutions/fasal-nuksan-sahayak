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

## Verified on 05/11/2026 (official sources; these replace the "VERIFY" items above)

Source OG = *PMFBY Operational Guidelines 2023, effective from Kharif 2023*, Department of
Agriculture & Farmers Welfare, linked from https://pmfby.gov.in/guidelines as
https://pmfby.amnex.co.in/pmfby/pdf/operational_guidelines_pmfby.pdf (the 2020 "Revamped" OG is
superseded by it). Quote the paragraph number on screen.

- **Localized calamities** (OG 5.2.4, 21.5.1): hailstorm, landslide, inundation, cloud burst and
  natural fire due to lightning, affecting isolated farms. Inundation = field covered or submerged
  by water that stays for a prolonged period and causes visible damage (21.5.2). Only while the
  crop is standing, up to harvest, within the crop calendar the State notified (21.5.4.3,
  21.5.5.1 A). **It is an add-on**: "only available if this cover is notified by the State/UT
  Government" (21.5.4.1) and for crops the State notified for it (21.5.3). The app must say
  "if your State notified this cover for your crop", never "you are covered".
- **Post-harvest losses** (OG 5.2.3, 21.6.1): hailstorm, cyclone, cyclonic rains and unseasonal
  rains hitting harvested crop kept in the field in "cut and spread" or small bundled condition to
  dry, **up to a maximum of two weeks (14 days) from harvesting**. Also an add-on notified by the
  State (21.6.4.1). Unseasonal rain triggers only when the month's rain is more than 20% over the
  long period average for the sub-district/district (21.6.2): say it, do not compute it.
  If the crop was harvested and is lying in the field, the event falls under post-harvest, not
  localized calamity (Table 10, row 1).
- **72 hours**: "Immediate intimation (within 72 hours) by the insured farmer" (21.5.5.1 B,
  21.6.6.1 B); Table 10: "Within 72 hours from the occurrence of a peril". "The intimation is a
  pre-condition to get benefit for the localized claim" (21.5.9.2).
- **Wide-spread calamities** (OG 5.5): for risks other than localized calamities and post-harvest,
  "lodging of intimation for claims by insured farmers ... is not essential"; claims come from the
  District Level Joint Committee report and/or the yield data of the State.
- **Channels** (21.5.5.4, Table 10): first mode = the "Crop Insurance App" or the centralized
  toll-free number of the Krishi Rakshak Portal & Helpline, **14447**; also the insurance
  company's toll-free number, the bank branch, the local agriculture department / district
  officials (who must forward within 48 hours, 21.5.5.6). pmfby.gov.in shows "WhatsApp ChatBot -
  7065514447" and "Krishi Rakshak Portal Helpline - 14447" in its header (read 05/11/2026). The
  Crop Insurance app on Google Play is `in.farmguide.farmerapp.central`, developer DAC&FW.
  Insurance companies per State: link https://pmfby.gov.in/insuranceCompanyDirectory, never a
  name typed by us.
- **What the intimation must contain** (21.5.5.1 C, 21.6.6.1 C): farmer's name, affected survey
  number wise insured crop and acreage affected, Farmer's Application No. on NCIP, mobile number,
  KCC account no. (loanee) or savings bank account (non-loanee). Partial details are accepted and
  the complete form may follow "within 7 days of the loss" (21.5.6.1). Photos with location via the
  app (21.5.5.1 E).
- **After intimation** (21.5.8, Table 10): loss assessor appointed within 48 hours; assessment
  within the next 10 days; claim settlement in the next 15 days, subject to receipt of the premium
  and the first instalment of subsidy. Joint survey with the farmer present (21.5.7.3). Premium must
  have been debited before the event (21.5.4.4, 21.5.9.8).
- **Grievance** (OG 30.2, 30.3, 30.6.1): Taluka/District grievance redressal officer acts within 7
  days; appeal to the District Level Grievance Redressal Committee (DGRC), headed by the
  Collector, disposes within 15 days; KRPH 14447 registers every complaint against a unique
  ticket number shared by SMS or chatbot.
- **Wild animal attack** (OG 5.2.5): optional add-on some States notify, premium paid in full by
  the farmer. Say "ask 14447 or your bank whether your State notified it".

Size (PIB, Ministry of Agriculture & Farmers Welfare):
- PIB release 2304549, 29/08/2026: from Kharif 2016 to Rabi 2025-26, more than 92.46 crore farmer
  applications insured and over 26.33 crore farmer applications paid claims exceeding Rs 2.06
  lakh crore; 2024-25 record of more than 15.23 crore farmer applications covering more than 4
  crore farmers; Kharif 2026: 241.38 lakh farmers insured as of 27/08/2026; KRPH toll-free 14447
  confirmed; post-harvest cover "up to 14 days after harvesting" confirmed.
- PIB release 2151351, 01/08/2025 (Rajya Sabha written reply): non-loanee farmer applications
  rose from 20 lakh in 2014-15 to 522 lakh in 2024-25 (the farmers with no bank officer watching
  their claim).
- No official figure was found for claims rejected for late intimation: the app and the issue do
  not claim one. Severity = OG 21.5.9.2 (no intimation, no localized claim) and the claim formula
  (21.5.5.2: sum insured x affected area share x crop damage %), whole sum insured of the damaged
  area at stake.
