"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { personas } from "@/lib/engine/ledger";
import { dayDate, naira, nairaRound } from "@/lib/format";
import { useInsights } from "@/lib/usePersona";

const ngn = (n: number) => "NGN" + naira(Math.abs(n), { kobo: true }).slice(1);

// The alerts are real rows from the sample ledger. The answer is the engine's reading of them.
export default function AlertStack() {
  const ins = useInsights(personas[0]);
  const sms = useMemo(() => ins.txns.filter((t) => t.amount < 0 && t.category !== "Bank charges").slice(-6), [ins]);
  const [step, setStep] = useState(0);
  const done = step > sms.length;

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s > sms.length ? 0 : s + 1)), step === 0 ? 500 : done ? 7000 : 620);
    return () => clearTimeout(t);
  }, [step, done, sms.length]);

  const [a, b] = ins.breakdown;
  const days = -ins.cycleStart - 1;

  return (
    <div className="relative mx-auto h-[25rem] w-full max-w-[22rem]" aria-live="off">
      <AnimatePresence>
        {!done &&
          sms.slice(0, step).map((t, i) => {
            const depth = step - 1 - i;
            if (depth > 3) return null;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -30, scale: 0.96 }}
                animate={{ opacity: 1 - depth * 0.22, y: depth * 74, scale: 1 - depth * 0.035 }}
                exit={{ opacity: 0, y: 150, scale: 0.7, transition: { duration: 0.35 } }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                style={{ zIndex: 10 - depth }}
                className="card absolute inset-x-0 top-0 p-3.5"
              >
                <div className="flex items-center justify-between text-[0.68rem] text-ink3">
                  <span className="font-medium text-ink2">HarbourBank</span>
                  <span>{depth === 0 ? "now" : `${depth * 2}h ago`}</span>
                </div>
                <p className="num mt-1.5 text-[0.72rem] leading-relaxed">
                  Acct: ******4471 · <span className="text-clay">DR {ngn(t.amount)}</span>
                  <br />
                  <span className="text-ink2">Desc: {t.narration}</span>
                  <br />
                  Avail Bal: {ngn(t.balance)}
                </p>
              </motion.div>
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {done && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.25 }}
            className="absolute inset-x-0 top-6 rounded-[1.4rem] bg-ink p-6 text-paper shadow-[0_40px_70px_-30px_rgba(23,20,15,0.8)]"
          >
            <p className="num text-[0.62rem] uppercase tracking-[0.18em] text-mint">AI Banker · {ins.txns.length} alerts read</p>
            <p className="display mt-4 text-[1.9rem] leading-[1.05]">
              {nairaRound(ins.moneyOut)} has gone out in {days} days.
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#cfc8b8]">
              {a.category} took {nairaRound(a.amount)}, {b.category.toLowerCase()} {nairaRound(b.amount)}.
              {ins.lowDay && ` At this pace you drop under ${naira(ins.threshold)} around ${dayDate(ins.lowDay.day)}, ${(ins.income.nextDay ?? 0) - ins.lowDay.day} days before payday.`}
            </p>
            <div className="mt-5 flex h-2 gap-[2px] overflow-hidden rounded-full">
              {ins.breakdown.map((x, i) => (
                <motion.span key={x.category} className="bg-mint" style={{ opacity: 1 - i * 0.13 }} initial={{ width: 0 }} animate={{ width: `${(x.amount / ins.moneyOut) * 100}%` }} transition={{ delay: 0.6 + i * 0.06, duration: 0.5 }} />
              ))}
            </div>
            <p className="num mt-4 text-[0.66rem] text-[#8f887a]">Worked out from sample data, live in your browser.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
