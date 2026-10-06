// Single source of truth for trust and consent wording (PRD v3, section 5.4.1).
// Compliance reviews this one file; no screen writes its own version.
export const trustCopy = {
  ONBOARDING_TRUST_SCREEN: {
    title: "Before anything else, three promises.",
    points: [
      ["We never see your bank password", "You sign in on a licensed partner's page, not ours."],
      ["Your money stays in your bank", "We hold nothing. We can only act where you allow it."],
      ["Nothing moves without you", "Every behaviour starts at notify-only. You raise it, or you don't."],
    ],
    learning: "We learn from how you use the app, in anonymous form, to make it more useful.",
    cta: "I understand, continue",
  },
  PRELINK_CONSENT_SCREEN: {
    title: "You are about to leave AI Banker for a moment.",
    body: "The next page is run by a CBN-licensed data partner, not by us. They confirm it is you, then give us read-only access to your transactions.",
    points: ["Read-only. We cannot move money with this link.", "Revoke it at any time from Settings."],
    cta: "Open the secure page",
  },
  POSTLINK_CONFIRM_TOAST: "Account linked securely through our licensed partner.",
} as const;
