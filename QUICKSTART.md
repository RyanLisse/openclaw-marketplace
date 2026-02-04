# QuickStart - OpenClaw Marketplace

## 🎯 Run the app (Makefile)

```bash
cd ~/clawd/projects/openclaw-marketplace
make setup              # install + create packages/frontend/.env.local
make dev-convex         # Terminal 1: Convex backend (copy CONVEX_URL into .env.local)
make dev                # Terminal 2: Next.js frontend → http://localhost:3000
```

Run `make help` for all targets (build, test, lint, smoke-test, docker, etc.).

---

## 🎯 Run the Complete Workflow (OpenProse)

```bash
cd ~/clawd/projects/openclaw-marketplace
prose run workflows/marketplace-development.prose
```

That's it! This orchestrates everything.

---

## 📋 What the Workflow Does

1. **Converts plan to beads** (executable tasks)
2. **Polishes 6+ rounds** (catches issues before coding)
3. **Cross-model review** (Codex final check)
4. **Sets up agent swarm** (parallel execution with different models)
5. **Provides summary** (what to monitor next)

---

## 🛠️ Manual Commands (If Needed)

### Makefile

```bash
make help       # List all targets
make install    # pnpm install
make setup      # install + copy frontend .env.local
make dev        # Start frontend
make dev-convex # Start Convex (other terminal)
make build      # Build all packages
make test       # Frontend tests
make test-convex   # Convex tests
make lint       # Lint all
make smoke-test # Week 1 smoke test script
```

### Beads

```bash
bd init                    # Initialize beads
bd list                    # Show all beads
bd ready                   # Show beads ready to start
bv --robot-insights        # Critical path, cycles, bottlenecks
```

### Agent Swarm (NTM)

```bash
ntm workspace create marketplace-swarm
ntm agent add claude-1 claude-code
ntm agent add glm-1 glm-cli
ntm assign <bead-id> <agent-name>
ntm status                 # Monitor progress
```

### OpenProse

```bash
prose help                 # Show help
prose examples             # List examples
prose run <file>           # Execute workflow
```

---

## 📁 File Locations

| What | Where |
|------|-------|
| Makefile targets | `make help` or root `Makefile` |
| Full architecture | `planning/PLAN_INITIAL.md` |
| Research findings | `research/RESEARCH.md` |
| Development guide | `docs/GUIDE.md` |
| Convex setup | `CONVEX_SETUP.md` |
| Workflow script | `workflows/marketplace-development.prose` |

---

## ⚡ Next Actions After Workflow Completes

### 1. Monitor Agent Progress

```bash
ntm status
bv --robot-triage  # What's blocking?
```

### 2. Check Bead Status

```bash
bd list --status open      # What's pending
bd list --status closed    # What's done
```

### 3. Review Code

Agents will commit to git. Review their work:

```bash
git log --oneline
git diff HEAD~5  # Last 5 commits
```

---

## 🎨 UI Design Reference

**Tensorlake agent aesthetic:**
- Dark background
- Green CRT graphics
- Dotted borders
- Modular architecture viz
- React Flow graph

Reference saved: `/tmp/tensorlake-agent-ui.jpg`

---

## 🔗 Key URLs

- **ClawTasks:** https://clawtasks.com (bounty reference)
- **AI SDK Workflow:** https://ai-sdk.dev/elements/examples/workflow
- **Tensorlake UI:** https://x.com/bruce_CQT/status/2017702095437369707

---

## 💡 Philosophy

> "Spend 80% planning, 20% implementing."

Planning is cheap. Implementation is expensive. Get it right in "plan space" first.

---

**Ready?** Run: `prose run workflows/marketplace-development.prose`
