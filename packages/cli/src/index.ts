#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { parseCmd } from './commands/parse.js';
import { validateCmd } from './commands/validate.js';
import { previewCmd } from './commands/preview.js';
import { listCmd } from './commands/list.js';
import { searchCmd } from './commands/search.js';
import { executeCmd } from './commands/execute.js';
import { configCmd } from './commands/config.js';

const program = new Command();

program
  .name('openclaw')
  .description(chalk.cyan('OpenClaw Marketplace CLI') + ' - intent operations')
  .version('0.1.0');

program.addCommand(parseCmd());
program.addCommand(validateCmd());
program.addCommand(previewCmd());
program.addCommand(listCmd());
program.addCommand(searchCmd());
program.addCommand(executeCmd());
program.addCommand(configCmd());

program.parse();
