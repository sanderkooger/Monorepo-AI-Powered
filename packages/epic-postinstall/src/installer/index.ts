import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import logger from '@src/logger/index.js'
import getReleases from './getReleases/index.js'

interface InstallerArgs {
  systemInfo: SystemInfo
  version: string
  githubUrl: string
}

const runInstaller = (args: InstallerArgs) => {
  logger.info('Installer arguments received:')
  logger.info(`System Info: ${JSON.stringify(args.systemInfo, null, 2)}`)
  logger.info(`Version: ${args.version}`)
  logger.info(`GitHub URL: ${args.githubUrl}`)

}

export default runInstaller
