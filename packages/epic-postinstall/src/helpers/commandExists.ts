import { execSync } from 'child_process';
import logger from '../logger/index.js';

/**
 * Checks if a command is available and optionally returns its version.
 * It tries to get the version using '--version' first, then '-v'.
 * @param command The command to check.
 * @returns An object indicating availability and the version string if found, otherwise null.
 */
export const isCommandAvailable = (command: string): { available: boolean; version: string | null } => {
  logger.debug(`Checking if command '${command}' is available...`);
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    logger.debug(`Command '${command}' is available.`);

    let version: string | null = null;
    try {
      // Try to get version using --version
      version = execSync(`${command} --version`, { encoding: 'utf8', stdio: 'pipe' }).trim();
      logger.debug(`Version for '${command}' (--version): ${version}`);
    } catch (e: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
      logger.debug(`'${command} --version' failed, trying '-v'.`);
      try {
        // Try to get version using -v
        version = execSync(`${command} -v`, { encoding: 'utf8', stdio: 'pipe' }).trim();
        logger.debug(`Version for '${command}' (-v): ${version}`);
      } catch (e2: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
        logger.debug(`'${command} -v' also failed. No version found.`);
      }
    }

    return { available: true, version };
  } catch (e: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
    logger.debug(`Command '${command}' is NOT available.`);
    return { available: false, version: null };
  }
};