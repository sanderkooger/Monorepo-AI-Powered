import { SystemInfo } from '@helpers/getSystemInfo/index.js';

export interface Posix {
  loginShell: boolean; // true for login shell files (~/.profile, ~/.bash_profile, ~/.zprofile), false for interactive non-login files (~/.bashrc, ~/.zshrc)
  snippet: string; // Renamed from 'script'
}

export interface ShellUpdaterData {
  bash?: Posix;
  sh?: Posix
  zsh?: Posix;
  fish?: string;
  nushell?: string; // Placeholder for future expansion
  elvish?: string; // Placeholder for future expansion
}

export interface ShellUpdaterOptions {
  programName: string; // e.g., 'direnv', 'asdf', 'epic-postinstall-path'
  systemInfo: SystemInfo;
  shellUpdaterData: ShellUpdaterData;
}