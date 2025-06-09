import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Writable } from 'node:stream';
import logger from '../logger/index.js';
import { GitBinary, PostInstallScript } from '@src/helpers/getConfig/index.js';
import { randomUUID } from 'node:crypto';

const execPromise = promisify(exec);

async function executePostInstallScript(scriptConfig: PostInstallScript, installedBinaryPath: string): Promise<void> {
  if (scriptConfig.inline) {
    logger.info(`Executing inline post-install script for ${installedBinaryPath}...`);
    try {
      const { stdout, stderr } = await execPromise(scriptConfig.inline, { cwd: path.dirname(installedBinaryPath) });
      if (stdout) logger.debug(`Script stdout: ${stdout}`);
      if (stderr) logger.warn(`Script stderr: ${stderr}`);
      logger.success('Inline post-install script executed successfully.');
    } catch (error) {
      logger.error(`Failed to execute inline post-install script: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  } else if (scriptConfig.path) {
    const scriptPath = path.resolve(scriptConfig.path); // Resolve to an absolute path
    logger.info(`Executing post-install script from file: ${scriptPath} for ${installedBinaryPath}...`);
    try {
      // Ensure the script is executable
      await fs.chmod(scriptPath, '755');
      const { stdout, stderr } = await execPromise(scriptPath, { cwd: path.dirname(installedBinaryPath) });
      if (stdout) logger.debug(`Script stdout: ${stdout}`);
      if (stderr) logger.warn(`Script stderr: ${stderr}`);
      logger.success('Post-install script file executed successfully.');
    } catch (error) {
      logger.error(`Failed to execute post-install script from file ${scriptPath}: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  } else {
    logger.warn('Post-install script configuration found but no inline script or path specified.');
  }
}

/**
 * Downloads a release asset, unpacks it, and places the executable in ~/.local.bin.
 * Creates ~/.local.bin if it does not exist. Overwrites previous versions.
 * @param releaseUrl The URL of the release asset to download.
 */
/**
 * Recursively searches a directory for an executable file.
 * @param directory The directory to search.
 * @param executableName The name of the executable to find.
 * @returns The full path to the executable if found, otherwise undefined.
 */
async function findExecutableInDirectory(directory: string, executableName: string): Promise<string | undefined> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  let foundExecutable: string | undefined;
  const foundExecutables: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isFile() && entry.name === executableName) {
      foundExecutables.push(fullPath);
      // For now, we'll just take the first one, but log a warning if multiple are found.
      if (!foundExecutable) {
        foundExecutable = fullPath;
      }
    } else if (entry.isDirectory()) {
      const nestedExecutable = await findExecutableInDirectory(fullPath, executableName);
      if (nestedExecutable) {
        foundExecutables.push(nestedExecutable);
        if (!foundExecutable) {
          foundExecutable = nestedExecutable;
        }
      }
    }
  }

  if (foundExecutables.length > 1) {
    logger.warn(`Multiple binaries named '${executableName}' found in archive. Using the first one found: ${foundExecutable}`);
  }

  return foundExecutable;
}

/**
 * Downloads a release asset, unpacks it, and places the executable in ~/.local.bin.
 * Creates ~/.local.bin if it does not exist. Overwrites previous versions.
 * @param releaseUrl The URL of the release asset to download.
 */
export async function binInstaller(releaseUrl: string, targetBinPath: string, gitBinary: GitBinary): Promise<void> {
  const fileName = path.basename(releaseUrl);
  const executableName = gitBinary.cmd; // Use gitBinary.cmd for the expected executable name
  const finalTargetPath = path.join(targetBinPath, executableName);
  let downloadedFilePath: string | undefined;
  let unpackDir: string | undefined; // Declare unpackDir here for finally block scope

  try {
    // Create targetBinPath if it doesn't exist
    await fs.mkdir(targetBinPath, { recursive: true });
    logger.debug(`Ensured directory exists: ${targetBinPath}`);

    const response = await fetch(releaseUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // Determine if it's an archive or a direct executable
    if (fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz') || fileName.endsWith('.zip') || fileName.endsWith('.tar.xz')) {
      // For archives, download to a temporary file first
      downloadedFilePath = path.join(os.tmpdir(), fileName);
      unpackDir = path.join(os.tmpdir(), `epic-postinstall-${randomUUID()}`);
      await fs.mkdir(unpackDir, { recursive: true });

      logger.info(`Downloading archive ${releaseUrl} to ${downloadedFilePath}...`);
      const arrayBuffer = await response.arrayBuffer();
      await fs.writeFile(downloadedFilePath, Buffer.from(arrayBuffer));
      logger.verbose('Archive download complete.');

      let command = '';
      if (fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz')) {
        command = `tar -xzf ${downloadedFilePath} -C ${unpackDir}`;
      } else if (fileName.endsWith('.tar.xz')) {
        command = `tar -xJf ${downloadedFilePath} -C ${unpackDir}`;
      } else if (fileName.endsWith('.zip')) {
        command = `unzip -o ${downloadedFilePath} -d ${unpackDir}`;
      }

      logger.verbose(`Unpacking ${fileName} to ${unpackDir}...`);
      await execPromise(command);
      logger.info(`Successfully unpacked ${fileName} to ${unpackDir}`);

      const foundBinaryPath = await findExecutableInDirectory(unpackDir, executableName);

      if (!foundBinaryPath) {
        throw new Error(`Executable '${executableName}' not found in the unpacked archive.`);
      }

      // Use copyFile and unlink instead of rename for cross-device compatibility
      await fs.copyFile(foundBinaryPath, finalTargetPath);
      await fs.unlink(foundBinaryPath); // Remove the original file after copying
      await fs.chmod(finalTargetPath, '755'); // Make it executable
      logger.success(`Successfully installed ${executableName} to ${finalTargetPath}`);

    } else {
      // For direct executables, stream directly to the final target path
      logger.info(`Streaming ${releaseUrl} to ${finalTargetPath}...`);
      const fileHandle = await fs.open(finalTargetPath, 'w');
      const writeStream = fileHandle.createWriteStream();
      await response.body?.pipeTo(Writable.toWeb(writeStream));
      await fileHandle.close();
      await fs.chmod(finalTargetPath, '755'); // Make it executable
      logger.success(`Successfully installed ${executableName} to ${finalTargetPath}`);
    }

    // Execute post-install script if configured
    if (gitBinary.postInstallScript) {
      await executePostInstallScript(gitBinary.postInstallScript, finalTargetPath);
    }

  } catch (error) {
    logger.error(`Error during installation: ${error instanceof Error ? error.message : error}`);
    throw error;
  } finally {
    // Clean up downloaded temporary archive file if it was created
    if (downloadedFilePath) {
      try {
        await fs.unlink(downloadedFilePath);
        logger.debug(`Cleaned up temporary file: ${downloadedFilePath}`);
      } catch (cleanupError) {
        logger.warn(`Failed to clean up temporary file ${downloadedFilePath}: ${cleanupError}`);
      }
    }
    // Clean up temporary unpack directory if it was created
    if (unpackDir) {
      try {
        await fs.rm(unpackDir, { recursive: true, force: true });
        logger.debug(`Cleaned up temporary unpack directory: ${unpackDir}`);
      } catch (cleanupError) {
        logger.warn(`Failed to clean up temporary unpack directory ${unpackDir}: ${cleanupError}`);
      }
    }
  }
}