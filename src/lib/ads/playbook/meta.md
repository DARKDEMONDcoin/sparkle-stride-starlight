# PLAYBOOK: META ADS (load when the account is Meta Ads)

## 14.17 Structure
- Consolidate. One campaign per objective and product/offer, with one or a few broad ad sets used as containers, instead of parallel campaigns for traffic, leads, video views, engagement, and retargeting. Too many parallel efforts leave none with enough signal to read. [E][M]
- Prefer the Advantage+ structure (Advantage+ budget, audience, placements). Fragmenting budget across many ad sets prevents any of them from exiting learning. [E][M]
- Roughly 50 optimization events per ad set per 7 days is the usual learning threshold. Compute the budget needed using the feasibility math. [V]
- Do not run a "single winning ad" mindset: an ad set works as a collection of ads that contribute to aggregate performance. Be cautious about pausing individual ads inside a broad ad set based on early data. Meta caps an ad set at 50 ads. [E]

## 14.18 Targeting and audiences
- For conversion, landing-page-view, and link-click goals, detailed targeting and lookalikes act as suggestions only; the system can reach beyond them. Do not stack interests or lookalikes as a tactic and do not build separate ad sets per interest group. [E][M]
- Hard controls: location, language, minimum age (no higher than 25 when using Advantage+ Audience), exclusions, and special-ad-category rules. [E]
- Prefer optimizing for conversions whenever possible. Restrictive targeting matters more when optimizing for shallow actions (clicks, video views, engagement) because the algorithm is literal. [E]
- Age and gender: for purchase goals, restrictions usually raise cost without benefit; let delivery find buyers. For lead goals, check the age distribution of leads; if low-quality leads cluster in one group, only then consider restriction or value rules. [E]
- Value rules (bid adjustments by age, gender, or location) fit when you know lifetime-value differences that Meta does not. Check current availability by objective. [E]
- Remarketing is the exception, not the rule: keep it to a small share of budget. Delivery already prioritizes people close to converting. Add exclusions of existing customers when the goal is new-customer acquisition. [E]
- If Audience Segments reporting is available, use it to see how budget is split between new, engaged, and existing audiences. [E]

## 14.19 Creative is the main lever
- Meta's official guidance is creative diversification. Genuine diversity means distinctly different visuals, formats, messages, personas, and offers; two similar images are not diversity, and ten edits of one idea count as one concept. [M][E]
- Define a concept as persona + pain point/angle + offer. Every concept has a written hypothesis. Plan concepts first, then produce executions ("quality shots on goal"), because more volume without a measurement plan makes the account harder to read. Lower production cost from AI should buy better concept development, not just more ads. [E]
- Use variety in the platform's own tools: multiple formats (static, carousel, video), Flexible Format / Dynamic Creative (up to 10 images or videos in one ad), up to 5 primary text and 5 headline variations per ad, placement-specific aspect ratios (9:16, 4:5, 1:1), Advantage+ Creative enhancements after reviewing them, AI-generated backgrounds, and related media. Be aware enhancements are on by default and can interfere with a deliberate test. [M][E]
- Speak to specific pain points and personas; don't rely on generic feature lists or plain product photos on white backgrounds. [E]
- Keep a concept library with results so the next batch is based on evidence from this account's history. A dry creative pipeline is one of the clearest signs of an account heading downward. [E]

## 14.20 Creative testing method
1. One hypothesis, written success criteria, a planned sample or duration, and kill/iterate/scale rules per test, before launch. Derive target CPA from margin, not from industry averages. [E]
2. Choose the structure by budget: with enough budget for each concept to approach the learning threshold, run a separate testing campaign using ad-set budgets (ABO) with equal budget and schedule and one variable changed, for about 10 to 14 days for conversion-optimized tests. With limited budget, do not fragment: put several distinct concepts in one ad set with Advantage+ budget (CBO) and let delivery allocate. Practitioners disagree on forced spend (ABO) vs. letting ads earn spend (CBO); default to the budget rule above and state the trade-off to the user. [E][V][D]
3. Advantage+ delivery can favor early-signal ads before every variant gets equal exposure. When a clean read is needed, recommend Meta's native A/B/creative testing tool, which splits audiences so variants compare fairly. [E]
4. Judge against the account's own top performers and against similar creative, not generic benchmarks. Explain why it won (hook, offer, talent, angle). Use "storytelling" metrics alongside the primary ones (for video: attention and hold metrics such as 3-second plays per impression and average watch time). [E]
5. Add winners to the scaling campaign as new ads rather than editing live ones; retire clear losers; brief the next batch from what won. Keep roughly 20 to 30% of spend for testing at small budgets and about 20% at large budgets. [E][V][D]

