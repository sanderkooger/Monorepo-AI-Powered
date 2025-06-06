export interface GithubReleaseAsset {
  url: string;
  name: string;
  label: string | null;
  content_type: string;
  size: number;
  download_count: number;
  browser_download_url: string;
}

export interface GithubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GithubReleaseAsset[];
  tarball_url: string;
  zipball_url: string;
  body: string | null;
}
