import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchGitHubReleases(url: string, token?: string): Promise<any> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching GitHub releases from ${url}:`, error);
    throw error;
  }
}