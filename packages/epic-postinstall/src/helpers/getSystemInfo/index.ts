import logger from '@src/logger/index.js';
import isCommandAvailable from '@src/helpers/isCommandAvailable/index.js';

export interface SystemInfo {
  os: 'linux' | 'macos' | 'windows' | 'unknown';
  arch: string;
  homebrewAvailable?: boolean;
}

const getSystemInfo = (): SystemInfo => {
  logger.debug('Starting system information detection...');
  const result: SystemInfo = {
    os: 'unknown',
    arch: process.arch,
  };

  logger.debug(`Detected platform: ${process.platform}`);
  switch (process.platform) {
    case 'darwin':
      result.os = 'macos';
      logger.info('Detected OS: macOS');
      logger.info(`Detected Architecture: ${result.arch}`);
      logger.debug('Platform is macOS. Checking for Homebrew...');
      result.homebrewAvailable = isCommandAvailable('brew').available;
      if (result.homebrewAvailable) {
        logger.info('Homebrew available.');
      } else {
        logger.warn('Homebrew not found, please install.');
      }
      break;
    case 'linux':
      result.os = 'linux';
      logger.info('Detected OS: Linux');
      logger.info(`Detected Architecture: ${result.arch}`);
      // No package manager checks for Linux as per request
      break;
    case 'win32':
      logger.warn('epic-postinstall is not fully compatible with Windows. Proceeding with almost guaranteed breaking super mega power limited functionality.');
      result.os = 'windows'; // Set OS to windows even if not fully compatible
      logger.info('Detected OS: Windows (limited compatibility)');
      logger.info(`Detected Architecture: ${result.arch}`);
      break;
    default:
      logger.warn(`Unknown platform: ${process.platform}. Setting OS to 'unknown'.`);
      result.os = 'unknown';
      logger.info(`Detected OS: unknown (${process.platform})`);
      logger.info(`Detected Architecture: ${result.arch}`);
      break;
  }

  logger.debug(`System information gathered: OS=${result.os}, Arch=${result.arch}, Homebrew Available=${result.homebrewAvailable}`);
  return result;
}
export default getSystemInfo;