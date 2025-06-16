import { existsSync, writeFileSync, readFileSync } from 'fs';
import * as path from 'path';
import logger from '@src/logger/index.js';
import { executeCommand } from '@helpers/executeCommand/index.js';
import { checkDirenvContentSafety } from './direnvContentValidator.js';

import { EpicPostinstallConfig } from '@helpers/getConfig/index.js'; // Import EpicPostinstallConfig

/**
 * Allows a .envrc file with direnv.
 * @param envrcPath The full path to the .envrc file.
 */
async function allowDirenvFile(envrcPath: string): Promise<void> {
  logger.info(`Running 'direnv allow' for ${envrcPath}...`);
  await executeCommand(`direnv allow ${envrcPath}`);
  logger.success('.envrc file allowed by direnv.');
}

/**
 * Creates or updates a .envrc file and ensures it's allowed by direnv,
 * with content safety checks based on configured allowed environment variables.
 * @param projectRoot The root directory of the project.
 * @param expectedContent The expected content for the .envrc file.
 * @param config The full EpicPostinstallConfig object.
 */
export async function createDirenvFile(projectRoot: string, expectedContent: string, config: EpicPostinstallConfig, defaultAllowedEnvVars: string[] = []): Promise<void> {
  const envrcPath = path.join(projectRoot, '.envrc');

  const globalAllowedEnvVars = config.direnv?.allowedEnvVars || [];
  const pythonAllowedEnvVars = config.python?.allowedEnvVars || [];
  const allAllowedEnvVars = [...new Set([...globalAllowedEnvVars, ...pythonAllowedEnvVars, ...defaultAllowedEnvVars])];

  if (!existsSync(envrcPath)) {
    logger.info(`Creating .envrc file at ${envrcPath}`);
    logger.debug(`Content to write: \n${expectedContent}`);
    writeFileSync(envrcPath, expectedContent);
    logger.success('.envrc file created successfully.');
    await allowDirenvFile(envrcPath);
  } else {
    logger.info('.envrc file already exists. Checking content for safety...');
    const existingContent = readFileSync(envrcPath, 'utf-8');
    logger.debug(`Existing content: \n${existingContent}`);

    if (existingContent.trim() === expectedContent.trim()) {
      logger.info('Existing .envrc content matches expected content. Ensuring it is allowed by direnv...');
      await allowDirenvFile(envrcPath);
    } else if (checkDirenvContentSafety(existingContent, allAllowedEnvVars)) {
      logger.info(
        `Existing .envrc file at ${envrcPath} contains additional safe content. ` +
        `Running 'direnv allow'.`
      );
      await allowDirenvFile(envrcPath);
    } else {
      logger.warn(
        `Existing .envrc file at ${envrcPath} contains unexpected or potentially unsafe content. ` +
        `Automatic 'direnv allow' skipped. Please review the file manually and run 'direnv allow' if it's safe.`
      );
    }
  }
}