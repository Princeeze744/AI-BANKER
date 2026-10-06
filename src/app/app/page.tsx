import type { Metadata } from "next";
import AppDemo from "@/components/app/AppDemo";
import { personas } from "@/lib/engine/ledger";

export const metadata: Metadata = { title: "AI Banker — working prototype" };

const num = (v: string | string[] | undefined, lo: number, hi: number) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

// Numbers chosen on the landing page arrive in the link, e.g. /app?p=tunde&income=350000
export default async function AppPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const base = personas.find((x) => x.id === q.p) ?? personas[0];
  const initial = {
    ...base,
    income: num(q.income, 60000, 4000000) ?? base.income,
    family: num(q.family, 0, 300000) ?? base.family,
    rent: num(q.rent, 100000, 5000000) ?? base.rent,
  };
  return <AppDemo initial={initial} />;
}
