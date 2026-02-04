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

## Testnet Deployment (Base Sepolia)

### Prerequisites

1. **Get testnet ETH** for gas:
   - Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia

2. **Get testnet USDC**:
   - Circle USDC Faucet: https://faucet.circle.com/
   - Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your PRIVATE_KEY (without 0x prefix)
   # Optionally add BASESCAN_API_KEY for contract verification
   ```

### Deploy Marketplace

```bash
# Make sure you're using Node 22
nvm use 22  # or: fnm use 22

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-marketplace.ts --network base-sepolia
```

This will:
1. Deploy the Marketplace contract as a UUPS proxy
2. Print the proxy address (use this for frontend integration)
3. Print the implementation address
4. Auto-verify on Basescan (if API key provided)

**Save the proxy address!** You'll need it for testing and frontend integration.

### Test on Testnet

After deploying, test the full intent lifecycle:

```bash
npx hardhat run scripts/test-marketplace.ts --network base-sepolia <MARKETPLACE_ADDRESS>
```

This will:
1. Check your USDC balance
2. Approve Marketplace to spend USDC
3. Create an intent (10 USDC)
4. Assign a provider
5. Complete the intent (releases funds to provider)
6. Verify all state changes

**Expected output:**
```
✅ All tests passed! Marketplace is working on testnet.
```

### Verify Contract Manually

If auto-verification failed:

```bash
npx hardhat verify --network base-sepolia <IMPLEMENTATION_ADDRESS>
```

Get implementation address from deployment output or:
```bash
npx hardhat run scripts/get-implementation.ts --network base-sepolia <PROXY_ADDRESS>
```

## Architecture

- **OpenZeppelin Upgradeable** - Contracts can be upgraded without losing state
- **UUPS Proxy Pattern** - Upgrade logic in implementation contract
- **Base L2** - Deployed on Base for low fees
- **USDC** - Primary payment token (6 decimals on Base)
