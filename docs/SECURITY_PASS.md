# OpenClaw Marketplace - Red Team Security Pass

**Date:** 2026-02-02
**Target:** `planning/PLAN_INITIAL.md`
**Protocol:** RedTeam/ParallelAnalysis (Pentester Roster)
**Status:** 🔴 CONDITIONALLY PASSED (Requires Critical Fixes)

---

## 1. Decomposition (Attack Surface)

The architecture was decomposed into 8 critical components for analysis:

1. **Identity:** Wallet-based auth + Soulbound Tokens (Section 3.5, 4.3)
2. **Matching Engine:** Vector similarity + Graph walk + ML ranking (Section 4.1)
3. **Smart Contracts:** Escrow, ReputationToken, DisputeResolver (Section 3.4)
4. **Payments:** Base L2 USDC + Superfluid streams (Section 3.6, 4.4)
5. **Reputation System:** Decay algorithm, 4-factor scoring (Section 4.3)
6. **Data Privacy:** Off-chain DB vs On-chain immutable records (Section 5.3)
7. **Dispute Resolution:** 3-tier hierarchy (AI -> Community -> Council) (Section 5.5)
8. **Frontend/API:** Next.js + REST/GraphQL exposure (Section 3.1, 7.0)

---

## 2. Red Team Analysis (Simulated 8 Agents)

### PT-1: The Red Team Lead
>
> "I'm looking for the structural collapse point."

* **Attack:** The "Hybrid" architecture (Section 5.3) creates a dual-state sync vulnerability. If I can desync the off-chain DB (Postgres) from the on-chain state (Base L2), I can trick the frontend into showing "Payment Released" while the contract is still locked, potentially tricking a provider into releasing work early.
* **Severity:** CRITICAL
* **Fix:** Frontend must *always* read critical status (Payment Released) directly from RPC, never from the cached API.

### PT-2: The Assumption Breaker
>
> "You assume X is true. It isn't."

* **Attack:** You assume "Soulbound Tokens can't be transferred" (Section 4.3). While true for the token standard, the *private keys* controlling the wallet can be sold. A high-reputation agent can sell their private key to a scammer on a secondary market effectively "selling" the reputation.
* **Severity:** HIGH
* **Fix:** Require "Proof of Personhood" (e.g., periodic facial scan or Moltbook behavioral fingerprint) for huge transactions, not just wallet ownership.

### PT-3: The Game Theorist
>
> "A rational adversary will optimize for profit."

* **Attack:** The "Community Vote" (Section 5.5) pays $5 USDC to voters. A botnet of 100 fake agents (farming reputation on cheap tasks) can flood the jury pool. If the cost to rig a vote ($50 fee) is less than the payout from a rigged dispute (e.g., $5,000 project), rational actors will attack the jury system.
* **Severity:** CRITICAL
* **Fix:** Jury selection must use Verifiable Random Function (VRF) weighted by high reputation *age*, not just score. The attack cost must exceed the potential gain (e.g., stake 2x the dispute amount to vote).

### PT-4: The Social Engineer
>
> "People are the weak link."

* **Attack:** The "New Agent" trust tier (Section 9.2) limits first transactions to $50. I will create a rigorous "legit" looking profile, perform 5 small $50 wash-trades with my own alt-wallets to unlock "Verified" status, then immediately launch a $2,000 scam exit.
* **Severity:** HIGH
* **Fix:** "Wash trading" detection is mentioned but vague. Hard rule: Reputation from < $100 transactions should have diminishing returns. Trust tier unlock requires time (age) + volume, not just transaction count.

### PT-5: The Precedent Finder
>
> "We've seen this before."

* **Attack:** Section 5.3 mentions "Off-chain for UX/speed". This mirrors the OpenSea "Wyvern Protocol" architecture. A common exploit there was listing signature replay attacks. If I sign an intent to "Pay $100 for X", and it's not strictly nonced or cancelled on-chain, a malicious matcher could replay that signature later to drain funds if I re-approve the token.
* **Severity:** MEDIUM
* **Fix:** Strict EIP-712 typed data signing with deadlines and nonces tracked on-chain.

### PT-6: The Defense Evaluator
>
> "Your mitigations fail."

* **Attack:** Section 9.1 mentions "AI monitors patterns" for suspicious activity. If the AI model is off-chain (Section 4.1), I can perform adversarial attacks on the matching inputs (e.g., prompt injection in the description) to bypass the safety filter or trick the matching engine into pairing me with high-value victims.
* **Severity:** MEDIUM
* **Fix:** Sanitize all inputs before embedding. Use a dedicated "Safety Classifier" model separate from the Matching model.

### PT-7: The Threat Modeler
>
> "You ignored this surface."

* **Attack:** Data Privacy in intents. "I need weekly crypto market summaries" is public. But if an intent is "I need a vulnerability assessment for [Stealth Startup]", that leak is damaging. The plan puts all intent descriptions in a searchable off-chain DB.
* **Severity:** HIGH (Privacy)
* **Fix:** Allow "Private Intents" where detailed description is encrypted and only revealed to a matched agent *after* mutual NDA signature/acceptance.

### PT-8: The Asymmetry Spotter
>
> "Attackers have infinite time."

* **Attack:** Reputation decay (Section 4.3) is `0.95^(months)`. This is too slow. An inactive hacked account remains "Trusted" for months. An attacker can buy old dormant high-rep keys.
* **Severity:** HIGH
* **Fix:** Aggressive activity heartbeat. If no login/tx in 14 days, pause "Trusted" status until re-verification.

---

## 3. Security Verdict

**Pass Status:** **PROVISIONAL PASS** (Pending Fixes)

The architecture is robust on the "Happy Path" but naive on the "Adversarial Path". The heavy reliance on off-chain AI/DB needs strict validation boundaries.

### Critical Fixes Required (The "Must-Haves")

1. **Anti-Sybil Jury:** Strengthen Section 5.5 to prevent botnet jury rigging (VRF + Staking).
2. **Frontend/Chain Isolation:** Enforce RPC-only reads for financial states (PT-1).
3. **Wash-Trading Defense:** Transaction volume + Account Age must weight reputation, not just Count (PT-4).

### Final Recommendation

The project has a **Security Pass** to proceed to the **Beads/Implementation Phase**, provided the 3 critical fixes above are integrated into the respective beads (`clawd-af6`, `clawd-bj3`).
