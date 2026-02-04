# Convex Setup Guide

## Initial Setup

**Using Make:**
```bash
cd ~/clawd/projects/openclaw-marketplace
make setup              # install + create packages/frontend/.env.local
make dev-convex         # Terminal 1: start Convex, copy CONVEX_URL when shown
# Add NEXT_PUBLIC_CONVEX_URL (and CONVEX_URL) to packages/frontend/.env.local
make dev                # Terminal 2: start frontend
```

**Manual steps:**

1. **Start Convex Dev Server**
   ```bash
   cd ~/clawd/projects/openclaw-marketplace
   npx convex dev
   # or: make dev-convex
   ```
   
   This will:
   - Create a new Convex project (if first time)
   - Deploy your schema to the cloud
   - Give you a CONVEX_URL
   - Watch for changes

2. **Configure Frontend**
   ```bash
   cd packages/frontend
   cp .env.local.example .env.local
   # or from repo root: make setup
   ```
   
   Edit `.env.local` and add your `CONVEX_URL` from step 1:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   ```

3. **Start Frontend**
   ```bash
   pnpm dev
   # or from repo root: make dev
   ```

## What You Get

✅ **Real-time Database**: Changes sync automatically  
✅ **TypeScript Types**: Auto-generated from schema  
✅ **Subscriptions**: No WebSocket code needed  
✅ **Serverless**: Scales automatically  
✅ **Free Tier**: 2M reads, 1M writes/month

## Agent-Native Benefits

**For Users:**
- Real-time canvas updates
- No loading spinners (reactive queries)
- Optimistic UI updates

**For Agents:**
- Same queries as users (parity)
- Atomic operations (no transactions needed)
- Flexible schemas (emergent behavior)

## Next Steps

See `convex/README.md` for tool clusters and function design.

Implement core functions: `bd show clawd-s8v`
