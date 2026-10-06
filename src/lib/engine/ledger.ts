// Builds three months of realistic Nigerian bank activity for a persona.
// The ledger carries NO categories. It is raw narrations and amounts, the same shape an
// account aggregator returns. Everything the app shows is worked out by engine.ts.
import { dom, dow, monShort } from "@/lib/format";

export type Txn = { id: number; day: number; narration: string; amount: number; balance: number };

export type PersonaKind = "salaried" | "trader" | "rider";
export type Persona = {
  id: string;
  kind: PersonaKind;
  name: string;
  role: string;
  city: string;
  bank: string;
  income: number; // typical money in per month
  family: number; // typical family support per month
  rent: number; // annual rent
  rentDueIn: number; // days from today
  fees: number; // school fees per term
};

export const personas: Persona[] = [
  { id: "tunde", kind: "salaried", name: "Tunde", role: "Logistics officer", city: "Lagos", bank: "Harbour Bank", income: 280000, family: 52000, rent: 720000, rentDueIn: 178, fees: 85000 },
  { id: "ngozi", kind: "trader", name: "Ngozi", role: "Provisions shop owner", city: "Port Harcourt", bank: "Delta Trust", income: 850000, family: 60000, rent: 650000, rentDueIn: 96, fees: 120000 },
  { id: "musa", kind: "rider", name: "Musa", role: "Dispatch rider", city: "Abuja", bank: "Kora Microfinance", income: 210000, family: 36000, rent: 300000, rentDueIn: 140, fees: 40000 },
];

export const DAYS = 92;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const people = ["OKONKWO EMEKA", "BALOGUN SEUN", "EZE AMARA", "YUSUF KABIR", "ADEYEMI TOLA", "NWOSU IFEANYI", "DANJUMA RUTH", "OJO BISI", "UCHE CHIDERA", "LAWAL RASHEED", "EKPO IMA", "ABUBAKAR SANI"];
const eateries = ["MAMA NKECHI KITCHEN", "SHOPWELL SUPERMKT", "CHOPNOW FOOD", "BUKA EXPRESS", "FRESHBASKET MART"];

