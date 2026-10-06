// The deterministic layer from PRD section 5.1: plain code, no AI.
// Reads raw narrations, sorts them, finds repeat charges, and projects the balance forward.
import { nextMonthSameDay } from "@/lib/format";
import { DAYS, type Persona, type Txn } from "./ledger";

export type Category =
  | "Income" | "Family" | "Food" | "Transport" | "Airtime & data" | "Subscriptions" | "Bills"
  | "Bank charges" | "Cash" | "Stock & supplies" | "Ajo" | "Other transfers" | "Other";

export const categoryTone: Record<Category, string> = {
  Income: "#0b6b43", Family: "#c2410c", Food: "#b7791f", Transport: "#1d5fa8", "Airtime & data": "#7c4dbd",
  Subscriptions: "#be185d", Bills: "#0e7490", "Bank charges": "#b91c1c", Cash: "#57534e",
  "Stock & supplies": "#3f6212", Ajo: "#9a6700", "Other transfers": "#78716c", Other: "#a8a29e",
};

// Order matters: first rule that matches wins.
const rules: [RegExp, Category][] = [
  [/LEVY$|TRANSFER FEE|SMS ALERT|MAINTENANCE FEE|STAMP DUTY/, "Bank charges"],
  [/SHOP SECURITY LEVY/, "Bills"],
  [/AJO|ESUSU/, "Ajo"],
  [/SALARY|PAYOUT|BONUS|SETTLEMENT|TRF FRM/, "Income"],
  [/WHOLESALE|\/GOODS|BIKE HIRE|SPARES/, "Stock & supplies"],
  [/UPKEEP|SCHOOL SUPPORT|FAMILY SUPPORT|\/HOME$/, "Family"],
  [/RECURRING CARD|SUBSCRIPTION/, "Subscriptions"],
  [/AIRTIME|DATA BUNDLE/, "Airtime & data"],
  [/METER TOKEN|DISCO/, "Bills"],
  [/FUEL|RIDEGO|FARE/, "Transport"],
  [/ATM CASH/, "Cash"],
  [/KITCHEN|SUPERMKT|FOOD|BUKA|MART|SUYA/, "Food"],
  [/TRF TO/, "Other transfers"],
];

export function categorise(t: Txn): Category {
  for (const [re, cat] of rules) {
    if (re.test(t.narration)) {
      if (cat === "Income" && t.amount < 0) continue;
      if (cat === "Ajo" && /SHOP SECURITY/.test(t.narration)) continue;
      return cat;
    }
  }
  return t.amount > 0 ? "Income" : "Other";
}

// "RECURRING CARD PYMT - STREAMBOX NG" -> "Streambox Ng"; "NIP TRF TO ADEBAYO FOLASADE /X" -> "Adebayo Folasade"
export function merchant(narration: string) {
  let s = narration.replace(/\s*\/.*$/, "");
  s = s.replace(/^(NIP TRF TO|NIP TRF FRM|POS PURCHASE -|WEB PURCHASE -|RECURRING CARD PYMT -|PREPAID METER TOKEN -|ATM CASH WITHDRAWAL -|POS SETTLEMENT -)\s*/, "");
  s = s.replace(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b \d{4} - /, "").replace(/ - \d[\d*]+$/, "").replace(/ (IKEJA|PH)$/, "");
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bNg\b/, "").replace(/\bTv\b/, "TV").replace(/(\d)gb\b/, "$1GB").trim();
}

export type Recurring = {
  key: string; name: string; category: Category; amount: number; every: "month" | "week";
  count: number; lastDay: number; nextDay: number; isCard: boolean;
};

