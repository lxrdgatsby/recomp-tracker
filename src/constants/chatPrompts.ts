export const CHAT_SUGGESTIONS = [
  "Log today's dose",
  'How am I progressing?',
  'Suggest titration',
  'Side effect check-in',
  'Review my current stack',
] as const

export const ASSISTANT_WELCOME =
  "Hey! I'm your peptide protocol assistant. I can help with dosing, side effects, progress tracking, or adjusting your plan. What's on your mind?"

export const FAQ_QUESTIONS = [
  'Are peptides steroids?',
  'What are the benefits of peptides?',
  'Are peptides safe?',
  'Do peptides have risks?',
  'How do you reconstitute peptides?',
  'How do you inject peptides?',
  'How do you store peptides?',
  'How long until results show?',
  'How long do peptides last?',
  'Can peptides be taken orally/topically instead of injected?',
  'How do I choose a reputable source when buying peptides?',
] as const

export type FaqQuestion = (typeof FAQ_QUESTIONS)[number]

/** Authoritative FAQ guidance the AI must follow for specific questions. */
export const FAQ_GUIDANCE: Partial<Record<FaqQuestion, string>> = {
  'How do you reconstitute peptides?': `Provide a clear numbered step-by-step reconstitution guide using U-100 insulin syringes and bacteriostatic water (BAC), aligned with clinical-trial handling practices.

NEVER say to leave reconstituted peptides at room temperature for activation. Activation happens IN THE REFRIGERATOR.

Step 8 MUST use this EXACT wording — do not paraphrase or substitute different storage advice:
8. **Store the Reconstituted Peptide**: Immediately place the reconstituted peptide in the refrigerator (not the freezer) after reconstitution. Keep it refrigerated for exactly 30 minutes before the first use to allow the bacteriostatic water to activate the peptides. Always keep your peptides stored in the refrigerator to maintain its stability, purity and potency. (IMPORTANT)`,

  'How do you store peptides?': `Provide a clear numbered storage guide covering both lyophilized (unreconstituted) and reconstituted peptides.

NEVER say to leave reconstituted peptides at room temperature for activation. NEVER say "30 minutes at room temperature." Activation happens IN THE REFRIGERATOR only.

Step 2 MUST use this EXACT wording — do not paraphrase or substitute different storage advice:
2. **After Reconstitution**: **IMPORTANT**: Immediately store the reconstituted peptide in the refrigerator (not the freezer) after reconstitution. Keep it refrigerated for exactly 30 minutes before the first use to allow the bacteriostatic water to activate the peptides. Never leave reconstituted peptides at room temperature for activation. Always keep your peptides stored in the refrigerator to maintain stability, purity, and potency.`,
}

export function getFaqGuidance(question: string): string | undefined {
  return FAQ_GUIDANCE[question as FaqQuestion]
}