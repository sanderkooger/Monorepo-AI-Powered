import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../logger/index.js';

const execPromise = promisify(exec);

export async function executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
  logger.debug(`Executing command: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd });
    if (stdout) {
      logger.debug(`stdout: ${stdout}`);
    }
    if (stderr) {
      logger.debug(`stderr: ${stderr}`);
    }
    return { stdout, stderr };
  } catch (error: unknown) {
    logger.error(`Command failed: ${command}`);
    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);
    } else {
      logger.error(`Unknown error: ${error}`);
    }
    throw error;
  }
}