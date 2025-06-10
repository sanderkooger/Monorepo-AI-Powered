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
        systemInfo: systemInfo, // Pass the existing systemInfo object
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

export async function uninstallAsdf(
  asdfBinary: GitBinary,
  targetBinPath: string,
  systemInfo: SystemInfo
): Promise<void> {
  logger.info('Starting ASDF uninstallation...');

  // First, remove ASDF's shell configuration
  if (asdfBinary.shellUpdate) {
    logger.info(`Attempting to remove shell configuration for ${asdfBinary.cmd}...`);
    const shellUpdateOptions: ShellUpdaterOptions = {
      programName: asdfBinary.cmd,
      systemInfo: systemInfo, // Pass the existing systemInfo object
      shellUpdaterData: asdfBinary.shellUpdate,
    };
    const removedShellConfig = await shellUpdater.remove(shellUpdateOptions);
    if (removedShellConfig) {
      logger.success(`Successfully removed shell configuration for ${asdfBinary.cmd}.`);
    } else {
      logger.warn(`Failed to remove shell configuration for ${asdfBinary.cmd}. Manual cleanup may be required.`);
    }
  }

  // Then, remove the ASDF binary itself
  const asdfPath = path.join(targetBinPath, asdfBinary.cmd);
  try {
    await fs.access(asdfPath, fs.constants.F_OK);
    logger.info(`Found ASDF at ${asdfPath}. Attempting to remove...`);
    await fs.unlink(asdfPath);
    logger.success(`Successfully removed ASDF binary.`);
  } catch (error: unknown) {
    if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
      logger.info(`ASDF binary not found at ${asdfPath}. Skipping binary removal.`);
    } else if (isNodeJS_ErrnoException(error)) {
      logger.error(`Failed to remove ASDF binary at ${asdfPath}: ${error.message}`);
    } else {
      logger.error(`An unknown error occurred while removing ASDF binary: ${error}`);
    }
  }

  // Finally, remove the ASDF home directory (~/.asdf)
  const asdfHome = path.join(systemInfo.homeDir, '.asdf');
  try {
    await fs.access(asdfHome, fs.constants.F_OK);
    logger.info(`Found ASDF home directory at ${asdfHome}. Attempting to remove...`);
    await fs.rm(asdfHome, { recursive: true, force: true });
    logger.success(`Successfully removed ASDF home directory.`);
  } catch (error: unknown) {
    if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
      logger.info(`ASDF home directory not found at ${asdfHome}. Skipping directory removal.`);
    } else if (isNodeJS_ErrnoException(error)) {
      logger.error(`Failed to remove ASDF home directory ${asdfHome}: ${error.message}`);
    } else {
      logger.error(`An unknown error occurred while removing ASDF home directory: ${error}`);
    }
  }

  logger.info('ASDF uninstallation process completed.');
}
