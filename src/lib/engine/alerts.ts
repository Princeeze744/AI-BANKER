// The "proactive" mode: turn what the engine found into the few things worth saying now.
import { naira, nairaRound, shortDate, whenText } from "@/lib/format";
import type { Insights } from "./engine";

export type Alert = {
  id: string;
  stage: 1 | 2;
  title: string;
  body: string;
  when: string;
  action?: { label: string; done: string; log: string };
};

export const stageName = { 1: "Step 1 · Notify", 2: "Step 2 · Suggest" } as const;

export function buildAlerts(ins: Insights): Alert[] {
  const out: Alert[] = [];

  const sub = ins.recurring.find((r) => r.isCard && r.nextDay >= 0 && r.nextDay <= 7);
  if (sub) {
    out.push({
      id: `sub-${sub.key}`, stage: 2, when: "Today, 8:02",
      title: `${sub.name} renews ${whenText(sub.nextDay)}`,
      body: `${naira(sub.amount)} has left your card ${sub.count} months in a row. I can pause the card it charges, so this renewal does not go through.`,
      action: { label: "Pause this card", done: `Card paused. ${sub.name} cannot charge it.`, log: `Paused the card ${sub.name} charges` },
    });
  }
  if (ins.lowDay) {
    out.push({
      id: "low", stage: 1, when: "Today, 7:30",
      title: `A low day is coming around ${shortDate(ins.lowDay.day)}`,
      body: ins.income.regular
        ? `At your usual pace you drop under ${naira(ins.threshold)} about ${(ins.income.nextDay ?? 0) - ins.lowDay.day} days before payday.`
        : `More has been going out than coming in. At this pace you drop under ${naira(ins.threshold)} in about ${ins.lowDay.day} days.`,
    });
  }
  if (!ins.income.regular && ins.moneyOut > ins.moneyIn) {
    out.push({
      id: "gap", stage: 1, when: "Yesterday, 19:10",
      title: `${nairaRound(ins.moneyOut - ins.moneyIn)} more went out than came in`,
      body: `Over the last 30 days: ${nairaRound(ins.moneyIn)} in, ${nairaRound(ins.moneyOut)} out.`,
    });
  }
  if (ins.charges.levyCount > 10) {
    out.push({
      id: "levy", stage: 1, when: "Yesterday, 18:30",
      title: `The ₦50 levy hit you ${ins.charges.levyCount} times this month`,
      body: `It applies every time ₦10,000 or more comes in. Altogether your bank took ${naira(ins.charges.now)} in charges across ${ins.charges.count} debits.`,
    });
  } else if (ins.charges.now > ins.charges.prev) {
    out.push({
      id: "charges", stage: 1, when: "Yesterday, 18:30",
      title: `${naira(ins.charges.now)} in bank charges this month`,
      body: `${ins.charges.count} small debits. That is ${naira(ins.charges.now - ins.charges.prev)} more than the month before.`,
    });
  }
  if (ins.ajo) {
    out.push({
      id: "ajo", stage: 1, when: "Mon, 9:15",
      title: `${ins.ajo.weeks} weeks of ajo, without missing one`,
      body: `${naira(ins.ajo.amount)} to ${ins.ajo.name} every week.${ins.ajo.lastPayout ? ` Your last payout was ${naira(ins.ajo.lastPayout.amount)} on ${shortDate(ins.ajo.lastPayout.day)}.` : ""}`,
    });
  }
  if (ins.family.low > 0) {
    out.push({
      id: "family", stage: 1, when: "Sun, 16:40",
      title: "Family support is behaving like a fixed bill",
      body: `Between ${nairaRound(ins.family.low)} and ${nairaRound(ins.family.high)} every month for 3 months. About ${nairaRound(ins.family.avg)} on average.`,
    });
  }
  return out;
}
