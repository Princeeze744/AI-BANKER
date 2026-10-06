"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { trustCopy } from "@/lib/trust-copy";

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { type: "spring" as const, stiffness: 280, damping: 30 },
};
const order = ["trust", "consent", "partner", "linking"] as const;
type Step = (typeof order)[number];

export default function Onboarding({ bank, txnCount, onLinked, onSkip }: { bank: string; txnCount: number; onLinked: () => void; onSkip: () => void }) {
  const [step, setStep] = useState<Step>("trust");
  const [read, setRead] = useState(0);
  const t = trustCopy.ONBOARDING_TRUST_SCREEN;
  const c = trustCopy.PRELINK_CONSENT_SCREEN;

  useEffect(() => {
    if (step !== "linking") return;
    const started = Date.now();
    const tick = setInterval(() => {
      const f = Math.min(1, (Date.now() - started) / 1900);
      setRead(Math.round(txnCount * f));
      if (f >= 1) {
        clearInterval(tick);
        setTimeout(onLinked, 450);
      }
    }, 40);
    return () => clearInterval(tick);
  }, [step, txnCount, onLinked]);

  return (
    <div className="flex h-full flex-col px-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {order.slice(0, 3).map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= order.indexOf(step) ? "bg-ink" : "bg-rule"}`} />
          ))}
        </div>
        <button onClick={onSkip} className="tap text-xs text-ink3 underline-offset-2 hover:text-ink hover:underline">
          Skip intro
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === "trust" && (
          <motion.div key="trust" {...slide} className="scroll-quiet flex min-h-0 flex-1 flex-col overflow-y-auto">
            <h1 className="display mt-5 text-[1.85rem] sm:mt-7 sm:text-[2.15rem]">{t.title}</h1>
            <ul className="mt-6 space-y-2.5">
              {t.points.map(([head, sub], i) => (
                <motion.li key={head} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.1 }} className="card-flat flex gap-3 p-3.5">
                  <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf text-[0.62rem] text-white">{i + 1}</span>
                  <span>
                    <span className="block text-[0.9rem] font-medium leading-snug">{head}</span>
                    <span className="mt-0.5 block text-[0.78rem] leading-relaxed text-ink2">{sub}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
            <p className="mb-4 mt-3 text-[0.7rem] leading-relaxed text-ink3">{t.learning}</p>
            <button onClick={() => setStep("consent")} className="btn btn-ink mt-auto w-full shrink-0 px-6 py-3.5 text-sm">
              {t.cta}
            </button>
          </motion.div>
        )}

        {step === "consent" && (
          <motion.div key="consent" {...slide} className="scroll-quiet flex min-h-0 flex-1 flex-col overflow-y-auto">
            <h1 className="display mt-7 text-[2rem]">{c.title}</h1>
            <p className="mt-4 text-[0.9rem] leading-relaxed text-ink2">{c.body}</p>
            <div className="well mt-5 space-y-2.5 p-4">
              {c.points.map((p) => (
                <p key={p} className="flex gap-2.5 text-[0.84rem]">
                  <span className="text-leaf">✓</span>
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-auto flex shrink-0 gap-2 pt-4">
              <button onClick={() => setStep("trust")} className="btn btn-line px-5 py-3.5 text-sm">
                Back
              </button>
              <button onClick={() => setStep("partner")} className="btn btn-ink flex-1 px-6 py-3.5 text-sm">
                {c.cta}
              </button>
            </div>
          </motion.div>
        )}

        {step === "partner" && (
          <motion.div key="partner" {...slide} className="scroll-quiet mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl bg-[#10233a] p-5 text-[#eaf1f8]">
            <p className="num text-[0.6rem] uppercase tracking-[0.18em] text-[#8fb1d4]">Licensed data partner · secure page</p>
            <h2 className="mt-2 text-lg font-semibold">Confirm it is you</h2>
            <p className="mt-1 text-xs text-[#8fb1d4]">Simulated for this prototype. No real bank is contacted.</p>
            <div className="mt-5 rounded-xl bg-white/10 p-4">
              <p className="text-[0.7rem] text-[#8fb1d4]">Bank</p>
              <p className="mt-0.5 font-medium">{bank}</p>
              <p className="mt-3 text-[0.7rem] text-[#8fb1d4]">AI Banker will receive</p>
              <p className="mt-0.5 text-sm">Transactions and balance, read-only</p>
              <p className="mt-3 text-[0.7rem] text-[#8fb1d4]">AI Banker will never receive</p>
              <p className="mt-0.5 text-sm">Your password, PIN or token</p>
            </div>
            <button onClick={() => setStep("linking")} className="btn mt-auto w-full shrink-0 bg-white px-6 py-3.5 text-sm text-[#10233a]">
              Give read-only access
            </button>
          </motion.div>
        )}

        {step === "linking" && (
          <motion.div key="linking" {...slide} className="flex flex-1 flex-col justify-center" role="status">
            <p className="eyebrow">Reading 3 months of activity</p>
            <p className="num mt-3 text-6xl font-medium">{read}</p>
            <p className="mt-1 text-sm text-ink2">of {txnCount} transactions from {bank}</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-rule">
              <div className="h-full rounded-full bg-leaf transition-[width] duration-75" style={{ width: `${(read / txnCount) * 100}%` }} />
            </div>
            <p className="mt-4 text-xs text-ink3">Sorting each one, finding repeat payments, working out your pace.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
