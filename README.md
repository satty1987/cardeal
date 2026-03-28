# 🚗 AutoDeal IQ — Car Lease & Finance Analyzer

A single-file, zero-dependency web app that helps you instantly evaluate whether a car lease or finance deal is worth taking — or a rip-off to walk away from.

---

## 📋 Overview

AutoDeal IQ takes the numbers from a dealer's offer and runs them through a scoring engine to produce a **0–100 deal score**, flag problems, and give you actionable negotiation tips. It covers two deal types via tabbed panels:

- **🔄 Lease Analyzer** — evaluates money factor, residual value, cap cost discount, and payment accuracy
- **💳 Finance Analyzer** — evaluates APR vs your credit tier benchmark, purchase discount, loan term risk, and total interest

---

## 🚀 Getting Started

No installation, no build step, no dependencies.

1. Download `car-deal-analyzer.html`
2. Open it in any modern web browser (Chrome, Firefox, Safari, Edge)
3. Enter your deal numbers and click **Analyze**

> Requires an internet connection only to load Google Fonts (Bebas Neue, DM Sans, DM Mono). All calculations run locally in your browser — no data is sent anywhere.

---

## 🔄 Lease Analyzer — Inputs

| Field | Description |
|---|---|
| **MSRP** | The sticker price / manufacturer's suggested retail price |
| **Negotiated Selling Price** | The price you've agreed on (cap cost before reductions) |
| **Residual Value ($)** | The car's estimated value at lease end (from the dealer) |
| **Money Factor** | The lease finance rate (e.g. `0.00125`). Multiply × 2400 to get APR equivalent |
| **Lease Term** | Length of the lease: 24, 36, 39, or 48 months |
| **Annual Mileage Allowance** | Miles per year included in the lease (10k–18k) |
| **Down Payment** | Cap cost reduction / drive-off cash paid upfront |
| **Monthly Payment** | The quoted monthly amount from the dealer |
| **Acquisition Fee** | Lender/bank fee built into the lease (typically $595–$995) |
| **Sales Tax Rate** | Your state/local tax rate applied to the monthly payment |

### How the Lease Score is Calculated

The score is built from five components (max 100 points):

| Component | Max Points | What's Measured |
|---|---|---|
| Selling Price Discount | 25 | % off MSRP (target: 3–8%) |
| Money Factor (APR) | 25 | Equivalent APR vs ~4% benchmark |
| Residual Value | 25 | % of MSRP retained vs term benchmark |
| Down Payment Risk | 15 | Lower upfront = safer on a lease |
| Payment Accuracy | 10 | Quoted vs calculated payment match |

### Lease Benchmarks Used

| Term | Target Residual |
|---|---|
| 24 months | ≥ 60% of MSRP |
| 36 months | ≥ 52% of MSRP |
| 48 months | ≥ 42% of MSRP |

### Lease Core Formulas

```
Adjusted Cap Cost    = Selling Price − Down Payment + Acquisition Fee
Depreciation/mo      = (Adjusted Cap Cost − Residual) ÷ Term
Finance Charge/mo    = (Adjusted Cap Cost + Residual) × Money Factor
Base Payment         = Depreciation + Finance Charge
Monthly Payment      = Base Payment × (1 + Tax Rate)
Equivalent APR       = Money Factor × 2400
```

---

## 💳 Finance Analyzer — Inputs

| Field | Description |
|---|---|
| **Vehicle Price (MSRP)** | The sticker price |
| **Negotiated Purchase Price** | The agreed sale price before tax and fees |
| **Down Payment** | Cash paid upfront toward the purchase |
| **Trade-In Value** | Value of any vehicle you're trading in |
| **Annual Interest Rate (APR)** | The loan's annual percentage rate |
| **Loan Term** | Length of the loan: 24, 36, 48, 60, 72, or 84 months |
| **Monthly Payment** | The quoted monthly payment from the dealer/lender |
| **Dealer Fees & Add-ons** | Doc fees, extended warranty, paint protection, etc. |
| **Sales Tax Rate** | Applied to the purchase price |
| **Credit Score** | Approximate tier used to benchmark your APR |

### How the Finance Score is Calculated

| Component | Max Points | What's Measured |
|---|---|---|
| Purchase Price Discount | 25 | % off MSRP (target: 3–8%) |
| APR vs Credit Benchmark | 30 | Your rate vs expected for your credit tier |
| Loan Term Risk | 20 | Shorter terms score higher |
| Down Payment Adequacy | 15 | 10–20% ideal |
| Payment Accuracy | 10 | Quoted vs calculated payment match |

### APR Benchmarks by Credit Tier

| Credit Tier | Score Range | Benchmark APR |
|---|---|---|
| Excellent | 750+ | ~5% |
| Good | 700–749 | ~7% |
| Fair | 650–699 | ~10% |
| Poor | < 650 | ~14% |

### Loan Term Risk Scale

| Term | Risk Score |
|---|---|
| 24 months | ✅ 20/20 — Lowest risk |
| 36 months | ✅ 18/20 |
| 48 months | ✅ 15/20 |
| 60 months | ⚠️ 11/20 — Common but costly |
| 72 months | 🚨 6/20 — High risk |
| 84 months | 🚨 2/20 — Avoid |

### Finance Core Formulas

```
Loan Amount     = Purchase Price + Tax + Fees − Down Payment − Trade-In
Monthly Rate    = APR ÷ 12 ÷ 100
Monthly Payment = Loan × (r × (1+r)^n) ÷ ((1+r)^n − 1)
Total Interest  = (Calc. Payment × Term) − Loan Amount
Total All-In    = (Monthly Payment × Term) + Down Payment + Trade-In
```

---

## 📊 Results Output

Both analyzers produce the same four output sections:

### 1. Verdict Banner
A color-coded summary banner:

| Score | Rating | Color |
|---|---|---|
| 70–100 | 🏆 Great Deal! | Green |
| 45–69 | 🤔 Decent — Room to Improve | Orange |
| 0–44 | 🚨 Avoid This Deal | Red |

### 2. Deal Score Ring
An animated circular progress ring showing the total score out of 100, with a color that matches the verdict.

### 3. Key Metrics Tiles
Six data tiles showing the most important calculated numbers at a glance (APR, discount, total interest, loan/cap cost, etc.).

### 4. Breakdown & Tips
Color-coded actionable tips (green / orange / red) covering:
- Whether your negotiated discount is strong enough
- Whether the APR/money factor is competitive
- Loan term or residual value risks
- Down payment strategy
- Payment math cross-check to detect dealer errors or hidden add-ons

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, animations) |
| Logic | Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts — Bebas Neue, DM Sans, DM Mono |
| Dependencies | None |

---

## 💡 Key Tips the App Will Tell You

**Lease-specific:**
- Putting money down on a lease is risky — if the car is totaled or stolen, you lose the down payment
- Always verify the money factor isn't marked up by the dealer (check manufacturer lease support sites)
- High residual = lower monthly payment (the car holds more value)

**Finance-specific:**
- Get pre-approved by a credit union or bank before visiting the dealer — it's negotiating leverage
- Avoid 72/84-month loans even if the monthly payment looks attractive; total interest balloons
- Dealer fees over ~3% of the purchase price often contain negotiable add-ons

---

## 📁 File Structure

```
car-deal-analyzer.html   ← Entire app (single file, ~400 lines)
README.md                ← This file
```

---

## 📄 License

MIT — free to use, modify, and distribute.