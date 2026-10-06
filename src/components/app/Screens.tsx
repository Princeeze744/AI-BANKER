"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import BalanceChart from "@/components/BalanceChart";
import { stageName, type Alert } from "@/lib/engine/alerts";
import { answer, starters } from "@/lib/engine/chat";
import { categoryTone, merchant, type Category, type Insights } from "@/lib/engine/engine";
import type { Persona } from "@/lib/engine/ledger";
import { dayDate, naira, nairaRound, pct, relDay, shortDate } from "@/lib/format";

const list = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export type LogEntry = { id: number; who: "You" | "AI Banker"; what: string; when: string };

/* ------------------------------ Home ------------------------------ */

export function Home({ p, ins, onCategory, onAsk }: { p: Persona; ins: Insights; onCategory: (c: Category) => void; onAsk: () => void }) {
  const reg = ins.income.regular;
  const daysToPay = ins.income.nextDay ?? 0;
  const headline = ins.lowDay
    ? reg
      ? `At this pace you drop under ${naira(ins.threshold)} around ${dayDate(ins.lowDay.day)}. That is ${daysToPay - ins.lowDay.day} days before payday.`
      : `More is going out than coming in. At this pace you drop under ${naira(ins.threshold)} around ${dayDate(ins.lowDay.day)}.`
    : reg
      ? "At this pace you reach payday with money still in the account."
      : `This covers ${ins.runwayDays} days of living costs if nothing came in.`;

  return (
    <motion.div variants={list} initial="hidden" animate="show" className="space-y-3.5 px-5 pb-6">
      <motion.div variants={item}>
        <p className="eyebrow">{dayDate(0)} · {p.bank}</p>
        <h1 className="display mt-1 text-[1.9rem]">Good morning, {p.name}.</h1>
      </motion.div>

      <motion.section variants={item} className="card overflow-hidden">
        <div className="p-4 pb-2">
          <p className="eyebrow">In your account</p>
          <p className="num mt-1 text-[2.35rem] font-medium leading-none">
            {naira(Math.floor(ins.balance))}
            <span className="text-lg text-ink3">.{String(Math.round((ins.balance % 1) * 100)).padStart(2, "0")}</span>
          </p>
          <p className="mt-2 text-[0.78rem] text-ink2">
            {reg ? (
              <>
                <b className="font-medium text-ink">{daysToPay} days</b> to payday · <b className="font-medium text-clay">{pct(ins.moneyOut, ins.income.amount)}%</b> of salary already out
              </>
            ) : (
              <>
                About <b className="font-medium text-leaf">{nairaRound(ins.income.perDay)}</b> in and <b className="font-medium text-clay">{nairaRound(ins.spendPerDay)}</b> out on a typical day
              </>
            )}
          </p>
        </div>
        <div className="px-3">
          <BalanceChart ins={ins} />
        </div>
        <p className={`border-t border-rule px-4 py-3 text-[0.84rem] leading-snug ${ins.lowDay ? "bg-claysoft" : "bg-leafsoft"}`}>{headline}</p>
      </motion.section>

      <motion.section variants={item} className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[0.95rem] font-semibold">Where it went</h2>
          <p className="num text-[0.78rem] text-ink2">{nairaRound(ins.moneyOut)} {ins.cycleLabel}</p>
        </div>
        <div className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
          {ins.breakdown.map((b, i) => (
            <motion.span key={b.category} style={{ background: categoryTone[b.category] }} initial={{ width: 0 }} animate={{ width: `${(b.amount / ins.moneyOut) * 100}%` }} transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: "easeOut" }} />
          ))}
        </div>
        <ul className="mt-2 divide-y divide-rule">
          {ins.breakdown.slice(0, 7).map((b) => (
            <li key={b.category}>
              <button onClick={() => onCategory(b.category)} className="tap flex w-full items-center gap-2.5 py-2.5 text-left">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: categoryTone[b.category] }} />
                <span className="flex-1 text-[0.86rem]">{b.category}</span>
                <span className="num text-[0.7rem] text-ink3">{b.count}×</span>
                <span className="num w-[5.2rem] text-right text-[0.86rem]">{nairaRound(b.amount)}</span>
                <span className="text-ink3" aria-hidden>›</span>
              </button>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={item} className="grid grid-cols-2 gap-3">
        <div className="card-flat p-3.5">
          <p className="eyebrow">Rent · {p.rentDueIn} days</p>
          <p className="num mt-1.5 text-lg font-medium">{naira(ins.rent.perMonth)}</p>
          <p className="text-[0.72rem] leading-snug text-ink2">a month from now reaches {naira(p.rent)} in time</p>
        </div>
        <div className="card-flat p-3.5">
          <p className="eyebrow">Family · monthly</p>
          <p className="num mt-1.5 text-lg font-medium">{nairaRound(ins.family.avg)}</p>
          <p className="text-[0.72rem] leading-snug text-ink2">steady for 3 months. It is a fixed bill in all but name</p>
        </div>
      </motion.section>

      <motion.button variants={item} onClick={onAsk} className="field tap flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-ink3">
        Ask about your money…
        <span className="text-ink">→</span>
      </motion.button>
    </motion.div>
  );
}

