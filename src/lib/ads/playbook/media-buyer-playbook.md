### 14.0 Legend
Every rule carries a basis tag so the employee can explain its confidence:
[G] Google official guidance.  [M] Meta official guidance (as relayed by practitioners).  [E] consistent guidance from recognized practitioners (e.g., ex-Google educators, long-running agencies).  [V] vendor, agency, or single-practitioner report, lower confidence.  [D] default or judgment, tunable.
When rules conflict, the "Default" line states which to follow.

# PLAYBOOK: CORE (load on every task)

## 14.1 History-first rules (learning from the account)
1. Build understanding from this account's own data before applying any general rule. Use general rules only to interpret the data, never to override it. [E][D]
2. Never read only the last 30 days. Review the last 30 days, the last 90 days, year over year where history allows, and before/after each major change; use change history to explain why performance moved. [E]
3. Conversions are back-dated to the click date and can arrive up to 90 days after the click, while spend is fully counted. Recent days therefore look weaker and costlier than they will end up. If it usually takes seven days to convert, wait at least seven days before reviewing a change. Treat at least the last 3 to 7 days as immature. [G][V]
4. Establish what normal looks like: day-of-week patterns, seasonality, typical ranges. Judge anomalies against the baseline, and decide whether they are one-day blips or a trend. Check external forces (seasonality, competitors entering, promotions, other channels), internal factors (broken site, broken tracking, CRM upload gaps), and account changes (ad, bid, budget, targeting changes) before concluding anything. Do not overreact to temporary external events. [G]
5. With a monthly budget, week-over-week comparisons mislead when spend ramps up or down at month start and end. [G]
6. Check ratios are based on enough data: a new keyword that converts on its first click does not have a 100% conversion rate worth acting on. Wait for enough clicks and for the usual conversion lag. [G]
7. Trust the conversion data before trusting any performance finding: check actions, duplicates, primary vs. secondary, counting settings, missing values, and gaps. Exclude unreliable periods from benchmarks. [E]
8. Start analysis with the highest-spend campaigns and ad groups. Prioritize findings by what costs the account the most, and present a point of view (what blocks performance, what works) rather than a long list. [E]
9. Use the impression-share action matrix: strong results but limited by budget, move budget from weaker campaigns; strong results but limited by rank, improve bidding and quality; weak results and limited by budget, understand the performance problem before adding spend; high impression share with poor results, review targeting, search terms, ads, and landing pages. [E]
10. Consider how actively the account is managed (many changes by API, scripts, or platform automation may mean nobody is watching the data) and audit the automation itself: decide for each automated rule or alert whether to keep, customize, or ignore it. [E]
11. Record what you learn from every change and check it before proposing similar ones. [D]

## 14.2 Principles
1. Measurement before optimization. Weak tracking invalidates every bid and budget decision. [E][G]
2. You are guiding systems, not controlling them. Smart Bidding, AI Max, Performance Max, and Advantage+ respond to conversion signal, budget, structure, and creative. Set clear goals and clean data, then verify what the system actually did. [E]
3. Structure protects signal. Every campaign is a data container; consolidate unless a real difference in goal, budget, bidding, geography, message, or offer justifies a split. [E][G]
4. Respect learning. Judge by conversion volume, not by elapsed days. Do not re-change something that is still learning. [E]
5. One meaningful change at a time per campaign where possible, smallest reversible change first, everything logged. [D]
6. Platform-reported conversions overlap and lag. Look at business-level outcomes (total sales, new customers, contribution margin, blended return) when the user can provide them. A campaign can look weak in-platform while total sales for its products rise. [E]
7. Everything starts from the offer and the post-click experience. If the landing page, offer, or checkout limits conversion, no ad-account change will fix it. [E]
8. Never promise results. Be honest about budgets that are too small for modern automation. [E]

## 14.3 Pre-launch feasibility check (run before proposing any new campaign)
1. Establish the target (allowable) CPA from the unit economics (AOV or deal size, margin, close rate). Confirm with the user. Cross-check against the account's historical CPA.
2. Required conversion rate = expected CPC / target CPA. Compare with the account's historical conversion rate and the landing page audit. If the required rate is unrealistic, say so and propose fixes: higher-intent keywords, a cheaper conversion event, a better page, a larger budget, or a different goal. [D]
3. Learning-budget math [D]: Google, about 30 conversions per 30 days per campaign means roughly one conversion per day, so the daily budget should be at least about the target CPA. Meta, an ad set needs about 50 optimization events in 7 days to leave learning, so the minimum daily budget per ad set is about (target CPA x 50) / 7. If the budget cannot meet this: use fewer campaigns/ad sets, optimize for an earlier funnel event, choose a simpler bidding strategy, and tell the user plainly what a small budget can and cannot do.
4. Tracking readiness (section 7b) and landing page readiness (section 7d). If either is not ready, the plan starts with the fixes.
5. Competitive scan using the competitors in the profile: offers, pricing, positioning, to differentiate rather than imitate.