export function buildLedger(p: Persona): Txn[] {
  const r = rng(p.id.split("").reduce((n, c) => n * 31 + c.charCodeAt(0), 7));
  const between = (lo: number, hi: number, step = 50) => Math.round((lo + r() * (hi - lo)) / step) * step;
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const txns: Txn[] = [];
  let bal = p.kind === "salaried" ? 38000 : p.kind === "trader" ? 95000 : 14000;
  let id = 1;

  const post = (day: number, narration: string, amount: number, force = false) => {
    amount = Math.round(amount * 100) / 100;
    if (amount < 0 && !force && bal + amount < 1200) return false; // would not go through
    if (amount < 0 && bal + amount < 0) return false;
    bal = Math.round((bal + amount) * 100) / 100;
    txns.push({ id: id++, day, narration, amount, balance: bal });
    return true;
  };
  const fee = (amt: number) => (amt <= 5000 ? 10.75 : amt <= 50000 ? 26.88 : 53.75);
  const send = (day: number, to: string, note: string, amt: number, force = false) => {
    if (post(day, `NIP TRF TO ${to} /${note}`, -amt, force)) post(day, "NIP TRANSFER FEE + VAT", -fee(amt), true);
  };
  const receive = (day: number, narration: string, amt: number) => {
    post(day, narration, amt);
    if (amt >= 10000) post(day, "ELECTRONIC MONEY TRANSFER LEVY", -50, true);
  };

  const scale = (base: number) => Math.pow(p.income / base, 0.7);

  for (let day = -(DAYS - 1); day <= 0; day++) {
    const d = dom(day);
    const wd = dow(day);
    const weekday = wd >= 1 && wd <= 5;

    if (p.kind === "salaried") {
      const k = scale(280000);
      if (d === 25) receive(day, `SALARY ${monShort(day)} 2026 - BRIGHTPATH LOGISTICS LTD`, p.income);
      if (d === 26) send(day, "ADEBAYO FOLASADE", "MUMMY UPKEEP", Math.round((p.family * 0.45) / 500) * 500, true);
      if (d === 2) send(day, "ADEBAYO KUNLE", "SCHOOL SUPPORT", Math.round((p.family * 0.35) / 500) * 500, true);
      if (d === 13 && r() < 0.85) send(day, pick(["ADEBAYO SIMI", "ADEBAYO FOLASADE"]), "FAMILY SUPPORT", Math.round((p.family * (0.12 + r() * 0.18)) / 500) * 500);
      if (d === 8) post(day, "RECURRING CARD PYMT - STREAMBOX NG", -4400, true);
      if (d === 15) post(day, "RECURRING CARD PYMT - TUNEWAVE MUSIC", -1300, true);
      if (d === 3) post(day, "CABLEVIEW TV SUBSCRIPTION", -6100, true);
      if (d === 1) post(day, "DATA BUNDLE 25GB - 0803****211", -6500, true);
      if (d === 5 || d === 20) post(day, "PREPAID METER TOKEN - CITYPOWER DISCO", -between(4500, 8000, 500));
      if (d === 28) post(day, "SMS ALERT CHARGES", -between(280, 460, 4), true);
      if (d === 30 && [8].includes(dateMonth(day))) post(day, "CARD MAINTENANCE FEE + VAT", -53.75, true);

      // Spending runs hot right after payday and tightens before the next one.
      const since = d >= 25 ? d - 25 : d + 6;
      const heat = since <= 6 ? 1.4 : since <= 15 ? 1 : 0.6;
      if (r() < 0.8 * Math.min(heat, 1.15)) {
        const n = r() < 0.2 * heat ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const place = pick(eateries);
          const web = place === "CHOPNOW FOOD";
          post(day, `${web ? "WEB PURCHASE" : "POS PURCHASE"} - ${place}${web ? "" : " IKEJA"}`, -between(1600, 5600) * k * heat);
        }
      }
      if (weekday && r() < 0.82) post(day, "WEB PURCHASE - RIDEGO TRIP", -between(1200, 3400) * k);
      if (wd === 6 && r() < 0.8) post(day, "POS PURCHASE - FILLRITE FUEL STN", -between(6000, 10000, 500) * k);
      if (r() < 0.22) post(day, "AIRTIME PURCHASE - 0803****211", -pick([500, 1000, 1000, 2000]));
      if (r() < 0.06 * heat) {
        post(day, "ATM CASH WITHDRAWAL - HARBOUR BANK ALLEN", -pick([10000, 20000]) * Math.round(k));
      }
      if (r() < 0.14 * heat) send(day, pick(people), pick(["THANKS", "CONTRIBUTION", "REFUND", "ASO EBI", "PAYMENT"]), between(3000, 14000, 500) * k);
    }

    if (p.kind === "trader") {
      const k = p.income / 850000;
      if (wd !== 0) {
        const sales = 2 + Math.floor(r() * 4);
        for (let i = 0; i < sales; i++) receive(day, `NIP TRF FRM ${pick(people)} /GOODS`, between(2500, 16000, 500) * k);
        if (r() < 0.72) receive(day, "POS SETTLEMENT - PAYPOINT TERMINAL 2044", between(6000, 30000, 100) * k);
      }
      if ((wd === 2 || wd === 5) && bal > 90000 * k) send(day, "GOLDEN CROWN WHOLESALE", "GOODS", Math.round((bal * (0.42 + r() * 0.16)) / 1000) * 1000, true);
      if (wd === 5) send(day, "UNITY TRADERS AJO", "CONTRIBUTION", 15000, true);
      if (day === -38) receive(day, "NIP TRF FRM UNITY TRADERS AJO /PAYOUT", 180000);
      if (wd === 1) send(day, "NWACHUKWU PATIENCE", "MAMA UPKEEP", Math.round((p.family / 4.3) / 500) * 500, true);
      if (d === 4) post(day, "RECURRING CARD PYMT - STREAMBOX NG", -4400, true);
      if (d === 10) post(day, "SHOP SECURITY LEVY - MILE 3 MARKET ASSOC", -5000, true);
      if (d === 1 || d === 16) post(day, "DATA BUNDLE 10GB - 0706****884", -3500, true);
      if (d === 28) post(day, "SMS ALERT CHARGES", -between(900, 1400, 4), true);
      if (r() < 0.7) post(day, `POS PURCHASE - ${pick(eateries)} PH`, -between(1500, 5200));
      if (r() < 0.55) post(day, "POS PURCHASE - KEKE & BUS FARE AGENT", -between(600, 1800, 100));
      if (d === 7 || d === 22) post(day, "PREPAID METER TOKEN - GARDENCITY DISCO", -between(6000, 11000, 500));
      if (r() < 0.07) send(day, pick(people), pick(["LOAN TO FRIEND", "CHURCH LEVY", "CONTRIBUTION"]), between(4000, 15000, 500));
    }

    if (p.kind === "rider") {
      const k = p.income / 210000;
      if (wd !== 0) post(day, "SWIFTDROP RIDER PAYOUT", between(5200, 10800, 100) * k);
      if (wd === 0 && r() < 0.6) receive(day, "SWIFTDROP WEEKLY BONUS", between(4000, 12000, 500) * k);
      if (wd !== 0) post(day, "POS PURCHASE - FILLRITE FUEL STN", -between(2000, 3600, 100));
      if (wd === 1) post(day, "MOTOLEASE BIKE HIRE PURCHASE", -12000, true);
      if (wd === 6) send(day, "IBRAHIM HAUWA", "HOME", Math.round((p.family / 4.3) / 500) * 500, true);
      if (r() < 0.85) post(day, `POS PURCHASE - ${pick(["BUKA EXPRESS", "MAMA NKECHI KITCHEN", "SUYA SPOT WUSE"])}`, -between(900, 2600, 100));
      if (r() < 0.4) post(day, "AIRTIME PURCHASE - 0812****067", -pick([200, 300, 500]));
      if (wd === 3) post(day, "DATA BUNDLE 3GB - 0812****067", -1500);
      if (d === 11) post(day, "RECURRING CARD PYMT - TUNEWAVE MUSIC", -1300, true);
      if (d === 28) post(day, "SMS ALERT CHARGES", -between(180, 300, 4), true);
      if (r() < 0.06) post(day, "POS PURCHASE - ZUBA MOTO SPARES", -between(4000, 14000, 500));
      if (r() < 0.05) send(day, pick(people), "PAYMENT", between(2000, 8000, 500));
    }
  }
  return txns;
}

function dateMonth(day: number) {
  return new Date(Date.UTC(2026, 9, 6) + day * 86400000).getUTCMonth();
}
