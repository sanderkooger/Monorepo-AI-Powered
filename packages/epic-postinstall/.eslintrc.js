import { nodejs } from "@repo/eslint-config/";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nodejs,
  {
    files: ["**/*.ts"],
    rules: {},
  },
];