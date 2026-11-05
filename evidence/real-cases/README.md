# Real cases: claims fought over the 72-hour intimation

Every case here is a real, published decision. I searched indiankanoon.org on 5 November 2026 for crop
insurance claims refused or argued over the farmer's intimation of loss within 72 hours (48 hours before the
2018 revision of the PMFBY guidelines). I read each decision in full. The text of each one is saved in
`sources/`, and `cases.json` keeps the facts each decision states. A field the decision does not state is
`null`; nothing is estimated.

`tests/real-cases.test.mjs` checks every quote word for word against the saved decision. It then replays
each case through the app's own `classify` and 72-hour `deadline` from `rules.js`, and checks the numbers
on this page against `cases.json`.

## The cases

| Case | Forum, date | Farmers | Peril, crop | Notice | Result |
|---|---|---|---|---|---|
| [Osmanabad](https://indiankanoon.org/doc/125932551/) | Bombay HC, 6 May 2022 | 357,287 | October 2020 rain on harvested soybean | most did not report individually | refusal overturned; in Nov 2025 Rs 225.75 crore of Rs 514.12 crore was still unpaid ([execution order](https://indiankanoon.org/doc/100261279/)) |
| [Chudawa, Parbhani](https://indiankanoon.org/doc/117427295/) | Maharashtra SCDRC, 12 Jan 2023 | 35 | hailstorm 12 Feb 2018, gram, jowar, wheat, safflower | none on record | **localized claim lost for want of 48-hour notice**; area-yield payout only |
| [Changephal, Parbhani](https://indiankanoon.org/doc/12420145/) | Maharashtra SCDRC, 27 Sep 2024 | 50 | the same hailstorm, same crops | to the Talathi | refusal overturned |
| [Bhojpur, five cases](https://indiankanoon.org/doc/141556986/) | NCDRC, 6 Aug 2026 | 5 | not stated | not reported | refusal overturned |
| [Rajnandgaon](https://indiankanoon.org/doc/45483787/) | NCDRC, 3 Jul 2026 | 1 | rain and hail on standing gram | to revenue officials | refusal overturned, Rs 1,05,749 |
| [Doddaballapura](https://indiankanoon.org/doc/10553029/) | Karnataka SCDRC, 12 Aug 2026 | 1 | 20 days of rain, ragi, Kharif 2020 | via the Agriculture Dept, 7 months later | refusal overturned |
| [Datia](https://indiankanoon.org/doc/152487499/) | MP SCDRC, 28 Aug 2024 | 4 | fire of unknown cause, standing wheat | police and Collector, not the insurer | **claim lost**: no proof, including no proof the insurer was told |
| [Odisha](https://indiankanoon.org/doc/122027121/) | Orissa HC, 14 Oct 2022 | 1 | cyclonic rain 14-15 Nov 2021, paddy | to the bank on day 2; insurer got it on day 10 | pending (interim order) |

## The numbers

- 8 decisions covering 3,57,384 farmers in 6 States.
- 2 lost the claim with the missing notice as a ground: in Chudawa it was decisive, in Datia it was one gap among several.
- 5 overturned the refusal, but only after years in court: 2016 losses decided in 2026 (Bhojpur), 2018 hail
  in 2024, Kharif 2020 rain in 2026. The 357,287 Osmanabad farmers won in 2022 and were still owed money in 2025.
- Amounts the decisions state as claimed: Rs 30,97,003 across four cases. Osmanabad is apart: the State
  put the whole claim at Rs 514.12 crore for 333,412 farmers.
- The same hailstorm on 12 February 2018, same insurer, same taluka and same rule went opposite ways in
  Chudawa and Changephal. A farmer cannot plan on which bench he gets; he can plan on reporting in time.
- In Osmanabad the insurer said 60,000 farmers reported within 72 hours and were paid; the rest waited for the Court.

## What the app would have said

- In 6 of 7 replayable cases the app tells the farmer, for at least one crop state the decision allows, to
  report the loss himself within 72 hours. Where the court named the kind (localized for hail in Rajnandgaon,
  Chudawa and Changephal), the app gives the same kind.
- Where the decision gives the event date, the test checks the deadline the app shows: 15 Feb 2018 for the
  Parbhani hailstorm, 17 to 18 Nov 2021 for Odisha, 25 Apr 2019 for Datia.
- Odisha: the farmer's report to the bank fell inside the 72 hours; the bank's report to the insurer fell
  outside. The app's report goes straight to the insurer through 14447, the first channel OG 21.5.4 names.

Where the app and the decision differ, `cases.json` says so in `divergence`:

- **Rule in force.** Before 2018 the guidelines said 48 hours. The app uses today's 72 hours, so for the 2018
  Parbhani hailstorm its window would have been 24 hours too long.
- **Osmanabad.** The Court held that no individual report was needed in a district-wide calamity. The app still
  tells the farmer to report. That is the safer advice, not the court's reading.
- **Rain on a standing crop** (Doddaballapura, Odisha if the paddy was standing): the app reads it as
  area-based and says an individual report "is not essential", yet insurers still refused for no 72-hour notice.
- **Fire of unknown cause** (Datia): the app lists only fire from lightning, and its "other" screen does not
  count a 72-hour window.

The last two were gaps in the app. Rain on a standing crop is now handled on screen: the app still reads it as
area-based, as the guidelines do, but tells the farmer that insurers have refused such claims for no report within
72 hours and to report within 72 hours anyway (test in `tests/real-cases.test.mjs`). Fire of unknown cause is still
a gap.

## Limits

This shows that the 72-hour notice is a real ground insurers use to refuse claims, and that the app gives the
farmer the deadline and the channel those decisions turn on. It is not field use: no farmer in these cases used
the app. Indian Kanoon carries few District Commission orders, so most refusals that were never challenged, or
were settled lower down, are not here. Batches decided together count as one decision. The five Bhojpur cases
are identified from the order's annexure and are probable, not certain. The Changephal claimed total is summed
from a table with OCR noise. Two other decisions came up and are left out: a weather-index (WBCIS) case, which
has different rules, and a 2025 Osmanabad judgment that turned on yield data, not on notice.
