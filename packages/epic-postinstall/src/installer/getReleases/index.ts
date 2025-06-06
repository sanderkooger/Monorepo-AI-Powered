import { fetchGitHubReleases } from '../../clients/githubApiClient.js';
import { parseGitHubRepoUrl } from '../../helpers/parseGitHubRepoUrl/index.js';
import logger from '../../logger/index.js';

import { GithubRelease } from '@src/types/github.js';

export interface Releases {
  [version: string]: GithubRelease;
}

async function getReleases(repoUrl: string): Promise<Releases> {
  logger.info(`Attempting to get releases for repository URL: ${repoUrl}`);
  
  const githubToken = process.env.GITHUB_TOKEN; // Use provided token or fallback to env variable
  try {
    const { owner, repo } = parseGitHubRepoUrl(repoUrl);
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

    logger.info(`Fetching releases from GitHub API: ${apiUrl}`);
    const githubReleases = await fetchGitHubReleases(apiUrl, githubToken);

    const releases: Releases = {};
    githubReleases.forEach((release: GithubRelease) => {
      releases[release.tag_name] = release;
    });
    logger.info(`Successfully found ${Object.keys(releases).length} releases from GitHub API.`);
    if (Object.keys(releases).length === 0) {
      logger.error(`No releases available for ${repoUrl}.`);
      throw new Error(`No releases available for ${repoUrl}.`);
    }
    return releases;
  } catch (error) {
    logger.error(`Failed to get releases from GitHub API for ${repoUrl}:`, error);
    throw error;
  }
}

export default getReleases;
