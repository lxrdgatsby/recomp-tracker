# Cardio During the Bulk: Research Findings and Protocol (Dec 1 onward)

Prepared: 2026-11-04 (America/Los_Angeles) for Gatsby, `recomp-tracker`.
Companion to `plans/lautner-bulk-phase.md` (this file changes nothing else in the repo).

**Not medical advice.** Retatrutide and cardiovascular-health points are for discussion with a prescriber/clinician.

**How to read this document.** Every study cited below was found through search and then checked against its abstract or full text (PubMed/Europe PMC/Crossref/publisher page) during this research session. Items I could not verify are labelled **[UNVERIFIED]**. Statements that are my own reasoning or extrapolation rather than something a study showed are labelled **[INFERENCE]**. Section 9 lists what is thin or conflicting.

---

## 0. TL;DR

1. **Interference is smaller than gym lore says, but not zero.** The best recent meta-analysis (Schumann et al. 2022, 43 studies) found concurrent cardio + lifting did **not** reduce muscle size (SMD -0.01) or maximal strength (SMD -0.06) versus lifting alone. It did reduce explosive strength (SMD -0.28), mostly when cardio and lifting were in the *same session* rather than ≥3 h apart. Older and trained-lifter data (Wilson 2012; Petré 2021) are less rosy: running and same-session cardio hurt more, and effects grow with cardio frequency and duration. Volume, frequency and timing matter more than the exact mode.
2. **Best modality for a lean-mass bulk:** low-impact, low-eccentric, moderate-volume work. Incline walking and cycling are the best-supported choices (Wilson 2012 and the fiber-level meta-analysis of Schumann et al. 2022 both point against running). HIIT is not clearly better for muscle (it attenuated lower-body lean-mass gain in one work-matched trial, Fyfe 2016). Rowing has **no direct evidence** for this question.
3. **12% incline at 3.0 mph is not "light."** By the ACSM walking equation it costs about **28.9 mL/kg/min (8.3 METs)**, which ACSM classes as vigorous in absolute terms. It burns about **205 / 223 / 244 kcal gross (180 / 196 / 215 kcal net) in 20 min at 156 / 170 / 186 lb**. Most people will sweat doing it. A 2025 lab study measured 10.2 kcal/min for the 12-3-30 protocol, within ~7% of the equation.
4. **Timing:** the evidence favours (in order) a separate day, a separate session ≥6 h apart, cardio *after* lifting in the same session, and cardio *before* lifting last. Pre-lift cardio reduced leg-press volume for up to 8 h in one trial (Sporer & Wenger 2003). I found **no study** testing a 5-minute treadmill warm-up, so treating it as harmless is an inference, a reasonable one.
5. **Schedule verdict:** (a) a 20-min block at 12:45 before lifting is the worst option at 12% incline. (b) a block after stretching at ~2:15 PM has the correct *order* but delays the 2 PM meal and sits badly with appetite suppression. (c) rest days only is the cleanest for muscle. Recommended hybrid: **5-min easy warm-up on lifting days + two 20-min incline walks on non-lifting days**.
6. **Retatrutide:** appetite suppression is a bigger threat to the bulk than the cardio is. Lean mass fell by about a third of total weight loss in the one DXA substudy (obese adults with T2D). Human data on the glucagon-mediated energy-expenditure effect from retatrutide itself are **not published** (that I could find), though acute glucagon infusion raises energy expenditure ~15%. Heart rate rose dose-dependently in the phase 2 trial, so use RPE/talk-test rather than heart-rate targets. Retatrutide is still **investigational and unapproved** (Lilly, Aug 2026). Raise all of this with a prescriber.
7. **Calorie rule:** on each incline-walk day add back the *net* kcal from the table (about **+200 kcal** at 3.0 mph/12%/20 min), in the next meal. The weekly cardio cost is only ~360-430 net kcal, small next to a ~3,200 kcal target. People generally do not compensate for exercise energy on their own (Schubert 2013 meta-analysis), and retatrutide makes that worse, so add it deliberately.

---

## 1. Best cardio mode for lean mass in a surplus, and the interference effect

### 1.1 What "interference" is, and what the mechanistic evidence shows

- **Origin of the idea.** Hickson (1980) found that adding heavy cardio (6 d/wk) to leg lifting blunted strength gains after ~7 weeks. This is described in Murach & Bagley 2016; I did not open Hickson's paper itself.
- **Proposed mechanism (AMPK vs mTOR).** Endurance-type stimulation activates AMPK-PGC-1α, which can inhibit protein-synthesis signalling (mTORC1). Resistance-type stimulation activates Akt-mTOR. The classic demonstration is **Atherton et al. 2005 (FASEB J)**, but it used *electrically stimulated rat muscle*, not people.
- **Human studies mostly do not show this interference acutely.**
  - **Apró et al. 2013** (Am J Physiol Endocrinol Metab; 10 moderately trained men): 30 min of cycling after heavy leg-press did not reduce mTORC1-S6K1 signalling; mTOR phosphorylation rose ~2-fold and S6K1 ~14-fold, the same with or without cycling.
  - **Wang et al. 2011** (J Appl Physiol; 10 subjects, 1 h cycling followed by leg press): the lifting *amplified* the mitochondrial-biogenesis signalling that cycling started (about 2-fold higher mRNA), contrary to the authors' own hypothesis of impairment.
  - **Donges et al. 2012** (J Appl Physiol): in sedentary middle-aged men, a combined (half-dose resistance + half-dose cycling) session raised myofibrillar protein synthesis at least as much as resistance alone (2.2-fold vs 1.8-fold).
  - **Camera et al. 2015** (Med Sci Sports Exerc): after resistance + 30 min cycling, myofibrillar protein synthesis rose 75-145%, and 25 g whey protein raised it further, so *the meal after concurrent training matters*.
  - **Lundberg et al. 2014** (J Appl Physiol): ~45 min cycling (15 min before leg extensions) raised AMPK but did not stop quadriceps growth (+6% vs +3% with resistance only, in a 5-week unilateral design). It did impair the progression of concentric torque and lowered muscle glycogen. **Lundberg et al. 2013** (J Appl Physiol; 10 men, 5 weeks; ~45 min one-legged cycling done **6 h before** the lifting) reported greater quadriceps volume (+14% vs +8%) and fiber CSA (+17% vs +9%) with the added cardio.
  - **Fyfe, Bishop & Stepto 2014** (Sports Med) review: signalling responses *can* inhibit synthesis pathways, but human studies have not observed such molecular interference after acute concurrent exercise that would explain lost hypertrophy, and the roles of order, recovery, volume, intensity and modality are "not fully elucidated."
- **Takeaway:** the AMPK-mTOR story is a plausible mechanism, but in humans it has not translated into reliably blunted muscle growth. Real-world interference, where it appears, looks more like **accumulated fatigue and reduced training quality** (Wilson 2012 uses the language of overreaching) than a switch flipped by a single walk.

### 1.2 Chronic outcomes (meta-analyses)

