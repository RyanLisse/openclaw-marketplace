# Scripts

## Week 1 smoke test

**Files:** `week1-smoke-test.sh`, `week1-smoke-test.ts`

**Purpose:** Manual smoke test for Week 1 backend: agent intents, match propose/accept, and CRUD for transactions, disputes, and votes. The same flows are available via MCP tools (`intent_create`, `match_propose`, `match_accept`, etc.).

**Run:**

```bash
CONVEX_URL=https://your-deployment.convex.cloud ./scripts/week1-smoke-test.sh
```

Or set `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` in `.env.local` and run from project root.

**Expected outputs (summary):**

| Step | Expected output |
|------|-----------------|
| 1. Create intents (need + offer) | `OK: intent create (need) returns intentId` and same for offer; log lines show `status=created`, `intentId` present. |
| 2. Propose match | `OK: match create returns matchId`; log shows `status=created` or `already_exists`, `matchId` present. |
| 3. Accept match | `OK: match accept returns accepted`; log shows `status=accepted`. |
| 4. Transactions | `OK: transaction create` then `OK: transaction list includes created tx`; log shows created tx and list count. |
| 4. Disputes | `OK: dispute create returns id`, `OK: dispute get`, `OK: dispute list`; then remove succeeds. |
| 4. Votes | `OK: votes list returns array`; log shows list length (update/retract require a voting dispute; see unit tests). |

Final line: `Week 1 smoke test finished. All steps passed.` Exit code 0 on success, 1 on first failure.

## E2E

See `e2e/README.md` for daily E2E test and Playwright setup.
