import { promises as fs } from 'fs';
import logger from '../logger/index.js';
import { isNodeJS_ErrnoException } from '../helpers/typeGuards.js';
import shellUpdater, { ShellUpdaterOptions } from '../shellUpdater/index.js';
import { SystemInfo } from '@src/helpers/getSystemInfo/index.js';
import { EpicPostinstallStateManager } from '../stateManager/index.js';

export async function uninstall(
  projectRoot: string,
  targetBinPath: string,
  systemInfo: SystemInfo
): Promise<void> {
  logger.info('Starting uninstallation process...');
  const stateManager = new EpicPostinstallStateManager(projectRoot);
  const state = await stateManager.loadState();

  if (state.installations.length === 0) {
    logger.info('No installations found in state file. Nothing to uninstall.');
    return;
  }

  for (const record of state.installations) {
    logger.info(`Uninstalling ${record.cmd} (version: ${record.version})...`);

    // 1. Remove shell configuration
    if (record.shellUpdate) {
      const programNameForRemoval = record.shellUpdateProgramName || record.cmd;
      logger.info(`Attempting to remove shell configuration for ${programNameForRemoval}...`);
      const shellUpdateOptions: ShellUpdaterOptions = {
        programName: programNameForRemoval,
        systemInfo: systemInfo,
        shellUpdaterData: record.shellUpdate, // shellUpdaterData is not strictly needed for removal, but type requires it
      };
      const removedShellConfig = await shellUpdater.remove(shellUpdateOptions);
      if (removedShellConfig) {
        logger.success(`Successfully removed shell configuration for ${programNameForRemoval}.`);
      } else {
        logger.warn(`Failed to remove shell configuration for ${programNameForRemoval}. Manual cleanup may be required.`);
      }
    }

    // 2. Remove binary file
    if (record.binaryPath) {
      try {
        await fs.access(record.binaryPath, fs.constants.F_OK);
        logger.info(`Found binary at ${record.binaryPath}. Attempting to remove...`);
        await fs.unlink(record.binaryPath);
        logger.success(`Successfully removed binary for ${record.cmd}.`);
      } catch (error: unknown) {
        if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
          logger.info(`Binary for ${record.cmd} not found at ${record.binaryPath}. Skipping binary removal.`);
        } else if (isNodeJS_ErrnoException(error)) {
          logger.error(`Failed to remove binary for ${record.cmd} at ${record.binaryPath}: ${error.message}`);
        } else {
          logger.error(`An unknown error occurred while removing binary for ${record.cmd}: ${error}`);
        }
      }
    } else {
      logger.warn(`No binary path recorded for ${record.cmd}. Skipping binary file removal.`);
    }

    // 3. Remove ASDF home directory if it was ASDF
    if (record.cmd === 'asdf' && record.asdfHome) {
      try {
        await fs.access(record.asdfHome, fs.constants.F_OK);
        logger.info(`Found ASDF home directory at ${record.asdfHome}. Attempting to remove...`);
        await fs.rm(record.asdfHome, { recursive: true, force: true });
        logger.success(`Successfully removed ASDF home directory.`);
      } catch (error: unknown) {
        if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
          logger.info(`ASDF home directory not found at ${record.asdfHome}. Skipping directory removal.`);
        } else if (isNodeJS_ErrnoException(error)) {
          logger.error(`Failed to remove ASDF home directory ${record.asdfHome}: ${error.message}`);
        } else {
          logger.error(`An unknown error occurred while removing ASDF home directory: ${error}`);
        }
      }
    }
  }

  // 4. Remove the state file itself after all uninstallations
  try {
    await fs.unlink(stateManager['stateFilePath']); // Access private property for now
    logger.success(`Successfully removed state file: ${stateManager['stateFilePath']}`);
  } catch (error: unknown) {
    if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
      logger.info(`State file not found at ${stateManager['stateFilePath']}. Skipping state file removal.`);
    } else if (isNodeJS_ErrnoException(error)) {
      logger.error(`Failed to remove state file ${stateManager['stateFilePath']}: ${error.message}`);
    } else {
      logger.error(`An unknown error occurred while removing state file: ${error}`);
    }
  }

  logger.info('Uninstallation process completed.');
}
