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

export function searchCmd() {
  const cmd = new Command('search')
    .description('Search intents by skills')
    .argument('<user-id>', 'User ID to search intents for')
    .argument('<skills...>', 'Skills to search (e.g. research ai)')
    .option('--json', 'Output JSON')
    .action(async (userId: string, skills: string[], opts: { json?: boolean }) => {
      try {
        const client = getClient();
        const intents = await client.query(api.intents.listIntents, { userId });

        // Filter by skills (client-side search)
        const searchTerm = skills.join(' ').toLowerCase();
        const filtered = (intents as any[]).filter((i: any) => {
          const intentSkills = (i.parsedIntent?.skills ?? []) as string[];
          const hasMatchingSkill = skills.some(s =>
            intentSkills.some((is: string) => is.toLowerCase().includes(s.toLowerCase()))
          );
          const titleMatches = i.parsedIntent?.title?.toLowerCase().includes(searchTerm);
          const descMatches = i.parsedIntent?.description?.toLowerCase().includes(searchTerm);
          return hasMatchingSkill || titleMatches || descMatches;
        });

        if (opts.json) {
          console.log(JSON.stringify(filtered, null, 2));
        } else {
          if (filtered.length === 0) {
            console.log(chalk.yellow('No intents found matching:'), chalk.cyan(skills.join(', ')));
          } else {
            console.log(chalk.gray(`Found ${filtered.length} intent(s) matching: ${skills.join(', ')}`));
            console.log('');
            for (const i of filtered) {
              const id = chalk.gray(i._id?.slice(0, 8) ?? 'unknown');
              const type = chalk.cyan(i.parsedIntent?.type ?? 'unknown');
              const title = chalk.yellow(i.parsedIntent?.title ?? '(no title)');
              const skillList = chalk.green((i.parsedIntent?.skills ?? []).join(', '));
              console.log(`${id} | ${type} | ${title}`);
              console.log(`    Skills: ${skillList}`);
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
