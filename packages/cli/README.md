# @openclaw/cli

OpenClaw Marketplace CLI - Intent operations command-line interface.

## Installation

```bash
# Install dependencies and build
pnpm install
pnpm build

# Link for global usage (optional)
pnpm link --global
```

## Usage

All commands are run via the `openclaw` CLI:

```bash
openclaw <command> [options]
```

### Commands

#### `parse <text>` - Parse intent from natural language

Parse natural language text into a structured intent draft.

```bash
# Parse a simple need
openclaw parse "I need help with Solidity smart contract development"

# Parse with skills specified
openclaw parse "Looking for a Rust developer skills: rust, blockchain"

# Output JSON format
openclaw parse "I offer AI consulting services" --json
```

**Output (human-readable):**
```
Parsed intent: offer
Title: I offer AI consulting services
Skills: (none)
✓ Valid intent
```

#### `validate <json>` - Validate intent JSON

Validate an intent draft from a JSON file or inline JSON.

```bash
# Validate from a file
openclaw validate ./intent.json

# Validate inline JSON
openclaw validate '{"type":"need","title":"Need help","description":"Looking for expert","skills":["solidity"]}'

# Output JSON format
openclaw validate ./intent.json --json
```

**Intent JSON format:**
```json
{
  "type": "need|offer|query|collaboration",
  "title": "Brief title (max 200 chars)",
  "description": "Full description (max 5000 chars)",
  "skills": ["skill1", "skill2"],
  "amount": 100,
  "currency": "USD"
}
```

**Output (human-readable):**
```
✓ Valid intent
```

Or if invalid:
```
✗ Invalid intent

  • title: Title is required
  • skills: Add at least one skill
```

#### `preview <text|json>` - Preview transaction

Build an intent preview from natural language or JSON.

```bash
# Preview from natural language
openclaw preview "I need research on DeFi protocols skills: research, defi"

# Preview from JSON
openclaw preview '{"type":"offer","title":"Smart Contract Audit","description":"...","skills":["solidity"]}'

# Output JSON format
openclaw preview "I need help" --json
```

#### `execute <intent-id>` - Execute intent

Mark an intent as executed (requires Convex backend).

```bash
# Execute with just the ID
openclaw execute 12345abcde

# Execute with transaction hash
openclaw execute 12345abcde --tx-hash 0xabc123...

# Output JSON format
openclaw execute 12345abcde --json
```

**Environment variables:**
- `CONVEX_URL` - Your Convex deployment URL
- `NEXT_PUBLIC_CONVEX_URL` - Alternative to CONVEX_URL

#### `list` - List recent intents

List intents from the Convex backend.

```bash
# List all intents for a user
openclaw list --user-id user_123

# Output JSON format
openclaw list --user-id user_123 --json
```

#### `search <user-id> <skills...>` - Search intents

Search intents by skills or keywords.

```bash
# Search by skill
openclaw search user_123 solidity rust

# Search by multiple skills
openclaw search user_123 ai ml nlp

# Output JSON format
openclaw search user_123 solidity --json
```

#### `config` - Manage configuration

Get or set CLI configuration values.

```bash
# Get all config
openclaw config get

# Get specific config value
openclaw config get convexUrl

# Set config value
openclaw config set convexUrl https://your-convex-app.convex.cloud
```

**Config file location:** `~/.openclaw/config.json`

## Options

### Global Options

- `--json` - Output in machine-readable JSON format (instead of human-readable colored output)

### Command-Specific Options

Each command has its own options. Use `openclaw <command> --help` for details.

## Exit Codes

The CLI uses the following exit codes:

- `0` - Success
- `1` - General error
- `3` - Configuration/credentials error (e.g., missing CONVEX_URL)
- `5` - Validation error

## Examples

### Complete workflow example

```bash
# 1. Parse natural language into an intent
openclaw parse "I need help developing a NEAR smart contract for NFT marketplace" > draft.json

# 2. Validate the draft
openclaw validate draft.json

# 3. Preview what the transaction would look like
openclaw preview draft.json

# 4. (When ready) Mark as executed
CONVEX_URL=https://your-app.convex.cloud openclaw execute <intent-id>
```

### Quick validation pipeline

```bash
# Parse and validate in one shot
openclaw parse "Offering Rust development services" | tee draft.json
openclaw validate draft.json
```

## Development

```bash
# Watch mode for development
pnpm dev

# Build for production
pnpm build

# Run directly with tsx
tsx src/index.ts parse "I need help"
```

## Configuration

The CLI stores configuration in `~/.openclaw/config.json`. Common config values:

```json
{
  "convexUrl": "https://your-app.convex.cloud",
  "defaultUserId": "user_123"
}
```

You can set these via:
```bash
openclaw config set convexUrl https://your-app.convex.cloud
openclaw config set defaultUserId user_123
```

## Error Handling

The CLI provides clear error messages with colored output:

- **Green (✓)** - Success
- **Yellow** - Warnings and info
- **Red (✗)** - Errors
- **Cyan** - Field names
- **Gray** - IDs and metadata

## TypeScript Support

The CLI is written in TypeScript and provides type definitions. Import it in your own tools:

```typescript
import { parseAndValidate, buildIntentPreview } from '@openclaw/core';

const { draft, validation } = parseAndValidate("I need help with Rust");
const preview = buildIntentPreview(draft);
```