## 14.21 Creative fatigue
- Use Meta's definitions: "Creative Fatigue" means cost per result is at least twice its past level; "Creative Limited" means higher but under twice. Read the delivery flags if exposed; otherwise compute cost-per-result trends at ad and ad-set level against the account's own baseline. [M]
- Do not treat frequency alone as a problem, and do not refresh on a fixed calendar. Ads built with real creative diversity can run for months. High frequency with stable results is fine. [E]
- Common causes: restricted audience (remarketing-only, tiny location), high budget, restricted placements, too few ads, too little text/creative variety. Fix by adding genuinely new ads and concepts, opening targeting and placements, adding text variations, and customizing creative by placement. If the ad set is exhausted, start a fresh ad set with new concepts. [M][E]

## 14.22 Budget and scaling
- Change budget in steps of up to about 20% and no more often than every 3 to 4 days; larger or more frequent edits can reset learning. Hold budgets steady for the first week after launch and don't edit creative, bids, and budget together. Move budget up or down instead of switching working campaigns off. [V][D]
- Scale vertically (budget) while CPA holds; scale horizontally with new concepts, new formats, and new markets or languages rather than cloning ad sets.
- Early-stage or small-budget accounts: build the creative foundation and tracking quality before pushing spend.

## 14.23 Lead generation (Meta)
- Optimize for lead quality, not volume: qualifying questions, higher-intent form settings, and feeding qualified-lead outcomes back (Conversions API) so the system learns what a good lead is. Without it you train delivery toward the wrong people. Remind the user that response speed to new leads strongly affects results. [E]
- Where messaging is the natural path (e.g., click-to-WhatsApp in markets where it dominates), consider message-based lead flows with qualification inside the chat. [E]

## 14.24 Measurement (Meta)
- In-platform ROAS is an incomplete picture. When the user can provide margin and customer data, also report blended return on ad spend, new-customer share, and contribution margin per set of ads. [E]
- Ensure Pixel + Conversions API, deduplication, consistent UTMs, plausible event counts, and Event Match Quality are healthy (section 7b). Attribution on Meta can over-credit in-platform; note this when interpreting results. [E]

## 14.25 Meta diagnostic matrix (read top to bottom; fix the first broken level)
- Level 1, attention and auction: CPM, CTR, cost per outbound click, landing page views. Level 2, message match and intent: click to landing page view, view content, add-to-cart, initiate checkout. Level 3, business outcome: conversion rate, CPA (new customers), ROAS against contribution margin, spend stability. A broken upper level poisons the metrics below it. [V]
- High CPM with weak CTR: creative or hook too generic or too narrow; test a new visual direction and hook against the control. [V]
- Good CTR with few landing page views: load time, broken click path, or a tracking gap; run a speed check and a manual click-through audit. [V]
- Good landing page views with weak product views or add-to-cart: message match failure; the page does not continue the ad's promise. [V]
- Good add-to-cart with weak purchases: price, trust, checkout friction, shipping cost, missing risk reversal. [V]
- Good conversion rate with low spend volume: angle too narrow or too little creative variation; broaden angles and formats. [V]
- Many clicks and no purchases: a curiosity hook with no buying intent. [V]
- Verify tracking first, change one thing at a time, and write down the kill/iterate/scale thresholds before the test. [V][E]

## 14.26 Weekly Meta checklist
Cost-per-result trend per ad and the delivery flags; ad sets stuck in learning; budget fragmentation; concept diversity; creative pipeline status; event match quality and Conversions API health; click to landing-page-view ratio and trend; placement and delivery issues; age/placement distribution for lead quality.

