import { cosmiconfigSync } from 'cosmiconfig';

/**
 * Represents the structure of the configuration object.
 */
export interface EpicPostinstallConfig {
  message?: string;
  binaries?: {
    [name: string]: {
      cmd: string;
      version?: string;
      githubRepo?: string;
      homebrewPackageName?: string;
    };
  };
  python?: {
    version?: string;
    virtualEnv?: {
      name: string;
      path?: string;
      requirementsFile?: string;
      packages?: string[];
    };
    scripts?: {
      name: string;
      path: string;
      args?: string[];
    }[];
  };
  scripts?: {
    name: string;
    path: string;
    args?: string[];
    runOn?: ('preinstall' | 'postinstall' | 'always')[];
    platforms?: ('linux' | 'windows' | 'macos')[];
  }[];
}

/**
 * Loads the configuration for epic-postinstall using cosmiconfig.
 * It searches for configuration files named '.epicpostinstallrc' or 'epicpostinstall.config.js' (and other supported formats)
 * starting from the current working directory and traversing up the directory tree.
 *
 * @returns {EpicPostinstallConfig | null} The loaded configuration object, or null if no configuration is found.
 */
export function loadConfig(): EpicPostinstallConfig | null {
  const moduleName = 'epicpostinstall';
  const explorerSync = cosmiconfigSync(moduleName, {
    searchPlaces: [
      'epicpostinstall.config.ts',
      'epicpostinstall.config.js',
      '.epicpostinstallrc.ts',
      '.epicpostinstallrc.js',
      '.epicpostinstallrc.json',
      '.epicpostinstallrc',
      'package.json'
    ],
  });
  const result = explorerSync.search();

  if (result && result.config) {
    return result.config as EpicPostinstallConfig;
  }
  return null;
}