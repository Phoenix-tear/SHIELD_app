# SHIELD — Systematic Hyperlocal Income-Event Loss Detection

> Parametric micro-insurance for Q-commerce delivery riders in India.  
> Zero paperwork. Automated triggers. UPI payout in under 4 hours.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Persona-Based Scenarios & Workflow](#2-persona-based-scenarios--workflow)
3. [Weekly Premium Model & Parametric Triggers](#3-weekly-premium-model--parametric-triggers)
4. [Platform Choice: Mobile vs Web](#4-platform-choice-mobile-vs-web)
5. [AI/ML Integration](#5-aiml-integration)
6. [Tech Stack](#6-tech-stack)
7. [Development Plan](#7-development-plan)
8. [Risk, Compliance & Regulatory Notes](#8-risk-compliance--regulatory-notes)
9. [Adversarial Defense & Anti-Spoofing Strategy](#9-adversarial-defense--anti-spoofing-strategy)

---

## 1. Problem Statement

Q-commerce delivery riders (Blinkit, Zepto, Swiggy Instamart) operate on a 10–20 minute SLA promise. Their income is entirely event-driven — they earn per delivery, with zero fixed pay. A single disruption event — a flash flood, a bandh, a dark store power outage, a VIP convoy — can erase 100% of their earnings for an entire shift with no recourse.

Existing insurance products do not cover income loss. They cover death, hospitalisation, and vehicle damage — but not the most frequent pain point: the shift you couldn't work, through no fault of your own.

SHIELD is a weekly parametric micro-insurance product that pays out automatically, via UPI, within 4 hours of a verified disruption event — no claim forms, no surveys, no waiting.

---

## 2. Persona-Based Scenarios & Workflow

### Persona A — Rajan, Blinkit Rider, Bengaluru

**Profile:** 28 years old. Works 6-hour evening shifts (5 PM – 11 PM). Average weekly earnings: ₹4,200. Pays ₹49/week for SHIELD.

**Scenario: Flash flood, Koramangala, 7:45 PM Friday**

Rajan is en route to deliver a grocery order when the underpass on 80 Feet Road floods to 15cm depth within 12 minutes of a cloudburst. His app shows zero new assignments — the dark store has throttled all outgoing orders.

| Step | What Happens |
|---|---|
| **7:51 PM** | IMD rainfall API records 22mm/hr for Bengaluru South district. SHIELD's disruption classifier fires an auto-trigger. |
| **7:52 PM** | Google Maps traffic speed API for the zone drops to 4 km/hr. Windy.com 5-min radar confirms localised cell. Dark store assignment rate = 0. Three signals corroborate. |
| **7:53 PM** | SHIELD pushes Rajan a notification: *"Disruption detected in your zone. Your earnings are protected. Tap to confirm you're active."* |
| **7:54 PM** | Rajan taps confirm. His GPS geofence is verified within the affected zone. Claim opens automatically. |
| **10:30 PM** | Rain clears. Rajan resumes deliveries. Earns ₹310 in the final 90 minutes of shift. |
| **11:05 PM** | Claim quantum calculated: Baseline ₹700 (Friday 7–10 PM slot) × disruption fraction 0.9 × peak coefficient 0.95 = ₹598 expected loss. Actual earnings gap = ₹598 − ₹0 (during rain) = **₹598 payout queued.** |
| **11:09 PM** | ₹598 credited to Rajan's UPI ID. Notification confirms amount and claim reference. |

---

### Persona B — Divya, Zepto Rider, Chennai

**Profile:** 24 years old. Works split shifts — 8 AM–12 PM and 6 PM–9 PM. Average weekly earnings: ₹3,600. Pays ₹42/week for SHIELD.

**Scenario: State-level bandh, political party-called shutdown, Wednesday**

Divya arrives at her dark store at 8 AM to find it locked — the store manager couldn't open due to party workers blocking the commercial complex entry. The platform app shows no assignments available across Chennai.

| Step | What Happens |
|---|---|
| **6:30 AM** | SHIELD's news NLP parser detects three verified news outlets (ANI, The Hindu, Manorama) publishing the bandh declaration. Confidence score: 0.97. Auto-trigger fires for Chennai district. |
| **8:05 AM** | Divya opens the app. A full-shift protection card is displayed proactively — she doesn't need to file anything. |
| **8:10 AM** | Dark store assignment rate for her hub's pin code = 0. Peer consensus: 11 of 12 riders in her 500m radius are showing idle status. All signals confirmed. |
| **End of day** | Full shift payout calculated: Morning baseline ₹480 + Evening baseline ₹360 = **₹840 payout.** |
| **7:00 AM Thursday** | ₹840 credited via the overnight batch sweep, before Divya starts her next shift. |

---

### Persona C — Suresh, Swiggy Instamart Rider, Hyderabad

**Profile:** 35 years old. Works 10 AM – 4 PM. Average weekly earnings: ₹2,900. Pays ₹35/week for SHIELD.

**Scenario: VIP convoy road closure + partial delivery recovery**

A Union Minister's visit seals a 2.5 km stretch of Jubilee Hills road for 70 minutes. Suresh is mid-shift and physically cannot reach his next 4 delivery addresses. He manages to complete 3 deliveries on an alternate route, earning ₹180 during the window.

| Step | What Happens |
|---|---|
| **12:18 PM** | Traffic speed API for Jubilee Hills drops to 2 km/hr. No IMD or official signal available — this is a semi-auto trigger scenario. |
| **12:19 PM** | SHIELD pushes: *"Unusual traffic detected in your zone. Did a road closure affect your shift? Tap to start a claim."* |
| **12:21 PM** | Suresh taps confirm. He uploads a 25-second geo-tagged video of the police cordon. Enters the claim lane. |
| **2:45 PM** | AI reviewer (human-in-loop) verifies video, cross-references Google Maps historical traffic anomaly log for the pin code + 70-minute timestamp window. Claim approved. |
| **Calculation** | Baseline ₹580 (Tuesday 12–2 PM slot) × disruption fraction (70/120 min) × coefficient 0.65 = ₹222 expected loss. Actual earnings gap = ₹222 − ₹180 earned = **₹42 payout.** |
| **3:10 PM** | ₹42 credited. Small number — but accurate. Suresh did work through part of the disruption, and the system tops up only his actual deficit. |

> The tiered deficit model is intentional. Riders always benefit from working — compensation never exceeds what they would have earned, ensuring there is no incentive to stop working during a disruption.

---

### Application Workflow (End-to-End)

```
Onboarding
  └── Rider downloads SHIELD app
  └── KYC: Aadhaar + Selfie verification (Digilocker API)
  └── Bank penny-drop verification (UPI handle)
  └── Links delivery platform account (OAuth or API token)
  └── Selects weekly premium tier → Policy activates Monday 00:00

During Shift
  └── SHIELD runs passively in background
  └── Monitors: GPS location, dark store assignment rate, IMD/AQI feeds
  └── Disruption detected → Classify → Auto / Semi-auto / Manual lane

Claim Processing
  └── Auto: No action needed from rider
  └── Semi-auto: One-tap confirmation
  └── Manual: 30-sec geo-tagged photo/video + description

Payout
  └── Fraud firewall clears → Job queue → UPI payout attempt
  └── Retry logic (3 attempts, exponential backoff) → NEFT fallback
  └── 3 AM batch sweep → 7 AM credit for all overnight-pending payouts

Rider Dashboard
  └── Weekly earnings baseline (rolling 4-week median)
  └── Active policy status
  └── Claim history + payout log
  └── Premium deduction record
```

---

## 3. Weekly Premium Model & Parametric Triggers

### Premium Model

Premiums are dynamic, calculated weekly, and deducted on Monday morning from the rider's SHIELD wallet (pre-loaded or auto-debit from linked account).

**Base Formula:**

```
Weekly Premium = Base_Rate × Zone_Risk_Score × Earnings_Band_Multiplier × Platform_Modifier
```

| Variable | Description |
|---|---|
| `Base_Rate` | ₹35–₹75 flat range depending on city tier |
| `Zone_Risk_Score` | 0.7–1.4 multiplier based on historical disruption frequency for the rider's primary dark store pin code (flood history, bandh frequency, AQI events, traffic accident density) |
| `Earnings_Band_Multiplier` | 0.8–1.2 based on the rider's rolling weekly earnings — higher earners pay slightly more, proportional to the income at risk |
| `Platform_Modifier` | Blinkit (1.0) / Zepto (1.05) / Instamart (0.95) — reflects historical claim rates per platform from beta data |

**Indicative premium ranges:**

| City | Rider Earnings Band | Weekly Premium | Max Weekly Payout |
|---|---|---|---|
| Bengaluru | ₹3,500–₹5,000 | ₹42–₹58 | ₹4,500 |
| Chennai | ₹3,000–₹4,500 | ₹38–₹52 | ₹4,000 |
| Delhi NCR | ₹4,000–₹6,000 | ₹55–₹75 | ₹5,500 |
| Hyderabad | ₹2,800–₹4,200 | ₹35–₹49 | ₹3,800 |

The maximum weekly payout is capped at 90% of the rider's 4-week median weekly earnings — preventing full income replacement while covering genuine losses.

---

### Parametric Triggers — Priority Tier Map

Triggers are classified into three tiers based on verifiability and automation confidence.

#### Tier 1 — Hard Auto-Triggers (No Rider Action Required)

| Trigger | Data Source | Threshold | Scope |
|---|---|---|---|
| Heavy Rainfall | IMD District API | >15mm/hr | Zone |
| Flash Flood (road depth) | BBMP/GHMC flood sensor network | >10cm road depth | Hyperlocal |
| Cyclone/Depression Warning | IMD Alert API | Orange/Red alert | City |
| Extreme AQI | CPCB AQI API | >400 (Severe) | City/Zone |
| Declared Bandh | Verified news NLP (ANI, PTI, The Hindu) | Confidence >0.90 | City/Zone |
| Platform App Outage | Blinkit/Zepto internal API (partner integration) | Outage >15 min during peak | City |
| Dark Store Power Outage | Dark store IoT sensor (partner integration) | Outage >20 min | Store |
| Curfew/Section 144 | State Government Gazette API | Any declared instance | Zone |

#### Tier 2 — Semi-Auto Triggers (One-Tap Rider Confirmation)

| Trigger | Corroboration Required (2 of 3) |
|---|---|
| VIP Convoy Road Closure | Traffic speed API <5 km/hr + Peer idle consensus + Manual photo |
| Film Shoot Road Block | Police permission public feed + Traffic speed + Peer consensus |
| Religious Procession | Known calendar event + Traffic speed + Peer consensus |
| RWA Delivery Blackout | Peer consensus + Dark store assignment rate drop + Rider geofence |
| Dark Store Picker Shortage | Assignment rate drop + Rider present at store geofence + Peer idle |

#### Tier 3 — Manual Claim Lane (Photo/Video + AI Review, 2-hr SLA)

Absurd but legitimate scenarios requiring human-in-loop AI review:

- Stray cattle/animal mob blocking route (geo-tagged video required)
- Wedding baraat occupying lane (photo + approximate duration)
- Unexploded ordnance exclusion zone (news corroboration + geofence)
- Sewage main collapse road closure (municipal emergency feed + photo)
- Wildfire smoke/crop burn AQI spike (CPCB AQI + geofence)
- False fire alarm building evacuation (duration log + building geofence)
- Gas pipeline rupture evacuation zone (municipal/fire department feed)

---

## 4. Platform Choice: Mobile vs Web

**Decision: Mobile-first (Android PWA → Native Android App)**

### Rationale

Q-commerce delivery riders in India are almost entirely mobile-native. Smartphone penetration among gig workers is >95%; laptop/desktop access is near zero. Every key workflow — shift tracking, GPS verification, claim submission, UPI payout — is mobile-native by design.

| Consideration | Web App | Mobile (Android) | Decision |
|---|---|---|---|
| Background GPS tracking | Not reliable | Full support | ✅ Mobile |
| Push notifications for auto-triggers | Limited (browser required open) | Native, always-on | ✅ Mobile |
| UPI deep link for payment confirmation | Awkward in browser | Seamless intent-based | ✅ Mobile |
| Offline functionality (poor network zones) | Service worker limited | Native offline cache | ✅ Mobile |
| Geo-tagged photo/video for manual claims | Browser Camera API (unreliable) | Native camera with metadata | ✅ Mobile |
| Distribution in market | No install friction | Play Store familiarity | Neutral |

**Phase 1 approach:** React Native PWA deployed as an installable Android app (no Play Store review cycle needed in MVP). Graduates to full native Android in Phase 2 once core flows are validated.

A lightweight web dashboard is built in parallel — but exclusively for:
- Rider onboarding (first-time KYC on a larger screen)
- Ops/admin claim review panel
- Partner (dark store operations) integration portal

---

## 5. AI/ML Integration

### 5.1 — Earnings Baseline Engine (Regression Model)

**Problem:** A fair baseline cannot simply be the rider's raw historical average — past disruptions contaminate the baseline.

**Solution:** A gradient-boosted regression model trained on:
- Rider's own earnings history (rolling 12 weeks, same day/slot pairs)
- Zone-level demand index from platform data
- Day-of-week, time-of-day, and seasonal patterns
- Festival calendar effects (Diwali +30%, post-bandh recovery surge, etc.)

The model normalises out disruption-contaminated weeks before computing the baseline. Output: a per-slot expected earnings figure with a confidence interval. The lower bound of the interval is used as the payout denominator — conservative and fraud-resistant.

### 5.2 — Disruption NLP Classifier (News + Social Feed Parsing)

**Problem:** Bandhs, VIP movements, and protest-related closures are announced inconsistently — sometimes on Twitter, sometimes in a regional news outlet, sometimes only in a WhatsApp group.

**Solution:** A fine-tuned NLP classifier (base: IndicBERT or mBERT for multilingual Indian language support) that:
- Ingests RSS feeds from ANI, PTI, The Hindu, Manorama, Eenadu, Lokmat, and 40+ regional outlets
- Monitors Twitter/X keyword streams for disruption signals by city + pin code
- Scrapes public Telegram channels of key resident welfare associations
- Classifies each signal: disruption type, geographic scope, confidence score, expected duration
- Only fires a trigger when confidence > 0.90 and at least one corroborating signal exists

### 5.3 — Fraud Detection Engine (Ensemble Model)

Six parallel checks feed a gradient-boosted fraud score (0–1 scale). Claims with score >0.7 go to human review; >0.9 are auto-rejected with rider notification.

| Check | Signal | Weight |
|---|---|---|
| Peer Consensus | % of riders in 500m radius showing idle status | 0.30 |
| Geofence Integrity | Rider GPS within zone at claimed time | 0.20 |
| Historical Claim Pattern | 90-day claim frequency vs. zone average | 0.20 |
| Earnings Velocity Anomaly | Abnormal earnings immediately before/after window | 0.15 |
| Dark Store Assignment Rate | Platform API: assignments issued during window | 0.10 |
| Zone Corroboration | Google Maps traffic speed + Windy.com + Social signals | 0.05 |

The model is retrained weekly on new labelled claim data. Human reviewers label edge cases in the Manual lane — these become high-quality training examples for the semi-auto tier over time, continuously tightening the automation boundary.

### 5.4 — Premium Pricing Model (Actuarial ML)

A time-series survival model trained on:
- Historical claim frequency by zone, season, platform, and earnings band
- IMD historical weather data (monsoon onset dates, flood event frequency by district)
- City-level bandh frequency (sourced from news archive)
- Dark store operational failure rate (partner data)

Output: expected annual claim value per rider segment, from which weekly premiums are back-calculated with a target loss ratio of 65–70% (leaving 30–35% for platform operations, reinsurance, and IRDAI-mandated reserve).

Premiums are re-priced every 4 weeks per rider based on updated zone risk scores and the rider's individual claim history — a light credibility weighting (no more than ±15% adjustment from zone base rate) to prevent over-personalisation on sparse data.

### 5.5 — Manual Claim AI Review (Vision + LLM)

For Tier 3 manual claims, the submitted photo/video is processed by:
1. A computer vision model verifying that the image contains a genuine physical blockage (road obstruction, flood water, animal, police cordon) — not a screenshot or fabricated image
2. EXIF metadata validation confirming geo-tag and timestamp match the claimed zone and window
3. An LLM (Claude API) that reads the rider's description, the visual model output, and all corroborating data signals, then produces a structured claim assessment with a recommendation (approve / reject / escalate)

Human reviewers see the LLM's recommendation with full reasoning. Their override decisions are logged and feed back into model improvement.

---

## 6. Tech Stack

### Mobile App

| Layer | Technology |
|---|---|
| Framework | React Native (Expo managed workflow → bare workflow in Phase 2) |
| State Management | Zustand |
| Maps & Geofencing | react-native-maps + background geolocation (transistorsoft) |
| Offline Support | WatermelonDB (local SQLite) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| UPI Deep Linking | react-native-upi-pay |

### Backend / API

| Layer | Technology |
|---|---|
| API Layer | FastAPI (Python) — async, OpenAPI auto-docs |
| Auth | Supabase Auth (JWT) + Aadhaar OTP via Digilocker API |
| Database | PostgreSQL (primary) + TimescaleDB extension for time-series earnings data |
| Job Queue | Redis + Celery (payout queue, retry logic, batch sweep) |
| Real-time Events | Supabase Realtime (WebSockets for claim status push) |

### ML / AI

| Component | Technology |
|---|---|
| Baseline Engine | XGBoost + scikit-learn, served via FastAPI ML endpoint |
| NLP Classifier | IndicBERT fine-tuned, hosted on HuggingFace Inference API |
| Fraud Score | LightGBM ensemble, retrained weekly via Airflow DAG |
| Vision Review | CLIP + custom CNN for obstruction classification |
| LLM Claim Assessment | Claude API (claude-sonnet-4-20250514) |
| Feature Store | Feast (offline + online) |
| Experiment Tracking | MLflow |

### Data Integrations

| Source | Purpose |
|---|---|
| IMD District API | Rainfall, cyclone, fog triggers |
| CPCB AQI API | Air quality triggers |
| Google Maps Platform (Routes + Traffic) | Zone traffic speed corroboration |
| Windy.com API | Hyperlocal 5-minute rainfall radar |
| News RSS feeds (40+ outlets) | Bandh / protest NLP classification |
| Twitter/X Filtered Stream | Real-time social disruption signals |
| Razorpay Payouts / Cashfree | UPI disbursement + NEFT fallback |
| Digilocker API | Aadhaar-based KYC |
| NPCI BBPS (future) | Premium auto-debit |
| Platform Partner APIs (Blinkit, Zepto) | Dark store assignment rate, rider shift data |

### Infrastructure

| Layer | Technology |
|---|---|
| Hosting | AWS (Mumbai region — ap-south-1) |
| Containerisation | Docker + ECS Fargate |
| CI/CD | GitHub Actions → ECR → ECS rolling deploy |
| Monitoring | Datadog (APM + log aggregation) |
| Secrets | AWS Secrets Manager |
| CDN | CloudFront |

---

## 7. Development Plan

### Phase 1 — MVP (Weeks 1–10)

**Goal:** One city (Bengaluru), one platform (Blinkit), top 5 auto-triggers only. 200 rider beta.

| Milestone | Week |
|---|---|
| Rider onboarding flow (KYC + bank verification) | W1–2 |
| Earnings baseline engine (rule-based, pre-ML) | W2–3 |
| IMD + CPCB API integrations + auto-trigger classifier | W3–4 |
| Dark store assignment rate integration (Blinkit API) | W4–5 |
| Claim processing engine + UPI payout flow | W5–6 |
| Rider app (React Native) — core screens | W5–7 |
| Fraud firewall — peer consensus + geofence checks | W7–8 |
| Beta onboarding — 200 riders, Bengaluru | W8–9 |
| Monitoring, error handling, payout reconciliation | W9–10 |

### Phase 2 — Expansion (Weeks 11–20)

**Goal:** 3 cities, all 3 platforms, semi-auto triggers, ML fraud model.

| Milestone | Week |
|---|---|
| NLP disruption classifier (news + Twitter) | W11–13 |
| Semi-auto trigger lane + one-tap rider flow | W12–14 |
| ML-based earnings baseline model | W13–15 |
| LightGBM fraud score (trained on Phase 1 data) | W14–16 |
| Manual claim lane (video upload + AI review) | W15–17 |
| Chennai + Hyderabad city onboarding | W16–18 |
| Zepto + Instamart platform integrations | W17–19 |
| Premium repricing engine (4-week recalibration) | W18–20 |

### Phase 3 — Scale & Compliance (Weeks 21–30)

**Goal:** IRDAI regulatory compliance, 5 cities, 10,000 riders, reinsurance integration.

| Milestone | Week |
|---|---|
| IRDAI Sandbox application + compliance audit | W21–24 |
| Reinsurance partner API integration | W23–26 |
| Delhi NCR + Mumbai onboarding | W24–27 |
| Full actuarial pricing model deployment | W25–28 |
| Native Android app (Play Store release) | W26–29 |
| Loss ratio reporting dashboard for reinsurance partners | W28–30 |

---

## 8. Risk, Compliance & Regulatory Notes

**IRDAI Classification:** SHIELD operates as a parametric insurance product. Under IRDAI's Regulatory Sandbox framework (Insurance Regulatory and Development Authority of India, 2019 Sandbox Regulations), parametric products targeting gig workers are explicitly listed as a priority innovation category. Phase 1 and 2 are operable under the Sandbox exemption; full IRDAI licence is required before Phase 3 scale.

**GST Treatment:** Payouts are classified as insurance claim settlements (not commercial income transfers). The payment API remarks field explicitly labels each transfer `INSURANCE_CLAIM_SETTLEMENT` to ensure correct tax treatment at the rider's bank and avoid TDS triggers at the 2% threshold.

**Data Privacy:** Rider GPS data is retained for 90 days for fraud audit purposes only, then anonymised. Location data is never sold or shared with delivery platforms. DPDP Act 2023 compliance is built into the data architecture from day one — explicit consent collected at onboarding for each data category.

**Reinsurance:** A minimum 40% of premium pool is ceded to a reinsurance partner (Munich Re or Swiss Re India, both active in Indian parametric space) from Phase 3 onwards, protecting the platform against correlated city-wide loss events (a cyclone causing 80% of Chennai riders to claim simultaneously).

**Rider Consent & Transparency:** Riders receive a plain-language, two-page policy document in their preferred language (English, Kannada, Tamil, Telugu, Hindi) at onboarding. The weekly premium, maximum weekly payout, and top 5 trigger events are displayed on the app home screen — always visible, never buried.

---

## 9. Adversarial Defense & Anti-Spoofing Strategy

> **Crisis context:** A coordinated syndicate of 500 riders in a Tier-1 city was found organizing via Telegram, using GPS-spoofing applications to fake location inside a red-alert weather zone while physically resting at home — draining a competitor platform's liquidity pool through mass false parametric payouts. Simple GPS verification is insufficient. This section documents SHIELD's architectural response.

---

### 9.1 — The Differentiation: Genuine Stranded Rider vs. Spoofed Location

GPS coordinates are a single data point. A spoofed GPS coordinate looks identical to a legitimate one at the coordinate level. The defense is never about verifying the coordinate itself — it is about verifying the **physical reality that should surround a legitimate coordinate**, across a minimum of six independent data dimensions simultaneously.

A real rider stranded in a flood zone produces a consistent fingerprint across all six. A spoofer sitting at home faking a location produces a coordinate that is *inconsistent* with at least three or four of them. The mismatch is the signal.

**The Six-Dimension Physical Reality Check:**

| Dimension | What a Genuine Stranded Rider Produces | What a Spoofer Produces |
|---|---|---|
| **GPS coordinate** | Matches disruption zone | Matches disruption zone (spoofed) |
| **Accelerometer / IMU sensor data** | Near-zero motion for prolonged period, consistent with stationary on a wet road or sheltering | At-home behavior: walking gait, couch micro-vibrations, or suspiciously perfect stillness (no real human is that still) |
| **Ambient audio fingerprint** | Background rainfall noise, traffic white noise, wind — captured passively by device mic (opt-in, privacy-gated) | Indoor ambient: fan hum, TV audio, domestic sounds, air conditioning frequency |
| **Network cell tower triangulation** | Device is connecting to the cell tower(s) geographically serving the claimed zone | Device connects to tower(s) serving the rider's home pin code — does not match the spoofed GPS zone |
| **Barometric pressure sensor** | Matches the atmospheric pressure reading from IMD for that zone at that timestamp | Matches the pressure at the rider's actual home location — a different reading if the zones are >2 km apart |
| **Nearby Bluetooth / WiFi environment** | Unknown access points and devices consistent with a street/road environment | Known home WiFi SSID, paired home Bluetooth devices (earbuds, speakers) visible in scan |

No single dimension is proof. All six together form a near-unforgeable physical fingerprint. The model computes a **Reality Coherence Score (RCS)** from 0–1 across these six dimensions. A genuine rider scores 0.80–1.0. A GPS spoofer — who has only manipulated the GPS layer — scores 0.2–0.45 because the other five dimensions expose the true location.

---

### 9.2 — The Data: Detecting a Coordinated Fraud Ring

Individual fraud is hard. Coordinated ring fraud at scale (500 riders, same Telegram group, same spoofing app) leaves a very different signature — and ironically, **the coordination itself becomes the most powerful detection signal.**

#### Signal Cluster A — Temporal Synchrony Anomaly

Legitimate disruptions cause organic, asynchronous claim submissions. Riders encounter a flood at different moments, tap confirm at different times, have varying GPS accuracy. A coordinated ring, working from a shared Telegram signal ("everyone spoof now"), produces a **submission spike with an unnaturally tight timestamp cluster** — dozens to hundreds of claims within a 90-second to 3-minute window.

The system monitors the **inter-arrival time distribution** of claims per zone per disruption event. Normal distributions are roughly Poisson. A ring attack produces a delta spike — statistically impossible under genuine organic behavior. Any zone showing >15 claims within a 120-second window is automatically flagged for ring-fraud analysis, regardless of individual claim legitimacy.

#### Signal Cluster B — Device Fingerprint Collusion Graph

Each rider's device has a stable fingerprint: IMEI, device model, Android version, installed app list hash, screen resolution, battery behavior signature. When onboarding, SHIELD records this fingerprint and monitors for:

- **Multiple accounts on the same physical device** (a single phone used to register two or more riders)
- **Device fingerprint clustering** — a set of 20 devices all running the same GPS spoofing application (detectable via installed app list hash at onboarding and periodic background check)
- **Shared network origin** — multiple riders whose claims originate from the same IP address or the same home WiFi router MAC address at claim submission time

A graph database (Neo4j) maps relationships between riders via shared device hardware, shared network nodes, and shared registration metadata. A connected component of >5 riders in this graph who simultaneously claim the same disruption event is a near-certain ring.

#### Signal Cluster C — Telegram / Social Coordination Intelligence

The exact attack vector used in the crisis — Telegram group coordination — is itself a detection surface. SHIELD's existing NLP classifier already monitors public Telegram channels for disruption signals. The same infrastructure is extended to monitor for **coordination language patterns**: phrases like "sab ek saath karein" (everyone do it together), spoofing app names, screenshots of fake GPS coordinates, or explicit payout strategy discussions. When a group is identified as coordinating fraud, all members' claims from that event window are immediately routed to the human review queue — regardless of their individual fraud score.

This is not a mass accusation — it is a routing decision. Legitimate riders who happen to be in the same group get reviewed faster, not penalized. The review clears them; the actual bad actors are caught.

#### Signal Cluster D — The Earnings Paradox

A spoofer claiming a flood payout while at home has, by definition, zero delivery earnings during the claimed disruption window. But a genuine rider stranded in a flood also has zero delivery earnings. These look identical.

The paradox breaks when you look at **the hours immediately before and after the claimed window:**

- A genuine stranded rider shows normal earning velocity right up to the moment the disruption began, then zero during it, then normal resumption after — consistent with a sudden environmental event.
- A ring-fraud rider shows a pattern of **recurring zero-earning windows** aligned suspiciously well with disruption events across multiple weeks, with earnings velocity that doesn't match their claimed shift commitment.

The model tracks **Claim-to-Shift Ratio**: the fraction of a rider's claimed shift hours that have resulted in compensation claims over a rolling 90-day window. Legitimate riders average 4–8% of shift hours claimed. Riders above 25% are auto-flagged.

---

### 9.3 — The UX Balance: Flagged Claims Without Penalizing Honest Riders

This is the most important design constraint. Heavy rain degrades GPS accuracy. Cell towers get congested during floods — the one signal that could prove a rider's location may be exactly the signal most degraded by the genuine disruption they're experiencing. A fraud defense that punishes riders for having bad signal in a storm is worse than no defense at all.

**The core principle: flagging is a routing decision, not a punishment decision.**

A flagged claim does not mean the claim is denied. It means the claim is moved from the auto-pay lane to the expedited human review lane. The rider's payout is held — not cancelled — and they receive an honest notification:

> *"Your claim is being reviewed. This usually takes under 2 hours. We'll notify you the moment it's resolved. You can continue working — your earnings are tracked."*

**Three specific protections for honest riders in bad signal conditions:**

**Protection 1 — The Network Degradation Allowance.**
During an active Tier 1 auto-trigger event (confirmed IMD rainfall >15mm/hr, or confirmed bandh), SHIELD temporarily **lowers the Reality Coherence Score threshold** required for auto-approval from 0.80 to 0.60. The rationale: if the IMD has already confirmed a severe weather event in this zone, an honest rider's degraded sensor data is expected. The environmental trigger itself does the heavy lifting; the device sensors are corroborating evidence, not gatekeeping evidence.

**Protection 2 — The Peer Anchor Override.**
If ≥ 10 riders in a 500m radius all pass the Reality Coherence Score check and are confirmed legitimate, then any rider in that same radius who scores between 0.45 and 0.60 (borderline — possibly degraded signal, possibly spoofed) is **automatically approved** rather than flagged. The reasoning: if 10 genuine riders are confirmed in the zone, the 11th with marginal sensor data is almost certainly also genuine. A spoofer cannot manufacture 10 legitimate co-claimants as cover.

**Protection 3 — The 2-Hour Paid-Forward Guarantee.**
For any claim that enters the human review queue — whether flagged for potential fraud or simply for manual verification — SHIELD processes a **provisional partial payout** of 50% of the calculated claim amount within 15 minutes of the flag. If the claim is approved in full after review, the remaining 50% is paid immediately. If the claim is rejected, the provisional 50% is recovered from the rider's next premium deduction — not debited from their bank account, never a shock withdrawal.

This means an honest rider who is flagged because their phone had bad GPS in a storm never goes home empty-handed while waiting for review. They receive half their claim within 15 minutes. The review resolves within 2 hours. The system is never weaponized against the people it exists to protect.

**The fraud defense hierarchy in plain language:**

```
Claim submitted
    │
    ├── Reality Coherence Score ≥ 0.80 AND no ring signals → AUTO-APPROVE, pay in full
    │
    ├── RCS 0.60–0.79 OR soft ring signal → EXPEDITED REVIEW
    │       └── Provisional 50% payout issued immediately
    │       └── Human reviewer + AI assessment within 2 hours
    │       └── Full approval → remaining 50% paid instantly
    │       └── Rejection → 50% recovered via next premium deduction
    │
    ├── RCS < 0.60 AND hard ring signal (timestamp cluster, device graph, Telegram) → HOLD
    │       └── No provisional payout
    │       └── Rider notified with explanation
    │       └── 24-hour investigation window
    │       └── Right to appeal with supporting evidence
    │
    └── RCS < 0.40 AND ≥ 3 hard ring signals → AUTO-REJECT
            └── Rider notified
            └── Formal appeal process available
            └── Repeat pattern → account suspension review
```

**What SHIELD will never do:**
- Deny a claim solely on the basis of GPS data without corroborating signals
- Debit a rider's bank account to recover a provisional payout
- Permanently suspend a rider without a human review and a right to appeal
- Use fraud flags as a reason to delay payouts beyond 2 hours without notifying the rider

The fraud defense exists to protect the liquidity pool that pays all legitimate claims. An underfunded pool means genuine riders don't get paid. Protecting against rings is, ultimately, protecting honest riders from the consequences of other people's fraud.

---

*Section added in response to DEVTrails 2026 Phase 1 adversarial threat report. Architecture hardened against GPS-spoofing syndicates operating via coordinated Telegram groups.*

---

## Contributing

This repository contains the core SHIELD product specification, algorithm design, and development roadmap. For technical contribution guidelines, see `CONTRIBUTING.md`.

For partnership inquiries (delivery platform API integration, reinsurance), contact: `partnerships@shieldgig.in`

---

*SHIELD is being built for India's 12 million+ Q-commerce and food delivery riders — the people who absorb the last-mile risk so that a city can have groceries in 10 minutes.*
