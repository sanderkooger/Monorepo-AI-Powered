import { cosmiconfigSync } from 'cosmiconfig'
import logger from '@src/logger/index.js'
import { ShellUpdaterData } from '@src/shellUpdater/index.js';

/**
 * Represents the structure of the configuration object.
 */
export interface HomebrewPackage {
  name: string
  tap?: string
}

export interface PostInstallScript {
  inline?: string;
  path?: string;
}

export interface GitBinary {
  cmd: string
  version: string
  githubRepo: string
  homebrew?: HomebrewPackage
  shellUpdate?: ShellUpdaterData
  postInstallScript?: PostInstallScript
}

export interface PythonVirtualEnv {
  name: string
  path?: string
  requirementsFile?: string
  packages?: string[]
}

export interface ScriptConfig {
  name: string
  path: string
  args?: string[]
}

export interface PythonConfig {
  version?: string
  virtualEnv: PythonVirtualEnv
  scripts?: ScriptConfig[]
}

export interface AsdfTool {
  version: string;
}

export interface AsdfConfig {
  version: string;
  tools?: {
    [toolName: string]: AsdfTool;
  };
}

export interface EpicPostinstallConfig {
  message?: string;
  gitBinaries?: {
    [name: string]: GitBinary;
  };
  python?: PythonConfig;
  scripts?: ScriptConfig[];
  asdf?: AsdfConfig;
}

/**
 * Loads the configuration for epic-postinstall using cosmiconfig.
 * It searches for configuration files named '.epicpostinstallrc' or 'epicpostinstall.config.js' (and other supported formats)
 * starting from the current working directory and traversing up the directory tree.
 *
 * @returns {EpicPostinstallConfig | null} The loaded configuration object, or null if no configuration is found.
 */
const getConfig = (): EpicPostinstallConfig | null => {
  logger.debug('Initializing cosmiconfig for epic-postinstall...')
  const moduleName = 'epicpostinstall'
  const explorerSync = cosmiconfigSync(moduleName, {
    searchPlaces: [
      'epicpostinstall.config.ts',
      'epicpostinstall.config.js',
      '.epicpostinstallrc.ts',
      '.epicpostinstallrc.js',
      '.epicpostinstallrc.json',
      '.epicpostinstallrc',
      'package.json'
    ]
  })
  logger.debug('Searching for configuration file...')
  const result = explorerSync.search()

  if (!result || !result.config) {
    logger.error(
      'No epic-postinstall configuration found. Please create an .epicpostinstallrc file or epicpostinstall.config.ts.'
    )
    throw new Error(
      'No epic-postinstall configuration found. Please create an .epicpostinstallrc file or epicpostinstall.config.ts.'
    )
  }
  logger.debug(`Configuration found at: ${result.filepath}`)
  return result.config as EpicPostinstallConfig
}
export default getConfig