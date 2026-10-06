"use client";

import { naira } from "@/lib/format";

export default function Slider({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; suffix?: string }) {
  const v = Math.min(max, Math.max(min, value));
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8rem] opacity-80">{label}</span>
        <span className="num text-[0.95rem] font-medium">
          {naira(v)}
          {suffix && <span className="text-[0.7rem] font-normal opacity-60"> {suffix}</span>}
        </span>
      </span>
      <input type="range" className="slider mt-2.5" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} style={{ "--p": `${((v - min) / (max - min)) * 100}%` } as React.CSSProperties} />
    </label>
  );
}

export const ranges = {
  salaried: { income: [80000, 1500000, 10000], label: "Monthly salary" },
  trader: { income: [200000, 4000000, 50000], label: "Monthly sales" },
  rider: { income: [60000, 600000, 10000], label: "Monthly earnings" },
} as const;
