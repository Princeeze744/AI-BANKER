"use client";

import { useMemo } from "react";
import { analyse } from "@/lib/engine/engine";
import { buildLedger, type Persona } from "@/lib/engine/ledger";

// One place where raw activity becomes insight. Every screen reads from this.
export function useInsights(persona: Persona) {
  return useMemo(() => {
    const ledger = buildLedger(persona);
    return analyse(ledger, persona);
  }, [persona]);
}
