import { Command } from 'commander';
import chalk from 'chalk';
import { parseAndValidate, buildIntentPreview } from '@openclaw/core';

export function parseCmd() {
  const cmd = new Command('parse')
    .description('Parse natural language into an intent')
    .argument('<text>', 'Natural language intent')
    .option('--json', 'Output JSON')
    .option('--store', 'Persist intent (requires CONVEX_URL)')
    .action((text: string, opts: { json?: boolean; store?: boolean }) => {
      const { draft, validation } = parseAndValidate(text);
      if (opts.json) {
        const out = {
          draft,
          validation: { valid: validation.valid, errors: validation.errors },
          preview: buildIntentPreview(draft),
        };
        console.log(JSON.stringify(out, null, 2));
        process.exit(validation.valid ? 0 : 5);
      }
      console.log(chalk.cyan('Parsed intent:'), chalk.bold(draft.type ?? 'unknown'));
      console.log(chalk.cyan('Title:'), chalk.yellow(draft.title ?? '(none)'));
      console.log(chalk.cyan('Skills:'), chalk.green((draft.skills ?? []).join(', ') || '(none)'));
      if (!validation.valid) {
        console.error(chalk.red('Validation errors:'), chalk.red(validation.errors.map(e => e.message).join('; ')));
        process.exit(5);
      }
      console.log(chalk.green('✓ Valid intent'));
      process.exit(0);
    });
  return cmd;
}
