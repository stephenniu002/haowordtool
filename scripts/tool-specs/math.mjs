/**
 * 计算类。绝大多数是「几个数字进，几个数字出」，
 * 判断标准只有一条：算出来的数必须能对得上手算，所以每个都带一个小例子。
 */

export default [
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    title: 'Percentage Calculator — Percent Of, Increase and Decrease',
    desc: 'Work out a percentage of a number, what percent one number is of another, and percentage increase or decrease. Three calculations in one.',
    cat: 'math',
    catName: 'Math',
    lead: 'Three separate questions, one page: X% of Y, X is what percent of Y, and the change from X to Y.',
    fields: [
      { k: 'a', label: 'Value A', type: 'num', val: 25 },
      { k: 'b', label: 'Value B', type: 'num', val: 200 },
    ],
    outs: [
      { k: 'of', label: 'A% of B', type: 'big' },
      { k: 'is', label: 'A is what % of B', type: 'big' },
      { k: 'change', label: 'Change from A to B', type: 'big' },
    ],
    compute: (v) => {
      const a = Number(v.a);
      const b = Number(v.b);
      const f = (x) => (Math.abs(x) >= 1000 ? x.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(Math.round(x * 10000) / 10000));
      return {
        of: isFinite(a * b) ? f((a / 100) * b) : '—',
        is: isFinite(a) && b !== 0 ? f((a / b) * 100) + '%' : '—',
        change: isFinite(a) && a !== 0 ? f(((b - a) / Math.abs(a)) * 100) + '%' : '—',
      };
    },
    example:
      'With A = 25 and B = 200: 25% of 200 is 50, 25 is 12.5% of 200, and going from 25 to 200 is a 700% increase.',
    body: [
      'Percentage questions come in three shapes and people routinely apply the wrong one. "25% of 200" is a multiplication. "25 is what percent of 200" is a division. "From 25 to 200" is a change relative to the starting value — and the last one is where sign errors happen.',
      '## The change formula',
      'The change is <code>(new − old) / |old|</code>. Dividing by the absolute value keeps the sign meaningful when the starting point is negative: going from −50 to −25 is an increase, even though the number got closer to zero.',
    ],
    faq: [
      ['Why is a 50% drop not undone by a 50% rise?', 'Because the percentages are taken from different bases. 100 → 50 is −50%; 50 → 100 is +100%. This asymmetry is the single most common source of pricing and margin errors.'],
    ],
  },
  {
    slug: 'percentage-change',
    name: 'Percentage Change Calculator',
    title: 'Percentage Change Calculator — Increase and Decrease',
    desc: 'Calculate percentage increase or decrease between two values, with the absolute difference and the ratio. Handles negative starting values.',
    cat: 'math',
    catName: 'Math',
    lead: 'Old value to new value, with the absolute difference shown alongside so the direction is never ambiguous.',
    fields: [
      { k: 'old', label: 'Old value', type: 'num', val: 80 },
      { k: 'new', label: 'New value', type: 'num', val: 100 },
    ],
    outs: [
      { k: 'pct', label: 'Change', type: 'big' },
      { k: 'abs', label: 'Absolute difference', type: 'big' },
      { k: 'kind', label: 'Direction', type: 'big' },
    ],
    compute: (v) => {
      const o = Number(v.old);
      const n = Number(v.new);
      if (!isFinite(o) || !isFinite(n) || o === 0) return { pct: '—', abs: '—', kind: 'Old value must be non-zero' };
      const diff = n - o;
      const pct = (diff / Math.abs(o)) * 100;
      const r = Math.round(pct * 100) / 100;
      return {
        pct: `${r > 0 ? '+' : ''}${r}%`,
        abs: `${diff > 0 ? '+' : ''}${Math.round(diff * 100) / 100}`,
        kind: diff === 0 ? 'No change' : diff > 0 ? 'Increase' : 'Decrease',
      };
    },
    example:
      'From 80 to 100 is +25%, not +20%. The base is the old value, so a 20-point rise on a base of 80 is a quarter of the starting figure.',
    body: [
      'Percentage change is always relative to the starting value, and that base is what people get wrong. A rise from 80 to 100 is 25%; a fall from 100 to 80 is 20%. Same 20 points, different percentages, because the denominators differ.',
      '## Negative starting values',
      'When the old value is negative, dividing by it flips the sign and produces nonsense — a company going from −£10m to −£5m is improving, but the raw formula reports −50%. This calculator divides by the absolute value so the direction stays correct.',
    ],
    faq: [
      ['What does a 100% increase mean?', 'The value doubled. 200% means it tripled. Above 100% is normal for growth; people often misread it as a cap.'],
    ],
  },
  {
    slug: 'tip-calculator',
    name: 'Tip Calculator',
    title: 'Tip Calculator — Split a Bill with Tip',
    desc: 'Calculate the tip and split the total between any number of people. Choose a percentage or enter a custom amount, with rounding options.',
    cat: 'math',
    catName: 'Math',
    lead: 'Bill, tip percentage, number of people. Rounds up to a whole currency unit if you want the numbers to be readable.',
    fields: [
      { k: 'bill', label: 'Bill amount', type: 'num', val: 84.5 },
      { k: 'pct', label: 'Tip %', type: 'num', val: 18 },
      { k: 'people', label: 'Split between', type: 'num', val: 3, min: 1, step: 1 },
      { k: 'round', label: 'Round each share up to a whole unit', type: 'chk', val: false },
    ],
    outs: [
      { k: 'tip', label: 'Tip', type: 'big' },
      { k: 'total', label: 'Total', type: 'big' },
      { k: 'each', label: 'Each person pays', type: 'big' },
    ],
    compute: (v) => {
      const bill = Number(v.bill);
      const pct = Number(v.pct);
      const n = Math.max(1, Math.floor(Number(v.people) || 1));
      if (!isFinite(bill) || !isFinite(pct)) return { tip: '—', total: '—', each: '—' };
      const tip = (bill * pct) / 100;
      const total = bill + tip;
      let each = total / n;
      if (v.round) each = Math.ceil(each);
      const m = (x) => x.toFixed(2);
      return { tip: m(tip), total: m(total), each: m(each) };
    },
    example:
      'An 84.50 bill at 18% adds 15.21, for 99.71 total. Split three ways that is 33.24 each — or 34.00 with rounding up.',
    body: [
      'The arithmetic is trivial; the useful part is seeing the per-person figure before the card arrives. Splitting an uneven total after the fact is where the argument starts.',
      '## On rounding',
      'Rounding each share up means the group overpays slightly, by at most one currency unit per person. Rounding the total instead and dividing produces shares with fractions of a cent, which nobody can pay.',
    ],
    faq: [
      ['Should the tip be calculated before or after tax?', 'On the pre-tax amount is the common convention in the US, and it is what most tip calculators assume. On the total is also accepted; either way, be consistent within a group.'],
    ],
  },
  {
    slug: 'discount-calculator',
    name: 'Discount Calculator',
    title: 'Discount Calculator — Sale Price and Savings',
    desc: 'Work out the sale price after a percentage discount, or find the original price from a discounted one. Shows the amount saved.',
    cat: 'math',
    catName: 'Math',
    lead: 'Price and discount in, final price and savings out. Or run it backwards to recover the original price.',
    fields: [
      { k: 'mode', label: 'Mode', type: 'sel', val: 'fwd', opts: [['fwd', 'Price + discount → final'], ['back', 'Final price + discount → original']] },
      { k: 'price', label: 'Price', type: 'num', val: 120 },
      { k: 'pct', label: 'Discount %', type: 'num', val: 30 },
      { k: 'stack', label: 'Second discount % (stacked)', type: 'num', val: 0 },
    ],
    outs: [
      { k: 'final', label: 'Final price', type: 'big' },
      { k: 'saved', label: 'You save', type: 'big' },
      { k: 'effective', label: 'Effective discount', type: 'big' },
    ],
    compute: (v) => {
      const p = Number(v.price);
      const d = Number(v.pct) / 100;
      const d2 = Number(v.stack) / 100;
      if (!isFinite(p) || !isFinite(d)) return { final: '—', saved: '—', effective: '—' };
      const m = (x) => (Math.round(x * 100) / 100).toFixed(2);
      if (v.mode === 'back') {
        const original = p / (1 - d) ;
        return { final: m(original), saved: m(original - p), effective: `${(Number(v.pct) || 0)}%` };
      }
      const after = p * (1 - d) * (1 - (isFinite(d2) ? d2 : 0));
      const eff = ((p - after) / p) * 100;
      return { final: m(after), saved: m(p - after), effective: `${(Math.round(eff * 100) / 100)}%` };
    },
    example:
      '30% off 120 gives 84. Stacking a further 10% takes it to 75.60, which is 37% off in total — not 40%. Discounts multiply, they do not add.',
    body: [
      'Stacked discounts are the classic arithmetic trap. "30% off, then an extra 10%" is not 40% off; it is 37%. The second discount applies to the already-reduced price, so the bases differ.',
      '## Recovering the original price',
      'If something costs 84 after 30% off, the original is 84 ÷ 0.7 = 120, not 84 × 1.3 = 109.20. Multiplying by 1.3 adds 30% of the sale price, which is a smaller number than 30% of the original.',
    ],
    faq: [
      ['How do I compute a discount in my head?', 'Take 10% by moving the decimal point, then multiply. 30% off is three times 10%; 15% is 10% plus half of 10%. Works for most real prices.'],
    ],
  },
  {
    slug: 'vat-calculator',
    name: 'VAT Calculator',
    title: 'VAT Calculator — Add or Remove VAT',
    desc: 'Add VAT to a net amount or extract VAT from a gross amount. Any rate, with the net, VAT and gross figures shown separately.',
    cat: 'math',
    catName: 'Math',
    lead: 'Add VAT to a net figure, or pull it back out of a gross one. Any rate you need.',
    fields: [
      { k: 'mode', label: 'Mode', type: 'sel', val: 'add', opts: [['add', 'Net → Gross (add VAT)'], ['remove', 'Gross → Net (extract VAT)']] },
      { k: 'amount', label: 'Amount', type: 'num', val: 100 },
      { k: 'rate', label: 'VAT rate %', type: 'num', val: 20 },
    ],
    outs: [
      { k: 'net', label: 'Net', type: 'big' },
      { k: 'vat', label: 'VAT', type: 'big' },
      { k: 'gross', label: 'Gross', type: 'big' },
    ],
    compute: (v) => {
      const a = Number(v.amount);
      const r = Number(v.rate) / 100;
      if (!isFinite(a) || !isFinite(r) || r <= -1) return { net: '—', vat: '—', gross: '—' };
      const m = (x) => (Math.round(x * 100) / 100).toFixed(2);
      if (v.mode === 'add') {
        const vat = a * r;
        return { net: m(a), vat: m(vat), gross: m(a + vat) };
      }
      const net = a / (1 + r);
      return { net: m(net), vat: m(a - net), gross: m(a) };
    },
    example:
      'Adding 20% to 100 gives 120. Extracting 20% from 120 gives 100 — but dividing 120 by 1.2, not multiplying by 0.8. That difference is the single most common VAT error.',
    body: [
      'VAT is charged on the net amount, so extracting it from a gross figure means dividing by <code>1 + rate</code>. Multiplying the gross by 0.8 to "remove 20%" takes 20% of the gross instead of 20% of the net, and lands 4% short on every invoice.',
      '## Rates that are not 20%',
      'The field is free-form because rates differ by country and by category within a country. Reduced rates, zero rates and exempt supplies all exist; this tool does arithmetic, not tax advice.',
    ],
    faq: [
      ['Why is the extracted VAT slightly less than 20% of the gross?', 'Because 20% applies to the net, which is smaller than the gross. On a 120 gross, the VAT is 20.00 — that is 16.67% of the gross.'],
    ],
  },
  {
    slug: 'loan-calculator',
    name: 'Loan Payment Calculator',
    title: 'Loan Calculator — Monthly Payment and Total Interest',
    desc: 'Calculate monthly repayments, total interest and the full cost of a loan. Works for mortgages, car loans and personal loans.',
    cat: 'math',
    catName: 'Math',
    lead: 'Principal, rate and term to a fixed monthly payment, plus the total interest over the life of the loan.',
    fields: [
      { k: 'p', label: 'Loan amount', type: 'num', val: 250000 },
      { k: 'rate', label: 'Annual interest rate %', type: 'num', val: 5.5 },
      { k: 'years', label: 'Term (years)', type: 'num', val: 25 },
    ],
    outs: [
      { k: 'pay', label: 'Monthly payment', type: 'big' },
      { k: 'total', label: 'Total paid', type: 'big' },
      { k: 'interest', label: 'Total interest', type: 'big' },
      { k: 'ratio', label: 'Interest as % of principal', type: 'big' },
    ],
    compute: (v) => {
      const P = Number(v.p);
      const r = Number(v.rate) / 100 / 12;
      const n = Number(v.years) * 12;
      if (!isFinite(P) || !isFinite(n) || n <= 0) return { pay: '—', total: '—', interest: '—', ratio: '—' };
      // 零利率要单独处理，否则分母为 0
      const pay = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
      const total = pay * n;
      const m = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
      return {
        pay: m(pay),
        total: m(total),
        interest: m(total - P),
        ratio: `${((total - P) / P * 100).toFixed(1)}%`,
      };
    },
    example:
      'A 250,000 loan at 5.5% over 25 years costs 1,535.05 a month. Over the term you pay 460,515 — of which 210,515 is interest, roughly 84% of the amount borrowed.',
    body: [
      'Amortisation means early payments are mostly interest and late payments are mostly principal. The monthly figure is constant; the split changes every month, which is why paying a little extra at the start saves disproportionately more than the same extra payment at the end.',
      '## What this calculator assumes',
      'A fixed rate for the entire term, no fees, no overpayments, and interest calculated monthly. Variable-rate loans, arrangement fees and early-repayment charges all change the real cost, sometimes by more than the rate difference.',
    ],
    faq: [
      ['Why is total interest so large on a long term?', 'Because interest accrues on the outstanding balance for every month of the term. Stretching 250,000 over 25 years rather than 15 lowers the monthly payment but raises the total substantially.'],
      ['Does a shorter term always cost less?', 'In total interest, yes. In monthly cash flow, no — and that constraint is what usually decides the term.'],
    ],
  },
  {
    slug: 'compound-interest',
    name: 'Compound Interest Calculator',
    title: 'Compound Interest Calculator — With Monthly Contributions',
    desc: 'Project investment growth with compounding and optional monthly contributions. Shows the balance, contributions and interest earned.',
    cat: 'math',
    catName: 'Math',
    lead: 'Initial amount, monthly contribution, rate and years. Monthly compounding, with the interest split out from what you paid in.',
    fields: [
      { k: 'p', label: 'Starting amount', type: 'num', val: 10000 },
      { k: 'monthly', label: 'Monthly contribution', type: 'num', val: 500 },
      { k: 'rate', label: 'Annual return %', type: 'num', val: 7 },
      { k: 'years', label: 'Years', type: 'num', val: 20 },
    ],
    outs: [
      { k: 'balance', label: 'Final balance', type: 'big' },
      { k: 'paid', label: 'Total contributed', type: 'big' },
      { k: 'earned', label: 'Interest earned', type: 'big' },
      { k: 'multiple', label: 'Growth multiple', type: 'big' },
    ],
    compute: (v) => {
      const P = Number(v.p) || 0;
      const m = Number(v.monthly) || 0;
      const r = Number(v.rate) / 100 / 12;
      const n = Math.max(0, Math.round(Number(v.years) * 12));
      let bal = P;
      for (let i = 0; i < n; i++) bal = bal * (1 + r) + m;
      const paid = P + m * n;
      const f = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 0 });
      return {
        balance: f(bal),
        paid: f(paid),
        earned: f(bal - paid),
        multiple: paid ? (bal / paid).toFixed(2) + '×' : '—',
      };
    },
    example:
      'Starting with 10,000 and adding 500 a month at 7% for 20 years ends near 264,000. You put in 130,000 of that; the rest is compounding.',
    body: [
      'Compounding is growth on growth. The first years look unremarkable — the balance barely moves away from what you contribute — and the last years do most of the work. This shape is why starting early beats contributing more later.',
      '## What the projection ignores',
      'Inflation, taxes on gains, fees, and the fact that returns are not a constant 7% — they are volatile, and sequence matters. A single bad decade early cannot be averaged away by a good one late. Treat the output as a shape, not a forecast.',
    ],
    faq: [
      ['Does contribution timing matter?', 'Yes. This calculator adds the contribution after each month\'s growth, which is the conservative assumption. Contributing at the start of the month produces a slightly higher result.'],
    ],
  },
  {
    slug: 'savings-goal',
    name: 'Savings Goal Calculator',
    title: 'Savings Goal Calculator — Monthly Amount Needed',
    desc: 'Work out how much to save each month to reach a target, given a starting balance, return rate and deadline. Also shows the date you would hit it.',
    cat: 'math',
    catName: 'Math',
    lead: 'Target, deadline and return rate to a required monthly contribution. Assumes monthly compounding.',
    fields: [
      { k: 'target', label: 'Target amount', type: 'num', val: 50000 },
      { k: 'start', label: 'Already saved', type: 'num', val: 5000 },
      { k: 'rate', label: 'Annual return %', type: 'num', val: 5 },
      { k: 'years', label: 'Years to reach it', type: 'num', val: 6 },
    ],
    outs: [
      { k: 'monthly', label: 'Monthly contribution', type: 'big' },
      { k: 'totalPaid', label: 'Total you contribute', type: 'big' },
      { k: 'fromGrowth', label: 'From growth', type: 'big' },
    ],
    compute: (v) => {
      const T = Number(v.target);
      const S = Number(v.start) || 0;
      const r = Number(v.rate) / 100 / 12;
      const n = Math.max(1, Math.round(Number(v.years) * 12));
      if (!isFinite(T)) return { monthly: '—', totalPaid: '—', fromGrowth: '—' };
      // 年金终值反解：PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
      const grown = S * Math.pow(1 + r, n);
      const need = T - grown;
      const monthly = r === 0 ? need / n : (need * r) / (Math.pow(1 + r, n) - 1);
      const f = (x) => (Math.round(x * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
      return {
        monthly: monthly <= 0 ? '0.00 — already on track' : f(monthly),
        totalPaid: f(Math.max(0, monthly) * n + S),
        fromGrowth: f(Math.max(0, T - (Math.max(0, monthly) * n + S))),
      };
    },
    example:
      'To reach 50,000 in six years from 5,000 at 5% needs about 456 a month. You contribute roughly 37,800; growth supplies the remaining 12,200.',
    body: [
      'Saving to a target is the inverse of a loan. Instead of an unknown payment given a known principal, you know the future value and solve for the payment. The formula is the same annuity equation rearranged.',
      '## Why the required amount feels high',
      'Because most of the target has to come from contributions, not from growth, unless the horizon is long. A six-year horizon at 5% gives growth about a quarter of the total; a twenty-year horizon gives it more than half.',
    ],
    faq: [
      ['What if I cannot save that much?', 'Extend the horizon or lower the target — both change the answer far more than chasing a higher return, which adds risk you may not be able to absorb.'],
    ],
  },
  {
    slug: 'roi-calculator',
    name: 'ROI Calculator',
    title: 'ROI Calculator — Return on Investment',
    desc: 'Calculate return on investment from cost and gain, with the multiple and the annualised figure if you supply a holding period.',
    cat: 'math',
    catName: 'Math',
    lead: 'Cost, gain, and optionally the holding period for an annualised figure.',
    fields: [
      { k: 'cost', label: 'Total cost', type: 'num', val: 1000 },
      { k: 'gain', label: 'Total return', type: 'num', val: 1500 },
      { k: 'years', label: 'Holding period (years, 0 to skip)', type: 'num', val: 2 },
    ],
    outs: [
      { k: 'roi', label: 'ROI', type: 'big' },
      { k: 'profit', label: 'Net profit', type: 'big' },
      { k: 'multiple', label: 'Multiple', type: 'big' },
      { k: 'annual', label: 'Annualised', type: 'big' },
    ],
    compute: (v) => {
      const c = Number(v.cost);
      const g = Number(v.gain);
      const y = Number(v.years);
      if (!isFinite(c) || !isFinite(g) || c === 0) return { roi: '—', profit: '—', multiple: '—', annual: '—' };
      const profit = g - c;
      const roi = (profit / c) * 100;
      const annual = y > 0 && g > 0 && c > 0 ? (Math.pow(g / c, 1 / y) - 1) * 100 : NaN;
      const r = (x) => (Math.round(x * 100) / 100).toFixed(2);
      return {
        roi: `${r(roi)}%`,
        profit: r(profit),
        multiple: r(g / c) + '×',
        annual: isFinite(annual) ? `${r(annual)}%` : '—',
      };
    },
    example:
      'Spending 1,000 to receive 1,500 is a 50% ROI and a 1.5× multiple. Held for two years, that annualises to 22.47% — the rate at which 1,000 would grow to 1,500 over that period.',
    body: [
      'ROI compares profit to cost, which makes it easy to compute and easy to compare across projects. It says nothing about risk, timing within the period, or the cost of the capital used.',
      '## Annualising',
      'A 50% return over two years is not 25% a year. Compounding means the annual rate is the geometric mean: <code>(1.5)^(1/2) − 1 = 22.47%</code>. Dividing by the number of years overstates long-horizon returns and understates short ones.',
    ],
    faq: [
      ['Should I include my own time as a cost?', 'If the decision is whether to spend the hours elsewhere, yes. Unpriced labour makes marginal projects look profitable.'],
    ],
  },
  {
    slug: 'cagr-calculator',
    name: 'CAGR Calculator',
    title: 'CAGR Calculator — Compound Annual Growth Rate',
    desc: 'Calculate compound annual growth rate from a start value, end value and number of years. Includes the total growth percentage.',
    cat: 'math',
    catName: 'Math',
    lead: 'The smoothed annual rate that takes a start value to an end value over a period.',
    fields: [
      { k: 'start', label: 'Start value', type: 'num', val: 10000 },
      { k: 'end', label: 'End value', type: 'num', val: 25000 },
      { k: 'years', label: 'Years', type: 'num', val: 5 },
    ],
    outs: [
      { k: 'cagr', label: 'CAGR', type: 'big' },
      { k: 'total', label: 'Total growth', type: 'big' },
      { k: 'multiple', label: 'Multiple', type: 'big' },
    ],
    compute: (v) => {
      const s = Number(v.start);
      const e = Number(v.end);
      const y = Number(v.years);
      if (!isFinite(s) || !isFinite(e) || !isFinite(y) || s <= 0 || e <= 0 || y <= 0) {
        return { cagr: '—', total: '—', multiple: '—' };
      }
      const cagr = (Math.pow(e / s, 1 / y) - 1) * 100;
      const r = (x) => (Math.round(x * 100) / 100).toFixed(2);
      return { cagr: `${r(cagr)}%`, total: `${r(((e - s) / s) * 100)}%`, multiple: r(e / s) + '×' };
    },
    example:
      'Going from 10,000 to 25,000 over five years is a 150% total gain, which annualises to 20.11% — not 30%. The difference is compounding.',
    body: [
      'CAGR is a smoothed rate, not a description of what happened. It tells you the constant annual rate that would produce the same end value; the actual path may have gone up 80% then down 30%. Useful for comparing investments of different lengths on one axis, misleading if read as performance consistency.',
      '## The negative case',
      'CAGR works for declines too, and requires positive start and end values. A series that crosses zero has no meaningful CAGR, which is why the formula fails there rather than returning a number.',
    ],
    faq: [
      ['Is CAGR the same as average annual return?', 'No. The arithmetic mean of yearly returns is always higher than CAGR when returns vary, because losses hurt more than equivalent gains help.'],
    ],
  },
  {
    slug: 'markup-margin',
    name: 'Markup and Margin Calculator',
    title: 'Markup vs Margin Calculator — Convert Between Them',
    desc: 'Convert between cost, markup and margin. Shows price, profit, markup percentage and margin percentage so the difference is explicit.',
    cat: 'math',
    catName: 'Math',
    lead: 'Markup is on cost, margin is on price. Enter either one and see both, plus the resulting price.',
    fields: [
      { k: 'mode', label: 'I know', type: 'sel', val: 'cost', opts: [['cost', 'Cost + markup %'], ['price', 'Price + margin %']] },
      { k: 'base', label: 'Cost or price', type: 'num', val: 60 },
      { k: 'pct', label: 'Percentage', type: 'num', val: 50 },
    ],
    outs: [
      { k: 'price', label: 'Selling price', type: 'big' },
      { k: 'profit', label: 'Profit', type: 'big' },
      { k: 'markup', label: 'Markup (on cost)', type: 'big' },
      { k: 'margin', label: 'Margin (on price)', type: 'big' },
    ],
    compute: (v) => {
      const b = Number(v.base);
      const p = Number(v.pct) / 100;
      if (!isFinite(b) || !isFinite(p)) return { price: '—', profit: '—', markup: '—', margin: '—' };
      let cost;
      let price;
      if (v.mode === 'cost') {
        cost = b;
        price = b * (1 + p);
      } else {
        price = b;
        cost = b * (1 - p);
      }
      const profit = price - cost;
      const r = (x) => (Math.round(x * 100) / 100).toFixed(2);
      return {
        price: r(price),
        profit: r(profit),
        markup: `${r((profit / cost) * 100)}%`,
        margin: `${r((profit / price) * 100)}%`,
      };
    },
    example:
      'A 50% markup on a cost of 60 gives a price of 90 and a margin of 33.3%. To achieve a 50% margin you need a 100% markup — the same word, two different numbers.',
    body: [
      'Markup and margin use the same profit figure against different bases, and confusing them is a standard way to lose money on a product line. Markup is profit over cost; margin is profit over price. Margin is always the smaller number, and it can never reach 100%.',
      '## The conversion',
      '<code>margin = markup / (1 + markup)</code>. A 50% markup is a 33.3% margin; a 100% markup is a 50% margin. Pricing to a target margin requires dividing by <code>1 − margin</code>, not multiplying by <code>1 + margin</code>.',
    ],
    faq: [
      ['Which should I use for pricing?', 'Margin, because it is what survives after discounts. A 20% discount on a 33% margin leaves 16%; on a 50% markup the same discount leaves 20% of cost as profit.'],
    ],
  },
  {
    slug: 'break-even',
    name: 'Break-Even Calculator',
    title: 'Break-Even Calculator — Units and Revenue Needed',
    desc: 'Calculate the number of units needed to cover fixed costs, given price and variable cost per unit. Includes contribution margin.',
    cat: 'math',
    catName: 'Math',
    lead: 'Fixed costs divided by contribution per unit. Also reports the revenue at that point.',
    fields: [
      { k: 'fixed', label: 'Fixed costs', type: 'num', val: 10000 },
      { k: 'price', label: 'Price per unit', type: 'num', val: 40 },
      { k: 'var', label: 'Variable cost per unit', type: 'num', val: 25 },
    ],
    outs: [
      { k: 'units', label: 'Break-even units', type: 'big' },
      { k: 'revenue', label: 'Revenue at break-even', type: 'big' },
      { k: 'cm', label: 'Contribution per unit', type: 'big' },
      { k: 'cmr', label: 'Contribution margin ratio', type: 'big' },
    ],
    compute: (v) => {
      const F = Number(v.fixed);
      const P = Number(v.price);
      const V = Number(v.var);
      if (!isFinite(F) || !isFinite(P) || !isFinite(V)) return { units: '—', revenue: '—', cm: '—', cmr: '—' };
      const cm = P - V;
      if (cm <= 0) return { units: 'Never — price does not cover variable cost', revenue: '—', cm: String(cm), cmr: '—' };
      const units = F / cm;
      const r = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return {
        units: Math.ceil(units).toLocaleString(),
        revenue: r(Math.ceil(units) * P),
        cm: r(cm),
        cmr: `${((cm / P) * 100).toFixed(1)}%`,
      };
    },
    example:
      'With 10,000 in fixed costs, a 40 price and 25 variable cost, each sale contributes 15. You need 667 units to break even, which is 26,680 in revenue.',
    body: [
      'Break-even is where contribution covers fixed cost. Contribution is price minus variable cost — the amount each sale puts toward the costs that do not change with volume.',
      '## When there is no break-even',
      'If variable cost exceeds price, every sale loses money and no volume fixes it. The calculator says so instead of returning a negative or infinite number, because that is the actual answer.',
    ],
    faq: [
      ['Should I round up or down?', 'Up. Selling 666.67 units is not possible, and at 666 you are still below the line.'],
    ],
  },
  {
    slug: 'salary-to-hourly',
    name: 'Salary to Hourly Calculator',
    title: 'Salary to Hourly — Convert Annual Pay to an Hourly Rate',
    desc: 'Convert an annual salary to hourly, weekly and monthly figures. Adjustable hours per week and weeks worked per year.',
    cat: 'math',
    catName: 'Math',
    lead: 'Annual salary to hourly, using your actual hours and weeks rather than a 2,080-hour assumption.',
    fields: [
      { k: 'salary', label: 'Annual salary', type: 'num', val: 75000 },
      { k: 'hours', label: 'Hours per week', type: 'num', val: 40 },
      { k: 'weeks', label: 'Paid weeks per year', type: 'num', val: 52 },
    ],
    outs: [
      { k: 'hourly', label: 'Hourly', type: 'big' },
      { k: 'monthly', label: 'Monthly', type: 'big' },
      { k: 'weekly', label: 'Weekly', type: 'big' },
      { k: 'daily', label: 'Daily (8h)', type: 'big' },
    ],
    compute: (v) => {
      const s = Number(v.salary);
      const h = Number(v.hours);
      const w = Number(v.weeks);
      if (!isFinite(s) || !isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return { hourly: '—', monthly: '—', weekly: '—', daily: '—' };
      const totalHours = h * w;
      const r = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
      return {
        hourly: r(s / totalHours),
        monthly: r(s / 12),
        weekly: r(s / w),
        daily: r(s / totalHours * 8),
      };
    },
    example:
      '75,000 over 40 hours a week for 52 weeks is 36.06 an hour. Drop to 48 paid weeks and the same salary is 39.06 an hour — the unpaid weeks are the difference.',
    body: [
      'The standard conversion assumes 2,080 hours a year — 40 hours for 52 weeks. That assumption quietly includes paid holiday and sick leave, so it understates the rate for anyone contracting without paid leave.',
      '## For freelancers',
      'Enter the weeks you actually bill, not 52. A contractor billing 46 weeks at 40 hours has 1,840 billable hours, and the rate has to cover the 6 unbilled weeks plus everything an employer would otherwise pay for.',
    ],
    faq: [
      ['Why does my payslip not match?', 'Because tax, pension and other deductions come out after this figure. This is gross pay, before any of that.'],
    ],
  },
  {
    slug: 'overtime-pay',
    name: 'Overtime Pay Calculator',
    title: 'Overtime Pay Calculator — Base Rate and Multiplier',
    desc: 'Calculate overtime pay from an hourly rate, regular hours and overtime hours. Configurable multiplier and weekly threshold.',
    cat: 'math',
    catName: 'Math',
    lead: 'Regular hours at base rate, overtime hours at a multiplier. Weekly total, split out.',
    fields: [
      { k: 'rate', label: 'Hourly rate', type: 'num', val: 20 },
      { k: 'regular', label: 'Regular hours', type: 'num', val: 40 },
      { k: 'ot', label: 'Overtime hours', type: 'num', val: 6 },
      { k: 'mult', label: 'Overtime multiplier', type: 'num', val: 1.5, step: 0.1 },
    ],
    outs: [
      { k: 'base', label: 'Regular pay', type: 'big' },
      { k: 'otpay', label: 'Overtime pay', type: 'big' },
      { k: 'total', label: 'Total', type: 'big' },
      { k: 'blended', label: 'Blended hourly rate', type: 'big' },
    ],
    compute: (v) => {
      const r = Number(v.rate);
      const reg = Number(v.regular) || 0;
      const ot = Number(v.ot) || 0;
      const m = Number(v.mult) || 1.5;
      if (!isFinite(r)) return { base: '—', otpay: '—', total: '—', blended: '—' };
      const base = r * reg;
      const otpay = r * m * ot;
      const total = base + otpay;
      const f = (x) => x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return { base: f(base), otpay: f(otpay), total: f(total), blended: f(total / (reg + ot || 1)) };
    },
    example:
      '40 hours at 20 plus 6 hours at time-and-a-half is 800 + 180 = 980. The blended rate is 21.30, not 20 — useful when comparing to a salaried offer.',
    body: [
      'Overtime rules vary by jurisdiction: the multiplier, the weekly threshold above which it applies, and whether it is calculated daily or weekly. This calculator does the arithmetic for the parameters you give it and does not assume any particular labour law.',
      '## The blended rate',
      'Total pay divided by total hours is the number to compare against a salaried offer. A job paying 20 an hour with ten hours of overtime every week pays the same annually as one paying 21.30 for fifty hours — but only the first has a contract that stops at forty.',
    ],
    faq: [
      ['Is overtime taxed differently?', 'No. It is taxed as ordinary income, though withholding can look higher because a single large pay period is annualised by payroll software.'],
    ],
  },
  {
    slug: 'date-difference',
    name: 'Date Difference Calculator',
    title: 'Date Difference Calculator — Days, Weeks and Months Between Dates',
    desc: 'Calculate the difference between two dates in days, weeks, months and years. Includes business days and the weekday of each date.',
    cat: 'math',
    catName: 'Math',
    lead: 'Calendar difference in days, weeks, months and years, plus business days excluding weekends.',
    fields: [
      { k: 'from', label: 'From date', type: 'text', val: '2026-01-01' },
      { k: 'to', label: 'To date', type: 'text', val: '2026-10-26' },
    ],
    outs: [
      { k: 'days', label: 'Days', type: 'big' },
      { k: 'weeks', label: 'Weeks', type: 'big' },
      { k: 'months', label: 'Months and days', type: 'big' },
      { k: 'business', label: 'Business days', type: 'big' },
      { k: 'weekday', label: 'Weekdays', type: 'big' },
    ],
    compute: (v) => {
      const parse = (s) => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
        if (!m) throw new Error('Use YYYY-MM-DD');
        const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        if (isNaN(d)) throw new Error('Invalid date');
        return d;
      };
      const a = parse(v.from);
      const b = parse(v.to);
      const sign = b >= a ? 1 : -1;
      const [s, e] = b >= a ? [a, b] : [b, a];
      const days = Math.round((e - s) / 86400000);
      // 月末对齐：1/31 到 2/28 算一个月，而不是 28 天不足一月
      let months = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
      if (e.getUTCDate() < s.getUTCDate()) months--;
      const anchor = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + months, s.getUTCDate()));
      const remDays = Math.round((e - anchor) / 86400000);
      let business = 0;
      for (let t = s.getTime(); t < e.getTime(); t += 86400000) {
        const wd = new Date(t).getUTCDay();
        if (wd !== 0 && wd !== 6) business++;
      }
      const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        days: String(days * sign),
        weeks: (days / 7).toFixed(1),
        months: `${months} months ${remDays} days`,
        business: String(business),
        weekday: `${wd[a.getUTCDay()]} → ${wd[b.getUTCDay()]}`,
      };
    },
    example:
      'From 1 January to 26 October 2026 is 298 days — 42.6 weeks, 9 months 25 days, and 212 business days. Business days ignore public holidays, which vary by country.',
    body: [
      'Date arithmetic is not subtraction. Months have different lengths, so "one month later" is ambiguous at month ends, and daylight saving means some days are 23 or 25 hours long if you work in local time. Everything here is computed in UTC to avoid the latter.',
      '## Why business days are approximate',
      'Weekends are a fixed rule; public holidays are not. The count excludes Saturday and Sunday only. For contractual deadlines, subtract the holidays that apply in the relevant jurisdiction.',
    ],
    faq: [
      ['Does the order of the dates matter?', 'No. The result is signed — a negative number of days means the second date is earlier.'],
      ['Why is 31 January to 28 February reported as one month?', 'Because that is how calendar months are conventionally counted at month ends. Reporting 28 days would be technically correct and practically unhelpful.'],
    ],
  },
  {
    slug: 'business-days',
    name: 'Business Days Calculator',
    title: 'Business Days Calculator — Add or Count Working Days',
    desc: 'Add working days to a date, or count working days between two dates. Weekends excluded, with a custom holiday list.',
    cat: 'math',
    catName: 'Math',
    lead: 'Add N working days to a start date, skipping weekends and any holidays you list.',
    fields: [
      { k: 'start', label: 'Start date', type: 'text', val: '2026-10-26' },
      { k: 'n', label: 'Working days to add', type: 'num', val: 10, step: 1 },
      { k: 'holidays', label: 'Holidays to skip (one YYYY-MM-DD per line)', type: 'area', rows: 3, val: '' },
    ],
    outs: [
      { k: 'result', label: 'Resulting date', type: 'big' },
      { k: 'skipped', label: 'Weekend days crossed', type: 'big' },
      { k: 'calendar', label: 'Calendar days', type: 'big' },
    ],
    compute: (v) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v.start).trim());
      if (!m) throw new Error('Start date must be YYYY-MM-DD');
      const hol = new Set(String(v.holidays || '').split('\n').map((x) => x.trim()).filter(Boolean));
      const n = Math.floor(Number(v.n) || 0);
      if (n === 0) return { result: String(v.start), skipped: '0', calendar: '0' };
      const step = n > 0 ? 1 : -1;
      let left = Math.abs(n);
      let d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      const startTime = d.getTime();
      let skipped = 0;
      let guard = 0;
      while (left > 0) {
        d = new Date(d.getTime() + step * 86400000);
        const wd = d.getUTCDay();
        const key = d.toISOString().slice(0, 10);
        if (wd === 0 || wd === 6 || hol.has(key)) {
          if (wd === 0 || wd === 6) skipped++;
          continue;
        }
        left--;
        if (++guard > 100000) break;
      }
      return {
        result: d.toISOString().slice(0, 10),
        skipped: String(skipped),
        calendar: String(Math.round(Math.abs(d.getTime() - startTime) / 86400000)),
      };
    },
    example:
      'Ten working days from Monday 26 October 2026 lands on Monday 9 November, crossing two weekends — 14 calendar days for 10 working ones.',
    body: [
      'Working-day arithmetic is what contracts use: "within 10 business days" is a different deadline from "within 10 days", and the difference is usually a weekend and a holiday.',
      '## Holidays are yours to supply',
      'There is no universal holiday list. List the dates that apply to your jurisdiction and your year, one per line, and they are skipped as well as weekends. Without them the result is a weekdays-only count.',
    ],
    faq: [
      ['What if the start date is a weekend?', 'Counting begins from that date regardless; the first working day after it is where the count starts incrementing.'],
      ['Can I subtract working days?', 'Yes — enter a negative number. The calculation runs backwards through the same rules.'],
    ],
  },
  {
    slug: 'number-base-converter',
    name: 'Number Base Converter',
    title: 'Number Base Converter — Binary, Octal, Decimal, Hex',
    desc: 'Convert between binary, octal, decimal and hexadecimal, plus any base from 2 to 36. Shows all four common bases at once.',
    cat: 'math',
    catName: 'Math',
    lead: 'Type in any base, read all of them. Bases 2 to 36 supported, with 32-bit and 64-bit views for bit-level work.',
    fields: [
      { k: 'value', label: 'Value', type: 'text', val: '255' },
      { k: 'base', label: 'Input base', type: 'sel', val: '10', opts: [['2', '2 binary'], ['8', '8 octal'], ['10', '10 decimal'], ['16', '16 hex'], ['36', '36 base-36']] },
    ],
    outs: [
      { k: 'dec', label: 'Decimal', type: 'big' },
      { k: 'bin', label: 'Binary', type: 'code' },
      { k: 'oct', label: 'Octal', type: 'big' },
      { k: 'hex', label: 'Hex', type: 'big' },
      { k: 'bits', label: 'Bit view', type: 'code' },
    ],
    compute: (v) => {
      const base = Number(v.base) || 10;
      const raw = String(v.value || '').trim().toLowerCase().replace(/^0x/, '');
      if (!raw) return { dec: '—', bin: '', oct: '—', hex: '—', bits: '' };
      if (base < 2 || base > 36) throw new Error('Base must be between 2 and 36');
      let n = 0;
      for (const ch of raw) {
        const d = parseInt(ch, 36);
        if (isNaN(d) || d >= base) throw new Error(`"${ch}" is not valid in base ${base}`);
        n = n * base + d;
      }
      const bin = n.toString(2);
      // 32 位分组，Linux 权限、掩码、协议头都按这个看
      const grouped = bin.padStart(Math.ceil(bin.length / 8) * 8, '0').replace(/(.{8})(?=.)/g, '$1 ');
      return {
        dec: n.toLocaleString('en-US').replace(/,/g, ''),
        bin: grouped,
        oct: '0o' + n.toString(8),
        hex: '0x' + n.toString(16).toUpperCase(),
        bits: `${bin.length} bits`,
      };
    },
    example:
      '255 is 11111111 in binary, 377 in octal and FF in hex. In the 8-bit grouping it is one full byte — which is why 255 is the mask for a single octet.',
    body: [
      'Base conversion is exact for integers and lossy for fractions, which is why this page does not accept a decimal point. Floating-point bases are a different problem with a different answer, and pretending otherwise produces quietly wrong values.',
      '## Where each base shows up',
      'Binary for bitmasks and permissions, octal for Unix file modes, hex for colours, memory addresses and byte literals, base-36 for short URL identifiers. The grouping by eight bits is there because byte boundaries are what matter at the level where these conversions get used.',
    ],
    faq: [
      ['Why is there no negative number support?', 'Two\'s complement needs a word size to be meaningful — the same −1 is FF, FFFF or FFFFFFFF depending on width. Pick a width and the bit view shows the pattern.'],
    ],
  },
  {
    slug: 'roman-numerals',
    name: 'Roman Numeral Converter',
    title: 'Roman Numeral Converter — Numbers to Roman and Back',
    desc: 'Convert numbers to Roman numerals and Roman numerals back to numbers. Handles values up to 3999 and explains subtractive notation.',
    cat: 'math',
    catName: 'Math',
    lead: 'Both directions, 1 to 3999, with the subtractive pairs handled correctly rather than as naive symbol repetition.',
    fields: [
      { k: 'mode', label: 'Direction', type: 'sel', val: 'enc', opts: [['enc', 'Number → Roman'], ['dec', 'Roman → Number']] },
      { k: 'input', label: 'Input', type: 'text', val: '2026' },
    ],
    outs: [
      { k: 'out', label: 'Result', type: 'big' },
      { k: 'note', label: 'Breakdown', type: 'code' },
    ],
    compute: (v) => {
      const TABLE = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
        [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
      ];
      const s = String(v.input || '').trim().toUpperCase();
      if (v.mode === 'enc') {
        let n = Math.floor(Number(s));
        if (!isFinite(n) || n < 1 || n > 3999) throw new Error('Enter a whole number from 1 to 3999');
        let out = '';
        const parts = [];
        for (const [val, sym] of TABLE) {
          while (n >= val) {
            out += sym;
            parts.push(`${val} → ${sym}`);
            n -= val;
          }
        }
        return { out, note: parts.join('\n') };
      }
      if (!/^[MDCLXVI]+$/.test(s)) throw new Error('Roman numerals use only I V X L C D M');
      const VAL = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let total = 0;
      const parts = [];
      for (let i = 0; i < s.length; i++) {
        const cur = VAL[s[i]];
        const next = VAL[s[i + 1]] || 0;
        // 小值在大值左边 = 减，这是唯一需要状态的地方
        if (cur < next) {
          total -= cur;
          parts.push(`-${cur} (${s[i]} before ${s[i + 1]})`);
        } else {
          total += cur;
          parts.push(`+${cur}`);
        }
      }
      return { out: String(total), note: parts.join('\n') };
    },
    example:
      '2026 decomposes as 1000 + 1000 + 10 + 10 + 5 + 1, giving MMXXVI. The subtractive pairs — IV, IX, XL, XC, CD, CM — exist because the Romans preferred fewer symbols over strict addition.',
    body: [
      'Roman numerals are additive with a subtractive exception: a smaller symbol before a larger one is subtracted. That single rule is why 4 is IV rather than IIII, and why a naive symbol-repetition converter gets roughly a third of numbers wrong.',
      '## The range',
      'Standard form covers 1 to 3999. Beyond that the Romans used overbars or other conventions that have no single modern encoding, so this converter refuses rather than inventing one.',
    ],
    faq: [
      ['Why is 4 sometimes written IIII on clocks?', 'Clock faces historically used IIII for visual symmetry opposite VIII. It is a traditional exception, not standard notation.'],
    ],
  },
];
