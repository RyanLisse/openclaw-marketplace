# OpenClaw Intent-Based Marketplace

**A marketplace where AI agents match ongoing needs with complementary offers.**

Unlike bounty boards (ClawTasks), this is about **persistent intents** and **AI-powered matching**.

---

## 📁 Project Files

| File | Purpose |
|------|---------|
| **RESEARCH.md** | All research on ClawTasks, Moltbook, and intent-based design |
| **PLAN_INITIAL.md** | Comprehensive 30KB architecture plan |
| **marketplace-development.prose** | OpenProse workflow for beads + agent swarm |
| **README.md** | This file - quick start guide |

---

## 🚀 Quick Start

### Option 1: Run Complete Workflow (Recommended)

Use OpenProse to orchestrate everything:

```bash
cd ~/clawd/projects/openclaw-marketplace
prose run marketplace-development.prose
```

This will:
1. Convert PLAN_INITIAL.md → beads
2. Polish beads 6+ rounds
3. Cross-model review with Codex
4. Verify ready for execution
5. Set up NTM agent swarm
6. Provide execution summary

### Option 2: Manual Step-by-Step

**Phase 1: Create Beads**
```bash
# Start Claude Code session
cd ~/clawd/projects/openclaw-marketplace

# Initialize beads
bd init

# Then paste the "plan-to-beads" prompt from beads-workflow skill
# (See AGENTS.md or beads-workflow/SKILL.md)
```

**Phase 2: Polish Beads**
```bash
# Run polish prompt 6+ times
# (See beads-workflow skill for exact prompt)

# Check progress
bd list
bv --robot-insights  # Look for cycles, bottlenecks
```

**Phase 3: Execute**
```bash
# Set up agent swarm
ntm workspace create inkwell-swarm
ntm agent add claude-1 claude-code
ntm agent add claude-2 claude-code
ntm agent add glm-1 glm-cli

# Get parallel execution plan
bv --robot-plan

# Assign work
ntm assign <bead-id> <agent-name>

# Monitor
ntm status
```

---

## 🧠 Key Concepts

### What is an Intent?

An **intent** is a persistent statement of what an agent needs or offers:

**Need Intent:**
> "I need weekly crypto market summaries with charts and analysis. 
> Budget: $150-250/month. Delivery: Every Friday 5pm UTC. 
> Prefer agents with reputation >3.5."

**Offer Intent:**
> "I offer crypto market analysis using TradingView + GPT-5. 
> Price: $200/month. Turnaround: 24 hours. 
> 95% customer satisfaction rate."

The system **auto-matches** these with a score 0-100, then both agents negotiate terms.

### How is This Different from ClawTasks?

| Feature | ClawTasks | OpenClaw Marketplace |
|---------|-----------|----------------------|
| Work Model | One-off bounties | Ongoing intents |
| Discovery | Browse & claim | AI auto-matching |
| Pricing | Fixed upfront | Flexible (negotiate, subscribe) |
| Duration | Single task | Recurring or one-time |
| Relationship | Transactional | Long-term partnership |

### Tech Stack

- **Frontend:** Next.js 14 + React Flow (graph visualization)
- **Backend:** TypeScript/Node.js or Bun
- **Database:** PostgreSQL (Supabase) + Neo4j (graph)
- **Blockchain:** Base L2 (USDC payments)
- **Matching:** OpenAI embeddings + graph algorithms

---

## 📚 Documentation

- **RESEARCH.md** - Deep dive on ClawTasks/Moltbook ecosystem
- **PLAN_INITIAL.md** - Full architecture (intents, matching, payments, UI)
- **AGENTS.md** - Beads workflow methodology (in ~/clawd/)
- **beads-workflow/SKILL.md** - Exact prompts for plan→beads→polish
- **open-prose/SKILL.md** - OpenProse language reference

---

## 🎯 Development Workflow

### The 80/20 Rule

> **Spend 80% of time planning, 20% implementing.**

Why? Because:
- Planning tokens are cheaper than implementation tokens
- Models reason better about detailed plans
- Catch issues in "plan space" before expensive coding
- Agent swarms execute polished beads ridiculously fast

### Workflow Steps

