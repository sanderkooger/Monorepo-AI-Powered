import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import logger from '@src/logger/index.js'
import getReleases from './getReleases/index.js'
import selectBinary from './selectReleaseUrl/selectReleaseUrl.js'
import { Releases } from './getReleases/index.js'

interface InstallerArgs {
  systemInfo: SystemInfo
  version: string
  githubUrl: string
  targetBinPath: string
}

const runInstaller = async (args: InstallerArgs) => {
  logger.info('Installer arguments received:');
  logger.info(`GitHub URL: ${args.githubUrl}`);
 
  // get releases for repo
  const releases: Releases = await getReleases(args.githubUrl);
  const releaseUrl = selectBinary(releases, args.systemInfo, args.version);
  
}

export default runInstaller
