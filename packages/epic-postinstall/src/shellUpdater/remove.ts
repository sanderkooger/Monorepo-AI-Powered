import { promises as fs } from 'fs';
import logger from '@src/logger/index.js';
import { ShellUpdaterOptions } from './types.js';
import { detectInstalledShells, getShellConfigPath, getCommentBlockIdentifier } from './utils.js';

/**
 * Removes shell configuration snippets for a given program from the appropriate shell startup files.
 * It auto-detects installed shells and attempts to remove the corresponding configuration blocks.
 * @param options The options for updating the shell, including program name, system info, and shell data.
 * @returns A promise that resolves to true if all configurations were successfully removed or not found, false otherwise.
 */
export async function remove(options: ShellUpdaterOptions): Promise<boolean> {
  const { programName } = options;
  const installedShells = await detectInstalledShells();
  let overallSuccess = true;

  for (const detectedShell of installedShells) {
    const potentialPaths: string[] = [];

    // Determine potential configuration file paths for the detected shell.
    // For Bash/Zsh/Sh, check both login and non-login shell config files.
    // For other shells, check their primary config file.
    switch (detectedShell) {
      case 'bash':
      case 'zsh':
      case 'sh':
        potentialPaths.push(getShellConfigPath(detectedShell, true));
        potentialPaths.push(getShellConfigPath(detectedShell, false));
        break;
      case 'fish':
      case 'nu':
      case 'nushell':
      case 'elvish':
        potentialPaths.push(getShellConfigPath(detectedShell, false)); // isLoginShell is irrelevant for these shells
        break;
      default:
        // For any other detected shell not explicitly handled, skip without warning.
        continue;
    }

    const { start: blockStartIdentifier, end: blockEndIdentifier } = getCommentBlockIdentifier(programName);
    const regex = new RegExp(`\\n?${blockStartIdentifier}[\\s\\S]*?${blockEndIdentifier}\\n?`, 'g');

    for (const targetFilePath of potentialPaths) {
      try {
        let fileContent = '';
        try {
          fileContent = await fs.readFile(targetFilePath, 'utf8');
        } catch (readError: unknown) {
          if ((readError as NodeJS.ErrnoException).code === 'ENOENT') {
            logger.debug(`Shell config file not found: ${targetFilePath}. Nothing to remove.`);
            continue; // File doesn't exist, nothing to remove from here
          } else {
            logger.error(`Failed to read shell config file ${targetFilePath}: ${(readError as Error).message}`);
            overallSuccess = false;
            continue;
          }
        }

        if (fileContent.includes(blockStartIdentifier)) {
          const newFileContent = fileContent.replace(regex, '');
          await fs.writeFile(targetFilePath, newFileContent, 'utf8');
          logger.success(`Successfully removed configuration for '${programName}' from '${targetFilePath}'.`);
        } else {
          logger.info(`Configuration for '${programName}' not found in '${targetFilePath}'. Skipping removal.`);
        }
      } catch (error: unknown) {
        logger.error(`Error removing from ${detectedShell} shell config file ${targetFilePath} for '${programName}': ${(error as Error).message}`);
        overallSuccess = false;
      }
    }
  }

  return overallSuccess;
}