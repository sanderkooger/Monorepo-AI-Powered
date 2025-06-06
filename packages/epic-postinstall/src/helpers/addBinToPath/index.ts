import { homedir } from 'os';
import getSystemInfo from '@helpers/getSystemInfo/index.js';
import logger from '@src/logger/index.js';
import { promises as fs } from 'fs';

/**
 * Ensures that a given directory is part of the system's PATH environment variable.
 * If not, it attempts to add it to the appropriate shell configuration file.
 * @param targetPath The directory to ensure is in the PATH.
 * @returns True if the path is already present or was successfully added, false otherwise.
 */
const addBinToPath = async (targetPath: string): Promise<boolean> => {
  logger.info(`Checking if '${targetPath}' is in the system PATH...`);
  const systemInfo = getSystemInfo();
  const currentPath = process.env.PATH || '';
  const homeDir = homedir();
  const resolvedTargetPath = targetPath.replace(/^~/, homeDir);

  // Check if the targetPath is already in the PATH
  const pathSeparator = systemInfo.os === 'windows' ? ';' : ':';
  const pathParts = currentPath.split(pathSeparator);
  if (pathParts.includes(resolvedTargetPath)) {
    logger.info(`'${targetPath}' is already in the PATH.`);
    logger.info(`It might have been added by a shell configuration file like ~/.bashrc, ~/.zshrc, or ~/.profile.`);
    return true;
  }

  logger.warn(`'${targetPath}' is NOT in the PATH.`);

  if (systemInfo.os === 'linux' || systemInfo.os === 'macos') {
    const shell = process.env.SHELL || '';
    let configFile = '';

    if (shell.includes('bash')) {
      configFile = `${homeDir}/.bashrc`;
    } else if (shell.includes('zsh')) {
      configFile = `${homeDir}/.zshrc`;
    } else {
      // Fallback for other shells or login shells
      configFile = `${homeDir}/.profile`;
    }

    const pathExportLine = `export PATH="${resolvedTargetPath}:$PATH"`;

    try {
      let content = '';
      try {
        content = await fs.readFile(configFile, 'utf8');
      } catch (readError: any) {
        if (readError.code === 'ENOENT') {
          logger.debug(`Config file '${configFile}' not found, will create.`);
        } else {
          throw readError;
        }
      }

      if (!content.includes(pathExportLine)) {
        logger.info(`Adding '${targetPath}' to '${configFile}'...`);
        await fs.appendFile(configFile, `\n${pathExportLine}\n`);
        logger.info(`Successfully added '${targetPath}' to '${configFile}'.`);
        logger.warn('Please restart your terminal or run `source ~/.bashrc` (or equivalent) for changes to take effect.');
        return true;
      } else {
        logger.info(`'${targetPath}' export line already exists in '${configFile}'.`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to modify shell configuration file '${configFile}': ${(error as Error).message}`);
      return false;
    }
  } else {
    logger.error(`Automatic PATH modification is not supported for OS: ${systemInfo.os}`);
    return false;
  }
};
export default addBinToPath