## 14.4 Minimum data and learning rules (tunable defaults)
- Smart Bidding stability: about 30 conversions in 30 days per campaign [E]; at lower volume learning can take 2 to 4 months, so be patient and simplify. [E]
- Google lead-gen goal: the chosen conversion action should have at least 15 conversions in the last 30 days at account level, ideally occur within 7 days of the ad interaction, and offline data should be uploaded daily. [G]
- Target ROAS: prefer fewer, larger campaigns (at least about 15 conversions per month each); base the target on at least 30 days of campaign data or three conversion cycles, whichever is longer. [G]
- Smart Bidding data volume per campaign for confident prediction: about 30 to 50 conversions per month. [E]
- Search keyword or ad judgments: at least 100 clicks or 20 conversions. [D]
- RSA learning needs data density: a full set of 15 headlines and 4 descriptions can create tens of thousands of combinations. At low volume reduce combinations (fewer headlines, or strategic pinning of key lines) so learning is faster; at high volume let the system mix. [E]
- Meta: about 50 optimization events per ad set per 7 days; an ad set stuck in learning for 7+ days is a red flag. [V][D]
- After a bid strategy, budget, or targeting change: wait 7 to 14 days (longer at low volume), and until the conversion lag has passed, before re-evaluating. [D][G]
- If thresholds are not met, state "not enough data yet" and how much more is needed.
- Tests: set sample size or duration and success criteria before launch; no early peeking; whole weeks; at low volume, fewer bolder bets. [V][E]

## 14.5 Decision rules (tunable defaults)
- Scale: beating target CPA/ROAS for 7+ days (on mature data) with stable volume, propose a budget increase of at most 20%, no more often than every 3 to 4 days. Move budget between campaigns rather than switching successful campaigns on and off. [D][V]
- Cut: spend above about 2 to 3x target CPA with zero conversions AND healthy tracking over a window longer than the conversion delay, propose pausing or restructuring. [D]
- Budget-limited vs. rank-limited: see 14.1 rule 9. [G][E]
- Do not pursue low CPCs for their own sake. High CPCs are not the problem; low-quality traffic is. Judge on conversions, CPA, and revenue. [E]
- Targets: set bid targets from past performance, adjusted for seasonality and promotions, aligned with the real CPA/ROAS goal. Budget-constrained campaigns leave conversions on the table. [G]

## 14.6 Monitoring, anomalies, and cadence (tunable)
- Daily (if audit enabled): spend pacing outside 70% to 120% of expected; sudden conversion drops with stable clicks (check tracking and the landing page BEFORE blaming ads); CPC/CPM spikes (check seasonality, competition, fatigue); zero conversions despite clicks (tracking until proven otherwise); disapprovals.
- Weekly: search terms and negatives, asset and creative performance, budget moves, brand vs. non-brand share, PMax/AI Max drift, new-concept pipeline, landing page speed and status.
- Monthly: structure, strategy, testing roadmap, tracking health, creative refresh plan, business-level results, outcome reviews of past changes.
- Every tactic has a shelf life. Watch for the point where something stops working rather than assuming it will keep working. [E]

## 14.7 Reporting rules
Lead with what changed and why, then the top 3 prioritized actions with evidence, then details. State the comparison period, the maturity of the data, and metric definitions. Separate facts (data) from interpretation and assumptions. Explain in plain language. For every ad or campaign discussed: show the numbers, compare with the account's own top performers and similar items, say why it performed that way, and propose scale, pause, iterate, or redesign. [E]

# PLAYBOOK: GOOGLE ADS (load when the account is Google Ads)

## 14.8 Account structure
- Group keywords into a small number of tightly themed ad groups (about 3 to 5 per campaign), each with one landing page and message. Avoid single-keyword and device-segmented structures; Smart Bidding already accounts for device. Start with one ad group per distinct landing page. [G][E]
- Segmenting traffic forces Smart Bidding to optimize several small targets separately and can lower efficiency. Segment only for a different goal, budget, bidding strategy, geography, or offer. [G][E]
- Over-segmentation symptoms (use in the structure audit): persistent learning-limited statuses, unstable CPA/ROAS, budget lost to impression share despite adequate total budget, spend concentrated in a few campaigns, poor PMax search-term visibility. Two or more symptoms mean structure is the likely cause. Consolidate in stages, highest spend first. [E]
- Separate brand and non-brand into different campaigns so budgets and results are not blended. Keep Search and Display in separate campaigns. [E]
- Align conversion goals across campaigns: clearly separate Primary (used for bidding) from Secondary (observation), with accurate conversion values for value-based bidding. [E]

## 14.9 Keywords, match types, negatives
- Google's guidance: put the match types of a themed ad group together and use broad match with Smart Bidding, because duplicate keywords across match types split the data. [G]
- Practitioner conditions: broad match works only with enough conversion data, enough budget, and time to learn, and with regular search-term review. Without those, expect waste. [E]
- Default: use broad match with Smart Bidding ONLY when tracking is healthy, the campaign has about 30+