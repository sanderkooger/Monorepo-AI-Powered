import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import logger from '@src/logger/index.js'
import getReleases from './getReleases/index.js'

interface InstallerArgs {
  systemInfo: SystemInfo
  version: string
  githubUrl: string
}

const runInstaller = async (args: InstallerArgs) => {
  logger.info('Installer arguments received:');
  logger.info(`GitHub URL: ${args.githubUrl}`);
  // Disabled because turbo rules do not apply during install time
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const githubToken = process.env.GITHUB_TOKEN; // Retrieve token from environment variable

  if (githubToken) {
    logger.info('GitHub token found in environment variables.');
  } else {
    logger.warn('No GitHub token found in environment variables. Proceeding with unauthenticated requests.');
  }

  const releases = await getReleases(args.githubUrl, githubToken);
  logger.info('Releases fetched successfully:');
  logger.info(JSON.stringify(releases, null, 2));
}

export default runInstaller
