import { fetchGitHubReleases } from '../../clients/githubApiClient.js';
import { parseGitHubRepoUrl } from '../../helpers/parseGitHubRepoUrl/index.js';
import logger from '../../logger/index.js';

interface Release {
  version: string;
  links: string[];
}

interface ReleasesByVersion {
  [version: string]: Release;
}

async function getReleases(repoUrl: string, githubToken?: string): Promise<ReleasesByVersion> {
  logger.info(`Attempting to get releases for repository URL: ${repoUrl}`);
  try {
    const { owner, repo } = parseGitHubRepoUrl(repoUrl);
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

    logger.info(`Fetching releases from GitHub API: ${apiUrl}`);
    const githubReleases = await fetchGitHubReleases(apiUrl, githubToken);

    const releases: ReleasesByVersion = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    githubReleases.forEach((release: any) => {
      const version = release.tag_name;
      const links: string[] = [];

      // Add tarball and zipball URLs
      if (release.tarball_url) {
        links.push(release.tarball_url);
      }
      if (release.zipball_url) {
        links.push(release.zipball_url);
      }

      // Add browser download URLs for assets
      if (release.assets && Array.isArray(release.assets)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        release.assets.forEach((asset: any) => {
          if (asset.browser_download_url) {
            links.push(asset.browser_download_url);
          }
        });
      }

      if (version && links.length > 0) {
        releases[version] = { version, links };
      }
    });

    logger.info(`Successfully found ${Object.keys(releases).length} releases from GitHub API.`);
    return releases;
  } catch (error) {
    logger.error(`Failed to get releases from GitHub API for ${repoUrl}:`, error);
    throw error;
  }
}

export default getReleases;