| Study | What it found | Relevance |
|---|---|---|
| **Wilson et al. 2012**, J Strength Cond Res (21 studies, 422 effect sizes) | Hypertrophy ES: strength alone 1.23, concurrent 0.85, endurance alone 0.27. Strength ES: 1.76 / 1.44 / 0.78. Power: 0.91 / 0.55 / 0.11. **Running, but not cycling,** significantly reduced hypertrophy and strength. Higher cardio frequency (r -0.26 to -0.35) and duration (r -0.29 to -0.75) correlated with smaller gains. Fat loss was greatest with high-intensity cardio. Interference was lower-body-specific. | Supports cycling over running, and short/infrequent cardio. Uphill *walking* was not a studied category. |
| **Schumann et al. 2022**, Sports Med (43 studies) | Concurrent vs strength alone: maximal strength SMD -0.06 (ns), **hypertrophy SMD -0.01 (ns)**, **explosive strength SMD -0.28 (significant)**. Explosive-strength loss was larger when cardio and lifting were in the same session (p = 0.043) than when ≥3 h apart. No significant moderators for cycling vs running, frequency (<5 vs >5 sessions/wk), training status, or age. | The most reassuring and most recent whole-muscle data. |
| **Lundberg et al. 2022**, Sports Med (muscle fiber hypertrophy; 15 studies; Schumann is senior author) | Small negative effect on fiber-level hypertrophy (SMD -0.23, p = 0.050). A negative effect on type I fibers appeared when the aerobic work was **running** but not cycling (my copy of the abstract is cut off before the exact number). | Even when whole-muscle size is intact, running may blunt fiber growth. Only a few studies per subgroup. |
| **Petré et al. 2021**, Sports Med (27 studies, lower-body 1RM) | 1RM was reduced in **trained** individuals (ES -0.35) but not untrained (0.03) or moderately trained (-0.20, ns). The hit was in **same-session** training (ES -0.66) and not in separate sessions (-0.10, ns). | Conflicts with Schumann's "no moderation by training status." Gatsby is likely "moderately trained" at best for a bulk start, so the same-session caution still applies. |
| **Murach & Bagley 2016**, Sports Med (narrative review) | No study had shown reduced *whole-muscle* growth of the legs with concurrent training; concurrent exercise sometimes *augmented* growth. Practical advice: separate bouts by 6-24 h, minimise total volume (HIIT, 2-3 cardio days, ≤2 leg-lifting days), favour cycling over running. | Narrative opinion article, not a meta-analysis. |

### 1.3 Mode-by-mode assessment

**Incline walking.** No trial compares incline walking against other modes for lean-mass gain during a surplus (I found none). Reasoning from related evidence **[INFERENCE]**:
- Uphill walking is concentric-dominant and impact-free. Franz & Kram 2012 (Gait & Posture) found uphill walking progressively raised hip, knee and ankle extensor activity, while downhill walking mainly loaded the knee extensors (eccentric). Minetti et al. 2002 (J Appl Physiol) found that above about a 15% grade the mechanical efficiency of walking and running reaches that of purely concentric muscle work. A 12% grade is just below that threshold, so it is largely, not purely, concentric **[INFERENCE]**.
- It avoids the running-specific penalty seen in Wilson 2012 and the type I fiber meta-analysis.
- It still uses glutes, hamstrings, quads and calves, so it can cost leg-day quality if placed badly (see section 3).

**Low-intensity steady state (LISS) generally.** Wilson 2012: duration and frequency, not just intensity, drive interference. Short LISS bouts are the safe end. The meta-analysis of acute effects (Markov et al. 2022) found that low-intensity aerobic exercise *did not significantly* reduce subsequent strength (SMD 0.65, p = 0.157), whereas moderate-to-high intensity did (SMD 0.65, p = 0.020), though the difference between subgroups was not significant (p = 0.979), so that finding is weak.

**HIIT.** Mixed. Pros: efficient, and Callahan et al. 2021 (Sports Med) argue HIIT can be anabolic, with muscle-growth data mostly in older/untrained groups. Cons for Gatsby: Fyfe et al. 2016 (Front Physiol; 23 recreationally active men, 3 sessions/wk, 8 weeks, n = 7-8 per group) found work-matched HIT and moderate continuous training **both** blunted leg-press strength gains versus lifting alone (about 7-8 percentage points less), and lower-body lean mass rose 1.8% with HIT versus 3.6% with continuous cardio and 4.1% with lifting alone (the HIT change was not statistically significant, p = 0.069; small sample). Wilson 2012 notes high-intensity cardio gave the best fat loss, but Gatsby's goal is not fat loss. HIIT also adds high leg fatigue, which competes with squat/deadlift days. Not recommended in the bulk phase.

**Cycling.** Wilson 2012 and the fiber meta-analysis favour it over running. Counterpoint: **Markov et al. 2022** found cycling caused *larger acute* strength decrements than running (SMD 0.79 vs 0.28, p < 0.0001 between subgroups), and Sporer & Wenger's impairment was shown with cycling. So cycling is "better chronically, worse acutely" in this data, another sign that **timing matters more than mode**.

**Rowing.** **I found no study** comparing rowing with other cardio modes for lean-mass preservation. It is whole-body (legs + back + arms) and strongly loads the same pulling and leg muscles that Tuesday/Wednesday train **[INFERENCE]**. Without evidence, it is the hardest to justify.

**Ranking for Gatsby (judgement, not a published ranking):**
1. Incline walking at moderate-to-vigorous intensity in a separate session or on a non-lifting day.
2. Stationary cycling (leg-specific fatigue similar; evidence mixed on acute vs chronic).
3. HIIT (reserve for later, if ever, on a non-lifting day).
4. Rowing (no evidence; whole-body fatigue).
5. Running (avoid during the bulk; evidence is worst).

Differences between the top two are small compared with the effect of **total weekly cardio volume and timing**.

---

## 2. The 20-minute 12% incline walk (the "12-3-30" and variants)

### 2.1 What has actually been studied

- **12-3-30 (12% grade, 3.0 mph, 30 min)** went viral via social media. The only controlled study I found is **Wong, Davis, Perez, Weyers, Green, Garcia & Navalta, 2025, Int J Exerc Sci 18(6):56-64** (doi 10.70252/ubix5911). 16 recreationally active adults (7 women, 9 men; mean age 25, mean mass 75.4 kg / 166 lb), a metabolic cart, and an energy-matched self-paced treadmill run for comparison (n = 14 in the paired analysis).
  - 12-3-30: 307.6 kcal over 30 min (**10.2 kcal/min**), 40.6% of energy from fat.
  - Matched run: 309.7 kcal in 23.9 min (13.1 kcal/min), 33.1% from fat.
  - Authors' conclusion: slower per minute, higher *fat share*; it "may be more advantageous for individuals aiming to increase fat utilization," but it is less time-efficient. This was a small exploratory study of acute metabolic responses in young recreational exercisers, with **no training outcomes**.
  - **My calculation [INFERENCE]:** with those percentages, roughly 125 kcal came from fat in 12-3-30 versus roughly 103 kcal in the run. The percentages are breath-by-breath averages, so treat that as approximate. In a *surplus*, fat-share is not a goal; **energy balance** is what matters.
- **Related incline studies:**
  - Silder, Besier & Delp 2012 (J Biomech; 16 subjects at 0/5/10% grade): incline plus soleus and vastus lateralis activity explained 96% of the variance in incline-walking metabolic cost, i.e. the extra cost is paid largely by the calf and quads.
  - Franz & Kram 2012: uphill walking raises extensor muscle activation (above).
- **There are no published training studies of 12-3-30** with lean-mass or fitness outcomes that I could find. All claims about long-term effects on muscle, fat or cardiovascular health are extrapolated from general aerobic-exercise evidence.

### 2.2 Cardiovascular benefit

- ACSM's position stand (Garber et al. 2011, Med Sci Sports Exerc) recommends **vigorous-intensity cardiorespiratory exercise ≥20 min/day on ≥3 days/week (≥75 min/wk)**, or ≥150 min/wk of moderate-intensity, or a combination. The WHO 2020 guidelines (Bull et al., Br J Sports Med) say 150-300 min moderate or 75-150 min vigorous per week, plus muscle-strengthening.
- At ~8.3 METs the 12%/3.0 mph walk falls in ACSM's **vigorous** band (6.0-8.7 METs; 64-90% of VO2max; RPE 14-17, per the Garber table as reproduced in a search summary of that position stand, not re-checked in the PDF). **Two 20-min walks = 40 vigorous min/week**, about half the 75-min guideline minimum. Adding the lifting sessions does not count toward aerobic guidelines.
- So the plan below gives a *reasonable but partial* aerobic dose, deliberately limited by Yuam's 20-min cap and by interference concerns. It is honest to say it is below the guideline-equivalent minimum unless a third session or other daily walking is added.

### 2.3 Is 12% "light"? Would it make him sweat (Yuam's rule)?

