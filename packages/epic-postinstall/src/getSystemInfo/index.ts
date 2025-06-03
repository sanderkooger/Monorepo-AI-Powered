import { execSync } from 'child_process';
import { debug, warn, info } from '../logger/index.js';

export interface SystemInfo {
  os: 'linux' | 'macos' | 'windows' | 'unknown';
  arch: string;
  packageManagers: string[];
}

const isCommandAvailable = (command: string): boolean => {
  debug(`Checking if command '${command}' is available...`);
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    debug(`Command '${command}' is available.`);
    return true;
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    debug(`Command '${command}' is NOT available.`);
    return false;
  }
};

export const getSystemInfo = (): SystemInfo => {
  debug('Starting system information detection...');
  let os: SystemInfo['os'] = 'unknown';
  const arch = process.arch;
  const packageManagers: string[] = [];

  debug(`Detected platform: ${process.platform}`);
  switch (process.platform) {
    case 'darwin':
      os = 'macos';
      info('Detected OS: macOS');
      info(`Detected Architecture: ${arch}`);
      debug('Platform is macOS. Checking for Homebrew...');
      if (isCommandAvailable('brew')) {
        packageManagers.push('homebrew');
        info('Homebrew found.');
      } else {
        info('Homebrew not found.');
      }
      break;
    case 'linux':
      os = 'linux';
      info('Detected OS: Linux');
      info(`Detected Architecture: ${arch}`);
      debug('Platform is Linux. Checking for apt, yum, dnf...');
      if (isCommandAvailable('apt-get')) {
        packageManagers.push('apt');
      }
      if (isCommandAvailable('yum')) {
        packageManagers.push('yum');
      }
      if (isCommandAvailable('dnf')) {
        packageManagers.push('dnf');
      }
      break;
    case 'win32':
      warn('epic-postinstall is not fully compatible with Windows. Proceeding with almost guaranteed breaking super mega power limited functionality.');
      os = 'windows'; // Set OS to windows even if not fully compatible
      info('Detected OS: Windows (limited compatibility)');
      info(`Detected Architecture: ${arch}`);
      break;
    default:
      warn(`Unknown platform: ${process.platform}. Setting OS to 'unknown'.`);
      os = 'unknown';
      info(`Detected OS: unknown (${process.platform})`);
      info(`Detected Architecture: ${arch}`);
      break;
  }

  // Common package managers across platforms
  debug('Checking for common package managers (npm, yarn, pnpm)...');
  if (isCommandAvailable('npm')) {
    packageManagers.push('npm');
  }
  if (isCommandAvailable('yarn')) {
    packageManagers.push('yarn');
  }
  if (isCommandAvailable('pnpm')) {
    packageManagers.push('pnpm');
  }

  debug(`System information gathered: OS=${os}, Arch=${arch}, Package Managers=${packageManagers.join(', ')}`);
  return {
    os,
    arch,
    packageManagers,
  };
}