import { nodeJS } from "@repo/eslint-config";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nodeJS,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];