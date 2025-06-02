import { defaultConfig } from "./packages/prettier-config/dist/index.js";

export default {
  ...defaultConfig,
  "ignorePatterns": [".next/**", "node-modules"]
}