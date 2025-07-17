import path from 'path';
import fs from 'fs/promises';
import { EpicPostinstallState, InstallationRecord } from './types.js';
import logger from '@src/logger/index.js';

const STATE_FILE_NAME = '.epic-postinstall-state.json';
const GITIGNORE_FILE_NAME = '.gitignore';


export class EpicPostinstallStateManager {
  private stateFilePath: string;
  private gitignorePath: string;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.stateFilePath = path.join(projectRoot, STATE_FILE_NAME);
    this.gitignorePath = path.join(projectRoot, GITIGNORE_FILE_NAME);
  }

  /**
   * Loads the current state from the .epic-install-state.json file.
   * If the file does not exist, an empty state is returned.
   * @returns The loaded state.
   */
  async loadState(): Promise<EpicPostinstallState> {
    try {
      const content = await fs.readFile(this.stateFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: unknown) {
      const err = error as Error;
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug(`State file not found at ${this.stateFilePath}. Returning empty state.`);
        // Attempt to read package.json to get projectId
        let projectId = 'unknown-project';
        try {
          const packageJsonPath = path.join(this.projectRoot, 'package.json');
          const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
          const packageJson = JSON.parse(packageJsonContent);
          if (packageJson.name) {
            projectId = packageJson.name;
          }
        } catch {
          logger.warn(`Could not read package.json at ${this.projectRoot} to determine projectId.`);
        }
        return { projectId, installations: [] };
      }
      logger.error(`Failed to load state from ${this.stateFilePath}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Saves the current state to the .epic-install-state.json file.
   * Ensures the parent directory exists.
   * @param state The state to save.
   */
  async saveState(state: EpicPostinstallState): Promise<void> {
    try {
      await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
      logger.debug(`State saved to ${this.stateFilePath}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Failed to save state to ${this.stateFilePath}: ${err.message}`);
      throw error;
    }
  }

  /**
   * Adds an installation record to the state.
   * @param record The installation record to add.
   */
  async addInstallation(record: InstallationRecord): Promise<void> {
    const state = await this.loadState();
    // Prevent duplicate entries based on cmd and version
    const existingIndex = state.installations.findIndex(
      (inst) => inst.cmd === record.cmd && inst.version === record.version
    );

    if (existingIndex !== -1) {
      state.installations[existingIndex] = record; // Update existing record
      logger.debug(`Updated existing installation record for ${record.cmd}@${record.version}`);
    } else {
      state.installations.push(record);
      logger.debug(`Added new installation record for ${record.cmd}@${record.version}`);
    }
    await this.saveState(state);
  }

  /**
   * Removes an installation record from the state based on its command.
   * @param cmd The command of the installation to remove.
   */
  async removeInstallation(cmd: string): Promise<void> {
    const state = await this.loadState();
    const initialLength = state.installations.length;
    state.installations = state.installations.filter((inst) => inst.cmd !== cmd);
    if (state.installations.length < initialLength) {
      await this.saveState(state);
      logger.debug(`Removed installation record for ${cmd}`);
    } else {
      logger.debug(`No installation record found for ${cmd} to remove.`);
    }
  }

  /**
   * Ensures that the .epic-postinstall/ directory is ignored in the project's .gitignore file.
   */
  async ensureGitignoreEntry(): Promise<void> {
    const ignoreEntry = `/${STATE_FILE_NAME}`; // Ignore the file itself
    let gitignoreContent = '';

    try {
      gitignoreContent = await fs.readFile(this.gitignorePath, 'utf-8');
    } catch (error: unknown) {
      const err = error as Error;
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug(`${GITIGNORE_FILE_NAME} not found at ${this.gitignorePath}. Creating it.`);
        // Will create the file later if needed
      } else {
        logger.warn(`Could not read ${this.gitignorePath}: ${err.message}`);
        return; // Abort if cannot read for other reasons
      }
    }

    if (!gitignoreContent.includes(ignoreEntry)) {
      try {
        await fs.appendFile(this.gitignorePath, `\n# epic-postinstall state files (local installation tracking)\n${ignoreEntry}\n`, 'utf-8');
        logger.info(`Added comment and '${ignoreEntry}' to ${this.gitignorePath}`);
      } catch (error: unknown) {
        const err = error as Error;
        logger.error(`Failed to add '${ignoreEntry}' to ${this.gitignorePath}: ${err.message}`);
      }
    } else {
      logger.debug(`'${ignoreEntry}' already present in ${this.gitignorePath}`);
    }
  }

}