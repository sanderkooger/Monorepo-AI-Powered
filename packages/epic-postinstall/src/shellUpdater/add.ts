
import { promises as fs } from 'fs';
import logger from '@src/logger/index.js';
import { ShellUpdaterOptions, Posix } from './types.js'; // Re-add Posix
import { SystemInfo } from '@helpers/getSystemInfo/index.js'; // Explicitly import SystemInfo
import { detectInstalledShells, getShellConfigPath, getCommentBlockIdentifier, generateShellScriptBlock } from './utils.js';

/**
 * Adds shell configuration snippets for a given program to the appropriate shell startup files.
 * It auto-detects installed shells, applies configurations, and handles Zsh fallback for Bash configs.
 * @param options The options for updating the shell, including program name, system info, and shell data.
 * @returns A promise that resolves to true if all configurations were successfully added or already existed, false otherwise.
 */
export async function add(options: ShellUpdaterOptions): Promise<boolean> {
  const { programName, systemInfo, shellUpdaterData } = options;
  const installedShells = await detectInstalledShells();
  let overallSuccess = true;

  for (const detectedShell of installedShells) {
    let snippetContent: string | undefined;
    let isLoginShell = false; // Default for interactive shells

    // Determine snippet content and loginShell status based on detected shell and provided data
    switch (detectedShell) {
      case 'bash':
        if (typeof shellUpdaterData.bash === 'string') {
          snippetContent = shellUpdaterData.bash;
          isLoginShell = false; // Default for string is .bashrc
        } else if (shellUpdaterData.bash) {
          snippetContent = shellUpdaterData.bash.snippet;
          isLoginShell = shellUpdaterData.bash.loginShell;
        }
        break;
      case 'zsh':
      case 'sh': // Treat sh like zsh for fallback logic
        if (detectedShell === 'zsh' && typeof shellUpdaterData.zsh === 'string') {
          snippetContent = shellUpdaterData.zsh;
          isLoginShell = false; // Default for string is .zshrc
        } else if (detectedShell === 'zsh' && shellUpdaterData.zsh) {
          snippetContent = shellUpdaterData.zsh.snippet;
          isLoginShell = shellUpdaterData.zsh.loginShell;
        } else if (shellUpdaterData.bash) { // Zsh/sh fallback to Bash config
          if (typeof shellUpdaterData.bash === 'string') {
            snippetContent = shellUpdaterData.bash;
            isLoginShell = false;
          } else {
            snippetContent = shellUpdaterData.bash.snippet;
            isLoginShell = shellUpdaterData.bash.loginShell;
          }
          logger.info(`Using Bash configuration for ${detectedShell} as no specific ${detectedShell} configuration was provided for '${programName}'.`);
        }
        break;
      case 'fish':
        snippetContent = shellUpdaterData.fish;
        isLoginShell = false; // Irrelevant for fish, but set for consistency
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
      default:
        // For any other detected shell not explicitly handled, warn and skip
        logger.warn(`Detected shell '${detectedShell}' is not explicitly supported by shellUpdater. Skipping configuration for '${programName}'.`);
        continue; // Skip to the next detected shell
    }

    if (!snippetContent) {
      logger.warn(`No specific configuration provided for '${detectedShell}' shell for program '${programName}'. Skipping.`);
      continue;
    }

    try {
      const targetFilePath = getShellConfigPath(detectedShell, isLoginShell);
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
      } else {
        await fs.appendFile(targetFilePath, `\n${fullSnippetBlock}\n`, 'utf8');
        logger.success(`Successfully added configuration for '${programName}' to '${targetFilePath}'.`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error(`Error updating ${detectedShell} shell for '${programName}': ${error.message}`);
      overallSuccess = false;
    }
  }

  return overallSuccess;
}