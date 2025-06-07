import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Writable } from 'node:stream';
import logger from '../logger/index.js';

const execPromise = promisify(exec);

/**
 * Downloads a release asset, unpacks it, and places the executable in ~/.local.bin.
 * Creates ~/.local.bin if it does not exist. Overwrites previous versions.
 * @param releaseUrl The URL of the release asset to download.
 */
export async function binInstaller(releaseUrl: string, targetBinPath: string): Promise<void> {
  const fileName = path.basename(releaseUrl);
  const executableName = path.parse(fileName).name;
  const finalTargetPath = path.join(targetBinPath, executableName);
  let downloadedFilePath: string | undefined; // Declare here for finally block scope

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
      logger.info(`Downloading archive ${releaseUrl} to ${downloadedFilePath}...`);
      const arrayBuffer = await response.arrayBuffer();
      await fs.writeFile(downloadedFilePath, Buffer.from(arrayBuffer));
      logger.info('Archive download complete.');

      let command = '';
      if (fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz')) {
        command = `tar -xzf ${downloadedFilePath} -C ${targetBinPath}`;
      } else if (fileName.endsWith('.tar.xz')) {
        command = `tar -xJf ${downloadedFilePath} -C ${targetBinPath}`;
      } else if (fileName.endsWith('.zip')) {
        command = `unzip -o ${downloadedFilePath} -d ${targetBinPath}`;
      }

      logger.info(`Unpacking ${fileName} to ${targetBinPath}...`);
      await execPromise(command);
      logger.success(`Successfully unpacked and installed from ${fileName} to ${targetBinPath}`);

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
  }
}