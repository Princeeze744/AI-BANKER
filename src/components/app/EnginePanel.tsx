"use client";

import BalanceChart from "@/components/BalanceChart";
import Slider, { ranges } from "@/components/Slider";
import type { Insights } from "@/lib/engine/engine";
import { personas, type Persona } from "@/lib/engine/ledger";
import { naira, shortDate } from "@/lib/format";

export default function EnginePanel({ p, ins, feed, onSwitch, onChange }: { p: Persona; ins: Insights; feed: { q: string; tools: string[] }[]; onSwitch: (id: string) => void; onChange: (patch: Partial<Persona>) => void }) {
  const r = ranges[p.kind];
  const cats = new Set(ins.txns.map((t) => t.category)).size;
  const stats: [string, string][] = [
    [String(ins.txns.length), "transactions read"],
    [String(cats), "categories found"],
    [String(ins.recurring.length), "repeat payments"],
    [String(ins.charges.count), "bank-charge debits"],
  ];
  return (
    <div className="engine flex h-full flex-col overflow-hidden">
      <div className="border-b border-nightline px-5 py-4">
        <p className="num text-[0.62rem] uppercase tracking-[0.18em] text-mint">Engine room</p>
        <p className="mt-1 text-[0.84rem] leading-snug text-[#a9b8ae]">What the app is doing underneath. Change the person or the numbers and every screen recalculates.</p>
      </div>

      <div className="scroll-quiet min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div>
          <p className="num mb-2 text-[0.6rem] uppercase tracking-[0.16em] text-[#7d8f84]">Whose account</p>
          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Sample person">
            {personas.map((x) => (
              <button key={x.id} role="radio" aria-checked={x.id === p.id} onClick={() => onSwitch(x.id)} className={`tap rounded-xl border px-2.5 py-2 text-left transition ${x.id === p.id ? "border-mint bg-[#1c2a22]" : "border-nightline hover:border-[#3d4f44]"}`}>
                <span className="block text-[0.84rem] font-medium">{x.name}</span>
                <span className="block text-[0.64rem] leading-tight text-[#8fa196]">{x.role}, {x.city}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Slider label={r.label} value={p.income} min={r.income[0]} max={r.income[1]} step={r.income[2]} onChange={(income) => onChange({ income })} />
          <Slider label="Family support" value={p.family} min={0} max={300000} step={2000} onChange={(family) => onChange({ family })} suffix="/ month" />
          <Slider label="Rent" value={p.rent} min={100000} max={5000000} step={50000} onChange={(rent) => onChange({ rent })} suffix="/ year" />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {stats.map(([n, l]) => (
            <div key={l} className="engine-cell px-3 py-2.5">
              <p className="num text-xl font-medium text-mint">{n}</p>
              <p className="text-[0.66rem] text-[#8fa196]">{l}</p>
            </div>
          ))}
        </div>

        <div className="engine-cell p-3">
          <p className="num text-[0.6rem] uppercase tracking-[0.16em] text-[#7d8f84]">Balance · 30 days back, forecast ahead</p>
          <BalanceChart ins={ins} dark height={96} />
          <p className="num mt-1 text-[0.68rem] text-[#a9b8ae]">
            {ins.lowDay ? `low day ≈ ${shortDate(ins.lowDay.day)} · floor ${naira(ins.threshold)}` : `no low day ahead · floor ${naira(ins.threshold)}`}
          </p>
        </div>

        <div>
          <p className="num mb-2 text-[0.6rem] uppercase tracking-[0.16em] text-[#7d8f84]">Tools called by the chat</p>
          {feed.length === 0 ? (
            <p className="engine-cell px-3 py-3 text-[0.74rem] text-[#8fa196]">Ask a question in the app and the tools it used will show here.</p>
          ) : (
            <ul className="space-y-1.5">
              {feed.slice(0, 4).map((f, i) => (
                <li key={`${f.q}-${i}`} className="engine-cell px-3 py-2">
                  <p className="truncate text-[0.72rem] text-[#a9b8ae]">“{f.q}”</p>
                  <p className="num mt-1 text-[0.66rem] leading-relaxed text-mint">{f.tools.length ? f.tools.map((t) => `→ ${t}`).join("  ") : "→ no tool matched"}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="border-t border-nightline px-5 py-3 text-[0.68rem] leading-snug text-[#7d8f84]">The sums are plain code, not AI, so they come out the same every time. Sample data; no real account.</p>
    </div>
  );
}