/* ------------------------------ Ledger ------------------------------ */

export function Ledger({ ins, filter, setFilter }: { ins: Insights; filter: Category | null; setFilter: (c: Category | null) => void }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const cats = useMemo(() => [...new Set(ins.txns.map((t) => t.category))], [ins]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ins.txns.filter((t) => (!filter || t.category === filter) && (!q || t.narration.toLowerCase().includes(q))).reverse();
  }, [ins, filter, query]);
  const total = rows.reduce((n, t) => n + t.amount, 0);
  const shown = rows.slice(0, limit);

  return (
    <div className="px-5 pb-6">
      <h1 className="display text-[1.9rem]">Every naira, sorted.</h1>
      <p className="mt-1 text-xs text-ink2">{ins.txns.length} transactions over 3 months, read exactly as your bank wrote them.</p>
      <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(40); }} placeholder="Search narrations, e.g. fuel" aria-label="Search transactions" className="field mt-4 w-full px-4 py-2.5 text-sm" />
      <div className="scroll-quiet -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
        <button className="chip tap" aria-pressed={!filter} onClick={() => setFilter(null)}>All</button>
        {cats.map((c) => (
          <button key={c} className="chip tap" aria-pressed={filter === c} onClick={() => { setFilter(filter === c ? null : c); setLimit(40); }}>
            <span className="h-2 w-2 rounded-[2px]" style={{ background: categoryTone[c] }} />
            {c}
          </button>
        ))}
      </div>
      <p className="num mt-3 text-[0.72rem] text-ink2">
        {rows.length} shown · net {naira(total, { sign: true })}
      </p>

      {rows.length === 0 ? (
        <div className="well mt-4 p-6 text-center text-sm text-ink2">Nothing matches that. Clear the search or pick another category.</div>
      ) : (
        <ul className="card mt-2 divide-y divide-rule">
          {shown.map((t, i) => (
            <li key={t.id} className="px-3.5 py-2.5">
              {(i === 0 || shown[i - 1].day !== t.day) && <p className="eyebrow mb-1.5 !text-[0.6rem] text-ink3">{relDay(t.day)}</p>}
              <div className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-[2px]" style={{ background: categoryTone[t.category] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.84rem]">{merchant(t.narration)}</p>
                  <p className="num truncate text-[0.62rem] text-ink3">{t.narration}</p>
                </div>
                <div className="text-right">
                  <p className={`num text-[0.84rem] ${t.amount > 0 ? "text-leaf" : ""}`}>{naira(t.amount, { kobo: t.amount % 1 !== 0, sign: t.amount > 0 })}</p>
                  <p className="text-[0.62rem] text-ink3">{t.category}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {rows.length > limit && (
        <button onClick={() => setLimit((n) => n + 40)} className="btn btn-line mt-3 w-full py-2.5 text-sm">
          Show 40 more
        </button>
      )}
    </div>
  );
}

/* ------------------------------ Ask ------------------------------ */

type Msg = { id: number; from: "you" | "agent"; text: string; tools?: string[] };

export function Chat({ p, ins, onAsked }: { p: Persona; ins: Insights; onAsked: (q: string, tools: string[]) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(1);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    const a = answer(text, ins, p);
    setBusy(true);
    setUsed((u) => [...u, text]);
    setMsgs((m) => [...m, { id: nextId.current++, from: "you", text }]);
    onAsked(text, a.tools);
    a.lines.forEach((line, i) => {
      timers.current.push(
        setTimeout(() => {
          const lastLine = i === a.lines.length - 1;
          setMsgs((m) => [...m, { id: nextId.current++, from: "agent", text: line, tools: lastLine ? a.tools : undefined }]);
          if (lastLine) setBusy(false);
        }, 750 + 900 * i),
      );
    });
  }

  const suggestions = starters(p).filter((s) => !used.includes(s));

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-quiet min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-3">
        {msgs.length === 0 && (
          <div className="pt-4">
            <h1 className="display text-[1.9rem]">Ask it your way.</h1>
            <p className="mt-2 text-[0.84rem] leading-relaxed text-ink2">
              Type any amount: <span className="num">“can I pay 45k for a generator?”</span> Every answer is worked out from {p.name}’s {ins.txns.length} transactions. I show the picture. You make the call.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 28 }} className={`flex flex-col ${m.from === "you" ? "items-end" : "items-start"}`}>
              <p className={m.from === "you" ? "max-w-[86%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[0.86rem] leading-snug text-paper" : "card-flat max-w-[90%] !rounded-2xl !rounded-bl-md px-3.5 py-2.5 text-[0.86rem] leading-snug"}>
                {m.text}
              </p>
              {m.tools && m.tools.length > 0 && (
                <p className="num mt-1.5 flex flex-wrap gap-1 text-[0.6rem] text-ink3" aria-label="Worked out using">
                  {m.tools.map((t) => (
                    <span key={t} className="rounded bg-[#e7e1d3] px-1.5 py-0.5">{t}</span>
                  ))}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex gap-1 px-2 py-1" role="status" aria-label="Working it out">
            {[0, 1, 2].map((d) => (
              <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-ink3" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }} />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="border-t border-rule bg-card/70 px-5 pb-3 pt-2.5">
        {!busy && suggestions.length > 0 && (
          <div className="scroll-quiet -mx-5 mb-2.5 flex gap-1.5 overflow-x-auto px-5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} className="chip tap">{s}</button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); ask(draft); setDraft(""); }} className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Your question" placeholder="Can I pay 45k for…" className="field min-w-0 flex-1 px-4 py-3 text-sm" />
          <button type="submit" disabled={busy || !draft.trim()} className="btn btn-ink w-12 text-base" aria-label="Send">↑</button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------ Alerts ------------------------------ */

export function Alerts({ alerts, handled, onDecide }: { alerts: Alert[]; handled: Record<string, "approved" | "declined">; onDecide: (a: Alert, choice: "approved" | "declined") => void }) {
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="space-y-3 px-5 pb-6">
      <motion.div variants={item}>
        <h1 className="display text-[1.9rem]">What I noticed.</h1>
        <p className="mt-1 text-xs text-ink2">Found in your activity, not written in advance. Suggestions wait for your tap.</p>
      </motion.div>
      {alerts.length === 0 && <div className="well p-6 text-center text-sm text-ink2">Nothing needs your attention right now.</div>}
      {alerts.map((a) => {
        const state = handled[a.id];
        return (
          <motion.article key={a.id} variants={item} layout className={`card p-4 ${a.action && !state ? "!border-ink" : ""}`}>
            <div className="flex items-center justify-between">
              <span className={`num rounded px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider ${a.stage === 2 ? "bg-ink text-paper" : "bg-[#e7e1d3] text-ink2"}`}>{stageName[a.stage]}</span>
              <span className="num text-[0.62rem] text-ink3">{a.when}</span>
            </div>
            <h2 className="mt-2.5 text-[0.95rem] font-semibold leading-snug">{a.title}</h2>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-ink2">{a.body}</p>
            {a.action && (
              <AnimatePresence mode="wait" initial={false}>
                {!state ? (
                  <motion.div key="ask" exit={{ opacity: 0 }} className="mt-3.5 flex gap-2">
                    <button onClick={() => onDecide(a, "approved")} className="btn btn-leaf flex-1 px-3 py-2.5 text-[0.84rem]">{a.action.label}</button>
                    <button onClick={() => onDecide(a, "declined")} className="btn btn-line px-4 py-2.5 text-[0.84rem]">Not now</button>
                  </motion.div>
                ) : (
                  <motion.p key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="status" className={`mt-3.5 rounded-lg px-3.5 py-2.5 text-[0.82rem] ${state === "approved" ? "bg-leafsoft text-leaf" : "bg-[#e7e1d3] text-ink2"}`}>
                    {state === "approved" ? `✓ ${a.action.done}` : "Left as it is. I will not ask again this month."}
                  </motion.p>
                )}
              </AnimatePresence>
            )}
          </motion.article>
        );
      })}
    </motion.div>
  );
}

/* ------------------------------ Record ------------------------------ */

export function Activity({ log }: { log: LogEntry[] }) {
  return (
    <div className="px-5 pb-6">
      <h1 className="display text-[1.9rem]">Everything on record.</h1>
      <p className="mt-1 text-xs text-ink2">Every alert, question and action. Nothing is ever removed.</p>
      <div className="receipt mt-5 px-5 pb-7 pt-5">
        <p className="num text-center text-[0.66rem] uppercase tracking-[0.2em] text-ink2">AI Banker · activity record</p>
        <hr className="dotrule my-3" />
        <ol>
          <AnimatePresence initial={false}>
            {log.map((e) => (
              <motion.li key={e.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                <div className="flex gap-3 py-2">
                  <span className={`num mt-0.5 w-9 shrink-0 text-[0.6rem] uppercase ${e.who === "You" ? "font-semibold text-leaf" : "text-ink3"}`}>{e.who === "You" ? "You" : "Agent"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.82rem] leading-snug">{e.what}</p>
                    <p className="num text-[0.6rem] text-ink3">{e.when}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        <hr className="dotrule my-3" />
        <p className="num text-center text-[0.62rem] text-ink3">{log.length} entries · as of {shortDate(0)}</p>
      </div>
    </div>
  );
}
