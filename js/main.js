
const $ = id => document.getElementById(id);
const fmtD = n => '$' + Math.round(n).toLocaleString();
const fmtP = n => n.toFixed(2) + '%';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const scoreColor = s => s >= 70 ? '#4ae8a0' : s >= 45 ? '#e8944a' : '#e84a4a';

function switchTab(tab) {
  ['lease','finance'].forEach(t => {
    $('panel-' + t).classList.toggle('active', t === tab);
    document.querySelectorAll('.tab-btn').forEach((b,i) => {
      b.classList.toggle('active', (i===0 && tab==='lease') || (i===1 && tab==='finance'));
    });
  });
}

function setScoreRing(ringId, numId, score) {
  const circ = 326.7;
  const fill = circ - (score / 100) * circ;
  const ring = $(ringId);
  const num  = $(numId);
  ring.style.stroke = scoreColor(score);
  setTimeout(() => { ring.style.strokeDashoffset = fill; }, 50);
  num.textContent = score;
  num.style.color = scoreColor(score);
}

function renderBreakdown(containerId, rows) {
  $(containerId).innerHTML = rows.map(r => `
    <div class="score-row">
      <span class="metric">${r.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:0%;background:${scoreColor(r.score)}" data-pct="${r.score}"></div></div>
      <span class="val" style="color:${scoreColor(r.score)}">${r.score}</span>
    </div>`).join('');
  setTimeout(() => {
    $(containerId).querySelectorAll('.bar-fill').forEach(b => {
      b.style.width = b.dataset.pct + '%';
    });
  }, 100);
}

function renderMetrics(containerId, tiles) {
  $(containerId).innerHTML = tiles.map(t => `
    <div class="metric-tile">
      <div class="mt-label">${t.label}</div>
      <div class="mt-value" style="${t.color ? 'color:'+t.color : ''}">${t.value}</div>
      <div class="mt-note">${t.note || ''}</div>
    </div>`).join('');
}

function renderTips(containerId, tips) {
  $(containerId).innerHTML = tips.map(t => `
    <div class="tip-item ${t.type}">
      <span class="tip-icon">${t.icon}</span>
      <span>${t.text}</span>
    </div>`).join('');
}

function renderVerdict(id, score, summary) {
  const cls = score >= 70 ? 'great' : score >= 45 ? 'ok' : 'bad';
  const emoji = score >= 70 ? '🏆' : score >= 45 ? '🤔' : '🚨';
  const headline = score >= 70 ? 'Great Deal!' : score >= 45 ? 'Decent — Room to Improve' : 'Avoid This Deal';
  $(id).className = 'verdict-banner ' + cls;
  $(id).innerHTML = `
    <div class="verdict-emoji">${emoji}</div>
    <div class="verdict-text">
      <h2>${headline}</h2>
      <p>${summary}</p>
    </div>`;
}

