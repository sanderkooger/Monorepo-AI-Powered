
import { promises as fs } from 'fs';
import logger from '@src/logger/index.js';
import { ShellUpdaterOptions} from './types.js'; // Re-add Posix
import { detectInstalledShells, getShellConfigPath, getCommentBlockIdentifier, generateShellScriptBlock } from './utils.js';

/**
 * Adds shell configuration snippets for a given program to the appropriate shell startup files.
 * It auto-detects installed shells, applies configurations, and handles Zsh fallback for Bash configs.
 * @param options The options for updating the shell, including program name, system info, and shell data.
 * @returns A promise that resolves to true if all configurations were successfully added or already existed, false otherwise.
 */
export async function add(options: ShellUpdaterOptions): Promise<boolean> {
  const { programName, shellUpdaterData } = options;
  const installedShells = await detectInstalledShells();
  let overallSuccess = true;
  const configuredFilePaths = new Set<string>(); // Track files that have been processed

  for (const detectedShell of installedShells) {
    let snippetContent: string | string[] | undefined;
    let isLoginShell = false; // Default for interactive shells

    // Determine snippet content and loginShell status based on detected shell and provided data
    switch (detectedShell) {
      case 'bash':
        if (shellUpdaterData.bash) {
          snippetContent = shellUpdaterData.bash.snippets;
          isLoginShell = shellUpdaterData.bash.loginShell;
        }
        break;
      case 'zsh':
      case 'sh': // Treat sh like zsh for fallback logic
        if (detectedShell === 'zsh' && shellUpdaterData.zsh) {
          snippetContent = shellUpdaterData.zsh.snippets;
          isLoginShell = shellUpdaterData.zsh.loginShell;
        } else if (shellUpdaterData.bash) { // Zsh/sh fallback to Bash config
          snippetContent = shellUpdaterData.bash.snippets;
          isLoginShell = shellUpdaterData.bash.loginShell;
          logger.info(`Using Bash configuration for ${detectedShell} as no specific ${detectedShell} configuration was provided for '${programName}'.`);
        }
        break;
      case 'fish':
        snippetContent = shellUpdaterData.fish;
        break;
      case 'nu': // Nushell
      case 'nushell':
        snippetContent = shellUpdaterData.nushell;
        isLoginShell = false; // Nushell typically has one config file
        break;
      case 'elvish':
        snippetContent = shellUpdaterData.elvish;
        isLoginShell = false; // Elvish typically has one config file
        break;
      case 'tmux': // tmux is a terminal multiplexer, not a shell, so we should ignore it.
        logger.debug(`Detected 'tmux', which is a terminal multiplexer, not a shell. Skipping configuration for '${programName}'.`);
        continue; // Skip to the next detected shell
      default:
        // For any other detected shell not explicitly handled, debug log and skip
        logger.debug(`Detected shell '${detectedShell}' is not explicitly supported by shellUpdater. Skipping configuration for '${programName}'.`);
        continue; // Skip to the next detected shell
    }

    if (!snippetContent) {
      logger.warn(`No specific configuration provided for '${detectedShell}' shell for program '${programName}'. Skipping.`);
      continue;
    }

    try {
      const targetFilePath = getShellConfigPath(detectedShell, isLoginShell);

      // If this file has already been configured by a previous shell, skip
      if (configuredFilePaths.has(targetFilePath)) {
        continue;
      }

      const fullSnippetBlock = generateShellScriptBlock(detectedShell, programName, snippetContent);
      const { start: blockStartIdentifier } = getCommentBlockIdentifier(programName);

      let fileContent = '';
      try {
        fileContent = await fs.readFile(targetFilePath, 'utf8');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (readError: any) {
        if (readError.code === 'ENOENT') {
          // File does not exist, will create it
          logger.debug(`Shell config file not found: ${targetFilePath}. It will be created.`);
        } else {
          logger.error(`Failed to read shell config file ${targetFilePath}: ${readError.message}`);
          overallSuccess = false;
          continue;
        }
      }

      if (fileContent.includes(blockStartIdentifier)) {
        logger.info(`Configuration for '${programName}' already exists in '${targetFilePath}'. Skipping.`);
        configuredFilePaths.add(targetFilePath); // Mark as configured
      } else {
        await fs.appendFile(targetFilePath, `\n${fullSnippetBlock}\n`, 'utf8');
        logger.success(`Successfully added configuration for '${programName}' to '${targetFilePath}'.`);
        configuredFilePaths.add(targetFilePath); // Mark as configured
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error(`Error updating ${detectedShell} shell for '${programName}': ${error.message}`);
      overallSuccess = false;
    }
  }

  return overallSuccess;
}