"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAlerts, type Alert } from "@/lib/engine/alerts";
import type { Category } from "@/lib/engine/engine";
import { personas, type Persona } from "@/lib/engine/ledger";
import { trustCopy } from "@/lib/trust-copy";
import { useInsights } from "@/lib/usePersona";
import EnginePanel from "./EnginePanel";
import Onboarding from "./Onboarding";
import { Activity, Alerts, Chat, Home, Ledger, type LogEntry } from "./Screens";

type Tab = "home" | "ledger" | "chat" | "alerts" | "record";
const tabs: { id: Tab; label: string; d: string }[] = [
  { id: "home", label: "Home", d: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" },
  { id: "ledger", label: "Activity", d: "M5 7h14M5 12h14M5 17h9" },
  { id: "chat", label: "Ask", d: "M5 6h14v10h-7l-4 3.5V16H5z" },
  { id: "alerts", label: "Alerts", d: "M7 16V11a5 5 0 0 1 10 0v5l1.5 2h-13zM10.5 20h3" },
  { id: "record", label: "Record", d: "M7 4h10v16l-2.5-1.6L12 20l-2.5-1.6L7 20zM10 9h4M10 12.5h4" },
];

export default function AppDemo({ initial }: { initial: Persona }) {
  const [p, setP] = useState<Persona>(initial);
  const [linked, setLinked] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [filter, setFilter] = useState<Category | null>(null);
  const [handled, setHandled] = useState<Record<string, "approved" | "declined">>({});
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [feed, setFeed] = useState<{ q: string; tools: string[] }[]>([]);
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState(false);
  const nextId = useRef(1000);

  const ins = useInsights(p);
  const alerts = useMemo(() => buildAlerts(ins), [ins]);
  const log = useMemo<LogEntry[]>(
    () => [...entries, ...alerts.map((a, i) => ({ id: i, who: "AI Banker" as const, what: `Sent alert: ${a.title}`, when: a.when }))],
    [entries, alerts],
  );

  const addLog = useCallback((who: LogEntry["who"], what: string) => {
    setEntries((l) => [{ id: nextId.current++, who, what, when: "Just now" }, ...l]);
  }, []);

  const onLinked = useCallback(() => {
    setLinked(true);
    addLog("You", `Linked ${initial.bank} with read-only access, through the licensed partner`);
    setToast(trustCopy.POSTLINK_CONFIRM_TOAST);
  }, [addLog, initial.bank]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3400);
    return () => clearTimeout(id);
  }, [toast]);

  function switchTo(id: string) {
    const next = personas.find((x) => x.id === id);
    if (!next || next.id === p.id) return;
    setP(next);
    setHandled({});
    setEntries([]);
    setFeed([]);
    setFilter(null);
    setLinked(true);
    setTab("home");
  }

  function decide(a: Alert, choice: "approved" | "declined") {
    if (!a.action) return;
    setHandled((h) => ({ ...h, [a.id]: choice }));
    if (choice === "approved") {
      addLog("You", `Approved: ${a.action.log}`);
      addLog("AI Banker", `${a.action.log}, on your approval`);
      setToast(a.action.done);
    } else addLog("You", `Declined: ${a.action.log}`);
  }

  const waiting = alerts.filter((a) => a.action && !handled[a.id]).length;
  const panel = <EnginePanel p={p} ins={ins} feed={feed} onSwitch={switchTo} onChange={(patch) => setP((x) => ({ ...x, ...patch }))} />;

  return (
    <main className="grain flex min-h-[100dvh] flex-col items-center justify-center md:py-4">
      <div className="hidden w-full max-w-[54rem] items-center justify-between px-6 pb-4 text-xs text-ink2 md:flex">
        <Link href="/" className="tap hover:text-ink">← Landing page</Link>
        <span className="num rounded-full border border-rule bg-card px-2.5 py-1 text-[0.6rem] uppercase tracking-widest">Working prototype · sample data</span>
      </div>

      <div className="flex w-full items-stretch justify-center gap-6 md:px-6">
        <div className="app-frame h-[100dvh] w-full md:h-[min(47.5rem,calc(100dvh-5.5rem))] md:w-[24rem] md:shrink-0">
          <div className="app-screen relative flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between px-5 pb-3 pt-4">
              <span className="display text-[1.15rem]">
                AI Banker<span className="text-leaf">.</span>
              </span>
              <button onClick={() => setSheet(true)} className="num tap rounded-full bg-night px-3 py-1.5 text-[0.62rem] uppercase tracking-wider text-mint lg:hidden">
                Engine room
              </button>
              <span className="num hidden text-[0.62rem] uppercase tracking-wider text-ink3 lg:inline">{linked ? `${p.bank} · read-only` : "Sample data"}</span>
            </header>

            {!linked ? (
              <Onboarding bank={p.bank} txnCount={ins.txns.length} onLinked={onLinked} onSkip={() => setLinked(true)} />
            ) : (
              <>
                <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div key={`${tab}-${p.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="h-full">
                      {tab === "home" && <Home p={p} ins={ins} onAsk={() => setTab("chat")} onCategory={(c) => { setFilter(c); setTab("ledger"); }} />}
                      {tab === "ledger" && <Ledger ins={ins} filter={filter} setFilter={setFilter} />}
                      {tab === "chat" && <Chat p={p} ins={ins} onAsked={(q, tools) => { addLog("You", `Asked: “${q}”`); setFeed((f) => [{ q, tools }, ...f]); }} />}
                      {tab === "alerts" && <Alerts alerts={alerts} handled={handled} onDecide={decide} />}
                      {tab === "record" && <Activity log={log} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <nav className="grid grid-cols-5 border-t border-rule bg-card px-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1.5" aria-label="App sections">
                  {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined} className={`tap relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[0.62rem] transition-colors ${tab === t.id ? "text-ink" : "text-ink3"}`}>
                      {tab === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-[#e9e3d5]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                      <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={t.d} />
                      </svg>
                      <span className="relative">{t.label}</span>
                      {t.id === "alerts" && waiting > 0 && <span className="num absolute right-[22%] top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[0.58rem] text-white">{waiting}</span>}
                    </button>
                  ))}
                </nav>
              </>
            )}

            <AnimatePresence>
              {toast && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 320, damping: 26 }} role="status" className="absolute inset-x-4 bottom-20 z-10 flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[0.82rem] text-paper shadow-xl">
                  <span className="text-mint">✓</span>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <aside className="hidden h-[min(47.5rem,calc(100dvh-5.5rem))] w-[24rem] shrink-0 lg:block" aria-label="Engine room">{panel}</aside>
      </div>

      <AnimatePresence>
        {sheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 flex items-end justify-center bg-ink/50 lg:hidden" onClick={() => setSheet(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }} className="flex h-[88dvh] w-full max-w-md flex-col gap-2 p-2" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Engine room">
              <div className="min-h-0 flex-1">{panel}</div>
              <button onClick={() => setSheet(false)} className="btn btn-leaf py-3.5 text-sm shadow-xl">See it in the app</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
