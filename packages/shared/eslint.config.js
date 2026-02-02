import { dirname } from "path";
import { fileURLToPath } from "url";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recommendedRules = typescriptEslintPlugin.configs.recommended?.rules ?? {};

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
    },
    rules: recommendedRules,
  },
];
