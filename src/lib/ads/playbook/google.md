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
- Default: use broad match with Smart Bidding ONLY when tracking is healthy, the campaign has about 30+ conversions per 30 days, the budget is adequate, and weekly negative-keyword review is in place. Otherwise use exact (and phrase where useful) on core high-intent terms. Phrase match has lost much of its former middle-ground value, so do not default to it as a "safe" choice. [E][D]
- Negatives are the main brake as broad match, AI Max, and PMax expand reach. Maintain shared account-level lists, mine search terms weekly, and propose negatives with evidence (spend, clicks, zero conversions). Derive the starting list from the business profile and industry (e.g., job-seeker or DIY terms when irrelevant); never apply words like "free" or "cheap" blindly. Many queries are hidden in the search terms report, which is another reason to keep reviewing. [E]
- Promote high-converting search terms to exact match with tailored ads. [E]
- Check for search terms that trigger several ad groups, and for negatives that block active keywords. [E]

## 14.10 Responsive Search Ads
- Fill headlines and descriptions with genuinely different angles (see creative playbook), then apply the data-density rule in 14.4 on how many to use and whether to pin. Check ad strength and that the landing page contains the offers the ad mentions. [E]
- Review auto-created assets (settings that create assets on your behalf) to ensure they describe the business and offers accurately. [E]

## 14.11 Bidding path
- Start new or low-volume campaigns on Maximize Conversions (or Conversion Value) with no target. Add a CPA/ROAS target only when volume supports it, and set it near actual performance rather than an aspiration. An aggressive target set too early throttles spend and slows learning. [E]
- Manual CPC is almost always a mistake now. Expect CPCs to rise when moving to Smart Bidding while conversions rise too. Poor Smart Bidding results usually trace to weak conversion data or impatience. [E]
- Micro-conversion ladder for low volume: optimize first for a high-volume step that must happen on the journey (e.g., add-to-cart, counting only the first per session), switch to the next step (begin checkout) once it reaches about 30 conversions, then to the final conversion (purchase) at about 30 to 50. Keep earlier steps as Secondary for visibility. Never use vanity events like page views. [E]
- Value-based bidding when leads or sales have different values. If lead quality matters but values can't be assigned, use target CPA on qualified or converted lead goals. [G]
- For very low-volume businesses with no way to feed back offline outcomes, be explicit: bidding has weak signal, so keep targeting tight and expectations modest. [E]

## 14.12 AI Max for Search
- AI Max is a bundle of features layered on Search campaigns (text customization, final URL expansion, search-term/keyword-list matching), not a new campaign type, and each part can be turned on separately. It reports which headlines and landing pages matched each search term. [E]
- Readiness (all should be true): healthy conversion tracking; roughly 50 to 60+ conversions in 30 days; broad match already in use; non-brand impression share already in roughly the 30 to 40% range (you have exhausted the existing keyword set); budget to explore; target CPA preferred over target ROAS in Search. It is NOT for small accounts with low impression share and a tiny budget. [E]
- Test protocol: set the benchmark first (CPA, ROAS, lead quality), isolate the test (Google Ads experiment or separate campaign, never mixed into the same ad groups), give it time, and review the search-term, headline, and landing-page reports. Judge on incremental results for THIS account, not on Google's reported averages. [E]
- Final URL expansion is risky for lead gen without offline conversion feedback because it may send traffic to pages that don't fit the funnel and optimize for spam leads. Audit expanded URLs (section 7d). [E]
- Dynamic Search Ads, auto-created assets, and campaign-level broad match are being auto-upgraded to AI Max starting September 2026. Detect flagged campaigns (migration date fields exist on the Campaign resource in v25.1+) and re-check search terms after migration. [V]
- The three inputs that matter most: conversion tracking, customer lists (fresh uploads help even if too small to target), and creative. [E]