export type Insights = {
  txns: (Txn & { category: Category })[];
  balance: number;
  income: { regular: boolean; lastDay: number; nextDay: number | null; amount: number; perDay: number; monthly: number };
  cycleStart: number; // day the current view starts (last payday, or 30 days back)
  cycleLabel: string;
  moneyIn: number;
  moneyOut: number;
  breakdown: { category: Category; amount: number; count: number; prev: number }[];
  recurring: Recurring[];
  charges: { now: number; prev: number; count: number; levyCount: number };
  family: { months: number[]; low: number; high: number; avg: number };
  spendPerDay: number;
  history: { day: number; balance: number }[];
  forecast: { day: number; balance: number }[];
  lowDay: { day: number; balance: number } | null;
  threshold: number;
  runwayDays: number;
  livingPerDay: number;
  thinnest: { day: number; balance: number };
  rent: { perMonth: number; months: number; coveredPct: number };
  ajo: { name: string; amount: number; weeks: number; lastPayout: { day: number; amount: number } | null } | null;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function findRecurring(txns: (Txn & { category: Category })[], sign: 1 | -1): Recurring[] {
  const groups = new Map<string, (Txn & { category: Category })[]>();
  for (const t of txns) {
    if (Math.sign(t.amount) !== sign || t.category === "Bank charges") continue;
    const key = merchant(t.narration);
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const out: Recurring[] = [];
  for (const [key, g] of groups) {
    if (g.length < 3) continue;
    const gaps = g.slice(1).map((t, i) => t.day - g[i].day);
    const amounts = g.map((t) => Math.abs(t.amount));
    const mid = median(amounts);
    const steady = amounts.filter((a) => Math.abs(a - mid) <= mid * 0.2).length >= amounts.length * 0.8;
    const monthly = gaps.every((x) => x >= 27 && x <= 34);
    const weekly = g.length >= 6 && gaps.filter((x) => x >= 6 && x <= 8).length >= gaps.length * 0.85;
    if (!steady || (!monthly && !weekly)) continue;
    const last = g[g.length - 1];
    out.push({
      key, name: key, category: last.category, amount: mid, every: monthly ? "month" : "week",
      count: g.length, lastDay: last.day, nextDay: monthly ? nextMonthSameDay(last.day) : last.day + 7,
      isCard: /RECURRING CARD/.test(last.narration),
    });
  }
  return out.sort((a, b) => a.nextDay - b.nextDay);
}

export function analyse(raw: Txn[], p: Persona): Insights {
  const txns = raw.map((t) => ({ ...t, category: categorise(t) }));
  const balance = txns.length ? txns[txns.length - 1].balance : 0;
  const win = (from: number, to: number) => txns.filter((t) => t.day > from && t.day <= to);
  const last30 = win(-30, 0);
  const prev30 = win(-60, -30);

  // Income: is there a steady monthly credit (a salary), or does money come in bits?
  const paydays = findRecurring(txns, 1).filter((x) => x.every === "month" && x.category === "Income");
  const salary = paydays.sort((a, b) => b.amount - a.amount)[0];
  const in30 = sum(last30.filter((t) => t.amount > 0).map((t) => t.amount));
  const allIn = sum(txns.filter((t) => t.amount > 0).map((t) => t.amount));
  const income = salary
    ? { regular: true, lastDay: salary.lastDay, nextDay: salary.nextDay, amount: salary.amount, perDay: salary.amount / 30, monthly: salary.amount }
    : { regular: false, lastDay: 0, nextDay: null, amount: 0, perDay: in30 / 30, monthly: (allIn / DAYS) * 30 };

  const cycleStart = income.regular ? income.lastDay - 1 : -30;
  const cycle = win(cycleStart, 0);
  const priorCycle = income.regular ? win(cycleStart - 30, cycleStart).filter((t) => t.day <= cycleStart - 30 + (0 - cycleStart)) : prev30;
  const outOf = (xs: typeof txns) => xs.filter((t) => t.amount < 0);
  const moneyOut = -sum(outOf(cycle).map((t) => t.amount));
  const moneyIn = sum(cycle.filter((t) => t.amount > 0).map((t) => t.amount));

  const by = new Map<Category, { amount: number; count: number; prev: number }>();
  for (const t of outOf(cycle)) {
    const b = by.get(t.category) ?? { amount: 0, count: 0, prev: 0 };
    b.amount -= t.amount; b.count++; by.set(t.category, b);
  }
  for (const t of outOf(priorCycle)) {
    const b = by.get(t.category);
    if (b) b.prev -= t.amount;
  }
  const breakdown = [...by].map(([category, v]) => ({ category, ...v })).sort((a, b) => b.amount - a.amount);

  const recurring = findRecurring(txns, -1);

  const isCharge = (t: (typeof txns)[number]) => t.category === "Bank charges";
  const charges = {
    now: -sum(last30.filter(isCharge).map((t) => t.amount)),
    prev: -sum(prev30.filter(isCharge).map((t) => t.amount)),
    count: last30.filter(isCharge).length,
    levyCount: last30.filter((t) => /MONEY TRANSFER LEVY/.test(t.narration)).length,
  };

  const famMonth = (from: number, to: number) => -sum(win(from, to).filter((t) => t.category === "Family").map((t) => t.amount));
  const months = [famMonth(-90, -60), famMonth(-60, -30), famMonth(-30, 0)];
  const family = { months, low: Math.min(...months), high: Math.max(...months), avg: sum(months) / 3 };

  // Day-by-day closing balance for the last 30 days.
  const history: { day: number; balance: number }[] = [];
  let running = txns.filter((t) => t.day <= -30).slice(-1)[0]?.balance ?? 0;
  for (let d = -29; d <= 0; d++) {
    const dayT = txns.filter((t) => t.day === d);
    if (dayT.length) running = dayT[dayT.length - 1].balance;
    history.push({ day: d, balance: running });
  }
  const thinnest = history.reduce((a, b) => (b.balance < a.balance ? b : a));

  // Forecast: everyday spending pace, plus the repeat payments we know are coming.
  const recurringKeys = new Set(recurring.map((x) => x.key));
  const everyday = outOf(last30).filter((t) => !recurringKeys.has(merchant(t.narration)));
  const spendPerDay = -sum(everyday.map((t) => t.amount)) / 30;
  const allSpendPerDay = -sum(outOf(last30).map((t) => t.amount)) / 30;
  const horizon = income.regular && income.nextDay ? Math.max(income.nextDay + 4, 21) : 30;
  const living = -sum(outOf(last30).filter((t) => t.category !== "Stock & supplies").map((t) => t.amount)) / 30;
  const threshold = income.regular
    ? Math.max(10000, Math.round((income.monthly * 0.06) / 1000) * 1000)
    : Math.max(5000, Math.round((living * 3) / 1000) * 1000);
  const forecast: { day: number; balance: number }[] = [{ day: 0, balance }];
  let proj = balance;
  let lowDay: Insights["lowDay"] = null;
  for (let d = 1; d <= horizon; d++) {
    proj -= spendPerDay;
    for (const x of recurring) {
      const step = x.every === "month" ? 30 : 7;
      if (d >= x.nextDay && (d - x.nextDay) % step === 0) proj -= x.amount;
    }
    if (income.regular) {
      if (d === income.nextDay) proj += income.amount;
    } else proj += income.perDay;
    forecast.push({ day: d, balance: Math.max(proj, 0) });
    const beforePay = !income.regular || d < (income.nextDay ?? 99);
    if (!lowDay && beforePay && balance >= threshold && proj < threshold) lowDay = { day: d, balance: Math.max(proj, 0) };
  }

  const monthsToRent = Math.max(1, Math.round(p.rentDueIn / 30));
  const ajoRec = recurring.find((x) => x.category === "Ajo");
  const payout = txns.filter((t) => t.category === "Ajo" && t.amount > 0).slice(-1)[0];

  return {
    txns, balance, income, cycleStart,
    cycleLabel: income.regular ? "since payday" : "in the last 30 days",
    moneyIn, moneyOut, breakdown, recurring, charges, family, spendPerDay: allSpendPerDay,
    history, forecast, lowDay, threshold,
    runwayDays: living > 0 ? Math.floor(balance / living) : 99,
    livingPerDay: living,
    thinnest,
    rent: { perMonth: Math.ceil(p.rent / monthsToRent / 1000) * 1000, months: monthsToRent, coveredPct: Math.min(100, Math.round((balance / p.rent) * 100)) },
    ajo: ajoRec ? { name: ajoRec.name, amount: ajoRec.amount, weeks: ajoRec.count, lastPayout: payout ? { day: payout.day, amount: payout.amount } : null } : null,
  };
}

// Used by the "can I pay X" question. Facts only; no verdict.
export function affordability(ins: Insights, amount: number) {
  const after = ins.balance - amount;
  const until = ins.income.regular && ins.income.nextDay ? ins.income.nextDay : 14;
  const path = ins.forecast.filter((f) => f.day >= 1 && f.day < until);
  const lowestAfter = path.length ? Math.min(...path.map((f) => f.balance)) - amount : after;
  // Past 90 days: on how many days did the closing balance sit below what would be left?
  const closes = new Map<number, number>();
  for (const t of ins.txns) closes.set(t.day, t.balance);
  const below = [...closes].filter(([, b]) => b < after).map(([d]) => d);
  return { after, until, lowestAfter, belowDays: below.length, lastBelow: below.length ? Math.max(...below) : null };
}
