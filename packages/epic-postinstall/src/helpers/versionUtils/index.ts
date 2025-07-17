import logger from '@src/logger/index.js';

/**
 * Compares two semantic version strings (e.g., "1.2.3" vs "1.2.0").
 * Returns true if installedVersion is greater than or equal to requiredVersion.
 * Handles basic semantic versioning (major.minor.patch).
 * @param installedVersion The version string currently installed.
 * @param requiredVersion The minimum required version string.
 * @returns True if installedVersion >= requiredVersion, false otherwise.
 */
export function isVersionCompatible(installedVersion: string, requiredVersion: string): boolean {
  logger.debug(`Comparing installed version '${installedVersion}' with required version '${requiredVersion}'`);

  const parseVersion = (version: string) => {
    // Remove any non-numeric or leading 'v' characters and split by '.'
    return version.replace(/[^0-9.]/g, '').split('.').map(Number);
  };

  const installedParts = parseVersion(installedVersion);
  const requiredParts = parseVersion(requiredVersion);

  const maxLength = Math.max(installedParts.length, requiredParts.length);

  for (let i = 0; i < maxLength; i++) {
    const installed = installedParts[i] || 0; // Treat missing parts as 0
    const required = requiredParts[i] || 0; // Treat missing parts as 0

    if (installed > required) {
      logger.debug(`Installed version ${installedVersion} is greater than required version ${requiredVersion}`);
      return true;
    }
    if (installed < required) {
      logger.debug(`Installed version ${installedVersion} is less than required version ${requiredVersion}`);
      return false;
    }
  }

  logger.debug(`Installed version ${installedVersion} is equal to required version ${requiredVersion}`);
  return true; // Versions are equal
}