import path from 'path';
import fs from 'fs/promises';

/**
 * Traverses upwards from the start directory to find the nearest project root.
 * A project root is identified by the presence of a 'package.json' file.
 * @param startDir The directory to start the search from.
 * @returns The absolute path to the project root, or null if not found.
 */
export async function findProjectRoot(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const rootDir = path.parse(currentDir).root;

  while (currentDir !== rootDir) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    try {
      await fs.access(packageJsonPath);
      return currentDir; // Found package.json, this is the project root
    } catch {
      // package.json not found in this directory, move up
      currentDir = path.dirname(currentDir);
    }
  }

  // Check the root directory itself
  const packageJsonPath = path.join(rootDir, 'package.json');
  try {
    await fs.access(packageJsonPath);
    return rootDir;
  } catch {
    return null; // package.json not found anywhere up to the system root
  }
}