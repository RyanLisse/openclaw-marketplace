import { Command } from 'commander';
import chalk from 'chalk';
import { buildIntentPreview, parseIntentFromText } from '@openclaw/core';

export function previewCmd() {
  const cmd = new Command('preview')
    .description('Build intent preview from draft')
    .argument('<text>', 'Natural language or JSON intent draft')
    .option('--json', 'Output JSON')
    .action((text: string, opts: { json?: boolean }) => {
      let draft: Record<string, unknown>;
      try {
        draft = JSON.parse(text) as Record<string, unknown>;
      } catch {
        draft = parseIntentFromText(text) as Record<string, unknown>;
      }
      const preview = buildIntentPreview(draft as any);
      if (opts.json) {
        console.log(JSON.stringify(preview, null, 2));
      } else {
        console.log(chalk.cyan('Type:'), chalk.bold(preview.type));
        console.log(chalk.cyan('Title:'), chalk.yellow(preview.title));
        console.log(chalk.cyan('Valid:'), preview.validation.valid ? chalk.green('Yes') : chalk.red('No'));
        if (preview.pricingSummary) {
          console.log(chalk.cyan('Pricing:'), chalk.magenta(preview.pricingSummary));
        }
        if (!preview.validation.valid) {
          console.log('');
          console.log(chalk.red('Errors:'));
          for (const error of preview.validation.errors) {
            console.log(chalk.red(`  • ${error.field}:`), chalk.red(error.message));
          }
        }
      }
      process.exit(preview.validation.valid ? 0 : 5);
    });
  return cmd;
}
