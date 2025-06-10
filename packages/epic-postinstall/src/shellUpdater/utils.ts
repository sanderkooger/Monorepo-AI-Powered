import { homedir } from 'os';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import logger from '@src/logger/index.js'; // Import logger
import { isNodeJS_ErrnoException } from '@helpers/typeGuards.js'; // Import the type guard

/**
 * Detects the shells installed on the system.
 * @returns A promise that resolves to an array of detected shell names (e.g., ['bash', 'zsh', 'fish']).
 */
export async function detectInstalledShells(): Promise<string[]> {
  const shells: string[] = [];
 

  // Check for common shell executables
  const commonShellPaths = [
    '/bin/bash',
    '/bin/zsh',
    '/usr/bin/fish',
    '/bin/sh', // POSIX shell
    '/bin/dash', // Debian Almquist shell
    '/bin/ksh', // KornShell
    '/bin/tcsh', // TENEX C Shell
    '/bin/csh', // C Shell
    '/usr/bin/nu', // Nushell common path
    '/usr/bin/elvish', // Elvish common path
  ];

  for (const shellPath of commonShellPaths) {
    try {
      await fs.access(shellPath);
      const shellName = shellPath.split('/').pop();
      if (shellName && !shells.includes(shellName)) {
        shells.push(shellName);
      }
    } catch (error: unknown) {
      // File does not exist or is not accessible, log at debug level and ignore
      if (isNodeJS_ErrnoException(error)) {
        logger.debug(`Could not access shell path ${shellPath}: ${error.message}`);
      } else {
        logger.debug(`An unknown error occurred while accessing shell path ${shellPath}: ${error}`);
      }
    }
  }

  // On Linux/macOS, try 'chsh -l' to get a list of valid login shells
  if (process.platform !== 'win32') {
    try {
      const { stdout } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        exec('chsh -l', (error, stdout, stderr) => {
          if (error) reject(error);
          resolve({ stdout, stderr });
        });
      });
      const chshShells = stdout.split('\n').map(s => s.trim()).filter(Boolean).map(s => s.split('/').pop());
      for (const shellName of chshShells) {
        if (shellName && !shells.includes(shellName)) {
          shells.push(shellName);
        }
      }
    } catch (error: unknown) {
      // chsh might not be available or might fail, log at debug level and ignore
      if (isNodeJS_ErrnoException(error)) {
        logger.debug(`'chsh -l' command failed or not available: ${error.message}`);
      } else {
        logger.debug(`An unknown error occurred while running 'chsh -l': ${error}`);
      }
    }
  }

  return shells;
}

/**
 * Determines the absolute path to the shell configuration file.
 * @param shell The name of the shell (e.g., 'bash', 'zsh', 'fish').
 * @param isLoginShell True if targeting a login shell config file, false for interactive non-login.
 * @param systemInfo System information to determine OS-specific paths.
 * @returns The absolute path to the shell configuration file.
 */
export function getShellConfigPath(shell: string, isLoginShell: boolean): string {
  const home = homedir();
  switch (shell) {
    case 'bash':
    case 'sh': // Treat sh like bash for config paths
      if (isLoginShell) {
        // Prefer .bash_profile, fallback to .profile
        return `${home}/.bash_profile`; // We'll check for .profile existence in the calling function if .bash_profile isn't found
      }
      return `${home}/.bashrc`; // .bashrc is common for interactive non-login shells
    case 'zsh':
      if (isLoginShell) {
        // Prefer .zprofile, fallback to .zshrc
        return `${home}/.zprofile`; // We'll check for .zshrc existence in the calling function if .zprofile isn't found
      }
      return `${home}/.zshrc`;
    case 'fish':
      // Fish typically uses one config file for interactive shells
      return `${home}/.config/fish/config.fish`;
    case 'nu': // Nushell
    case 'nushell':
      return `${home}/.config/nushell/config.nu`; // Common config path for Nushell
    case 'elvish':
      return `${home}/.elvish/rc.elv`; // Common config path for Elvish
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Generates unique start and end comment strings for the injected block.
 * @param programName The name of the program adding the configuration.
 * @returns An object containing the start and end comment identifiers.
 */
export function getCommentBlockIdentifier(programName: string): { start: string; end: string } {
  const identifier = `epic-postinstall added this for ${programName}`;
  return {
    start: `# ${identifier} START`,
    end: `# ${identifier} END`,
  };
}

/**
 * Wraps the raw snippet content with the appropriate shell comment syntax.
 * @param shell The name of the shell.
 * @param programName The name of the program.
 * @param snippetContent The raw shell snippet to wrap.
 * @returns The full shell script block with comments.
 */
export function generateShellScriptBlock(shell: string, programName: string, snippetContent: string): string {
  const { start, end } = getCommentBlockIdentifier(programName);
  // For now, comment syntax is the same across these shells.
  // If other shells require different comment syntax, this function would need to adapt.
  return `${start}\n${snippetContent}\n${end}`;
}