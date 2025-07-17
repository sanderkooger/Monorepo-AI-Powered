export function parseGitHubRepoUrl(url: string): { owner: string; repo: string } {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);

    if (pathParts.length >= 2 && urlObj.hostname === 'github.com') {
      const owner = pathParts[0];
      const repo = pathParts[1].replace(/\.git$/, ''); // Remove .git extension if present
      return { owner, repo };
    } else {
      throw new Error(`Invalid GitHub repository URL: ${url}`);
    }
  } catch (error) {
    console.error(`Error parsing GitHub repository URL ${url}:`, error);
    throw error;
  }
}