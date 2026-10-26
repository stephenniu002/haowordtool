/**
 * 健康类。公式都是公开的教科书公式，不做医学判断。
 * 每个都写清楚「它算的是什么，不算什么」——BMI 和体脂率最大的问题
 * 不是公式错，是被当成诊断。
 */

export default [
  {
    slug: 'calorie-calculator',
    name: 'Calorie Needs Calculator',
    title: 'Daily Calorie Needs — TDEE Calculator',
    desc: 'Estimate daily calories from age, sex, height, weight and activity level using the Mifflin-St Jeor equation.',
    cat: 'health',
    catName: 'Health',
    lead: 'Mifflin-St Jeor for resting rate, multiplied by an activity factor. Shows maintenance, a mild deficit and a mild surplus.',
    fields: [
      { k: 'sex', label: 'Sex', type: 'sel', val: 'm', opts: [['m', 'Male'], ['f', 'Female']] },
      { k: 'age', label: 'Age', type: 'num', val: 30 },
      { k: 'h', label: 'Height (cm)', type: 'num', val: 175 },
      { k: 'w', label: 'Weight (kg)', type: 'num', val: 75 },
      { k: 'act', label: 'Activity', type: 'sel', val: '1.55', opts: [['1.2', 'Sedentary'], ['1.375', 'Light (1–3 days/wk)'], ['1.55', 'Moderate (3–5)'], ['1.725', 'Very active (6–7)'], ['1.9', 'Athlete']] },
    ],
    outs: [
      { k: 'bmr', label: 'Resting rate (BMR)', type: 'big' },
      { k: 'tdee', label: 'Maintenance', type: 'big' },
      { k: 'cut', label: 'Mild deficit (−15%)', type: 'big' },
      { k: 'bulk', label: 'Mild surplus (+10%)', type: 'big' },
    ],
    compute: (v) => {
      const a = Number(v.age);
      const h = Number(v.h);
      const w = Number(v.w);
      if (!isFinite(a) || !isFinite(h) || !isFinite(w)) return { bmr: '—', tdee: '—', cut: '—', bulk: '—' };
      const bmr = 10 * w + 6.25 * h - 5 * a + (v.sex === 'f' ? -161 : 5);
      const tdee = bmr * (Number(v.act) || 1.55);
      const r = (x) => Math.round(x).toLocaleString();
      return { bmr: r(bmr), tdee: r(tdee), cut: r(tdee * 0.85), bulk: r(tdee * 1.1) };
    },
    example:
      'A 30-year-old male at 175 cm and 75 kg has a resting rate near 1,700 kcal. At moderate activity the maintenance figure lands around 2,640.',
    body: [
      'Mifflin-St Jeor predicts resting energy expenditure from four inputs and is accurate within about 10% for most people. The activity multiplier is the weak link: self-reported activity levels are consistently overestimated, which is why the maintenance figure often comes out higher than reality.',
    ],
    faq: [
      ['Why does my weight not match the prediction?', 'Because the multiplier is a population average, not a measurement. Track intake and weight for two weeks and adjust from observed data rather than from the formula.'],
      ['Is a 15% deficit safe?', 'It is a commonly used moderate deficit. Anything below about 1,200 kcal for women or 1,500 for men needs medical supervision rather than a calculator.'],
    ],
  },
  {
    slug: 'bmr-calculator',
    name: 'BMR Calculator',
    title: 'BMR Calculator — Basal Metabolic Rate',
    desc: 'Calculate basal metabolic rate with the Mifflin-St Jeor equation. Shows BMR next to TDEE at several activity levels.',
    cat: 'health',
    catName: 'Health',
    lead: 'Energy burned at complete rest, before any activity is counted.',
    fields: [
      { k: 'sex', label: 'Sex', type: 'sel', val: 'm', opts: [['m', 'Male'], ['f', 'Female']] },
      { k: 'age', label: 'Age', type: 'num', val: 30 },
      { k: 'h', label: 'Height (cm)', type: 'num', val: 175 },
      { k: 'w', label: 'Weight (kg)', type: 'num', val: 75 },
    ],
    outs: [
      { k: 'bmr', label: 'BMR (kcal/day)', type: 'big' },
      { k: 'sed', label: 'At sedentary × 1.2', type: 'big' },
      { k: 'mod', label: 'At moderate × 1.55', type: 'big' },
      { k: 'high', label: 'At very active × 1.725', type: 'big' },
    ],
    compute: (v) => {
      const a = Number(v.age);
      const h = Number(v.h);
      const w = Number(v.w);
      if (!isFinite(a) || !isFinite(h) || !isFinite(w)) return { bmr: '—', sed: '—', mod: '—', high: '—' };
      const bmr = 10 * w + 6.25 * h - 5 * a + (v.sex === 'f' ? -161 : 5);
      const r = (x) => Math.round(x).toLocaleString();
      return { bmr: r(bmr), sed: r(bmr * 1.2), mod: r(bmr * 1.55), high: r(bmr * 1.725) };
    },
    example:
      'BMR for a 75 kg, 175 cm, 30-year-old male is about 1,700 kcal — the energy the body uses staying alive and still, before walking to the kitchen.',
    body: [
      'BMR is the floor: the energy cost of breathing, circulation, cell turnover and thermoregulation at rest. It typically accounts for 60–70% of daily expenditure, which is why it dominates any weight-change plan.',
      '## Why BMR alone is not a target',
      'Eating at BMR means a large deficit for anyone who moves at all. The maintenance figure — BMR times an activity factor — is the number to compare intake against.',
    ],
    faq: [
      ['Which formula is more accurate, Mifflin or Harris-Benedict?', 'Mifflin-St Jeor is more accurate for modern populations in most validation studies and is the one used here.'],
    ],
  },
  {
    slug: 'body-fat-calculator',
    name: 'Body Fat Calculator',
    title: 'Body Fat Percentage — US Navy Tape Method',
    desc: 'Estimate body fat percentage from circumference measurements using the US Navy formula. Requires neck, waist and hip measurements.',
    cat: 'health',
    catName: 'Health',
    lead: 'The US Navy circumference method. Tape measure in centimetres, no calipers needed.',
    fields: [
      { k: 'sex', label: 'Sex', type: 'sel', val: 'm', opts: [['m', 'Male'], ['f', 'Female']] },
      { k: 'h', label: 'Height (cm)', type: 'num', val: 175 },
      { k: 'neck', label: 'Neck (cm)', type: 'num', val: 38 },
      { k: 'waist', label: 'Waist (cm)', type: 'num', val: 85 },
      { k: 'hip', label: 'Hip (cm, female only)', type: 'num', val: 95 },
    ],
    outs: [
      { k: 'bf', label: 'Body fat', type: 'big' },
      { k: 'cat', label: 'Category', type: 'big' },
      { k: 'lean', label: 'Lean mass (kg at 75 kg)', type: 'big' },
    ],
    compute: (v) => {
      const h = Number(v.h);
      const neck = Number(v.neck);
      const waist = Number(v.waist);
      const hip = Number(v.hip);
      if (![h, neck, waist].every(isFinite)) return { bf: '—', cat: '—', lean: '—' };
      let bf;
      if (v.sex === 'f') {
        if (!isFinite(hip)) throw new Error('Hip measurement is required for the female formula');
        // 三种围度相加，任何一项错都会放大误差
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450;
      } else {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
      }
      if (!isFinite(bf) || bf < 0 || bf > 70) throw new Error('Check the measurements — waist must exceed neck, and all values in the same unit');
      const cat = v.sex === 'f'
        ? bf < 14 ? 'Essential to athletic' : bf < 21 ? 'Fitness' : bf < 25 ? 'Average' : bf < 32 ? 'Above average' : 'High'
        : bf < 6 ? 'Essential to athletic' : bf < 14 ? 'Fitness' : bf < 18 ? 'Average' : bf < 25 ? 'Above average' : 'High';
      return { bf: `${bf.toFixed(1)}%`, cat, lean: `${(75 * (1 - bf / 100)).toFixed(1)} kg` };
    },
    example:
      'Neck 38, waist 85 and height 175 gives roughly 15% by the Navy formula. The same waist on a shorter frame reads higher, because height is part of the denominator.',
    body: [
      'The Navy method assumes body fat distributes predictably relative to circumference. It is accurate to about ±3–4 percentage points for most people, and considerably worse for very muscular or very lean individuals, where neck and waist do not move the way the formula expects.',
      '## Measuring consistently',
      'Measure at the same time of day, relaxed, tape flat against the skin without compressing. A one-centimetre error at the waist moves the result by about half a percentage point, so consistency between measurements matters more than absolute precision.',
    ],
    faq: [
      ['Is this better than a smart scale?', 'Usually yes. Bioimpedance scales are strongly affected by hydration and typically carry a larger error than a careful tape measurement.'],
    ],
  },
  {
    slug: 'ideal-weight',
    name: 'Ideal Weight Calculator',
    title: 'Ideal Weight Calculator — Devine, Robinson and Miller',
    desc: 'Estimate ideal body weight using three published formulas. Shows the range and the healthy BMI range for your height.',
    cat: 'health',
    catName: 'Health',
    lead: 'Three formulas, three answers. The range between them is the honest output.',
    fields: [
      { k: 'sex', label: 'Sex', type: 'sel', val: 'm', opts: [['m', 'Male'], ['f', 'Female']] },
      { k: 'h', label: 'Height (cm)', type: 'num', val: 175 },
    ],
    outs: [
      { k: 'devine', label: 'Devine', type: 'big' },
      { k: 'robinson', label: 'Robinson', type: 'big' },
      { k: 'miller', label: 'Miller', type: 'big' },
      { k: 'bmiRange', label: 'Healthy BMI 18.5–24.9 range', type: 'big' },
    ],
    compute: (v) => {
      const cm = Number(v.h);
      if (!isFinite(cm) || cm < 100) return { devine: '—', robinson: '—', miller: '—', bmiRange: '—' };
      const inches = cm / 2.54;
      const over60 = Math.max(0, inches - 60);
      const male = v.sex !== 'f';
      const devine = (male ? 50 : 45.5) + 2.3 * over60;
      const robinson = (male ? 52 : 49) + (male ? 1.9 : 1.7) * over60;
      const miller = (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * over60;
      const m = cm / 100;
      const lo = 18.5 * m * m;
      const hi = 24.9 * m * m;
      const f = (x) => `${x.toFixed(1)} kg`;
      return { devine: f(devine), robinson: f(robinson), miller: f(miller), bmiRange: `${f(lo)} – ${f(hi)}` };
    },
    example:
      'At 175 cm, the three male formulas give 65.2, 65.4 and 65.5 kg — close together here, but they diverge by several kilograms at the extremes of height.',
    body: [
      'These formulas were built for drug dosing, not for setting personal targets. They assume a specific body composition and were derived from mid-twentieth-century insurance data, which is why three of them disagree by a few kilograms on the same person.',
      '## Use the range',
      'The healthy BMI band for your height is a wider and more defensible target than any single formula. If your weight sits inside it and your measurements are stable, the precise "ideal" number adds nothing.',
    ],
    faq: [
      ['Do these formulas account for muscle?', 'No. A muscular person will read as overweight against every one of them, because the formulas only know height and sex.'],
    ],
  },
  {
    slug: 'water-intake',
    name: 'Water Intake Calculator',
    title: 'Daily Water Intake Calculator',
    desc: 'Estimate daily water needs from body weight and activity. Shows the total including water from food, in litres and cups.',
    cat: 'health',
    catName: 'Health',
    lead: 'Weight-based baseline plus an activity allowance. Includes the share that normally comes from food.',
    fields: [
      { k: 'w', label: 'Weight (kg)', type: 'num', val: 75 },
      { k: 'min', label: 'Exercise (minutes/day)', type: 'num', val: 30 },
      { k: 'hot', label: 'Hot climate', type: 'chk', val: false },
    ],
    outs: [
      { k: 'total', label: 'Total fluid per day', type: 'big' },
      { k: 'drink', label: 'From drinks', type: 'big' },
      { k: 'cups', label: 'In 250 ml cups', type: 'big' },
    ],
    compute: (v) => {
      const w = Number(v.w);
      const min = Number(v.min) || 0;
      if (!isFinite(w) || w <= 0) return { total: '—', drink: '—', cups: '—' };
      let litres = w * 0.033;
      litres += (min / 30) * 0.35;
      if (v.hot) litres *= 1.15;
      // 约 20% 来自食物，所以饮用量要减掉
      const drink = litres * 0.8;
      return {
        total: `${litres.toFixed(2)} L`,
        drink: `${drink.toFixed(2)} L`,
        cups: String(Math.round((drink * 1000) / 250)),
      };
    },
    example:
      '75 kg with 30 minutes of exercise needs about 2.8 litres of total fluid, of which roughly 2.2 litres should come from drinks — around nine 250 ml cups.',
    body: [
      'Water needs scale with body mass and losses, not with a fixed eight glasses. About a fifth of total intake normally comes from food, which is why the drinking figure is lower than the total.',
      '## Thirst is a reasonable guide',
      'For healthy adults with free access to water, thirst tracks need closely. Fixed targets matter mainly for people whose thirst signal is unreliable — endurance athletes, older adults, and anyone in extreme heat.',
    ],
    faq: [
      ['Can I drink too much?', 'Yes. Sustained intake well above need dilutes blood sodium. The condition is rare but real, and it is the reason "more water" is not automatically better.'],
    ],
  },
  {
    slug: 'pace-calculator',
    name: 'Running Pace Calculator',
    title: 'Pace Calculator — Running Pace, Time and Distance',
    desc: 'Calculate running pace from distance and time, or the finish time for a target pace. Supports km, miles and common race distances.',
    cat: 'health',
    catName: 'Health',
    lead: 'Fill in any two of distance, time and pace; the third is computed. Race distances are preset.',
    fields: [
      { k: 'dist', label: 'Distance (km)', type: 'num', val: 10 },
      { k: 'h', label: 'Hours', type: 'num', val: 0, step: 1 },
      { k: 'm', label: 'Minutes', type: 'num', val: 50, step: 1 },
      { k: 's', label: 'Seconds', type: 'num', val: 0, step: 1 },
    ],
    outs: [
      { k: 'pace', label: 'Pace per km', type: 'big' },
      { k: 'paceMi', label: 'Pace per mile', type: 'big' },
      { k: 'speed', label: 'Average speed', type: 'big' },
      { k: 'marathon', label: 'Marathon at this pace', type: 'big' },
    ],
    compute: (v) => {
      const d = Number(v.dist);
      const secs = (Number(v.h) || 0) * 3600 + (Number(v.m) || 0) * 60 + (Number(v.s) || 0);
      if (!isFinite(d) || d <= 0 || secs <= 0) return { pace: '—', paceMi: '—', speed: '—', marathon: '—' };
      const clock = (t) => {
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = Math.round(t % 60);
        return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + `:${String(s).padStart(2, '0')}`;
      };
      const perKm = secs / d;
      return {
        pace: clock(perKm) + ' /km',
        paceMi: clock(perKm * 1.609344) + ' /mi',
        speed: (d / (secs / 3600)).toFixed(2) + ' km/h',
        marathon: clock(perKm * 42.195),
      };
    },
    example:
      '10 km in 50 minutes is 5:00 per kilometre, 8:03 per mile, 12 km/h — and a marathon of 3:30:59 if that pace could be held.',
    body: [
      'Pace is time divided by distance, and it does not scale linearly across distances. Most runners slow by 3–8% going from 10 km to a marathon; the projection here is pace held constant, which is an upper bound rather than a forecast.',
      '## Pace versus speed',
      'Pace is minutes per unit of distance; speed is distance per hour. They are reciprocals, so improving from 5:00 to 4:30 per kilometre is a bigger gain than the numbers suggest.',
    ],
    faq: [
      ['Why are splits negative or positive?', 'A negative split means the second half was faster. Most personal bests come from even or slightly negative splits, which is why pacing matters more than early effort.'],
    ],
  },
  {
    slug: 'heart-rate-zones',
    name: 'Heart Rate Zones Calculator',
    title: 'Heart Rate Zones — Training Zones from Age',
    desc: 'Calculate training heart rate zones from age or a measured maximum. Shows all five zones with bpm ranges.',
    cat: 'health',
    catName: 'Health',
    lead: 'Five zones from max heart rate. Enter a measured max if you have one; otherwise the age formula is used.',
    fields: [
      { k: 'age', label: 'Age', type: 'num', val: 30 },
      { k: 'max', label: 'Measured max HR (0 = use age formula)', type: 'num', val: 0 },
      { k: 'rest', label: 'Resting HR (optional)', type: 'num', val: 0 },
    ],
    outs: [
      { k: 'maxhr', label: 'Max heart rate', type: 'big' },
      { k: 'z1', label: 'Z1 recovery 50–60%', type: 'big' },
      { k: 'z2', label: 'Z2 aerobic 60–70%', type: 'big' },
      { k: 'z3', label: 'Z3 tempo 70–80%', type: 'big' },
      { k: 'z4', label: 'Z4 threshold 80–90%', type: 'big' },
      { k: 'z5', label: 'Z5 max 90–100%', type: 'big' },
    ],
    compute: (v) => {
      const age = Number(v.age);
      const max = Number(v.max) > 0 ? Number(v.max) : isFinite(age) ? 208 - 0.7 * age : NaN;
      if (!isFinite(max)) return { maxhr: '—', z1: '—', z2: '—', z3: '—', z4: '—', z5: '—' };
      const rest = Number(v.rest);
      const zone = (lo, hi) => {
        // 有静息心率就用 Karvonen，否则直接按最大心率百分比
        if (isFinite(rest) && rest > 0 && rest < max) {
          return `${Math.round(rest + (max - rest) * lo)}–${Math.round(rest + (max - rest) * hi)} bpm`;
        }
        return `${Math.round(max * lo)}–${Math.round(max * hi)} bpm`;
      };
      return {
        maxhr: `${Math.round(max)} bpm`,
        z1: zone(0.5, 0.6),
        z2: zone(0.6, 0.7),
        z3: zone(0.7, 0.8),
        z4: zone(0.8, 0.9),
        z5: zone(0.9, 1.0),
      };
    },
    example:
      'At 30, the Tanaka formula gives a max of 187 bpm — six beats lower than the classic 220 minus age. Zone 2 then runs from 112 to 131.',
    body: [
      'Zone training assigns effort levels to heart rate bands so that easy days stay easy and hard days stay hard. The failure mode is doing everything in zone 3, which is too hard to recover from and too easy to drive adaptation.',
      '## Which max heart rate formula',
      '220 minus age overestimates for younger people and underestimates for older ones. Tanaka (208 − 0.7 × age) fits measured data better and is used here. Neither substitutes for an actual test.',
    ],
    faq: [
      ['What if I have a resting heart rate?', 'Entering it switches to the Karvonen method, which anchors zones between rest and max rather than from zero. That is more accurate for anyone with a notably low or high resting rate.'],
    ],
  },
  {
    slug: 'sleep-cycle',
    name: 'Sleep Cycle Calculator',
    title: 'Sleep Calculator — Bedtime by Sleep Cycles',
    desc: 'Work out what time to go to bed or wake up, based on 90-minute sleep cycles. Accounts for the time taken to fall asleep.',
    cat: 'health',
    catName: 'Health',
    lead: 'Ninety-minute cycles, plus 15 minutes to fall asleep. Waking at the end of a cycle is what makes the difference.',
    fields: [
      { k: 'mode', label: 'I want to', type: 'sel', val: 'wake', opts: [['wake', 'wake up at…'], ['bed', 'go to bed now at…']] },
      { k: 'time', label: 'Time (HH:MM, 24h)', type: 'text', val: '07:00' },
      { k: 'fall', label: 'Minutes to fall asleep', type: 'num', val: 15 },
    ],
    outs: [{ k: 'out', label: 'Options', type: 'code' }],
    compute: (v) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(v.time).trim());
      if (!m) throw new Error('Time must be HH:MM');
      const fall = Math.max(0, Number(v.fall) || 0);
      const base = new Date();
      base.setHours(+m[1], +m[2], 0, 0);
      const fmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const out = [];
      for (let cycles = 6; cycles >= 3; cycles--) {
        const mins = cycles * 90 + fall;
        const d = new Date(base.getTime() + (v.mode === 'wake' ? -mins : mins) * 60000);
        out.push(`${cycles} cycles (${(cycles * 1.5).toFixed(1)} h sleep) → ${fmt(d)}`);
      }
      return { out: out.join('\n') };
    },
    example:
      'To wake at 07:00 after six cycles, go to bed at 21:45 — 540 minutes of sleep plus 15 to fall asleep. Five cycles moves that to 23:15.',
    body: [
      'Sleep runs in cycles of roughly 90 minutes, moving through light sleep, deep sleep and REM. Waking mid-cycle, especially out of deep sleep, produces grogginess that can last an hour even after adequate total sleep.',
      '## Why 90 minutes is approximate',
      'Cycle length varies between 70 and 120 minutes depending on the person and the night, and shifts toward longer cycles later in the night. The calculator gives a target, not a guarantee; the useful signal is that going to bed 20 minutes later can feel worse than sleeping less.',
    ],
    faq: [
      ['Do I need exactly six cycles?', 'No. Most adults need seven to nine hours total; cycles are a way of arranging that, not a substitute for it.'],
    ],
  },
  {
    slug: 'macro-split',
    name: 'Macro Split Calculator',
    title: 'Macro Calculator — Protein, Carbs and Fat Split',
    desc: 'Split daily calories into protein, carbohydrate and fat grams for balanced, high-protein and low-carb plans.',
    cat: 'health',
    catName: 'Health',
    lead: 'Calories to grams across three common splits. Protein first, since that is the one with a defensible floor.',
    fields: [
      { k: 'kcal', label: 'Daily calories', type: 'num', val: 2200 },
      { k: 'w', label: 'Body weight (kg)', type: 'num', val: 75 },
      { k: 'plan', label: 'Split', type: 'sel', val: 'balanced', opts: [['balanced', 'Balanced 30/40/30'], ['high', 'High protein 40/35/25'], ['low', 'Lower carb 35/25/40']] },
    ],
    outs: [
      { k: 'p', label: 'Protein', type: 'big' },
      { k: 'c', label: 'Carbohydrate', type: 'big' },
      { k: 'f', label: 'Fat', type: 'big' },
      { k: 'perkg', label: 'Protein per kg bodyweight', type: 'big' },
    ],
    compute: (v) => {
      const kcal = Number(v.kcal);
      const w = Number(v.w);
      if (!isFinite(kcal) || kcal <= 0) return { p: '—', c: '—', f: '—', perkg: '—' };
      const split = { balanced: [0.30, 0.40, 0.30], high: [0.40, 0.35, 0.25], low: [0.35, 0.25, 0.40] }[v.plan] || [0.3, 0.4, 0.3];
      // 蛋白 4 kcal/g，碳水 4，脂肪 9
      const p = (kcal * split[0]) / 4;
      const c = (kcal * split[1]) / 4;
      const f = (kcal * split[2]) / 9;
      return {
        p: `${Math.round(p)} g`,
        c: `${Math.round(c)} g`,
        f: `${Math.round(f)} g`,
        perkg: isFinite(w) && w > 0 ? `${(p / w).toFixed(1)} g/kg` : '—',
      };
    },
    example:
      'At 2,200 kcal on a balanced split: 165 g protein, 220 g carbohydrate, 73 g fat. For 75 kg that is 2.2 g protein per kilogram — above the 1.6 g/kg that most training research supports.',
    body: [
      'Macro splits convert calories into grams using 4 kcal per gram for protein and carbohydrate, 9 for fat. The arithmetic is trivial; the argument is about the ratios, and the evidence for a specific ratio is weaker than the marketing suggests.',
      '## Protein has the strongest case',
      '1.6 g per kilogram of bodyweight is the level most resistance-training research converges on for muscle retention and gain. Above that, returns are small. Below it, especially while losing weight, lean mass suffers.',
    ],
    faq: [
      ['Does meal timing matter?', 'Far less than total intake. The distribution across the day is a distant second to hitting the daily totals at all.'],
    ],
  },
];