- **ACSM intensity classes (Garber 2011):** light = 2.0-2.9 METs, moderate = 3.0-5.9, vigorous = 6.0-8.7 (≥8.8 near-maximal). 3.0 mph at 12% is **8.3 METs**, so **vigorous, not light**.
- Relative intensity depends on fitness. If Gatsby's VO2max is about 40-45 mL/kg/min (typical for an active 34-year-old man; **assumption, not measured**), 28.9 mL/kg/min is roughly **65-72% of VO2max**, still in ACSM's "vigorous" range **[INFERENCE]**.
- **Sweating:** sweat rate is driven mainly by the evaporative requirement for heat balance, i.e. by metabolic heat production and room conditions (Gagnon, Jay & Kenny 2013, J Physiol: 23 men, 200-500 W heat production, 30-45 °C). My estimate **[INFERENCE]**: for 156 lb at 3.0 mph/12%, gross metabolic power ≈ 710 W; subtracting ~112 W of external work against gravity leaves roughly 600 W of heat, above the highest heat-production tested by Gagnon. **In a normal indoor gym he should expect to break a visible sweat within 5-10 minutes.** A 3.0 mph/0-2% warm-up (3.3-4.1 METs, ~270-340 W heat) usually will not make him sweat in a cool room.
- **What Yuam's rule actually says.** The sourcing is thin. In a July 2009 *Interview* magazine piece, Lautner said: "My trainer told me that I couldn't break a sweat, because I was burning more calories than I was putting on," in the context of the gym five days a week, **two hours a day**, sometimes seven days in a row, and rapid weight loss (Interview, 6 Jul 2009). Men's Health (2015) quotes Lautner "I was exercising so hard that I began to lose weight" and says cardio "saps strength and limits muscle growth, especially if you spin your wheels for longer than 20 minutes before or after lifting, according to researchers at Stephen F. Austin State University." I could not trace that underlying study (**[UNVERIFIED]**). Wilson 2012's duration correlations are the nearest peer-reviewed support I found.
- **Interpretation [INFERENCE]:** sweat itself is water, not stored energy. The rule is a proxy for *energy expenditure being too high relative to intake*. A 12% walk makes him sweat *and* has a measurable calorie cost, so respect the rule by **budgeting the calories** (section 6), not by avoiding sweat. Sweat water loss also moves the scale by a fraction of a pound that rehydration reverses, so weigh in at the same time each morning.
- Yuam's context also differs from Gatsby's: Lautner's ~2-hour sessions and 7-day streaks are far more total work than a 75-minute, 5-day plan.

### 2.4 Interference risk specific to a 12% walk

- Lower than running (no impact, concentric-dominant), but it is **not** trivial leg work: glutes, hamstrings, calves, quads (Franz & Kram 2012). At 8.3 METs it is vigorous.
- Sporer & Wenger 2003 showed the cost of earlier cardio was **localised to the muscles used** (leg-press volume dropped, bench press did not). The 12% walk therefore matters most for squat, deadlift and leg-press work.
- Practical consequence: keep hard walks **away from leg/deadlift sessions** (section 3 and 6).

---

## 3. Calorie burn estimates (ACSM walking equation)

### 3.1 Method and assumptions

ACSM walking equation (exam-prep source quoting the ACSM *Guidelines for Exercise Testing and Prescription*; the primary ACSM text was not retrieved, **[UNVERIFIED] against the printed GETP**):

```
VO2 (mL·kg⁻¹·min⁻¹) = 3.5 + 0.1·S + 1.8·S·G
  S = speed in m/min  (1 mph = 26.8 m/min)
  G = grade as a decimal (12% = 0.12)
Gross kcal/min = VO2 × body mass (kg) / 1000 × 5 kcal per L O2
Net kcal/min   = (VO2 − 3.5) × body mass (kg) / 1000 × 5
METs = VO2 / 3.5
```

- Worked example, 156 lb (70.76 kg), 3.0 mph, 12%: S = 80.4 m/min. VO2 = 3.5 + 8.04 + 1.8×80.4×0.12 = 3.5 + 8.04 + 17.37 = **28.9 mL/kg/min** (8.3 METs). Gross = 28.9 × 70.76 / 1000 × 5 = 10.2 kcal/min → **205 kcal in 20 min**. Net = 25.4 × 70.76 / 1000 × 5 = 9.0 kcal/min → **180 kcal**.
- Assumptions: 5 kcal per liter O2 (4.9 is more exact); steady state; **no handrail holding** (holding on lowers the real cost, a widely repeated caveat I did not verify in a primary source); level-of-grade accuracy for steep slopes is less certain; ACSM says the equation is most accurate for 1.9-3.7 mph (50-100 m/min), and all speeds here (2.5-3.5 mph) fall inside it.
- **"Gross"** includes the ~1 kcal/kg/hr he would burn anyway. **"Net"** is the extra cost above resting and is what matters for calorie add-back (his maintenance estimate already includes resting burn).
- **Reality check:** with Wong et al.'s mean mass of 75.4 kg, the equation predicts 10.9 kcal/min against the measured 10.2 kcal/min, an over-prediction of ~7%. Treat the table as ±10% and likely slightly high.
- Body masses: 156 lb = 70.8 kg; 170 lb = 77.1 kg; 186 lb = 84.4 kg.

### 3.2 20-minute walks: gross / net kcal (156 / 170 / 186 lb)

| Speed | Grade | METs | 156 lb gross / net | 170 lb gross / net | 186 lb gross / net |
|---|---|---|---|---|---|
| 3.0 mph | **12%** | **8.3** | **205 / 180** | **223 / 196** | **244 / 215** |
| 2.5 mph | 12% | 7.1 | 175 / 150 | 190 / 163 | 208 / 179 |
| 3.5 mph | 12% | 9.5 | 235 / 210 | 256 / 229 | 280 / 250 |
| 3.0 mph | 5% | 5.4 | 133 / 108 | 145 / 118 | 159 / 129 |
| 3.0 mph | 8% | 6.6 | 164 / 139 | 178 / 151 | 195 / 166 |
| 3.0 mph | 10% | 7.4 | 184 / 159 | 201 / 174 | 220 / 190 |
| 3.0 mph | 15% | 9.5 | 235 / 211 | 257 / 230 | 281 / 251 |
| 2.5 mph | 5% | 4.6 | 115 / 90 | 125 / 98 | 137 / 107 |
| 2.5 mph | 10% | 6.4 | 158 / 133 | 172 / 145 | 188 / 158 |
| 2.5 mph | 15% | 8.1 | 200 / 176 | 218 / 191 | 239 / 209 |
| 3.5 mph | 5% | 6.1 | 151 / 126 | 165 / 138 | 180 / 150 |
| 3.5 mph | 10% | 8.5 | 211 / 186 | 230 / 203 | 251 / 222 |
| 3.5 mph | 15% | 10.9 | 271 / 246 | 295 / 268 | 323 / 293 |

### 3.3 Other durations

| Session | 156 lb gross / net | 170 lb gross / net | 186 lb gross / net |
|---|---|---|---|
| 12-3-30 original (3.0 mph, 12%, **30 min**) | 307 / 270 | 335 / 294 | 366 / 322 |
| 3.0 mph, 12%, 15 min | 154 / 135 | 167 / 147 | 183 / 161 |
| Warm-up, 3.0 mph, 0%, 5 min (3.3 METs) | 20 / 14 | 22 / 16 | 24 / 17 |
| Warm-up, 3.0 mph, 2%, 5 min (4.1 METs) | 26 / 19 | 28 / 21 | 30 / 23 |
| Warm-up, 2.5 mph, 0%, 5 min (2.9 METs) | 18 / 12 | 20 / 13 | 22 / 14 |

### 3.4 Weekly budget of the recommended protocol (section 7)

