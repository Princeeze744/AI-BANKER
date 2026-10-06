"use client";

import Link from "next/link";
import { useState } from "react";
import BalanceChart from "@/components/BalanceChart";
import Slider, { ranges } from "@/components/Slider";
import { personas, type Persona } from "@/lib/engine/ledger";
import { dayDate, naira, nairaRound, pct } from "@/lib/format";
import { useInsights } from "@/lib/usePersona";

const kinds = [
  { id: "tunde", label: "I earn a salary" },
  { id: "ngozi", label: "I run a business" },
  { id: "musa", label: "I earn daily" },
];

export default function Calculator() {
  const [p, setP] = useState<Persona>(personas[0]);
  const ins = useInsights(p);
  const r = ranges[p.kind];
  const reg = ins.income.regular;
  const famShare = pct(ins.family.avg, ins.income.monthly);

  const rows: [string, string, boolean][] = [
    reg
      ? [`${pct(ins.moneyOut, ins.income.amount)}%`, `of your salary is gone ${-ins.cycleStart - 1} days after payday`, true]
      : [`${nairaRound(ins.livingPerDay)}`, "a day goes on living costs, before any stock or supplies", false],
    ins.lowDay
      ? [dayDate(ins.lowDay.day), reg ? `is when you drop under ${naira(ins.threshold)}. Payday is ${(ins.income.nextDay ?? 0) - ins.lowDay.day} days later` : `is when you drop under ${naira(ins.threshold)} at this pace`, true]
      : [reg ? "You make it" : `${ins.runwayDays} days`, reg ? "to payday with money still in the account" : "of living costs covered if nothing came in", false],
    [`${famShare}%`, `of what you earn goes to family: about ${nairaRound(ins.family.avg)} a month`, famShare >= 20],
    [naira(ins.rent.perMonth), `a month from now is what your ${naira(p.rent)} rent needs`, ins.rent.perMonth > ins.income.monthly * 0.35],
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="card p-5 sm:p-7">
        <div className="flex flex-wrap gap-1.5" aria-label="How you earn">
          {kinds.map((k) => (
            <button key={k.id} aria-pressed={p.id === k.id} className="chip tap !px-3.5 !py-2 !text-[0.82rem]" onClick={() => setP(personas.find((x) => x.id === k.id) ?? personas[0])}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="mt-7 space-y-6">
          <Slider label={r.label} value={p.income} min={r.income[0]} max={r.income[1]} step={r.income[2]} onChange={(income) => setP((x) => ({ ...x, income }))} />
          <Slider label="What you send to family" value={p.family} min={0} max={300000} step={2000} onChange={(family) => setP((x) => ({ ...x, family }))} suffix="/ month" />
          <Slider label="Your rent" value={p.rent} min={100000} max={5000000} step={50000} onChange={(rent) => setP((x) => ({ ...x, rent }))} suffix="/ year" />
        </div>
        <p className="mt-7 text-[0.74rem] leading-relaxed text-ink3">
          Nothing you set here is saved or sent anywhere. It builds a sample three-month statement around your numbers and runs the same engine the app uses.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 pt-5 sm:px-7 sm:pt-6">
          <p className="eyebrow">What the engine sees</p>
          <BalanceChart ins={ins} height={130} />
        </div>
        <ul className="divide-y divide-rule border-t border-rule">
          {rows.map(([big, rest, warn]) => (
            <li key={rest} className="flex items-baseline gap-4 px-5 py-3.5 sm:px-7">
              <span className={`num w-[8.2rem] shrink-0 text-[1.25rem] font-medium ${warn ? "text-clay" : "text-leaf"}`}>{big}</span>
              <span className="text-[0.88rem] leading-snug text-ink2">{rest}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-rule bg-[#f0ebdf] p-4 sm:px-7">
          <Link href={`/app?p=${p.id}&income=${p.income}&family=${p.family}&rent=${p.rent}`} className="btn btn-ink w-full px-5 py-3.5 text-sm">
            Open the app with these numbers →
          </Link>
        </div>
      </div>
    </div>
  );
}
