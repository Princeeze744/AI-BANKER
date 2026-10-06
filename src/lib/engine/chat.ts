// The "reactive" mode from PRD section 5.2: a question comes in, tools are called, and the
// answer is written only from what the tools return. No number here is typed by hand.
// This demo routes questions with rules. In the real build, an AI model chooses the tools
// and words the answer; the tools underneath stay exactly as they are.
import { naira, nairaRound, pct, relDay, shortDate, whenText } from "@/lib/format";
import { affordability, type Insights } from "./engine";
import type { Persona } from "./ledger";

export type Answer = { lines: string[]; tools: string[] };

export const starters = (p: Persona) => [
  "Am I in a good position to pay school fees this month?",
  "Where is my money going?",
  p.kind === "salaried" ? "Will my money reach payday?" : "How long can I last if work stops?",
  "What charges am I paying?",
];

function parseAmount(q: string): number | null {
  const m = q.replace(/,/g, "").match(/(?:₦|n|ngn)?\s*(\d+(?:\.\d+)?)\s*(k|m|thousand|million)?\b/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "k" || unit === "thousand") n *= 1000;
  if (unit === "m" || unit === "million") n *= 1000000;
  return n >= 500 ? n : null;
}

export function answer(question: string, ins: Insights, p: Persona): Answer {
  const q = question.toLowerCase();
  const has = (...w: string[]) => w.some((x) => new RegExp("\\b" + x.replace(/[-()]/g, "\\$&")).test(q));

  // The licence boundary (PRD principle 5). Checked first, on purpose.
  if (has("invest", "treasury", "t-bill", "stock", "crypto", "loan", "borrow", "lend me")) {
    return {
      tools: ["advice_boundary_check()"],
      lines: [
        "That is a decision about investing or credit, and I am not licensed to tell you what to choose there.",
        `What I can show you is your own picture: ${nairaRound(ins.balance)} today, about ${nairaRound(ins.livingPerDay)} a day going on living costs, and ${ins.runwayDays} days of cover if nothing else came in.`,
      ],
    };
  }

  if (has("afford", "can i pay", "can i buy", "position to pay", "school fees", "fees", "rent") || (has("pay", "buy") && parseAmount(q))) {
    const typed = parseAmount(q);
    const what = has("rent") ? "rent" : has("fee") ? "school fees" : "that";
    const amount = typed ?? (has("rent") ? p.rent : p.fees);
    const a = affordability(ins, amount);
    const tools = ["get_balance()", "get_balance_forecast()", `check_history_below(${Math.max(0, Math.round(a.after))})`];
    if (a.after < 0) {
      return {
        tools,
        lines: [
          `${what === "that" ? "That" : `Your ${what}`} is ${naira(amount)}. You have ${nairaRound(ins.balance)} today, so you are ${nairaRound(-a.after)} short as things stand.`,
          what === "rent"
            ? `It is due in ${p.rentDueIn} days. Spread evenly from now, that is about ${naira(ins.rent.perMonth)} a month.`
            : ins.income.regular
              ? `Your next pay of ${naira(ins.income.amount)} is expected ${relDay(ins.income.nextDay ?? 0)}.`
              : `About ${nairaRound(ins.income.perDay)} comes in on a typical day, and ${nairaRound(ins.spendPerDay)} goes out.`,
          "That is the picture. The decision is yours.",
        ],
      };
    }
    const hist = a.belowDays
      ? `Your balance has been lower than that on ${a.belowDays} of the last 92 days, most recently on ${shortDate(a.lastBelow ?? 0)}.`
      : "Your balance has not gone that low at any point in the last 3 months.";
    const ahead = a.lowestAfter < 0
      ? `At your usual pace you would run out before ${ins.income.regular ? "payday" : "the next two weeks are up"}, unless something changes.`
      : `At your usual pace, the lowest it would get before ${ins.income.regular ? "payday" : "two weeks are up"} is about ${nairaRound(a.lowestAfter)}.`;
    return {
      tools,
      lines: [`${what === "that" ? "That" : `Your ${what}`} is ${naira(amount)}. Paying it today would leave you with about ${nairaRound(a.after)}.`, `${hist} ${ahead}`, "That is the picture. The decision is yours."],
    };
  }

  if (has("charge", "fee", "subscription", "deduct", "levy", "debit alert")) {
    const subs = ins.recurring.filter((r) => r.category === "Subscriptions");
    const delta = ins.charges.now - ins.charges.prev;
    const lines = [
      `Your bank took ${naira(ins.charges.now)} in charges in the last 30 days, across ${ins.charges.count} separate debits. That is ${naira(Math.abs(delta))} ${delta >= 0 ? "more" : "less"} than the 30 days before.`,
    ];
    if (ins.charges.levyCount > 5) lines.push(`The ₦50 transfer levy alone hit you ${ins.charges.levyCount} times. It applies each time ₦10,000 or more comes in.`);
    if (subs.length) lines.push(`You also have ${subs.length} repeat card ${subs.length === 1 ? "payment" : "payments"}: ${subs.map((s) => `${s.name} at ${naira(s.amount)}`).join(", ")}. The next one leaves ${whenText(subs[0].nextDay)}.`);
    return { tools: ["get_bank_charges(30)", "list_recurring_charges()"], lines };
  }

  if (has("family", "mum", "mama", "parent", "black tax", "send home", "sibling")) {
    const [a, b, c] = ins.family.months;
    return {
      tools: ['get_category_trend("Family")'],
      lines: [
        `You sent ${nairaRound(c)} to family in the last 30 days. The two months before were ${nairaRound(b)} and ${nairaRound(a)}.`,
        `It has stayed between ${nairaRound(ins.family.low)} and ${nairaRound(ins.family.high)} every month, so it behaves like a fixed bill of about ${nairaRound(ins.family.avg)}, even though no budget treats it that way.`,
      ],
    };
  }

  if (has("payday", "can i last", "last me", "will it last", "run out", "finish", "reach", "broke", "work stops", "how long", "survive")) {
    const tools = ["get_balance()", "get_balance_forecast()"];
    if (ins.income.regular) {
      const days = ins.income.nextDay ?? 0;
      return {
        tools,
        lines: [
          `You have ${nairaRound(ins.balance)} and payday is ${days} days away.`,
          ins.lowDay
            ? `At your usual pace, you drop under ${naira(ins.threshold)} around ${relDay(ins.lowDay.day)}. That is ${days - ins.lowDay.day} days before your salary lands.`
            : `At your usual pace you should reach payday with money still in the account.`,
          `Last month, your lowest point was ${nairaRound(ins.thinnest.balance)} on ${shortDate(ins.thinnest.day)}.`,
        ],
      };
    }
    return {
      tools,
      lines: [
        `Your living costs run at about ${nairaRound(ins.livingPerDay)} a day. With ${nairaRound(ins.balance)} in the account, that covers ${ins.runwayDays} days if nothing came in.`,
        `On a typical day about ${nairaRound(ins.income.perDay)} comes in. Your thinnest day in the last month was ${shortDate(ins.thinnest.day)}, at ${nairaRound(ins.thinnest.balance)}.`,
      ],
    };
  }

  if (has("ajo", "esusu", "contribution")) {
    if (!ins.ajo) return { tools: ["detect_ajo_pattern()"], lines: ["I do not see a regular ajo or esusu contribution in the last 3 months of this account."] };
    return {
      tools: ["detect_ajo_pattern()"],
      lines: [
        `You have paid ${naira(ins.ajo.amount)} to ${ins.ajo.name} for ${ins.ajo.weeks} weeks in a row.`,
        ins.ajo.lastPayout ? `Your last payout was ${naira(ins.ajo.lastPayout.amount)} on ${shortDate(ins.ajo.lastPayout.day)}.` : "I have not seen a payout come in yet.",
      ],
    };
  }

  if (has("where", "going", "spend", "spent", "summary", "breakdown", "money go")) {
    const [a, b, c] = ins.breakdown;
    const lines = [
      ins.income.regular
        ? `Since payday, ${nairaRound(ins.moneyOut)} has gone out. That is ${pct(ins.moneyOut, ins.income.amount)}% of your salary in ${-ins.cycleStart - 1} days.`
        : `In the last 30 days, ${nairaRound(ins.moneyIn)} came in and ${nairaRound(ins.moneyOut)} went out.`,
      `The biggest share is ${a.category.toLowerCase()} at ${nairaRound(a.amount)}, which is ${pct(a.amount, ins.moneyOut)}% of everything that left. Then ${b.category.toLowerCase()} at ${nairaRound(b.amount)} and ${c.category.toLowerCase()} at ${nairaRound(c.amount)}.`,
    ];
    const up = ins.breakdown.filter((x) => x.prev > 0 && x.amount > x.prev * 1.25 && x.amount - x.prev > 3000)[0];
    if (up) lines.push(`${up.category} is the one that moved: up ${nairaRound(up.amount - up.prev)} on the same stretch last time.`);
    return { tools: ["get_monthly_summary()", "get_category_breakdown()"], lines };
  }

  if (has("save", "saving", "cushion", "emergency")) {
    return {
      tools: ["get_balance_trend(90)"],
      lines: [
        `In the last month your account never held less than ${nairaRound(ins.thinnest.balance)}. That is the most you could have set aside without touching anything you actually spent.`,
        `Your living costs are about ${nairaRound(ins.livingPerDay)} a day, so one month of cover would be about ${nairaRound(ins.livingPerDay * 30)}.`,
      ],
    };
  }

  if (has("should i")) {
    return { tools: ["advice_boundary_check()"], lines: ["I will not tell you what you should do. Ask me what something would leave you with, or what is coming up, and I will show you the numbers."] };
  }

  return {
    tools: [],
    lines: ["I could not match that to anything I can work out in this demo. Try asking where your money goes, whether you can pay an amount, what charges you pay, what you send to family, or how long your money will last."],
  };
}
