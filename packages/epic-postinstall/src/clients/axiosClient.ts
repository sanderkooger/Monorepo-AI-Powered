import axios from 'axios';

export async function fetchHtml(uri: string): Promise<string> {
  try {
    const response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.error(`Error fetching HTML from ${uri}:`, error);
    throw error;
  }
}