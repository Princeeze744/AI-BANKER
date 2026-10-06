export type Scenario = { id: string; short: string; title: string; feeling: string; agent: string };

// The six recognition scenarios from PRD v3, Phase 0.
export const scenarios: Scenario[] = [
  { id: "salary", short: "Salary finishes early", title: "Salary finishes before the month does", feeling: "Payday was the 25th. By the 9th you are counting days.", agent: "Shows the exact week the money leaves, and warns you before the low day arrives." },
  { id: "spend", short: "Don't know where it went", title: "You cannot say where it went", feeling: "The alerts came. The total never added up in your head.", agent: "Every naira sorted and explained in plain words, across all your accounts." },
  { id: "family", short: "Family support", title: "Family calls, and you send", feeling: "It is love, not waste. But nothing in your budget plans for it.", agent: "Treats family support as the fixed bill it really is, sized from what you actually send." },
  { id: "cushion", short: "No cushion", title: "One emergency from trouble", feeling: "One big surprise bill would mean borrowing.", agent: "Spots spare money and suggests a small buffer. You approve every move." },
  { id: "rent", short: "Rent in one lump", title: "Rent lands all at once", feeling: "A full year, due in one painful week.", agent: "Counts down to the date and spreads the weight across the months before it." },
  { id: "fees", short: "School fees", title: "School fees, every single term", feeling: "You know it is coming. It still catches you.", agent: "Ask if you can pay it today. The answer comes from your real numbers." },
];
