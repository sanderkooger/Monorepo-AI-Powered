import prettierConfig from "@repo/prettier-config";

export default {
  ...prettierConfig,
  "ignorePatterns": [".next/**", "node-modules"]
}