## 14.13 Performance Max
- The three levers: conversion settings (the compass; choose the goal at the current volume level), bid strategy (Maximize Conversions favors volume; Target CPA/ROAS favors efficiency; an early aggressive target can throttle it), and assets (the creative is the real audience signal). [E]
- Audience signals and search themes are hints that help early exploration; they do not restrict who is eligible. If the system finds better conversions elsewhere it will move there. Use the reports afterward to see what it actually did. [E]
- Structure: create a new CAMPAIGN only for a different conversion goal, budget, bid strategy, geography/service area, or clearly different product or service category. Create a new ASSET GROUP only when messaging, audience intent, or product focus really differs, and give it different assets. Never create several asset groups with identical assets that differ only in signals. Default: few asset groups (about 1 to 3, up to about 5 until roughly 50 conversions per month). [E][D]
- Judge by conversion volume and business-level results, not by two weeks of platform data. A campaign that looks weak in-platform may still lift total product sales. Check total sales for the advertised products before concluding. [E]
- Protect the brand: use brand exclusions and campaign-level negatives so PMax doesn't cannibalize branded Search. Flag cannibalization when over about 30% of conversions come from brand terms despite exclusions. Search overlap is common, so compare PMax and Search results for the same terms and keep control where Search converts better. [E][V]
- Weekly PMax health check (tunable; two or more "yes" answers mean investigate): over 80% of spend in the top 20% of products or asset groups; any placement over 15% of spend; best-performing assets being auto-generated rather than uploaded; Search CPCs rising after PMax launched; conversions from unexpected locations; over 30% of conversions from brand terms; an asset group rating below "Good" for more than 7 days. [E]
- Channel reporting is a diagnostic, not a kill switch. Lower YouTube ROAS than Search is expected for an upper-funnel channel; use channel data to decide where to test or invest next, not to shut channels off. [E]
- Placement and content exclusions help when the data shows waste (a vendor case reported about a 30% PMax ROAS gain from systematically excluding off-intent placements). Apply on evidence, not reflex. [V]
- Retail: the feed is the foundation. Titles with brand, product type, and key attributes; SKU/MPN and GTIN where available; accurate price and availability; consider running Standard Shopping alongside PMax for query-level insight and control, since both compete on ad rank. [E]
- Review asset performance weekly and replace low-rated assets only after enough data. Video is no longer optional for PMax and Demand Gen. [E]
- Set expectations for small budgets: modern automation needs enough conversion data; $20 to $30 a day often can't produce reliable learning. [E]

## 14.14 Demand Gen
- Replaced Video Action and Discovery campaigns. Visual, mid-funnel, strong with video and product feeds. Judge on engaged views, assisted conversions, and new-customer signals as well as direct conversions, over longer windows than Search. Use social-like CPA/ROAS targets, and remember that with optimized targeting on, audience selections act as signals only. It supplements winning Search/Shopping; it does not replace them. [G][E]

## 14.15 Lead generation quality (Google)
- Optimize for qualified-lead / converted-lead / booked-appointment goals rather than raw form fills; these goals also trigger invalid-traffic protections built for lead gen. Choose one conversion goal for bidding rather than mixing funnel stages. [G]
- Feed qualified outcomes back (enhanced conversions for leads or offline import via the currently supported route); Google reports enhanced conversions for leads capture on average about 10% more conversions than standard import. Without offline feedback, automation tends to chase the cheapest form-fillers and spam. [G][E]
- Add call assets and lead form assets; add lead verification (reCAPTCHA, double opt-in, server-side validation); review the Search Partner network and demographic distribution of leads for quality problems. [G][E]
- Use Lead Journey Mapping in Google Ads where available to connect lead stages to values and delays. [G]

## 14.16 Weekly Google checklist
Search terms and negatives; disapprovals; impression share lost (budget vs. rank); asset/ad performance; brand vs. non-brand share; PMax channel and asset insights and the health check; AI Max term, headline, and URL quality; conversion tracking status; structure symptoms; landing page speed and status.

