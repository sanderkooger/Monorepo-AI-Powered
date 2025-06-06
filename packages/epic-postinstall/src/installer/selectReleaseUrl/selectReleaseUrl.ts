import logger from '@src/logger/index.js'
import { Releases } from '../getReleases/index.js'
import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import { GithubReleaseAsset } from '@src/types/github.js'

const filterAssetsByOs = (assets: GithubReleaseAsset[], systemInfo: SystemInfo): GithubReleaseAsset[] => {
  const os = systemInfo.os;
  return assets.filter(asset => {
    const assetName = asset.name.toLowerCase();
    if (os === 'macos') {
      return assetName.includes('darwin') || assetName.includes('macos');
    } else if (os === 'linux') {
      return assetName.includes('linux');
    } else if (os === 'windows') {
      return assetName.includes('windows');
    }
    return false;
  });
};

const filterAssetsByArch = (assets: GithubReleaseAsset[], systemInfo: SystemInfo): GithubReleaseAsset[] => {
  const arch = systemInfo.arch;
  return assets.filter(asset => {
    const assetName = asset.name.toLowerCase();
    if (arch === 'x64') {
      return assetName.includes('x64') || assetName.includes('amd64')|| assetName.includes('x86_64');
    } else if (arch === 'arm64') {
      return assetName.includes('arm64') || assetName.includes('aarch64');
    } else if (arch === 'arm') {
      // Assuming 'arm' maps to 'armv6hf' for shellcheck releases
      return assetName.includes('armv6hf');
    } else if (arch === 'riscv64') {
      return assetName.includes('riscv64');
    }
    return false;
  });
};
const ARCHIVE_PRIORITY_ORDER = ['.zip', '.tar.gz', '.tgz', '.tar.xz'];

const selectPreferredArchiveAsset = (assets: GithubReleaseAsset[]): GithubReleaseAsset | null => {
  const archiveAssets = assets.filter(asset => {
    const assetName = asset.name.toLowerCase();
    return ARCHIVE_PRIORITY_ORDER.some(ext => assetName.endsWith(ext));
  });

  if (archiveAssets.length === 0) {
    return null;
  }

  for (const preferredExt of ARCHIVE_PRIORITY_ORDER) {
    const foundAsset = archiveAssets.find(asset => asset.name.toLowerCase().endsWith(preferredExt));
    if (foundAsset) {
      return foundAsset;
    }
  }

  return archiveAssets[0]; // Fallback, should ideally not be reached if ARCHIVE_PRIORITY_ORDER is comprehensive
};

const selectReleaseUrl = (
  releases: Releases,
  systemInfo: SystemInfo,
  version: string
): string => {
  let sanitizedVersion = version;
  if (/^\d+(\.\d+)*$/.test(version)) {
    sanitizedVersion = `v${version}`;
  }

  const versionedRelease = releases[sanitizedVersion];
  if (!versionedRelease) {
    throw new Error(
      `Release for version ${sanitizedVersion} not found. Please check the Github.com/reponame/releases page for a valid version.`
    );
  }

  const osSpecificAssets = filterAssetsByOs(versionedRelease.assets, systemInfo);
  const archSpecificAssets = filterAssetsByArch(osSpecificAssets, systemInfo);
  const selectedAsset = selectPreferredArchiveAsset(archSpecificAssets);

  if (!selectedAsset) {
    logger.error('No preferred archive asset found for the specified OS, architecture, and archive format.');
    throw new Error('No suitable release asset found.');
  }

  logger.info(`Selected asset: ${selectedAsset.name} for OS: ${systemInfo.os}, Arch: ${systemInfo.arch}`);
  return selectedAsset.browser_download_url;
};

export default selectReleaseUrl;