// ─── LEASE ANALYZER ─────────────────────────────────────────────────────────
function analyzeLease() {
  const msrp     = +$('l-msrp').value    || 0;
  const selling  = +$('l-selling').value  || 0;
  const residual = +$('l-residual').value || 0;
  const mf       = +$('l-mf').value       || 0;
  const term     = +$('l-term').value;
  const miles    = +$('l-miles').value;
  const down     = +$('l-down').value     || 0;
  const payment  = +$('l-payment').value  || 0;
  const acqfee   = +$('l-acqfee').value   || 795;
  const taxRate  = +$('l-tax').value      || 0;

  if (!msrp || !selling || !residual || !mf || !payment) {
    alert('Please fill in all required fields (MSRP, Selling Price, Residual, Money Factor, Monthly Payment).');
    return;
  }

  // ── Core Calculations ──
  const adjCapCost   = selling - down + acqfee;
  const depreciation = (adjCapCost - residual) / term;
  const financeCharge = (adjCapCost + residual) * mf;
  const basePayment  = depreciation + financeCharge;
  const taxOnPayment = basePayment * (taxRate / 100);
  const calcPayment  = basePayment + taxOnPayment;

  const equivalentAPR = mf * 2400;
  const residualPct   = (residual / msrp) * 100;
  const sellingDiscount = ((msrp - selling) / msrp) * 100;
  const totalCost     = payment * term + down;
  const costPerMile   = totalCost / (miles * (term / 12));
  const paymentAccuracy = Math.abs(calcPayment - payment) / payment * 100; // % difference

  // ── Scoring ──
  // 1. Selling price discount (0-25): >5% = great
  const discountScore = clamp(Math.round((sellingDiscount / 8) * 25), 0, 25);

  // 2. Money factor vs benchmark (0-25): benchmark ~0.00165 (=4% APR)
  const aprScore = clamp(Math.round(((0.004 - mf) / 0.003) * 25), 0, 25);

  // 3. Residual value (0-25): >50% for 36mo = good
  const benchRes = term === 24 ? 60 : term === 36 ? 52 : term === 48 ? 42 : 38;
  const residualScore = clamp(Math.round(((residualPct - (benchRes - 10)) / 12) * 25), 0, 25);

  // 4. Down payment risk (0-15): lower is better on a lease
  const downPct  = (down / msrp) * 100;
  const downScore = clamp(Math.round(((5 - downPct) / 5) * 15), 0, 15);

  // 5. Payment accuracy (0-10)
  const accScore = clamp(Math.round((1 - paymentAccuracy / 20) * 10), 0, 10);

  const totalScore = discountScore + aprScore + residualScore + downScore + accScore;

  // ── Tips ──
  const tips = [];
  if (sellingDiscount >= 5) tips.push({ type: 'good', icon: '✅', text: `<strong>Solid negotiation:</strong> You got ${fmtP(sellingDiscount)} off MSRP. Aim for 3–8% off for most vehicles.` });
  else if (sellingDiscount < 1) tips.push({ type: 'bad', icon: '🚨', text: `<strong>No discount on cap cost!</strong> You're paying near MSRP. Even 3–5% off saves ${fmtD((msrp * 0.04) / term)}/mo.` });
  else tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Discount is thin</strong> at ${fmtP(sellingDiscount)} off MSRP. Try to negotiate closer to 5%+.` });

  if (equivalentAPR <= 4) tips.push({ type: 'good', icon: '✅', text: `<strong>Low money factor:</strong> ${mf} = ${fmtP(equivalentAPR)} APR equivalent. That's competitive financing.` });
  else if (equivalentAPR <= 7) tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Average money factor:</strong> ${mf} = ${fmtP(equivalentAPR)} APR. Check if manufacturer has lower MF programs.` });
  else tips.push({ type: 'bad', icon: '🚨', text: `<strong>High money factor!</strong> ${mf} = ${fmtP(equivalentAPR)} APR equivalent. The finance cost is inflating your payment.` });

  if (residualPct >= benchRes) tips.push({ type: 'good', icon: '✅', text: `<strong>Strong residual:</strong> ${fmtP(residualPct)} of MSRP retained. High residual = lower depreciation cost per month.` });
  else tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Below-average residual:</strong> ${fmtP(residualPct)} vs ~${benchRes}% benchmark for ${term}-month leases. You're depreciating more value.` });

  if (down > msrp * 0.05) tips.push({ type: 'bad', icon: '🚨', text: `<strong>Large cap cost reduction risk:</strong> ${fmtD(down)} upfront. If totaled, you lose this money. Minimize lease down payments.` });
  else if (down === 0) tips.push({ type: 'good', icon: '✅', text: `<strong>Zero drive-off is ideal:</strong> No cap cost reduction means no money lost if the car is totaled or stolen.` });

  if (paymentAccuracy > 10) tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Payment discrepancy detected:</strong> Calculated payment is ${fmtD(calcPayment)} vs quoted ${fmtD(payment)}. Ask dealer for a full payment breakdown.` });
  else tips.push({ type: 'good', icon: '✅', text: `<strong>Payment math checks out:</strong> Quoted payment is consistent with the deal terms provided.` });

  tips.push({ type: down > 0 ? 'warn' : 'good', icon: '💡', text: `<strong>Total cost over term:</strong> You'll pay ${fmtD(totalCost)} (including down). That's ${fmtD(costPerMile)}/mile based on ${(miles/1000).toFixed(0)}k annual miles.` });

  // ── Render ──
  const summary = `Score: ${totalScore}/100 — APR equivalent: ${fmtP(equivalentAPR)} · Residual: ${fmtP(residualPct)} · Discount: ${fmtP(sellingDiscount)}`;
  renderVerdict('lease-verdict', totalScore, summary);
  setScoreRing('l-score-ring', 'l-score-num', totalScore);
  renderBreakdown('l-score-breakdown', [
    { label: 'Selling Price Discount', score: discountScore * 4 },
    { label: 'Money Factor (APR)',      score: aprScore * 4 },
    { label: 'Residual Value',          score: residualScore * 4 },
    { label: 'Down Payment Risk',       score: downScore * (100/15) | 0 },
    { label: 'Payment Accuracy',        score: accScore * 10 },
  ]);
  renderMetrics('l-metrics', [
    { label: 'Equiv. APR',     value: fmtP(equivalentAPR), color: scoreColor(aprScore * 4),     note: 'Money factor × 2400' },
    { label: 'Residual %',     value: fmtP(residualPct),   color: scoreColor(residualScore * 4), note: `${fmtD(residual)} of MSRP` },
    { label: 'Cap Cost Discount', value: fmtP(sellingDiscount), color: scoreColor(discountScore * 4), note: `Saved ${fmtD(msrp - selling)}` },
    { label: 'Base Payment',   value: fmtD(basePayment),   color: null, note: 'Before tax' },
    { label: 'Finance Charge', value: fmtD(financeCharge * term), color: null, note: `${fmtD(financeCharge)}/mo` },
    { label: 'Total Lease Cost', value: fmtD(totalCost),  color: null, note: `${term} mo + ${fmtD(down)} down` },
  ]);
  renderTips('l-tips', tips);

  $('lease-result').classList.add('show');
  $('lease-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── FINANCE ANALYZER ───────────────────────────────────────────────────────
function analyzeFinance() {
  const msrp    = +$('f-msrp').value    || 0;
  const price   = +$('f-price').value   || 0;
  const down    = +$('f-down').value    || 0;
  const tradein = +$('f-tradein').value || 0;
  const apr     = +$('f-apr').value     || 0;
  const term    = +$('f-term').value;
  const payment = +$('f-payment').value || 0;
  const fees    = +$('f-fees').value    || 0;
  const taxRate = +$('f-tax').value     || 0;
  const credit  = $('f-credit').value;

  if (!msrp || !price || !apr || !payment) {
    alert('Please fill in MSRP, Purchase Price, APR, and Monthly Payment.');
    return;
  }

  // ── Calculations ──
  const taxAmount   = price * (taxRate / 100);
  const totalPrice  = price + taxAmount + fees;
  const loanAmount  = totalPrice - down - tradein;
  const monthlyRate = (apr / 100) / 12;
  const calcPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) /
                      (Math.pow(1 + monthlyRate, term) - 1);
  const totalPaid   = payment * term + down + tradein;
  const totalInterest = calcPayment * term - loanAmount;
  const priceDiscount = ((msrp - price) / msrp) * 100;
  const paymentAccuracy = Math.abs(calcPayment - payment) / payment * 100;
  const downPct     = (down / price) * 100;

  // Benchmark APR by credit
  const benchAPR = { excellent: 5, good: 7, fair: 10, poor: 14 }[credit];

  // ── Scoring ──
  // 1. Price discount (0-25)
  const discountScore = clamp(Math.round((priceDiscount / 8) * 25), 0, 25);

  // 2. APR vs benchmark (0-30)
  const aprDiff = benchAPR - apr;
  const aprScore = clamp(Math.round(((aprDiff + 3) / 8) * 30), 0, 30);

  // 3. Loan term risk (0-20): shorter = better
  const termBenchmark = { 24: 20, 36: 18, 48: 15, 60: 11, 72: 6, 84: 2 }[term] || 10;
  const termScore = termBenchmark;

  // 4. Down payment adequacy (0-15): 10-20% ideal
  const downScore = downPct >= 20 ? 15 : downPct >= 10 ? 12 : downPct >= 5 ? 7 : 3;

  // 5. Payment accuracy (0-10)
  const accScore = clamp(Math.round((1 - paymentAccuracy / 20) * 10), 0, 10);

  const totalScore = discountScore + aprScore + termScore + downScore + accScore;

  // ── Tips ──
  const tips = [];
  if (priceDiscount >= 5) tips.push({ type: 'good', icon: '✅', text: `<strong>Strong purchase discount:</strong> ${fmtP(priceDiscount)} off MSRP saves you ${fmtD(msrp - price)} before financing costs.` });
  else if (priceDiscount < 1) tips.push({ type: 'bad', icon: '🚨', text: `<strong>Paying near MSRP!</strong> Most cars sell for 2–8% off sticker. Negotiate before discussing financing.` });
  else tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Modest discount:</strong> ${fmtP(priceDiscount)} off MSRP. Room to push for 5%+ depending on vehicle and market.` });

  if (apr <= benchAPR - 1) tips.push({ type: 'good', icon: '✅', text: `<strong>Below-market APR:</strong> ${fmtP(apr)} is better than the ~${fmtP(benchAPR)} average for your credit tier. Great rate!` });
  else if (apr <= benchAPR + 2) tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Average APR:</strong> ${fmtP(apr)} vs ~${fmtP(benchAPR)} benchmark. Shop credit unions — they often beat dealer rates by 1–2%.` });
  else tips.push({ type: 'bad', icon: '🚨', text: `<strong>High APR!</strong> ${fmtP(apr)} is above expected for your credit. Get pre-approved elsewhere before returning to the dealer.` });

  if (term <= 48) tips.push({ type: 'good', icon: '✅', text: `<strong>Responsible loan term:</strong> ${term} months limits total interest and keeps you equity-positive sooner.` });
  else if (term === 60) tips.push({ type: 'warn', icon: '⚠️', text: `<strong>60-month term:</strong> Common but means more interest paid. You'll pay ${fmtD(totalInterest)} in interest over the loan.` });
  else tips.push({ type: 'bad', icon: '🚨', text: `<strong>${term}-month loan is risky:</strong> Extended terms maximize interest paid (${fmtD(totalInterest)}) and leave you underwater longer. Consider a shorter term or cheaper vehicle.` });

  if (downPct >= 15) tips.push({ type: 'good', icon: '✅', text: `<strong>Healthy down payment:</strong> ${fmtP(downPct)} down reduces loan amount and protects against early depreciation.` });
  else if (downPct < 5) tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Low down payment:</strong> Under 5% means you'll likely be underwater (owe more than value) for the first 1–2 years. Consider gap insurance.` });

  if (fees > price * 0.03) tips.push({ type: 'bad', icon: '🚨', text: `<strong>High dealer fees:</strong> ${fmtD(fees)} in fees is above average. Review for add-ons like paint protection, extended warranty, or window tinting — many are negotiable.` });
  else if (fees > 0) tips.push({ type: 'good', icon: '✅', text: `<strong>Reasonable dealer fees:</strong> ${fmtD(fees)} is within normal range for doc/title fees.` });

  if (paymentAccuracy > 10) tips.push({ type: 'warn', icon: '⚠️', text: `<strong>Payment discrepancy:</strong> Calculated ${fmtD(calcPayment)} vs quoted ${fmtD(payment)}. Verify the full amortization schedule from the dealer.` });
  else tips.push({ type: 'good', icon: '✅', text: `<strong>Payment math checks out:</strong> Quoted payment aligns with the provided terms.` });

  tips.push({ type: 'good', icon: '💡', text: `<strong>Total cost of ownership:</strong> You'll pay ${fmtD(totalPaid)} all-in, including ${fmtD(totalInterest)} in interest. The vehicle costs ${fmtD(totalPaid - totalInterest)} in principal.` });

  // ── Render ──
  const summary = `Score: ${totalScore}/100 — APR: ${fmtP(apr)} · Discount: ${fmtP(priceDiscount)} · Total interest: ${fmtD(totalInterest)}`;
  renderVerdict('finance-verdict', totalScore, summary);
  setScoreRing('f-score-ring', 'f-score-num', totalScore);
  renderBreakdown('f-score-breakdown', [
    { label: 'Purchase Discount',    score: discountScore * 4 },
    { label: 'APR vs Benchmark',     score: aprScore * (100/30) | 0 },
    { label: 'Loan Term Risk',       score: termScore * 5 },
    { label: 'Down Payment',         score: downScore * (100/15) | 0 },
    { label: 'Payment Accuracy',     score: accScore * 10 },
  ]);
  renderMetrics('f-metrics', [
    { label: 'APR',            value: fmtP(apr),            color: scoreColor(aprScore * (100/30)|0), note: `Bench: ~${fmtP(benchAPR)} (${credit})` },
    { label: 'Price Discount', value: fmtP(priceDiscount),  color: scoreColor(discountScore * 4), note: `Saved ${fmtD(msrp - price)}` },
    { label: 'Loan Amount',    value: fmtD(loanAmount),     color: null, note: 'After down + trade-in' },
    { label: 'Total Interest', value: fmtD(totalInterest),  color: totalInterest > price * 0.15 ? '#e84a4a' : '#4ae8a0', note: `Over ${term} months` },
    { label: 'Calc. Payment',  value: fmtD(calcPayment),    color: null, note: 'Principal + interest' },
    { label: 'Total All-In',   value: fmtD(totalPaid),      color: null, note: 'Full cost of deal' },
  ]);
  renderTips('f-tips', tips);

  $('finance-result').classList.add('show');
  $('finance-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}