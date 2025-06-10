import { promises as fs } from 'fs';
import logger from '@src/logger/index.js';
import { ShellUpdaterOptions } from './types.js';
import { SystemInfo } from '@helpers/getSystemInfo/index.js'; // Explicitly import SystemInfo
import { detectInstalledShells, getShellConfigPath, getCommentBlockIdentifier } from './utils.js';

/**
 * Removes shell configuration snippets for a given program from the appropriate shell startup files.
 * It auto-detects installed shells and attempts to remove the corresponding configuration blocks.
 * @param options The options for updating the shell, including program name, system info, and shell data.
 * @returns A promise that resolves to true if all configurations were successfully removed or not found, false otherwise.
 */
export async function remove(options: ShellUpdaterOptions): Promise<boolean> {
  const { programName, systemInfo} = options;
  const installedShells = await detectInstalledShells();
  let overallSuccess = true;

  for (const detectedShell of installedShells) {
    // For removal, we need to consider both login and non-login paths for Bash/Zsh
    // as we don't necessarily know which one was used during 'add'.
    // We'll try to remove from both if applicable.
    const potentialPaths: { path: string; isLoginShell: boolean }[] = [];

    if (detectedShell === 'bash' || detectedShell === 'zsh' || detectedShell === 'sh') {
      potentialPaths.push({ path: getShellConfigPath(detectedShell, true), isLoginShell: true });
      potentialPaths.push({ path: getShellConfigPath(detectedShell, false), isLoginShell: false });
    } else if (detectedShell === 'fish') {
      potentialPaths.push({ path: getShellConfigPath(detectedShell, false), isLoginShell: false }); // isLoginShell is irrelevant for fish
    } else if (detectedShell === 'nu' || detectedShell === 'nushell') {
      potentialPaths.push({ path: getShellConfigPath(detectedShell, false), isLoginShell: false });
    } else if (detectedShell === 'elvish') {
      potentialPaths.push({ path: getShellConfigPath(detectedShell, false), isLoginShell: false });
    } else {
      // For any other detected shell not explicitly handled, warn and skip
      logger.warn(`Detected shell '${detectedShell}' is not explicitly supported by shellUpdater for removal. Skipping.`);
      continue; // Skip to the next detected shell
    }

    const { start: blockStartIdentifier, end: blockEndIdentifier } = getCommentBlockIdentifier(programName);
    const regex = new RegExp(`\\n?${blockStartIdentifier}[\\s\\S]*?${blockEndIdentifier}\\n?`, 'g');

    for (const { path: targetFilePath } of potentialPaths) {
      try {
        let fileContent = '';
        try {
          fileContent = await fs.readFile(targetFilePath, 'utf8');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (readError: any) {
          if (readError.code === 'ENOENT') {
            logger.debug(`Shell config file not found: ${targetFilePath}. Nothing to remove.`);
            continue; // File doesn't exist, nothing to remove from here
          } else {
            logger.error(`Failed to read shell config file ${targetFilePath}: ${readError.message}`);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        logger.error(`Error removing from ${detectedShell} shell config file ${targetFilePath} for '${programName}': ${error.message}`);
        overallSuccess = false;
      }
    }
  }

  return overallSuccess;
}