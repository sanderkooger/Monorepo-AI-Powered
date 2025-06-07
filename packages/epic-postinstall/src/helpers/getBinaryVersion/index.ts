import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import logger from '@src/logger/index.js';

const execPromise = promisify(exec);

/**
 * Attempts to get the version of a command by running it with '--version' or '-v'.
 * @param command The command to check.
 * @returns The version string if found, otherwise null.
 */
export async function getBinaryVersion(command: string): Promise<string | null> {
  logger.debug(`Attempting to get version for command: '${command}'`);
  try {
    // Try with --version
    const { stdout: versionOutput } = await execPromise(`${command} --version`, { encoding: 'utf8' });
    const match = versionOutput.match(/(\d+\.\d+\.\d+)/); // Basic regex to find semantic version
    if (match && match[1]) {
      logger.debug(`Found version for '${command}' using --version: ${match[1]}`);
      return match[1];
    }
  } catch (error) {
    logger.debug(`'${command} --version' failed: ${(error as Error).message}`);
  }

  try {
    // Try with -v
    const { stdout: versionOutput } = await execPromise(`${command} -v`, { encoding: 'utf8' });
    const match = versionOutput.match(/(\d+\.\d+\.\d+)/); // Basic regex to find semantic version
    if (match && match[1]) {
      logger.debug(`Found version for '${command}' using -v: ${match[1]}`);
      return match[1];
    }
  } catch (error) {
    logger.debug(`'${command} -v' failed: ${(error as Error).message}`);
  }

  logger.debug(`Could not determine version for command: '${command}'`);
  return null;
}