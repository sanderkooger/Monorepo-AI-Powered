import logger from '@src/logger/index.js';

/**
 * Defines universally allowed patterns for .envrc content.
 * These patterns are considered safe for automatic 'direnv allow'.
 */
const UNIVERSALLY_ALLOWED_DIRENV_PATTERNS: RegExp[] = [
  /^#!\/bin\/bash$/, // Shebang
  /^export [A-Z_]+="[^"]*"$/, // Generic environment variable export (e.g., export VAR="value")
  /^layout [a-zA-Z0-9_ ]+$/, // Generic layout command (e.g., layout python3, layout node)
  // Add other universally safe patterns here if needed
];

/**
 * Checks if the content of a .envrc file is safe for automatic 'direnv allow'.
 * This function uses a strict set of universally allowed patterns.
 * @param content The content of the .envrc file.
 * @param additionalAllowedEnvVars Optional array of additional environment variable names to allow.
 * @returns True if the content is safe, false otherwise.
 */
export function checkDirenvContentSafety(content: string, additionalAllowedEnvVars: string[] = []): boolean {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const allAllowedPatterns = [
    ...UNIVERSALLY_ALLOWED_DIRENV_PATTERNS,
    ...additionalAllowedEnvVars.map(varName => new RegExp(`^export ${varName}="[^"]*"$`))
  ];

  for (const line of lines) {
    let isAllowed = false;
    for (const pattern of allAllowedPatterns) {
      if (pattern.test(line)) {
        isAllowed = true;
        break;
      }
    }
    if (!isAllowed) {
      logger.warn(`Disallowed content found in .envrc: "${line}"`);
      return false;
    }
  }
  return true;
}