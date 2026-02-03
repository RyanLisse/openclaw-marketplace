#!/bin/bash
#
# OpenClaw Marketplace - Daily E2E Test Runner
# Based on Ryan Carson's agent-driven E2E testing approach
#
# Usage: ./daily-e2e-test.sh [base_url]
# Example: ./daily-e2e-test.sh http://localhost:3000
#
# Runs daily at 9 AM via launchd (see com.openclaw-marketplace.e2e-daily.plist)

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/e2e"
SCREENSHOT_DIR="$LOG_DIR/screenshots"
LOG_FILE="$LOG_DIR/e2e-$(date '+%Y-%m-%d-%H%M%S').log"

# Load environment
if [[ -f "$SCRIPT_DIR/.env.e2e" ]]; then
  source "$SCRIPT_DIR/.env.e2e"
fi

BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"
CHROME_DEBUG_PROFILE="${CHROME_DEBUG_PROFILE:-$HOME/chrome-debug-profile}"
AGENT_BROWSER="${AGENT_BROWSER:-$HOME/.local/bin/agent-browser}"

# Test state
TEST_STATUS="SUCCESS"
ERRORS=()
STEP_COUNT=0

# ============================================================================
# Logging & Utilities
# ============================================================================

mkdir -p "$LOG_DIR" "$SCREENSHOT_DIR"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg" | tee -a "$LOG_FILE"
}

log_error() {
  log "❌ ERROR: $1"
  ERRORS+=("$1")
  TEST_STATUS="FAILED"
}

log_success() {
  log "✅ $1"
}

screenshot() {
  local name="${1:-step-$STEP_COUNT}"
  local path="$SCREENSHOT_DIR/$name-$(date '+%H%M%S').png"
  $AGENT_BROWSER screenshot "$path" 2>/dev/null || true
  log "📸 Screenshot: $path"
}

run_step() {
  local step_name="$1"
  shift
  STEP_COUNT=$((STEP_COUNT + 1))
  log "━━━ Step $STEP_COUNT: $step_name ━━━"
  
  if "$@"; then
    log_success "$step_name completed"
    return 0
  else
    log_error "$step_name failed"
    screenshot "error-$step_name"
    return 1
  fi
}

# ============================================================================
# Browser Control
# ============================================================================

start_browser() {
  log "Starting Chrome with debug profile..."
  
  # Kill any existing Chrome debug instances
  pkill -f "remote-debugging-port=9222" 2>/dev/null || true
  sleep 1
  
  # Check if debug profile exists
  if [[ ! -d "$CHROME_DEBUG_PROFILE" ]]; then
    log_error "Chrome debug profile not found at $CHROME_DEBUG_PROFILE"
    log "Create it with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=\"$CHROME_DEBUG_PROFILE\""
    return 1
  fi
  
  # Launch Chrome with debug profile
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=9222 \
    --user-data-dir="$CHROME_DEBUG_PROFILE" \
    --no-first-run \
    --disable-default-apps \
    --disable-popup-blocking &
  
  sleep 3
  
  # Connect agent-browser
  if ! $AGENT_BROWSER connect 9222 2>/dev/null; then
    log_error "Failed to connect to Chrome"
    return 1
  fi
  
  log_success "Browser connected"
}

stop_browser() {
  log "Closing browser..."
  $AGENT_BROWSER close 2>/dev/null || true
  pkill -f "remote-debugging-port=9222" 2>/dev/null || true
}

# ============================================================================
# Test Helpers
# ============================================================================

wait_for_element() {
  local selector="$1"
  local timeout="${2:-10}"
  local start=$(date +%s)
  
  while true; do
    if $AGENT_BROWSER snapshot -i 2>/dev/null | grep -q "$selector"; then
      return 0
    fi
    
    local elapsed=$(($(date +%s) - start))
    if [[ $elapsed -ge $timeout ]]; then
      return 1
    fi
    sleep 0.5
  done
}

get_page_text() {
  $AGENT_BROWSER eval "document.body.innerText" 2>/dev/null || echo ""
}

click_button() {
  local text="$1"
  $AGENT_BROWSER find text "$text" click 2>/dev/null
}

# ============================================================================
# Test Phases
# ============================================================================

phase_setup() {
  log "═══════════════════════════════════════════════════════════════"
  log "Phase 1: SETUP"
  log "═══════════════════════════════════════════════════════════════"
  
  run_step "Start browser" start_browser
  run_step "Navigate to home" $AGENT_BROWSER open "$BASE_URL"
  sleep 2
  screenshot "home-page"
}

phase_landing_page() {
  log "═══════════════════════════════════════════════════════════════"
  log "Phase 2: LANDING PAGE TESTS"
  log "═══════════════════════════════════════════════════════════════"
  
  local page_text=$(get_page_text)
  
  # Check core elements exist
  run_step "Check hero section" echo "$page_text" | grep -qi "intent\|marketplace\|agent"
  run_step "Check navigation" $AGENT_BROWSER snapshot -i | grep -qi "button\|link"
  
  screenshot "landing-verified"
}

