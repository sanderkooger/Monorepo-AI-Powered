import { promises as fs } from 'fs'
import logger from '@src/logger/index.js'
import { ShellUpdaterOptions } from './types.js' // Re-add Posix
import {
  detectInstalledShells,
  getShellConfigPath,
  getCommentBlockIdentifier,
  generateShellScriptBlock
} from './utils.js'

/**
 * Adds shell configuration snippets for a given program to the appropriate shell startup files.
 * It auto-detects installed shells, applies configurations, and handles Zsh fallback for Bash configs.
 * @param options The options for updating the shell, including program name, system info, and shell data.
 * @returns A promise that resolves to true if all configurations were successfully added or already existed, false otherwise.
 */
export async function add(options: ShellUpdaterOptions): Promise<boolean> {
  const { programName, shellUpdaterData } = options
  const installedShells = await detectInstalledShells()
  let overallSuccess = true
  const configuredFilePaths = new Set<string>() // Track files that have been processed

  for (const detectedShell of installedShells) {
    let snippetContent: string | string[] | undefined
    let isLoginShell = false

    // Determine snippet content and loginShell status based on detected shell and provided data
    switch (detectedShell) {
      case 'bash':
        if (shellUpdaterData.bash) {
          snippetContent = shellUpdaterData.bash.snippets
          isLoginShell = shellUpdaterData.bash.loginShell ?? false
        }
        break
      case 'zsh':
      case 'sh': // Fallback for sh/zsh to bash if zsh config is not available
        if (detectedShell === 'zsh' && shellUpdaterData.zsh) {
          snippetContent = shellUpdaterData.zsh.snippets
          isLoginShell = shellUpdaterData.zsh.loginShell ?? false
        } else if (shellUpdaterData.bash) {
          snippetContent = shellUpdaterData.bash.snippets
          isLoginShell = shellUpdaterData.bash.loginShell ?? false
          logger.info(
            `Using Bash configuration for ${detectedShell} as no specific configuration was provided for '${programName}'.`
          )
        }
        break
      case 'fish':
        snippetContent = shellUpdaterData.fish
        break
      case 'nu': // Nushell
      case 'nushell':
      case 'elvish':
        // Nushell and Elvish typically have one config file, not distinguishing login/non-login
        snippetContent = shellUpdaterData[detectedShell as 'nushell' | 'elvish']
        isLoginShell = false
        break
      case 'tmux': // tmux is a terminal multiplexer, not a shell, so we should ignore it.
        logger.debug(`Detected shell '${detectedShell}' is not a supported shell type. Skipping.`)
        continue
      default:
        logger.debug(
          `Detected shell '${detectedShell}' is not explicitly supported by shellUpdater. Skipping configuration for '${programName}'.`
        )
        continue
    }

    if (!snippetContent) {
      logger.warn(
        `No configuration provided for '${detectedShell}' shell for program '${programName}'. Skipping.`
      )
      continue
    }

    try {
      const targetFilePath = getShellConfigPath(detectedShell, isLoginShell)

      // If this file has already been configured by a previous shell, skip
      if (configuredFilePaths.has(targetFilePath)) {
        continue
      }

      const fullSnippetBlock = generateShellScriptBlock(
        detectedShell,
        programName,
        snippetContent
      )
      const { start: blockStartIdentifier } =
        getCommentBlockIdentifier(programName)

      // Convert snippetContent to a single string for content checking
      const rawSnippetContent = Array.isArray(snippetContent)
        ? snippetContent.join('\n')
        : snippetContent

      let fileContent = ''
      try {
        fileContent = await fs.readFile(targetFilePath, 'utf8')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (readError: any) {
        if ((readError as NodeJS.ErrnoException).code === 'ENOENT') {
          logger.debug(`Shell config file not found: ${targetFilePath}. It will be created.`)
        } else {
          logger.error(`Failed to read shell config file ${targetFilePath}: ${(readError as Error).message}`)
          overallSuccess = false
          continue
        }
      }

      // Check if the full comment block or the raw snippet content already exists
      if (fileContent.includes(blockStartIdentifier) || fileContent.includes(rawSnippetContent)) {
        logger.info(
          `Configuration for '${programName}' already exists in '${targetFilePath}'. Skipping.`
        )
      } else {
        await fs.appendFile(targetFilePath, `\n${fullSnippetBlock}\n`, 'utf8')
        logger.success(
          `Successfully added configuration for '${programName}' to '${targetFilePath}'.`
        )
      }
      configuredFilePaths.add(targetFilePath) // Mark as configured regardless of whether it was added or already existed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(
        `Error updating ${detectedShell} shell for '${programName}': ${errorMessage}`
      )
      overallSuccess = false
    }
  }

  return overallSuccess
}
