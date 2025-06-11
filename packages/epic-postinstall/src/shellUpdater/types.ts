import { SystemInfo } from '@helpers/getSystemInfo/index.js';

export interface Posix {
  loginShell: boolean; // true for login shell files (~/.profile, ~/.bash_profile, ~/.zprofile), false for interactive non-login files (~/.bashrc, ~/.zshrc)
  snippet: string | string[]; // Renamed from 'script', now supports single string or array of strings
}

export interface ShellUpdaterData {
  bash?: Posix;
  sh?: Posix
  zsh?: Posix;
  fish?: string | string[];
  nushell?: string | string[]; // Placeholder for future expansion
  elvish?: string | string[]; // Placeholder for future expansion
}

export interface ShellUpdaterOptions {
  programName: string; // e.g., 'direnv', 'asdf', 'epic-postinstall-path'
  systemInfo: SystemInfo;
  shellUpdaterData: ShellUpdaterData;
}