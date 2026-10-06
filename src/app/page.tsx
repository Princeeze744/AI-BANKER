"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import AlertStack from "@/components/AlertStack";
import Calculator from "@/components/Calculator";
import Waitlist from "@/components/Waitlist";
import { scenarios } from "@/lib/scenarios";

const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 130, damping: 22 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const ladder = [
  ["Notify", "It tells you what it saw. Nothing moves."],
  ["Suggest", "It proposes an action. One tap from you to approve."],
  ["Act, with a window", "It acts, and you have time to cancel."],
  ["Autonomous", "Only for the things you have chosen to hand over."],
];
const promises = [
  ["Your money stays in your bank", "We never hold your funds. Every movement runs through a licensed partner, with your consent."],
  ["We never see your password", "Linking happens on the licensed partner's own secure page. Revoke it any time."],
  ["Every action is on record", "One log shows everything the agent said and did, in the place it happened."],
];
const stats = [
  ["60%+", "of workers live paycheck to paycheck", "Jobberman"],
  ["8 in 10", "support family financially", "PiggyVest"],
  ["Over half", "have no emergency cushion", "PiggyVest"],
];

export default function Home() {
  const [picked, setPicked] = useState<string | null>(null);
  const choose = (id: string) => {
    setPicked(id);
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="grain min-h-screen overflow-x-hidden">
      <p className="num border-b border-rule bg-card/80 px-4 py-2 text-center text-[0.62rem] uppercase tracking-[0.18em] text-ink2">Working prototype · every figure is sample data</p>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="display text-[1.5rem]">
          AI Banker<span className="text-leaf">.</span>
        </span>
        <nav className="flex items-center gap-2">
          <a href="#try" className="hidden px-3 py-2 text-sm text-ink2 hover:text-ink sm:inline">Try your numbers</a>
          <Link href="/app" className="btn btn-ink px-4 py-2.5 text-[0.82rem]">Open the app</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-14">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.p variants={rise} className="eyebrow">For how Nigerians really earn and spend</motion.p>
          <motion.h1 variants={rise} className="display mt-5 text-[3.1rem] sm:text-[4.6rem] lg:text-[5.4rem]">
            Your bank sends alerts. <span className="text-leaf">Nobody sends answers.</span>
          </motion.h1>
          <motion.p variants={rise} className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink2">
            AI Banker reads every debit, credit and charge, tells you in plain words what is coming, and acts only when you say so.
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-2.5">
            <Link href="/app" className="btn btn-ink px-6 py-3.5 text-sm">Try the working prototype →</Link>
            <a href="#waitlist" className="btn btn-line px-6 py-3.5 text-sm">Join the waitlist</a>
          </motion.div>
          <motion.dl variants={rise} className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-rule pt-6">
            {stats.map(([n, t, src]) => (
              <div key={t}>
                <dt className="display text-[1.7rem] sm:text-[2.1rem]">{n}</dt>
                <dd className="mt-1.5 text-[0.76rem] leading-snug text-ink2">
                  {t} <span className="num text-[0.64rem] text-ink3">· {src}</span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.2 }}>
          <AlertStack />
        </motion.div>
      </section>

      <section id="try" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-24 sm:px-8">
        <p className="eyebrow">Not a mock-up</p>
        <h2 className="display mt-3 max-w-3xl text-[2.6rem] sm:text-[3.6rem]">Put your own numbers in.</h2>
        <p className="mb-8 mt-4 max-w-xl text-ink2">Move a slider and watch it recalculate. This is the real engine running, not a picture of one.</p>
        <Calculator />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <p className="eyebrow">Six money moments</p>
        <h2 className="display mt-3 max-w-3xl text-[2.6rem] sm:text-[3.6rem]">Which one sounds like your month?</h2>
        <p className="mt-4 max-w-xl text-ink2">Tap the one that hits closest. It shapes what we build first.</p>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s, i) => {
            const on = picked === s.id;
            return (
              <motion.button key={s.id} variants={rise} whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }} onClick={() => choose(s.id)} aria-pressed={on} className={`card tap flex flex-col p-5 text-left ${on ? "!border-ink" : ""}`}>
                <span className="flex items-center justify-between">
                  <span className="num text-[0.7rem] text-ink3">0{i + 1}</span>
                  <span className={`num rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-wider ${on ? "bg-leaf text-white" : "bg-[#e9e3d5] text-ink2"}`}>{on ? "That’s me ✓" : "This is me"}</span>
                </span>
                <span className="display mt-5 block text-[1.5rem] leading-[1.08]">{s.title}</span>
                <span className="mt-2 block text-[0.88rem] text-ink2">{s.feeling}</span>
                <span className="mt-auto block pt-5">
                  <span className="block border-t border-dashed border-rule pt-3 text-[0.82rem] leading-snug">
                    <span className="num text-[0.62rem] uppercase tracking-wider text-leaf">AI Banker </span>
                    {s.agent}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">You stay in charge</p>
            <h2 className="display mt-3 text-[2.6rem] sm:text-[3.6rem]">Trust is earned one step at a time.</h2>
            <p className="mt-4 max-w-md text-ink2">Every behaviour starts at step one. You move each one up only when the agent has proved itself right.</p>
          </div>
          <motion.ol variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-2 items-end gap-2.5 sm:grid-cols-4">
            {ladder.map(([name, line], i) => (
              <motion.li key={name} variants={rise} className="card flex flex-col p-4" style={{ minHeight: `${8.5 + i * 2.2}rem` }}>
                <span className="num text-[0.66rem] text-leaf">STEP {i + 1}</span>
                <span className="mt-1 text-[1rem] font-semibold leading-tight">{name}</span>
                <span className="mt-auto pt-3 text-[0.78rem] leading-snug text-ink2">{line}</span>
              </motion.li>
            ))}
          </motion.ol>
        </div>
        <div className="mt-10 grid gap-x-10 gap-y-6 border-t border-rule pt-8 md:grid-cols-3">
          {promises.map(([title, body]) => (
            <div key={title}>
              <h3 className="text-[1.02rem] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <Waitlist picked={picked} onPick={setPicked} />
      </section>

      <footer className="border-t border-rule px-5 py-8 text-center text-xs leading-relaxed text-ink3">
        AI Banker shares insight, not investment or credit advice. Working prototype on sample data; no real bank is connected.
        <br />
        Designed and built by Ochidi Prince Onuh.
      </footer>
    </main>
  );
}
