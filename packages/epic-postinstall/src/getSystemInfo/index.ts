import { execSync } from 'child_process';

export interface SystemInfo {
  os: 'linux' | 'macos' | 'windows' | 'unknown';
  arch: string;
  packageManagers: string[];
}

const isCommandAvailable = (command: string): boolean => {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return false;
  }
};

export const getSystemInfo = (): SystemInfo => {
  let os: SystemInfo['os'] = 'unknown';
  const arch = process.arch;
  const packageManagers: string[] = [];

  switch (process.platform) {
    case 'darwin':
      os = 'macos';
      if (isCommandAvailable('brew')) {
        packageManagers.push('homebrew');
      }
      break;
    case 'linux':
      os = 'linux';
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
      throw new Error('epic-postinstall is not compatible with Windows. Please run this on a Linux or macOS system.');
    default:
      os = 'unknown';
      break;
  }

  // Common package managers across platforms
  if (isCommandAvailable('npm')) {
    packageManagers.push('npm');
  }
  if (isCommandAvailable('yarn')) {
    packageManagers.push('yarn');
  }
  if (isCommandAvailable('pnpm')) {
    packageManagers.push('pnpm');
  }

  return {
    os,
    arch,
    packageManagers,
  };
}