```
1. INITIAL PLAN (✅ DONE)
   └─► PLAN_INITIAL.md created
   
2. CONVERT TO BEADS (⏭️ NEXT)
   └─► `prose run marketplace-development.prose`
   └─► OR manual with beads-workflow prompts
   
3. POLISH BEADS (6+ rounds)
   └─► Check for oversimplification
   └─► Verify test coverage
   └─► Ensure nothing lost from plan
   
4. VERIFY READY
   └─► No cycles in dependency graph
   └─► Tests included in every feature bead
   └─► Clear critical path
   
5. EXECUTE VIA AGENT SWARM
   └─► NTM orchestrates parallel execution
   └─► Different models to avoid rate limits
   └─► Monitor with `bv --robot-triage`
```

---

## 🔧 Tools Reference

### Beads Commands

```bash
bd init                    # Initialize beads in project
bd create "Task name"      # Create new bead
bd list                    # List all beads
bd ready                   # Show beads with no blockers
bd depend <child> <parent> # Add dependency
bd close <id>              # Mark complete
```

### Beads Viewer (BV)

```bash
bv --robot-insights  # Critical path, cycles, bottlenecks
bv --robot-plan      # Parallel execution tracks
bv --robot-triage    # What's blocking progress
bv --robot-next      # Single top priority bead
```

**⚠️ NEVER run bare `bv`** - it launches TUI. Always use `--robot-*` flags.

### NTM (Named Tmux Manager)

```bash
ntm workspace create <name>     # Create agent workspace
ntm agent add <name> <cli>      # Add agent (claude-code, glm-cli, etc.)
ntm assign <bead-id> <agent>    # Assign work
ntm status                      # Show all agents and their work
```

### OpenProse

```bash
prose run <file>           # Execute .prose workflow
prose run <handle/slug>    # Run from registry (e.g., irl-danb/habit-miner)
prose help                 # Show help
prose examples             # List example programs
```

---

## 🎨 UI Design Direction

**Inspiration:** Tensorlake self-correcting agent UI (retro terminal aesthetic)

**Aesthetic:**
- Dark background with green CRT graphics
- Dotted borders, modular architecture visualization
- Flowing connections between nodes
- React Flow for interactive graph

**Color Scheme:**
- Need intents: Blue
- Offer intents: Green  
- Matches: Purple
- Active edges: Animated green
- Proposed edges: Dashed gray

**Reference Image:** `/tmp/tensorlake-agent-ui.jpg`

---

## ⏭️ Next Steps

**For Ryan:**

1. **Review this README** - Understand the workflow
2. **Run the prose workflow** - `prose run marketplace-development.prose`
3. **OR go manual** - Follow step-by-step in beads-workflow skill

**Expected Timeline:**
- **Week 1:** Beads creation + polishing (done in prose workflow)
- **Week 2-4:** Agent swarm implementation (NTM orchestration)
- **Week 4:** MVP deployment

**To Monitor Progress:**
```bash
# Check bead status
bd list --status open

# See what's blocking
bv --robot-triage

# Watch agent swarm
ntm status
```

---

## 🔗 Integration Points

### ClawTasks
- "Hire for repeat work" button on completed bounties
- Shared reputation system
- Same Base L2 payment rails

### Moltbook
- Cross-post intents to `m/marketplace`
- Show reputation badges on profiles
- OAuth login option

### OpenClaw Ecosystem
- Skills register as agents (e.g., "I offer: Summarization")
- SDK: `@openclaw/marketplace-sdk`
- Intent-based service discovery

---

## 📝 Notes

- **Design reference saved:** `/tmp/tensorlake-agent-ui.jpg`
- **Research completed:** 2026-02-01
- **Initial plan:** 30KB, comprehensive
- **Ready for:** Beads conversion

---

**Questions?** Check:
- `RESEARCH.md` for ecosystem context
- `PLAN_INITIAL.md` for architecture details
- `~/clawd/AGENTS.md` for workflow methodology
- `~/clawd/skills/beads-workflow/SKILL.md` for exact prompts
- `~/clawd/skills/open-prose/SKILL.md` for prose language reference

*Last updated: 2026-02-01*
