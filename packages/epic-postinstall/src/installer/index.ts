import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import logger from '@src/logger/index.js'
import getReleases from './getReleases/index.js'
import selectBinary from './selectReleaseUrl/selectReleaseUrl.js'
import { Releases } from './getReleases/index.js'
import { binInstaller } from './binInstaller.js'
import { GitBinary } from '@src/helpers/getConfig/index.js'
import { getBinaryVersion } from '@helpers/getBinaryVersion/index.js'
import { isVersionCompatible } from '@helpers/versionUtils/index.js'

interface InstallerArgs {
  systemInfo: SystemInfo
  gitBinary: GitBinary
  targetBinPath: string
}

const runInstaller = async (args: InstallerArgs) => {
  logger.info(`GitHub URL: ${args.gitBinary.githubRepo}`);

  const installedVersion = await getBinaryVersion(args.gitBinary.cmd);

  if (installedVersion && isVersionCompatible(installedVersion, args.gitBinary.version)) {
    logger.success(`Skipping installation of ${args.gitBinary.cmd}. Installed version (${installedVersion}) is compatible with required version (${args.gitBinary.version}).`);
    return;
  }

  // get releases for repo
  const releases: Releases = await getReleases(args.gitBinary);
  const releaseUrl = selectBinary(releases, args.systemInfo, args.gitBinary.version);
  
  if (releaseUrl) {
    await binInstaller(releaseUrl, args.targetBinPath, args.gitBinary);
  } else {
    logger.error('No suitable release found for installation.');
  }
}

export default runInstaller