- Two 20-min walks at 3.0 mph/12%: net ≈ **360 kcal (156 lb) / 392 (170 lb) / 429 (186 lb)** per week.
- Five 5-min warm-ups at 3.0 mph/2%: net ≈ **97 / 105 / 115** per week.
- Combined: about **450-545 net kcal/week ≈ 65-78 kcal/day**, roughly 2% of a 3,200 kcal day. The cardio cost is not what threatens the surplus; appetite is (section 5).

---

## 4. Timing relative to lifting

### 4.1 Cardio BEFORE lifting

- **Sporer & Wenger 2003** (J Strength Cond Res): 16 men did either high-intensity intervals (n = 8) or continuous submaximal cycling (n = 8), then 4 sets of bench press and leg press at ~75% 1RM after 4, 8 or 24 h of recovery. After 4 h and 8 h, **fewer leg-press reps** were completed than in control or at 24 h. No difference by aerobic type. Only leg-press repetitions were reported as reduced, and the authors concluded the impairment was **localised to the muscles used in the aerobic work**.
- **Markov et al. 2022** (Sports Med; 15 studies, trained men): prior aerobic exercise produced moderate strength declines (SMD 0.79). Declines were larger after >30 min (SMD 1.02) than ≤30 min (SMD 0.59), but the subgroup difference was not significant; cycling hurt more than running; **power was unaffected**.
- **Doma et al.** (Sports Med 2017; 2019): note that these reviews mainly cover the *reverse* direction, that **resistance training impairs subsequent endurance quality** for hours to days (via neural recruitment, mechanics, soreness, glycogen), and recommend scheduling the priority session first. I did not find a Doma paper that directly measures cardio-then-lifting strength loss, so I cite Sporer and Markov for that question.
- **Lundberg et al. 2014:** 45 min of cycling 15 min before leg extensions did not reduce muscle growth over 5 weeks but impaired concentric-torque progression and depleted glycogen. So pre-lift cardio may protect size more than strength, and it hurts *quality* of lifting.
- **For a 5-min easy warm-up:** none of the above tested one. Fradkin, Zazryn & Smoliga 2010 (J Strength Cond Res, 32 studies) found warm-ups improved performance in 79% of measured outcomes and there was "little evidence" that warming up is detrimental. A 5-min walk at ~3-4 METs is a conventional warm-up **[INFERENCE]**, not "cardio" in the interference sense.

### 4.2 Cardio AFTER lifting (same session)

- **Eddens, van Someren & Howatson 2018** (Sports Med; 10 studies, ≥5 weeks): resistance-then-endurance beat endurance-then-resistance for lower-body **dynamic strength** (+6.91%; 95% CI 1.96-11.87; p = 0.006), with **no order effect** on lower-body hypertrophy, static strength, aerobic capacity or body fat.
- **Murlasits, Kneffel & Thalib 2018** (J Sports Sci): strength-first gave +3.96 kg more lower-body 1RM (95% CI 0.81-7.10), with no difference in VO2max.
- **Acute MPS:** Apró 2013 (cycling after leg-press), Donges 2012 and Camera 2015 all found MPS and mTORC1 signalling were **not** impaired when cardio followed lifting (and Camera 2015 showed protein ingestion still raised MPS afterwards).
- Same-session training is where the biggest *performance* penalties appear in Petré 2021 (trained lifters, ES -0.66) and Schumann 2022 (explosive strength), even if hypertrophy holds. If cardio shares the session, **after lifting is the better order.**

### 4.3 Time-separation windows

| Source | Finding |
|---|---|
| Robineau et al. 2016, J Strength Cond Res (58 rugby players, 7 weeks, high-intensity intervals after strength) | Strength gains lower with 0 h recovery than with 6 h, 24 h or strength-only. VO2peak gain greatest at 24 h. Authors: avoid <6 h between strength and endurance; 24 h preferred for full adaptation. |
| Sporer & Wenger 2003 | Leg-press volume impaired at 4 h and 8 h, recovered at 24 h. |
| Schumann et al. 2022 | Explosive-strength attenuation significant in the same session, not significant with ≥3 h separation. |
| Murach & Bagley 2016 | Recommends 6-24 h separation. |

**Reading:** ≥3 h helps; ~6 h is a sensible minimum; 24 h (a different day) is cleanest. Most of the data use high-intensity, leg-based cardio, so a 20-min walk may need less separation, but that is an inference.

### 4.4 What this means for Gatsby

- **Best:** a different day than squats and deadlifts.
- **OK:** after lifting in the same session on an upper-body day (bench, shoulders) with moderate, not vigorous, intensity.
- **Worst:** a long or vigorous block *before* lifting, especially before squat/deadlift days.

---

## 5. Integration with the 12:45 PM schedule

