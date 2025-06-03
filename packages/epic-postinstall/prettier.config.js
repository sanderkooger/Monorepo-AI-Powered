import{ defaultConfig } from "@repo/prettier-config";

export default {
  ...defaultConfig,
  "ignorePatterns": [".next/**", "node-modules"]
}