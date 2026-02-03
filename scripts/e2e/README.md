# OpenClaw Marketplace - Daily E2E Testing

Agent-driven E2E testing based on [Ryan Carson's approach](https://x.com/ryancarson/status/2018354837918732297).

## Quick Start

```bash
# 1. One-time setup: Create Chrome debug profile with test Google account
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/chrome-debug-profile"
# Sign into test Gmail account, then close Chrome

# 2. Copy and configure environment
cp .env.e2e.example .env.e2e
# Edit .env.e2e with your values

# 3. Run manually
./daily-e2e-test.sh http://localhost:3000

# 4. Schedule for daily runs at 9 AM
cp com.openclaw-marketplace.e2e-daily.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.openclaw-marketplace.e2e-daily.plist
```

## Files

| File | Purpose |
|------|---------|
| `daily-e2e-test.sh` | Main test runner script |
| `delete-test-user.ts` | Cleanup script (DB + Auth + Payments) |
| `com.openclaw-marketplace.e2e-daily.plist` | launchd schedule for 9 AM daily |
| `.env.e2e.example` | Required environment variables |

## Test Phases

1. **Setup** - Start browser, connect to Chrome debug profile
2. **Landing Page** - Verify core elements load
3. **Intent Creation** - Test create intent flow
4. **Search/Matching** - Test browse and search functionality
5. **API Health** - Verify Convex connection

## On Failure

- Screenshots are saved to `logs/e2e/screenshots/`
- Full logs in `logs/e2e/e2e-YYYY-MM-DD-HHMMSS.log`
- GitHub issue auto-filed (if configured)

## Configuration

Set in `.env.e2e`:

```bash
CONVEX_URL=https://your-deployment.convex.cloud
E2E_TEST_EMAIL=test@openclaw.ai
GITHUB_REPO=RyanLisse/openclaw-marketplace
BASE_URL=http://localhost:3000
```

## Extending

Add new test phases in `daily-e2e-test.sh`:

```bash
phase_my_feature() {
  log "Testing my feature..."
  run_step "Navigate to feature" $AGENT_BROWSER open "$BASE_URL/my-feature"
  run_step "Check element" wait_for_element "My Element"
  screenshot "my-feature"
}
```

Then call it in `main()`.
