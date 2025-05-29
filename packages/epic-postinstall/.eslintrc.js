import { config } from "../../packages/eslint-config/base.js";

export default [
  ...config,
  {
    files: ["**/*.ts"],
    rules: {},
  },
];