phase_intent_creation() {
  log "═══════════════════════════════════════════════════════════════"
  log "Phase 3: INTENT CREATION FLOW"
  log "═══════════════════════════════════════════════════════════════"
  
  # Navigate to create intent (adjust selectors as needed)
  run_step "Find create button" wait_for_element "Create\|New Intent\|Post"
  
  # Try to click create
  if click_button "Create" || click_button "New Intent" || click_button "Post"; then
    sleep 2
    screenshot "create-intent-form"
    
    # Check form loaded
    local snapshot=$($AGENT_BROWSER snapshot -i 2>/dev/null)
    if echo "$snapshot" | grep -qi "textbox\|input\|form"; then
      log_success "Intent creation form loaded"
    else
      log_error "Intent creation form not found"
    fi
  else
    log_error "Could not find create intent button"
  fi
}

phase_search_matching() {
  log "═══════════════════════════════════════════════════════════════"
  log "Phase 4: SEARCH & MATCHING"
  log "═══════════════════════════════════════════════════════════════"
  
  # Navigate to search/browse
  run_step "Navigate to browse" $AGENT_BROWSER open "$BASE_URL/browse" || $AGENT_BROWSER open "$BASE_URL/search"
  sleep 2
  
  local page_text=$(get_page_text)
  
  # Check search functionality exists
  if echo "$page_text" | grep -qi "search\|filter\|browse"; then
    log_success "Search/browse page loaded"
    screenshot "search-page"
  else
    log_error "Search functionality not found"
  fi
}

phase_api_health() {
  log "═══════════════════════════════════════════════════════════════"
  log "Phase 5: API HEALTH CHECK"
  log "═══════════════════════════════════════════════════════════════"
  
  # Check Convex connection via browser
  local api_check=$($AGENT_BROWSER eval "typeof window.__CONVEX_STATE__ !== 'undefined'" 2>/dev/null)
  
  if [[ "$api_check" == "true" ]]; then
    log_success "Convex connection verified"
  else
    log "⚠️ Could not verify Convex connection (may be normal for SSR)"
  fi
}

# ============================================================================
# Bug Filing
# ============================================================================

file_bug() {
  [[ "$TEST_STATUS" == "SUCCESS" ]] && return 0
  
  log "═══════════════════════════════════════════════════════════════"
  log "Filing bug report..."
  log "═══════════════════════════════════════════════════════════════"
  
  local title="[E2E] Daily test failed - $(date '+%Y-%m-%d %H:%M')"
  local body="## E2E Test Failure Report

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Base URL:** $BASE_URL
**Log file:** $LOG_FILE

### Errors
$(printf '- %s\n' "${ERRORS[@]}")

### Screenshots
Check: $SCREENSHOT_DIR

### Steps to reproduce
1. Run \`./scripts/e2e/daily-e2e-test.sh $BASE_URL\`
2. Review log output

### Environment
- macOS $(sw_vers -productVersion)
- Chrome $(defaults read /Applications/Google\ Chrome.app/Contents/Info CFBundleShortVersionString 2>/dev/null || echo 'unknown')
- agent-browser $($AGENT_BROWSER --version 2>/dev/null || echo 'unknown')
"

  # File via GitHub CLI
  if command -v gh &>/dev/null && [[ -n "${GITHUB_REPO:-}" ]]; then
    gh issue create \
      --repo "$GITHUB_REPO" \
      --title "$title" \
      --body "$body" \
      --label "bug,e2e,automated" \
      2>/dev/null && log_success "Bug filed to GitHub" || log "⚠️ Failed to file GitHub issue"
  else
    log "⚠️ GitHub CLI not configured, skipping bug filing"
    log "Bug report:\n$title\n$body"
  fi
}

# ============================================================================
# Main
# ============================================================================

main() {
  log "═══════════════════════════════════════════════════════════════"
  log "OpenClaw Marketplace - Daily E2E Test"
  log "Started: $(date)"
  log "Base URL: $BASE_URL"
  log "═══════════════════════════════════════════════════════════════"
  
  # Run test phases
  phase_setup || true
  phase_landing_page || true
  phase_intent_creation || true
  phase_search_matching || true
  phase_api_health || true
  
  # Cleanup
  stop_browser
  
  # Report results
  log ""
  log "═══════════════════════════════════════════════════════════════"
  log "TEST RESULTS"
  log "═══════════════════════════════════════════════════════════════"
  log "Status: $TEST_STATUS"
  log "Steps run: $STEP_COUNT"
  log "Errors: ${#ERRORS[@]}"
  log "Log: $LOG_FILE"
  log "Screenshots: $SCREENSHOT_DIR"
  
  if [[ "$TEST_STATUS" == "SUCCESS" ]]; then
    log "✅ All tests passed!"
    exit 0
  else
    log "❌ Tests failed with ${#ERRORS[@]} error(s)"
    file_bug
    exit 1
  fi
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
