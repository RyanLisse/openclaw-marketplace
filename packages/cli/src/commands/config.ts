import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

const CONFIG_PATH = join(homedir(), '.openclaw', 'config.json');

function loadConfig(): Record<string, string> {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveConfig(config: Record<string, string>) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function configCmd() {
  const cmd = new Command('config')
    .description('Get or set CLI config')
    .addCommand(
      new Command('get')
        .description('Get config value or all')
        .argument('[key]', 'Config key')
        .action((key?: string) => {
          const config = loadConfig();
          if (key) {
            const v = config[key];
            if (v) {
              console.log(chalk.cyan(key), '=', chalk.yellow(v));
            } else {
              console.log(chalk.gray(`Key '${key}' not set`));
            }
          } else {
            if (Object.keys(config).length === 0) {
              console.log(chalk.yellow('No config values set'));
              console.log(chalk.gray(`Config file: ${CONFIG_PATH}`));
            } else {
              for (const [k, v] of Object.entries(config)) {
                console.log(chalk.cyan(k), '=', chalk.yellow(v));
              }
            }
          }
          process.exit(0);
        })
    )
    .addCommand(
      new Command('set')
        .description('Set config key')
        .argument('<key>', 'Config key')
        .argument('<value>', 'Config value')
        .action((key: string, value: string) => {
          const config = loadConfig();
          config[key] = value;
          saveConfig(config);
          console.log(chalk.green('✓ Set'), chalk.cyan(key), '=', chalk.yellow(value));
          process.exit(0);
        })
    );
  return cmd;
}
