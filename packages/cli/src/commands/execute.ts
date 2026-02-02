import { Command } from 'commander';
import chalk from 'chalk';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api.js';
import type { Id } from '../../../../convex/_generated/dataModel.js';

function getClient(): ConvexHttpClient {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error(chalk.red('Error:'), chalk.red('CONVEX_URL or NEXT_PUBLIC_CONVEX_URL required'));
    process.exit(3);
  }
  return new ConvexHttpClient(url);
}

export function executeCmd() {
  const cmd = new Command('execute')
    .description('Mark intent as executed')
    .argument('<intent-id>', 'Intent document ID')
    .option('--tx-hash <hash>', 'Transaction hash')
    .option('--json', 'Output JSON')
    .action(async (intentId: string, opts: { txHash?: string; json?: boolean }) => {
      try {
        const client = getClient();
        await client.mutation(api.intents.updateIntentStatus, {
          id: intentId as Id<'user_intents'>,
          status: 'executed',
          txHash: opts.txHash,
        });
        if (opts.json) {
          console.log(JSON.stringify({ success: true, intentId }, null, 2));
        } else {
          console.log(chalk.green('✓ Executed:'), chalk.cyan(intentId));
        }
        process.exit(0);
      } catch (err) {
        console.error(chalk.red('Error:'), err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
  return cmd;
}
