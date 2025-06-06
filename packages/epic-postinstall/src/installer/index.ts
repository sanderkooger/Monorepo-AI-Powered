import { SystemInfo } from '@helpers/getSystemInfo/index.js';

interface InstallerArgs {
  systemInfo: SystemInfo;
  version: string;
  githubUrl: string;
}

const runInstaller = (args: InstallerArgs) => {
  console.log("Installer arguments received:");
  console.log(`System Info: ${JSON.stringify(args.systemInfo, null, 2)}`);
  console.log(`Version: ${args.version}`);
  console.log(`GitHub URL: ${args.githubUrl}`);
};

export { runInstaller };