Current day: 6 AM shake; 8 AM breakfast; 10 AM snack; 12 PM lunch; **12:45 session start**; ~2 PM post-workout meal; 4 PM dinner. (From `plans/lautner-bulk-phase.md`: 5-min light warm-up at the front per Project Swole **[UNVERIFIED by me; the Project Swole pages returned 403/timeouts, so I rely on the repo's note]**, 50 min lifting, 15 abs, 10 stretching; "cardio never exceeds 20 min"; the plan counts the warm-up toward that 20-min cap.)

| Option | Evidence for | Problems | Verdict |
|---|---|---|---|
| **(a) 20-min block at 12:45, before lifting** | Cardio-first sometimes does not harm size (Lundberg 2014). | Pre-lift cardio reduced leg-press volume for up to 8 h in Sporer & Wenger; trained men lose strength acutely (Markov). Vigorous 12% walk at 8.3 METs, 45 min after a noon lunch, then squat/deadlift: worst combination. Pushes lifting to ~1:10 PM and the post-workout meal to ~2:25 PM. | **Not recommended** at 12% incline. Only the 5-min easy version is fine. |
| **(b) 20-min block after stretching, ~2:15 PM** | Correct *order* (Eddens 2018; Murlasits 2018). Does not delay lifting. MPS/mTORC1 signalling not impaired after lifting (Apró 2013). | Delays the 2 PM meal to roughly 2:35-2:40 PM. Camera 2015 shows protein after concurrent exercise lifts MPS, though the data do not show a *narrow* window. Glycogen already low after 50 min lifting (Lundberg 2014: cardio depletes glycogen). Vigorous exercise before a meal when appetite is suppressed by retatrutide risks under-eating. Exercise rarely triggers compensatory eating (Schubert 2013). Adds 20+ min to an already ~80-min session. | **Acceptable only on upper-body days (Mon bench, Thu shoulders) at moderate intensity**, and only if the meal is still eaten promptly. Not the default. |
| **(c) Rest days only** | Cleanest for interference (≥24 h separation, Robineau 2016; Petré 2021 separate sessions ES -0.10 ns). Lets him make the walk vigorous. | Needs ≥2 non-lifting days with treadmill access. Cuts into pure rest days; walking is low-damage, but Lautner's "every third day off" principle favours real recovery. | **Best for the main cardiovascular dose.** |
| **(d) 5-10 min light warm-up at the start + separate block** | Warm-up helps performance (Fradkin 2010); a separate block avoids same-session interference. | Total cardio per day must stay ≤20 min under the repo rule (warm-up counts), so the block can't also be 20 min on the same day. | **Recommended hybrid**: warm-up on lifting days, 20-min block on non-lifting days. |

Schedule notes:
- The repo plan says both "day off every 3rd day" and a Mon-Fri weekly split; those conflict. I assume **Mon-Fri lifting, Sat/Sun off** (Dec 1, 2026 is a Tuesday).
- The repo's older Phase 1 table says "cardio: 15 min max, 2x/week"; Phase 4 says "10 min max or zero." The protocol below intentionally replaces those *for the Dec 1+ bulk*; update the plan file only if you decide to adopt it.

---

## 6. Retatrutide considerations (tentative; discuss with a prescriber)

**Status.** Retatrutide (LY3437943) is a once-weekly **GIP / GLP-1 / glucagon** triple agonist. As of Aug 2026 Lilly's medical-information page says it is an **investigational phase 3 molecule, not FDA-approved**, cannot be lawfully compounded, and that products sold to consumers as retatrutide are unlawful. Lilly plans a US filing in Q1 2027. If this is not a trial supply, the identity/dose of what is being injected cannot be assumed, which is worth telling a clinician. I am not giving medical advice and not telling him to stop or continue.

**Efficacy and body composition (what trials show):**
- **Jastreboff et al. 2023, NEJM phase 2 (obesity; n = 338)**: mean weight change at 48 weeks of -8.7% (1 mg), -17.1% (4 mg), -22.8% (8 mg), -24.2% (12 mg) versus -2.1% with placebo. GI adverse events were most common, dose-related and partly reduced by a lower start dose. **Dose-dependent heart-rate increases peaked at week 24 and declined after.** The abstract does not report DXA lean-mass data.
- **Jastreboff et al. 2026, NEJM phase 3 (n = 2,339; obesity without diabetes; 80 weeks)**: -17.6% (4 mg), -23.7% (9 mg), -25.0% (12 mg) vs -3.9% placebo. Gastrointestinal adverse events were the most common. The abstract does not report lean-mass or heart-rate data.
- **Coskun et al. 2025, Lancet Diabetes Endocrinol (DXA substudy in T2D, n = 189, week 36)**: fat mass fell 26.1% (8 mg) and 23.2% (12 mg); absolute fat loss ~10.9 and 10.5 kg; **lean mass fell ~6.5 and 6.4 kg**. Fat loss was ~64.6% of total tissue loss, so **~35% was lean mass**, which the authors call "similar to other obesity treatments." Those numbers come from a news summary (Springer Medicine/medwireNews) of the paper plus the abstract. A theoretical concern that glucagon-receptor agonism could lower circulating amino acids and affect muscle protein synthesis has been raised in the literature **[UNVERIFIED; I did not trace a source]**.
- **Population caveat:** trials enrolled adults with obesity or overweight (or T2D). **I found no data in lean, resistance-training adults using retatrutide while eating a deliberate surplus.** Everything below is extrapolation.

**Appetite and energy expenditure:**
- Mouse data suggest the glucagon-receptor component adds energy expenditure to GIP/GLP-1-driven reduced intake (Coskun et al. 2022, Cell Metab). In humans, **acute glucagon infusion raises energy expenditure ~15%** (Salem et al. 2016, Diabetes Obes Metab, 11 men, 50 ng/kg/min; Nair et al. 1987, J Clin Endocrinol Metab, in insulin-deficient men), and a meta-analysis found a moderate-to-large acute effect (Frampton et al. 2022, Int J Obes). **I found no published human indirect-calorimetry study of retatrutide itself**; claims online of a specific resting-energy-expenditure increase are **[UNVERIFIED]**. Most of the weight loss is probably reduced intake, but that is **[INFERENCE]**.
- Phase 2 reported reduced appetite in a minority of participants, but I only found that figure on a secondary site, so I do not state the percentages.

**What this means for cardio [INFERENCE unless noted]:**
1. **Appetite is the bottleneck.** The bulk needs ~3,200 kcal/day across six feedings; cardio adds only ~65-78 kcal/day on average. The most important cardio-related rule is **do not let exercise displace eating** (e.g., delaying the 2 PM meal).
2. **Eat on a schedule, not by hunger.** Schubert et al. 2013 (29 studies) found that after acute exercise people do **not** compensate energy intake on their own, so the burn is a net deficit unless eaten back. Retatrutide likely amplifies that.
3. **Heart rate:** phase 2 saw dose-dependent resting heart-rate rises (peak at 24 weeks). Heart-rate zones based on age formulas could therefore read high. Use **RPE (talk test)** and METs/speed/grade to set intensity, and mention exercise heart rates to the prescriber.
4. **GI side effects and exercise:** nausea is a leading side effect. Avoid vigorous walking within ~30-60 minutes after a big meal; walk before lunch (section 7). I did not find an exercise-specific nausea study.
5. **Muscle:** preserving lean mass on GLP-1-class drugs is mainly about **resistance training + enough protein** (2025 joint advisory from ACLM/ASN/OMA/TOS; Mozaffarian et al., Obesity Pillars). That supports putting lifting quality first and keeping cardio modest.
6. The repo plan already says "consider tapering or pausing" because the drug's appetite suppression fights the surplus. That decision belongs with the prescriber. Questions to bring: dose and timing during a surplus, expected effect on appetite and heart rate, lean-mass monitoring (DXA), and whether exercise heart-rate or blood-pressure monitoring is advisable.

---

## 7. Recommended protocol, Dec 1 onward

**Principles:** lifting first, cardio capped at 20 min per day (warm-up counted), vigorous work kept off lifting days, every cardio kcal eaten back, appetite protected.

### 7.1 Protocol table

| Component | Days | Time | Duration | Speed / incline | Intensity cue | Placement vs lifting |
|---|---|---|---|---|---|---|
| **A. Warm-up walk (every lifting day)** | Mon-Fri (start Tue Dec 1) | 12:45 PM | **5 min** (counts toward 20-min cap) | **3.0 mph, 0-2%** (2.5 mph if stiff) | 3.3-4.1 METs; RPE ≤ 9-11; no sweat; can hold a conversation | Immediately before lifting, followed by dynamic warm-up/push-ups/air squats from the plan. No more than 5-7 min. |
| **B. Incline walk (main cardio dose)** | **2 non-lifting days/week** (Sat + Sun under a Mon-Fri split; any 2 days that are ≥24 h before a deadlift/squat day if the split changes) | **~11:30 AM** (finish ~11:50, lunch at 12:00 so lunch doubles as the post-walk meal) | **20 min** (+2-3 min easy cool-down at 2.0-2.5 mph, 0%, allowed as the plan's cap is about steady work) | **Weeks 1-2: 3.0 mph at 10%**; **then 3.0 mph at 12%** if conditions in 7.3 are met | 7.4-8.3 METs; RPE 6-7/10 (hard but steady; can speak in short sentences); no handrail-holding | 24+ h after Friday's session and ~48 h before Monday's bench. Never within 24 h before deadlift (Tue) or squat (Wed). |
| **C. (Optional, Tier 2) Third walk, moderate** | **Thu** (upper-body shoulder day) only, and only if gaining ≥ plan pace and appetite is fine | **~6:30-6:50 AM** after the 6 AM shake (≈6 h before lifting), **or** ~2:15 PM after stretching **only if** the 2 PM meal is still eaten immediately after | 15-20 min | **3.0 mph, 5%** (5.4 METs, moderate) | RPE 4-5/10, conversational | Separate session ≥6 h before lifting (Robineau 2016), or after lifting on an upper-body day (Eddens 2018). |

Why this shape:
- Respects Yuam's cap (the warm-up is 5 min, rest-day blocks 20 min, and no day exceeds ~20-25 min total cardio).
- Puts the vigorous work where interference is least likely (separate days, Robineau; Petré's separate-session ES -0.10, ns).
- Keeps the warm-up light and brief (Fradkin 2010 supports warm-ups).
- Gives ~40 vigorous min/week (about half the ACSM minimum of 75; with Tier 2 and daily walking he can move toward it).
- Starting at 10% rather than 12% for two weeks is a conservative on-ramp **[my judgement]**, with 12% matching the studied 12-3-30 format.

### 7.2 Calorie adjustment rule

1. **Per-walk add-back:** eat back the **net** kcal from section 3 (rounded to the nearest 25) at the next meal, as carbohydrate + some protein. At 3.0 mph/12%/20 min that is **+200 kcal at 156 lb, +200 at 170 lb, +225 at 186 lb**; at 3.0 mph/10% about **+175 / +175 / +200**. For a 5%-grade Tier 2 walk, about +100-125.
2. **Warm-up days:** nothing separate; the ~15-23 kcal is inside normal rounding.
3. **Recompute every ~10 lb** gained using the table.
4. **Weekly check (repo rule, kept):** weigh daily, average weekly. If the weekly average is flat for 7 days, add 200 kcal (separate from the cardio add-back). If it is rising faster than ~1.5 lb/week for two weeks, trim 200 kcal from non-cardio meals first.
5. **Hierarchy when things go wrong:** if gain stalls for two successive weeks despite +200 steps, drop to **one** walk a week *before* cutting any calories, and review appetite/dose with the prescriber. Order of priority: lifting > food > cardio.
6. **Do not delay the 2 PM meal** for a cardio block (on Tier 2 option 2:15 PM, eat the meal first if intake is ever missed).

### 7.3 Conditions to progress from 10% to 12% and to keep walks

Progress or keep both walks only if, over the previous 2 weeks: (i) weekly average weight is rising ~0.5-1 lb/week; (ii) working weights on squat/deadlift are not dropping; (iii) he is hitting calorie and protein targets on ≥6 of 7 days; (iv) no unusual soreness or nausea during the walk. Otherwise stay at 10% (or 5%), or cut to one walk.

### 7.4 Safety and practical notes

- No evidence supports running for this phase; keep it out.
- Hold neither handrail; the calorie table assumes none. Hold lightly only if needed for safety, and then subtract ~10-15% **[assumption, not sourced]**.
- Hydrate, as sweating is likely at 8 METs.
- Before changing routine intensity, discuss exercise, heart rate and retatrutide with a clinician.

---

### 7.5 How this compares with the plan text on `main` (commits af9a527 and 1c6c756, added while this research was in progress)

`plans/lautner-bulk-phase.md` now schedules **20 min at 12% / 3.0 mph after stretching (~2:15 PM) on Mon/Wed/Fri**, with the post-workout meal pushed to ~2:35 PM. That is option (b) from section 5, three days a week. What the evidence here says about it:

- **Good:** cardio comes *after* lifting (Eddens 2018; Murlasits 2018), and the settings match the one studied 12-3-30 format.
- **Risks:** (1) Wednesday is squat day, so a vigorous (8.3 MET) leg-dominant walk lands in the same session as the heaviest lower-body work, the pattern linked to lower-body strength loss in trained lifters (Petré 2021, same-session ES -0.66). (2) Three vigorous walks per week is ~60 min vigorous, more than the two-walk protocol above and about the volume where Wilson 2012 saw frequency/duration correlate with smaller gains. (3) The 2 PM meal slips to ~2:35 PM while retatrutide is suppressing appetite; and every walk must be eaten back (~+200 kcal each, ~600 kcal/week).
- **If you keep Mon/Wed/Fri after lifting**, the least-risk edits are: make Wednesday the *moderate* walk (3.0 mph at 5-8%, +100-140 kcal add-back) or move it to a non-lifting day; take a protein-plus-carb snack during stretching so the walk does not delay refuelling; and apply the stall rule in 7.2 (drop to 2 walks before cutting food).
- **Numbers in that plan text that do not match what I verified:** it says the walk burns "~250-300 kcal for a 155-180 lb person"; the ACSM equation gives 205-223 kcal gross (180-196 net) per 20 min, and the one lab measurement (166 lb average) was ~205 kcal per 20 min. It also cites an "umbrella review of 17 meta-analyses" and "glutes 30-50% harder than flat walking"; I did not find or verify either. Franz & Kram 2012 report much larger muscle-activity increases at steeper (9°) grades.
- The older "15 min max, 2x/week" cap I mentioned in section 8 has since been replaced in the plan by 20 min, 3x/week.

---

## 8. Data-consistency flags (not research findings)

- **Recomp target:** 156 lb → 145 lb by Dec 1 is ~11 lb in ~4 weeks, while the repo's bulk plan says "156 lbs targeting 186 lbs." Starting a bulk from 145 would make 186 a **+41 lb** goal, not +30. I did not research the appropriate rate of loss/gain, so I only flag it. The calorie table includes 170 and 186 lb for later in the bulk.
- **Repo cardio caps** differ across phases (older text: 15 min 2×/week; 20 min; 10 min or zero). I did not edit them; see 7.5 for the newer Mon/Wed/Fri text.

---

## 9. Evidence-quality notes

| Question | Strength | Notes |
|---|---|---|
| Whole-muscle hypertrophy is preserved with concurrent training | **Moderate-good** (multiple meta-analyses: Schumann 2022; Murach & Bagley review; Wilson 2012 shows ES 0.85 vs 1.23) | Wilson (2012) shows a *numerical* gap that was not flagged significant in the abstract; Schumann (2022) found none. Meta-analysis populations are mostly untrained/moderately trained, with relatively short interventions (often 8-12 weeks), and mostly young adults. |
| Explosive-strength loss and the same-session effect | **Moderate** | Schumann 2022 (p = 0.043 same session vs ≥3 h); Petré 2021 for trained lifters. They disagree on whether training status moderates the effect. |
| Running worse than cycling chronically | **Low-moderate** | Wilson 2012 and fiber meta-analysis say yes; Schumann 2022 whole-muscle found no modality moderator; acute data (Markov 2022) say cycling is worse. |
| Molecular AMPK-mTOR interference in humans | **Mixed; mostly not supported acutely** | Atherton 2005 is rat; Apró, Wang, Donges, Camera, Lundberg (all small, n = 8-10, mostly men, mostly cycling, mostly untrained or moderately trained) show no blunting of signalling or MPS, but those are acute and short-term. Fyfe 2014 says mechanism is "not fully elucidated." |
| Time-separation numbers (3 h, 6 h, 24 h) | **Low-moderate** | Robineau (58 rugby players; magnitude-based inference), Sporer (n = 16; same muscles), Schumann (meta-analytic but only the explosive-strength outcome). Not tested for walking. |
| Order within a session | **Moderate** for strength, **none** for hypertrophy | Eddens 2018 (10 studies) and Murlasits 2018 (lower-body 1RM). |
| 12% incline walking, health and fat oxidation | **Low** | One 16-person acute study (Wong 2025); no training outcomes. Cardiovascular benefit extrapolated from ACSM/WHO aerobic guidelines. |
| Calorie estimates | **Moderate** | ACSM equation validated at ~7% above measured values at 12%/3.0 mph (one small study). Handrail use, individual economy and steep-grade accuracy introduce error; treat as ±10-15%. |
| Rowing | **None** | No direct comparison found. |
| Retatrutide lean-mass data | **Low-moderate** | One DXA substudy (n = 189 randomised; 103 completed paired scans) in T2D, ~36 weeks, sponsor-funded; lean-mass number is my summary of secondary reporting plus the abstract. |
| Retatrutide energy expenditure in humans | **Not established** | Mouse data and acute glucagon infusion only. |
| Retatrutide + surplus + heavy lifting in lean adults | **None found** | Entirely extrapolated. |
| Yuam's 20-min and no-sweat rules | **Anecdotal** | A coach's heuristic for a 2-hour/day, 5-7-day actor schedule; Interview 2009 verifies the sweat quote only as Lautner's paraphrase. The 20-min figure comes from Men's Health attributing it to unnamed researchers **[UNVERIFIED]**. |

**Other limits:** most studies are in men aged ~20-30; most compare *lower-body* outcomes; none involve incline walking in a surplus; surplus-size data are thin (Helms et al. 2023 randomised 17 trained lifters to maintenance, +5% or +15% surplus for 8 weeks: no group differences for muscle thickness or squat 1RM, a larger bench 1RM gain and more skinfold gain with +15%). Slater et al. 2019 (Front Nutr) conclude the surplus *required* for hypertrophy is unknown.

**Items I could not verify:**
- Project Swole's treadmill warm-up statement (site returned 403/timeouts).
- The Men's Health "Stephen F. Austin State University" 20-minute claim.
- Retatrutide heart-rate magnitudes (I only found numbers on a secondary site) and phase 2 appetite-reduction percentages.
- That the ACSM Guidelines text prints the equation exactly as quoted (I used an exam-prep article that cites it plus the ACSM *Health & Fitness Journal* title).
- Whether the phase 3 retatrutide paper reports lean mass or heart rate (not in the abstract I read).

---

## 10. References

Peer-reviewed (all checked via PubMed/Europe PMC/Crossref metadata or abstract unless stated):

1. Wilson JM, Marin PJ, Rhea MR, Wilson SMC, Loenneke JP, Anderson JC. Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises. *J Strength Cond Res* 2012;26(8):2293-2307. doi:10.1519/JSC.0b013e31823a3e2d. PMID 22002517. https://pubmed.ncbi.nlm.nih.gov/22002517/
2. Schumann M, Feuerbacher JF, Sünkeler M, Freitag N, Rønnestad BR, Doma K, Lundberg TR. Compatibility of concurrent aerobic and strength training for skeletal muscle size and function: an updated systematic review and meta-analysis. *Sports Med* 2022;52(3):601-612. doi:10.1007/s40279-021-01587-7. PMID 34757594. https://pubmed.ncbi.nlm.nih.gov/34757594/
3. Lundberg TR, Feuerbacher JF, Sünkeler M, Schumann M. The effects of concurrent aerobic and strength training on muscle fiber hypertrophy: a systematic review and meta-analysis. *Sports Med* 2022;52(10):2391-2403. doi:10.1007/s40279-022-01688-x. PMID 35476184.
4. Murach KA, Bagley JR. Skeletal muscle hypertrophy with concurrent exercise training: contrary evidence for an interference effect. *Sports Med* 2016;46(8):1029-1039. doi:10.1007/s40279-016-0496-y. PMID 26932769. https://pubmed.ncbi.nlm.nih.gov/26932769/
5. Fyfe JJ, Bishop DJ, Stepto NK. Interference between concurrent resistance and endurance exercise: molecular bases and the role of individual training variables. *Sports Med* 2014;44(6):743-762. doi:10.1007/s40279-014-0162-1. PMID 24728927. https://pubmed.ncbi.nlm.nih.gov/24728927/
6. Fyfe JJ, Bartlett JD, Hanson ED, Stepto NK, Bishop DJ. Endurance training intensity does not mediate interference to maximal lower-body strength gain during short-term concurrent training. *Front Physiol* 2016;7:487. doi:10.3389/fphys.2016.00487. PMID 27857692. https://pubmed.ncbi.nlm.nih.gov/27857692/
7. Robineau J, Babault N, Piscione J, Lacome M, Bigard AX. Specific training effects of concurrent aerobic and strength exercises depend on recovery duration. *J Strength Cond Res* 2016;30(3):672-683. doi:10.1519/JSC.0000000000000798. PMID 25546450. https://pubmed.ncbi.nlm.nih.gov/25546450/
8. Sporer BC, Wenger HA. Effects of aerobic exercise on strength performance following various periods of recovery. *J Strength Cond Res* 2003;17(4):638-644. doi:10.1519/00124278-200311000-00003. PMID 14636098. https://pubmed.ncbi.nlm.nih.gov/14636098/
9. Markov A, Chaabene H, Hauser L, Behm S, Bloch W, Puta C, Granacher U. Acute effects of aerobic exercise on muscle strength and power in trained male individuals: a systematic review with meta-analysis. *Sports Med* 2022;52(6):1385-1398. doi:10.1007/s40279-021-01615-6. PMID 34878640.
10. Petré H, Hemmingsson E, Rosdahl H, Psilander N. Development of maximal dynamic strength during concurrent resistance and endurance training in untrained, moderately trained, and trained individuals: a systematic review and meta-analysis. *Sports Med* 2021;51(5):991-1010. doi:10.1007/s40279-021-01426-9. PMID 33751469.
11. Eddens L, van Someren K, Howatson G. The role of intra-session exercise sequence in the interference effect: a systematic review with meta-analysis. *Sports Med* 2018;48(1):177-188. doi:10.1007/s40279-017-0784-1. PMID 28917030. https://pubmed.ncbi.nlm.nih.gov/28917030/
12. Murlasits Z, Kneffel Z, Thalib L. The physiological effects of concurrent strength and endurance training sequence: a systematic review and meta-analysis. *J Sports Sci* 2018;36(11):1212-1219. doi:10.1080/02640414.2017.1364405. PMID 28783467. https://pubmed.ncbi.nlm.nih.gov/28783467/
13. Doma K, Deakin GB, Bentley DJ. Implications of impaired endurance performance following single bouts of resistance training: an alternate concurrent training perspective. *Sports Med* 2017;47(11):2187-2200. doi:10.1007/s40279-017-0758-3. PMID 28702901.
14. Doma K, Deakin GB, Schumann M, Bentley DJ. Training considerations for optimising endurance development: an alternate concurrent training perspective. *Sports Med* 2019;49(5):669-682. doi:10.1007/s40279-019-01072-2. PMID 30847824.
15. Apró W, Wang L, Pontén M, Blomstrand E, Sahlin K. Resistance exercise induced mTORC1 signaling is not impaired by subsequent endurance exercise in human skeletal muscle. *Am J Physiol Endocrinol Metab* 2013;305(1):E22-E32. doi:10.1152/ajpendo.00091.2013. PMID 23632629. https://pubmed.ncbi.nlm.nih.gov/23632629/
16. Wang L, Mascher H, Psilander N, Blomstrand E, Sahlin K. Resistance exercise enhances the molecular signaling of mitochondrial biogenesis induced by endurance exercise in human skeletal muscle. *J Appl Physiol* 2011;111(5):1335-1344. doi:10.1152/japplphysiol.00086.2011.
17. Donges CE, Burd NA, Duffield R, Smith GC, West DW, Short MJ, Mackenzie R, Plank LD, Shepherd PR, Phillips SM, Edge JA. Concurrent resistance and aerobic exercise stimulates both myofibrillar and mitochondrial protein synthesis in sedentary middle-aged men. *J Appl Physiol* 2012;112(12):1992-2001. doi:10.1152/japplphysiol.00166.2012. PMID 22492939.
18. Camera DM, West DW, Phillips SM, Rerecich T, Stellingwerff T, Hawley JA, Coffey VG. Protein ingestion increases myofibrillar protein synthesis after concurrent exercise. *Med Sci Sports Exerc* 2015;47(1):82-91. doi:10.1249/MSS.0000000000000390. PMID 24870574.
19. Lundberg TR, Fernandez-Gonzalo R, Gustafsson T, Tesch PA. Aerobic exercise does not compromise muscle hypertrophy response to short-term resistance training. *J Appl Physiol* 2013;114(1):81-89. doi:10.1152/japplphysiol.01013.2012. PMID 23104700.
20. Lundberg TR, Fernandez-Gonzalo R, Tesch PA. Exercise-induced AMPK activation does not interfere with muscle hypertrophy in response to resistance training in men. *J Appl Physiol* 2014;116(5):611-620. doi:10.1152/japplphysiol.01082.2013. PMID 24408998.
21. Atherton PJ, Babraj J, Smith K, Singh J, Rennie MJ, Wackerhage H. Selective activation of AMPK-PGC-1α or PKB-TSC2-mTOR signaling can explain specific adaptive responses to endurance or resistance training-like electrical muscle stimulation. *FASEB J* 2005;19(7):786-788. doi:10.1096/fj.04-2179fje. PMID 15716393. (rat muscle)
22. Di Donato DM, West DW, Churchward-Venne TA, Breen L, Baker SK, Phillips SM. Influence of aerobic exercise intensity on myofibrillar and mitochondrial protein synthesis in young men during early and late postexercise recovery. *Am J Physiol Endocrinol Metab* 2014;306(9):E1025-E1032. doi:10.1152/ajpendo.00487.2013. PMID 24595306. (Reviewed; not relied on for conclusions.)
23. Callahan MJ, Parr EB, Hawley JA, Camera DM. Can high-intensity interval training promote skeletal muscle anabolism? *Sports Med* 2021;51(3):405-421. doi:10.1007/s40279-020-01397-3. PMID 33512698.
24. Wong, Davis, Perez, Weyers, Green, Garcia, Navalta. An exploratory study comparing the metabolic responses between the 12-3-30 treadmill workout and self-paced treadmill running. *Int J Exerc Sci* 2025;18(6):56-64. doi:10.70252/ubix5911. PMC11798546. https://pmc.ncbi.nlm.nih.gov/articles/PMC11798546/ (initials not recorded.)
25. Silder A, Besier T, Delp SL. Predicting the metabolic cost of incline walking from muscle activity and walking mechanics. *J Biomech* 2012;45(10):1842-1849. doi:10.1016/j.jbiomech.2012.03.032. PMID 22578744.
26. Franz JR, Kram R. The effects of grade and speed on leg muscle activations during walking. *Gait Posture* 2012;35(1):143-147. doi:10.1016/j.gaitpost.2011.08.025. PMID 21962846.
27. Minetti AE, Moia C, Roi GS, Susta D, Ferretti G. Energy cost of walking and running at extreme uphill and downhill slopes. *J Appl Physiol* 2002;93(3):1039-1046. doi:10.1152/japplphysiol.01177.2001. PMID 12183501.
28. Gagnon D, Jay O, Kenny GP. The evaporative requirement for heat balance determines whole-body sweat rate during exercise under conditions permitting full evaporation. *J Physiol* 2013;591(11):2925-2935. doi:10.1113/jphysiol.2012.248823. PMID 23459754.
29. Fradkin AJ, Zazryn TR, Smoliga JM. Effects of warming-up on physical performance: a systematic review with meta-analysis. *J Strength Cond Res* 2010;24(1):140-148. doi:10.1519/JSC.0b013e3181c643a0. PMID 19996770.
30. Schubert MM, Desbrow B, Sabapathy S, Leveritt M. Acute exercise and subsequent energy intake: a meta-analysis. *Appetite* 2013;63:92-104. doi:10.1016/j.appet.2012.12.010. PMID 23274127.
31. Jastreboff AM, Kaplan LM, Frías JP, et al. Triple-hormone-receptor agonist retatrutide for obesity: a phase 2 trial. *N Engl J Med* 2023;389(6):514-526. doi:10.1056/NEJMoa2301972. PMID 37366315. https://pubmed.ncbi.nlm.nih.gov/37366315/
32. Jastreboff AM, Kaplan LM, Davies MJ, Wilding JPH, et al. Retatrutide, a triple hormone receptor agonist, for treatment of obesity (phase 3). *N Engl J Med* 2026 (online ahead of print). doi:10.1056/NEJMoa2604169. PMID 42814954.
33. Coskun T, Wu Q, Schloot NC, Haupt A, Milicevic Z, Khouli C, Harris C. Effects of retatrutide on body composition in people with type 2 diabetes: a substudy of a phase 2, double-blind, parallel-group, placebo-controlled, randomised trial. *Lancet Diabetes Endocrinol* 2025;13(8):674-684. doi:10.1016/S2213-8587(25)00092-0. PMID 40609566.
34. Coskun T, Urva S, Roell WC, et al. LY3437943, a novel triple glucagon, GIP, and GLP-1 receptor agonist for glycemic control and weight loss: from discovery to clinical proof of concept. *Cell Metab* 2022;34(9):1234-1247. doi:10.1016/j.cmet.2022.07.013. PMID 35985340.
35. Salem V, Izzi-Engbeaya C, Coello C, et al. Glucagon increases energy expenditure independently of brown adipose tissue activation in humans. *Diabetes Obes Metab* 2016;18(1):72-81. doi:10.1111/dom.12585. PMID 26434748.
36. Nair KS. Hyperglucagonemia increases resting metabolic rate in man during insulin deficiency. *J Clin Endocrinol Metab* 1987;64(5):896-901. doi:10.1210/jcem-64-5-896.
37. Frampton J, Izzi-Engbeaya C, Salem V, Murphy KG, Tan TM, et al. The acute effect of glucagon on components of energy balance and glucose homoeostasis in adults without diabetes: a systematic review and meta-analysis. *Int J Obes* 2022;46(11):1948-1959. doi:10.1038/s41366-022-01223-y.
38. Mozaffarian D, et al. Nutritional priorities to support GLP-1 therapy for obesity: a joint advisory from the American College of Lifestyle Medicine, the American Society for Nutrition, the Obesity Medicine Association, and The Obesity Society. *Obesity Pillars* 2025 (doi:10.1016/j.obpill.2025.100181 per the erratum record; abstract not read, relied on a search summary).
39. Helms ER, Spence AJ, Sousa C, Kreiger J, Taylor S, Oranchuk DJ, Dieter BP, Watkins CM. Effect of small and large energy surpluses on strength, muscle, and skinfold thickness in resistance-trained individuals: a parallel groups design. *Sports Med Open* 2023;9:102. doi:10.1186/s40798-023-00651-y. PMID 37914977.
40. Slater GJ, Dieter BP, Marsh DJ, Helms ER, Shaw G, Iraki J. Is an energy surplus required to maximize skeletal muscle hypertrophy associated with resistance training? *Front Nutr* 2019;6:131. doi:10.3389/fnut.2019.00131. PMID 31482093.

Professional-body position stands / guidelines:

41. Garber CE, Blissmer B, Deschenes MR, et al. (ACSM). Quantity and quality of exercise for developing and maintaining cardiorespiratory, musculoskeletal, and neuromotor fitness in apparently healthy adults: guidance for prescribing exercise. *Med Sci Sports Exerc* 2011;43(7):1334-1359. doi:10.1249/MSS.0b013e318213fefb.
42. Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. *Br J Sports Med* 2020;54(24):1451-1462. doi:10.1136/bjsports-2020-102955. PMID 33239350.
43. Jäger R, Kerksick CM, Campbell BI, et al. (ISSN). International Society of Sports Nutrition position stand: protein and exercise. *J Int Soc Sports Nutr* 2017;14:20. doi:10.1186/s12970-017-0177-8. PMID 28642676.
44. Aragon AA, Schoenfeld BJ, Wildman R, et al. (ISSN). International Society of Sports Nutrition position stand: diets and body composition. *J Int Soc Sports Nutr* 2017;14:16. doi:10.1186/s12970-017-0174-y. PMID 28630601. (Surplus-driven mass gain.)
45. Kerksick CM, Arent S, Schoenfeld BJ, et al. (ISSN). International Society of Sports Nutrition position stand: nutrient timing. *J Int Soc Sports Nutr* 2017;14:33. doi:10.1186/s12970-017-0189-4. PMID 28919842. (Read for protein-spacing guidance, ~every 3 h; abstract only.)

Popular / non-peer-reviewed sources:

46. Interview Magazine, "Taylor Lautner," M. Martin, 6 Jul 2009: https://www.interviewmagazine.com/film/taylor-lautner (source of the "couldn't break a sweat" quote).
47. Men's Health, "The Taylor Lautner Workout: Build Muscle Fast," 25 Mar 2015: https://www.menshealth.com/fitness/a19534518/taylor-lautner-workout/ (Yuam quotes; "cut down on cardio," 20-min guidance).
48. Engram Kinetics, "ACSM-EP Metabolic Calculations, Demystified" (updated Oct 2026; exam-prep article citing ACSM GETP): https://www.engramkinetics.com/blog/acsm-ep-metabolic-calculations (used for the walking equation and kcal conversion; cross-checked against the Wong measurement).
49. Eli Lilly Medical, "Is retatrutide available in the consumer market?" (reviewed 4 Aug 2026): https://medical.lilly.com/us/products/answers/is-retatrutide-available-in-the-consumer-market-381272 (investigational status; planned Q1 2027 BLA submission).
50. medwireNews / Springer Medicine, "Retatrutide significantly reduces fat mass in type 2 diabetes," 11 Jul 2025: https://www.springermedicine.com/type-2-diabetes/diabetes-therapy/retatrutide-significantly-reduces-fat-mass-t2d/51204996 (lean-mass kg and 64.6% fat-loss index from the Coskun substudy).
