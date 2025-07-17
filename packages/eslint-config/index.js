import { config } from "./base.js";
import { nextJsConfig } from "./next.js";
import { nodeJsConfig } from "./node-js.js";
import { reactPackageConfig } from "./react-Package.js";

/** @type {import("eslint").Linter.Config[]} */
export default config;

export const nextJS = nextJsConfig;
export const nodeJS = nodeJsConfig;
export const reactPackage = reactPackageConfig