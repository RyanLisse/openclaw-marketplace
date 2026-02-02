import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { validateIntent } from '@openclaw/core';
import type { IntentDraft } from '@openclaw/core';

export function validateCmd() {
  const cmd = new Command('validate')
    .description('Validate intent JSON')
    .argument('<json>', 'Intent JSON (file path or inline)')
    .option('--json', 'Output JSON')
    .action((jsonInput: string, opts: { json?: boolean }) => {
      let draft: Partial<IntentDraft>;

      // Try to read from file first
      const filePath = resolve(jsonInput);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          draft = JSON.parse(content) as Partial<IntentDraft>;
        } catch (err) {
          console.error(chalk.red('Error:'), 'Invalid JSON in file');
          process.exit(1);
        }
      } else {
        // Try parsing as inline JSON
        try {
          draft = JSON.parse(jsonInput) as Partial<IntentDraft>;
        } catch (err) {
          console.error(chalk.red('Error:'), 'Invalid JSON input');
          process.exit(1);
        }
      }

      const result = validateIntent(draft);

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.valid) {
          console.log(chalk.green('✓ Valid intent'));
        } else {
          console.log(chalk.red('✗ Invalid intent'));
          console.log('');
          for (const error of result.errors) {
            console.log(chalk.red(`  • ${error.field}:`), chalk.red(error.message));
          }
        }
      }

      process.exit(result.valid ? 0 : 1);
    });
  return cmd;
}
