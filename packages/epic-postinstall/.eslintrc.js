import { nodeJS } from "@repo/eslint-config/";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nodeJS,
  {
    files: ["**/*.ts"],
    rules: {},
  },
];