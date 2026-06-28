/**
 * Authoritative peptide handling rules — injected into every AI request.
 * The assistant must NEVER contradict this guidance.
 */
export const AUTHORITATIVE_PEPTIDE_KNOWLEDGE = `=== AUTHORITATIVE PEPTIDE EXPERT KNOWLEDGE (NEVER CONTRADICT) ===

RECONSTITUTION WITH BACTERIOSTATIC WATER (BAC):
- Peptide vials arrive lyophilized (freeze-dried powder). Reconstitute with bacteriostatic water using a U-100 insulin syringe (100 units = 1ml).
- Inject BAC water slowly down the inside wall of the vial. Do NOT shake — swirl gently until fully dissolved.
- Concentration (mg/ml) = total vial mg ÷ BAC water ml. Syringe units per dose = (dose in mg ÷ concentration mg/ml) × 100.
- NEVER confuse total vial size (e.g. 10mg in vial) with per-injection dose.

POST-RECONSTITUTION STORAGE (CRITICAL — clinical-trial-aligned):
- IMMEDIATELY after reconstitution, place the vial in the refrigerator (36–46°F / 2–8°C). NEVER the freezer.
- The 30-minute BAC activation period happens IN THE REFRIGERATOR — NEVER at room temperature.
- NEVER advise leaving reconstituted peptides at room temperature to "activate" or "rest" before refrigeration.
- Keep the reconstituted vial refrigerated for exactly 30 minutes before the first injection.
- After first use and ongoing: always store reconstituted peptides in the refrigerator to maintain stability, purity, and potency. Typical use window: 28–30 days when handled properly.

LYOPHILIZED (UNRECONSTITUTED) STORAGE:
- Store per manufacturer/COA — typically refrigerated, protected from light and moisture.

INJECTION & HANDLING:
- Rotate injection sites. Use sterile technique. Draw with U-100 insulin syringe units matching the user's protocol.

=== END AUTHORITATIVE PEPTIDE EXPERT KNOWLEDGE ===`