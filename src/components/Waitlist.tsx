"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { scenarios } from "@/lib/scenarios";

export default function Waitlist({ picked, onPick }: { picked: string | null; onPick: (id: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const chosen = scenarios.find((s) => s.id === picked);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("That email does not look right. Check it and try again.");
    setError("");
    setDone(true); // Prototype: nothing is stored or sent yet.
  }

  return (
    <div className="rounded-[1.6rem] bg-ink p-6 text-paper shadow-[0_40px_80px_-40px_rgba(23,20,15,0.8)] sm:p-12">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status" className="py-6">
            <p className="num text-[0.66rem] uppercase tracking-[0.18em] text-mint">You are in</p>
            <h3 className="display mt-3 text-4xl sm:text-5xl">Thank you{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}.</h3>
            <p className="mt-4 max-w-md text-[#cfc8b8]">
              {chosen ? `We noted what matters most to you: “${chosen.title}”. That is what you will see first.` : "We will write to you the moment early access opens."}
            </p>
            <p className="num mt-6 text-[0.66rem] uppercase tracking-[0.16em] text-[#8f887a]">Prototype · this signup was not saved</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} noValidate className="grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="display text-4xl sm:text-[3.4rem]">Be first in line.</h3>
              <p className="mt-4 max-w-sm text-[#cfc8b8]">Tell us which one is yours. It decides what we build first.</p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {scenarios.map((s) => (
                  <button type="button" key={s.id} onClick={() => onPick(s.id)} aria-pressed={s.id === picked} className={`tap rounded-full border px-3 py-1.5 text-[0.76rem] transition ${s.id === picked ? "border-mint bg-mint text-ink" : "border-[#4a443a] text-[#cfc8b8] hover:border-[#8f887a]"}`}>
                    {s.short}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#cfc8b8]">First name</span>
                <input className="field w-full px-4 py-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tunde" autoComplete="given-name" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#cfc8b8]">Email</span>
                <input type="email" required className="field w-full px-4 py-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={!!error} />
              </label>
              {error && <p className="text-sm text-[#ff9b78]" role="alert">{error}</p>}
              <button type="submit" className="btn w-full bg-mint px-6 py-3.5 text-sm font-medium text-ink hover:bg-[#b3ecca]">Join the waitlist</button>
              <p className="text-xs text-[#8f887a]">We never see your bank password. Not now, not ever.</p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
