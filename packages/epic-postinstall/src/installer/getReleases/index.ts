import * as cheerio from 'cheerio';
import { fetchHtml } from '@src/clients/axiosClient.js';
import * as fs from 'fs/promises'; // Import fs/promises for async file operations
import logger from '@src/logger/index.js';

interface Release {
  version: string;
  gitRepoUrl: string;
}

interface ReleasesByVersion {
  [version: string]: Release;
}

async function getReleases(repoUrl: string): Promise<ReleasesByVersion> {
  let urlToFetch = repoUrl;
  if (!urlToFetch.includes('/releases')) {
    urlToFetch = `${urlToFetch}/releases`;
  }
logger.info(`Fetching releases from: ${urlToFetch}`);
  try {
    const htmlContent = await fetchHtml(urlToFetch);
    // For now, write the HTML content to a file for examination
    await fs.writeFile('temp/temp_github_releases.html', htmlContent);
    console.log('Fetched HTML saved to temp/temp_github_releases.html');

    // TODO: Implement parsing logic using cheerio here
    // const $ = cheerio.load(htmlContent);
    // ... parsing logic ...

    return {}; // Return an empty object for now, as parsing is not yet implemented
  } catch (error) {
    console.error(`Failed to get releases from ${repoUrl}:`, error);
    throw error;
  }
}

export default getReleases;
