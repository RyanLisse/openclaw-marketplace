# Smart Contracts

Hardhat-based smart contracts for OpenClaw Marketplace escrow and dispute resolution.

## Requirements

- **Node.js 22 LTS** (not Node 25+)
- Hardhat requires even-numbered major versions (22, 20, 18, etc.)

## Setup

1. Install Node 22 LTS:
   ```bash
   # Using nvm (recommended)
   nvm install 22
   nvm use 22
   
   # Using fnm
   fnm install 22
   fnm use 22
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build contracts:
   ```bash
   bun run build
   ```

4. Run tests:
   ```bash
   bun run test
   ```

## Issue: Node 25 Compatibility

If you see:
```
WARNING: You are using Node.js 25.x.x which is not supported by Hardhat.
Please upgrade to 22.10.0 or a later LTS version (even major version number)
```

**Solution**: Switch to Node 22 using the commands above. The `.nvmrc` file in this directory specifies Node 22 for auto-switching.

## Contracts

- `Escrow.sol` - Escrow contract for holding funds during work
- `DisputeResolution.sol` - Multi-tier dispute resolution (AI → Community → Arbitration)

## Architecture

- **OpenZeppelin Upgradeable** - Contracts can be upgraded without losing state
- **Base L2** - Deployed on Base for low fees
- **USDC** - Primary payment token
