import logger from '../logger/index.js';
import { isCommandAvailable } from '../helpers/commandExists.js';

export interface SystemInfo {
  os: 'linux' | 'macos' | 'windows' | 'unknown';
  arch: string;
  packageManagers: { name: string; version: string | null }[];
}

export const getSystemInfo = (): SystemInfo => {
  logger.debug('Starting system information detection...');
  let os: SystemInfo['os'] = 'unknown';
  const arch = process.arch;
  const packageManagers: { name: string; version: string | null }[] = [];

  logger.debug(`Detected platform: ${process.platform}`);
  switch (process.platform) {
    case 'darwin':
      os = 'macos';
      logger.info('Detected OS: macOS');
      logger.info(`Detected Architecture: ${arch}`);
      logger.debug('Platform is macOS. Checking for Homebrew...');
      {
        const brew = isCommandAvailable('brew');
        if (brew.available) {
          packageManagers.push({ name: 'homebrew', version: brew.version });
          logger.info('Homebrew found.');
        } else {
          logger.info('Homebrew not found.');
        }
      }
      break;
    case 'linux':
      os = 'linux';
      logger.info('Detected OS: Linux');
      logger.info(`Detected Architecture: ${arch}`);
      logger.debug('Platform is Linux. Checking for apt, yum, dnf...');
      {
        const apt = isCommandAvailable('apt-get');
        if (apt.available) {
          packageManagers.push({ name: 'apt', version: apt.version });
        }
      }
      {
        const yum = isCommandAvailable('yum');
        if (yum.available) {
          packageManagers.push({ name: 'yum', version: yum.version });
        }
      }
      {
        const dnf = isCommandAvailable('dnf');
        if (dnf.available) {
          packageManagers.push({ name: 'dnf', version: dnf.version });
        }
      }
      break;
    case 'win32':
      logger.warn('epic-postinstall is not fully compatible with Windows. Proceeding with almost guaranteed breaking super mega power limited functionality.');
      os = 'windows'; // Set OS to windows even if not fully compatible
      logger.info('Detected OS: Windows (limited compatibility)');
      logger.info(`Detected Architecture: ${arch}`);
      break;
    default:
      logger.warn(`Unknown platform: ${process.platform}. Setting OS to 'unknown'.`);
      os = 'unknown';
      logger.info(`Detected OS: unknown (${process.platform})`);
      logger.info(`Detected Architecture: ${arch}`);
      break;
  }

  logger.debug(`System information gathered: OS=${os}, Arch=${arch}, Package Managers=${JSON.stringify(packageManagers)}`);
  return {
    os,
    arch,
    packageManagers,
  };
}