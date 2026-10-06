import type { Insights } from "@/lib/engine/engine";
import { naira, shortDate } from "@/lib/format";

// Solid line: what happened. Dashed line: where the engine expects it to go.
export default function BalanceChart({ ins, dark = false, height = 120 }: { ins: Insights; dark?: boolean; height?: number }) {
  const W = 320;
  const H = height;
  const pad = { t: 10, b: 18, l: 2, r: 2 };
  const pts = [...ins.history, ...ins.forecast.slice(1)];
  const minD = pts[0].day;
  const maxD = pts[pts.length - 1].day;
  const maxB = Math.max(...pts.map((p) => p.balance), ins.threshold * 2) * 1.08;
  const x = (d: number) => pad.l + ((d - minD) / (maxD - minD)) * (W - pad.l - pad.r);
  const y = (b: number) => pad.t + (1 - b / maxB) * (H - pad.t - pad.b);
  const line = (xs: { day: number; balance: number }[]) => xs.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.balance).toFixed(1)}`).join(" ");
  const ink = dark ? "#dfe8e2" : "#17140f";
  const soft = dark ? "#5f7267" : "#8f887a";
  const leaf = dark ? "#9be3b9" : "#0b5d3b";
  const clay = dark ? "#ff9b78" : "#c8401a";
  const hist = line(ins.history);
  const area = `${hist} L${x(0).toFixed(1)},${H - pad.b} L${x(minD).toFixed(1)},${H - pad.b} Z`;
  const pay = ins.income.regular && ins.income.nextDay && ins.income.nextDay <= maxD ? ins.income.nextDay : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label={`Balance over the last 30 days and the forecast ahead. Today ${naira(ins.balance)}.${ins.lowDay ? ` Expected to drop under ${naira(ins.threshold)} around ${shortDate(ins.lowDay.day)}.` : ""}`}>
      <line x1={pad.l} x2={W - pad.r} y1={y(ins.threshold)} y2={y(ins.threshold)} stroke={clay} strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
      <path d={area} fill={leaf} opacity={dark ? 0.12 : 0.09} />
      <path d={hist} fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line(ins.forecast)} fill="none" stroke={leaf} strokeWidth="1.8" strokeDasharray="1 5" strokeLinecap="round" />
      <line x1={x(0)} x2={x(0)} y1={pad.t - 4} y2={H - pad.b} stroke={soft} strokeWidth="1" />
      <circle cx={x(0)} cy={y(ins.balance)} r="4" fill={dark ? "#111814" : "#fbf9f5"} stroke={ink} strokeWidth="2" />
      {ins.lowDay && <circle cx={x(ins.lowDay.day)} cy={y(ins.lowDay.balance)} r="4.5" fill={clay} stroke={dark ? "#111814" : "#fbf9f5"} strokeWidth="2" />}
      <g fontSize="8.5" fontFamily="var(--font-mono)" fill={soft}>
        <text x={pad.l} y={H - 4}>{shortDate(minD)}</text>
        <text x={x(0)} y={H - 4} textAnchor="middle" fill={ink}>today</text>
        {pay && <text x={x(pay)} y={H - 4} textAnchor="middle" fill={leaf}>payday</text>}
        {!pay && <text x={W - pad.r} y={H - 4} textAnchor="end">{shortDate(maxD)}</text>}
        {ins.lowDay && <text x={x(ins.lowDay.day)} y={y(ins.lowDay.balance) - 9} textAnchor="middle" fill={clay}>low</text>}
      </g>
    </svg>
  );
}
