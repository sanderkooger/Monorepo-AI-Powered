import { GitBinary } from '@helpers/getConfig/index.js';

export interface InstallationRecord extends GitBinary {
  timestamp: string; // ISO 8601 string of when the installation was recorded
}

export interface EpicPostinstallState {
  projectId: string; // Derived from package.json name or projectRoot
  installations: InstallationRecord[];
  // Future: fileModifications: FileModificationRecord[]; // If we need to track non-GitBinary related file changes
}