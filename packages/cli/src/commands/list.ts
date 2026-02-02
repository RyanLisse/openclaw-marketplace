import { Command } from 'commander';
import chalk from 'chalk';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api.js';

function getClient(): ConvexHttpClient {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error(chalk.red('Error:'), chalk.red('CONVEX_URL or NEXT_PUBLIC_CONVEX_URL required'));
    process.exit(3);
  }
  return new ConvexHttpClient(url);
}

export function listCmd() {
  const cmd = new Command('list')
    .description('List intents from Convex')
    .option('--user-id <id>', 'Filter by user ID (required)')
    .option('--json', 'Output JSON')
    .action(async (opts: { userId?: string; json?: boolean }) => {
      if (!opts.userId) {
        console.error(chalk.red('Error:'), chalk.red('--user-id is required'));
        process.exit(1);
      }
      try {
        const client = getClient();
        const intents = await client.query(api.intents.listIntents, {
          userId: opts.userId,
        });
        if (opts.json) {
          console.log(JSON.stringify(intents, null, 2));
        } else {
          if (intents.length === 0) {
            console.log(chalk.yellow('No intents found'));
          } else {
            for (const i of intents as any[]) {
              const id = chalk.gray(i._id?.slice(0, 8) ?? 'unknown');
              const status = i.status === 'executed' ? chalk.green('executed') :
                            i.status === 'pending' ? chalk.yellow('pending') :
                            i.status === 'failed' ? chalk.red('failed') :
                            chalk.gray(i.status ?? 'unknown');
              const type = chalk.cyan(i.parsedIntent?.type ?? 'unknown');
              const title = chalk.yellow(i.parsedIntent?.title ?? '(no title)');
              console.log(`${id} | ${type} | ${title} | ${status}`);
            }
          }
        }
        process.exit(0);
      } catch (err) {
        console.error(chalk.red('Error:'), err instanceof Error ? err.message : err);
        process.exit(3);
      }
    });
  return cmd;
}
