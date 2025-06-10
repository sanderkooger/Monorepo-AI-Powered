import path from 'path'
import { promises as fs } from 'fs'
import logger from '../logger/index.js';
import { GitBinary } from '../helpers/getConfig/index.js';
import { isNodeJS_ErrnoException } from '../helpers/typeGuards.js'; // Import the type guard
import shellUpdater, { ShellUpdaterOptions } from '../shellUpdater/index.js';
import { SystemInfo } from '@src/helpers/getSystemInfo/index.js';

export async function uninstallBinaries(
  gitBinaries: Record<string, GitBinary>,
  targetBinPath: string,
  systemInfo: SystemInfo // Add systemInfo parameter
): Promise<void> {
  logger.info('Starting uninstallation of git binaries...');

  for (const binaryKey in gitBinaries) {
    const binary = gitBinaries[binaryKey];
    const binaryPath = path.join(targetBinPath, binary.cmd);

    // Attempt to remove shell configuration first
    if (binary.shellUpdate) {
      logger.info(`Attempting to remove shell configuration for ${binary.cmd}...`);
      const shellUpdateOptions: ShellUpdaterOptions = {
        programName: binary.cmd,
        systemInfo: { os: process.platform as SystemInfo['os'], arch: process.arch}, // SystemInfo needs to be passed, assuming basic platform info is sufficient here
        shellUpdaterData: binary.shellUpdate,
      };
      const removedShellConfig = await shellUpdater.remove(shellUpdateOptions);
      if (removedShellConfig) {
        logger.success(`Successfully removed shell configuration for ${binary.cmd}.`);
      } else {
        logger.warn(`Failed to remove shell configuration for ${binary.cmd}. Manual cleanup may be required.`);
      }
    }

    try {
      await fs.access(binaryPath, fs.constants.F_OK);
      logger.info(`Found ${binary.cmd} at ${binaryPath}. Attempting to remove...`);
      await fs.unlink(binaryPath);
      logger.success(`Successfully removed ${binary.cmd}.`);
    } catch (error: unknown) {
      if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
        logger.info(`${binary.cmd} not found at ${binaryPath}. Skipping binary removal.`);
      } else if (isNodeJS_ErrnoException(error)) {
        logger.error(`Failed to remove ${binary.cmd} at ${binaryPath}: ${error.message}`);
      } else {
        logger.error(`An unknown error occurred while removing ${binary.cmd}: ${error}`);
      }
    }
  }
 
  // The isNodeJS_ErrnoException function is now in typeGuards.ts
  // function isNodeJS_ErrnoException(error: unknown): error is NodeJS.ErrnoException {
  //   return (
  //     typeof error === 'object' &&
  //     error !== null &&
  //     'code' in error &&
  //     typeof (error as NodeJS.ErrnoException).code === 'string'
  //   )
  // }
  logger.info('Uninstallation process completed.')
}
