const GITHUB_API_BASE_URL =
  process.env.GITHUB_API_BASE_URL || 'https://api.github.com';

const MAX_FILE_BYTES = 40_000;
const MAX_README_CHARS = 12_000;
const MAX_PACKAGE_CHARS = 8_000;
const MAX_SOURCE_FILE_CHARS = 6_000;
const MAX_SOURCE_FILES = 6;

const PRIORITY_SOURCE_FILES = [
  'package.json',
  'README.md',
  'readme.md',
  'src/index.js',
  'src/index.ts',
  'src/main.js',
  'src/main.ts',
  'src/App.jsx',
  'src/App.tsx',
  'src/app.js',
  'src/app.ts',
  'index.js',
  'index.ts',
  'main.js',
  'main.ts',
  'app.js',
  'app.ts',
  'server.js',
  'server.ts',
  'src/server.js',
  'src/server.ts',
  'client/src/App.jsx',
  'client/src/App.tsx',
  'server/server.js',
  'server/app.js',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'requirements.txt',
  'pom.xml',
  'build.gradle',
  'Dockerfile',
];

/**
 * Parse a GitHub repository URL into { owner, repo }.
 * Accepts https://github.com/owner/repo and similar variants.
 */
function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!['github.com', 'www.github.com'].includes(parsed.hostname)) {
    return null;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, '');

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

function buildHeaders(accept = 'application/vnd.github+json') {
  const headers = {
    Accept: accept,
    'User-Agent': 'RepoLens',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function createApiError(message, status, cause) {
  const error = new Error(message);
  error.status = status;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

/**
 * Shared GitHub REST request helper used by other services.
 */
async function githubRequest(path, options = {}) {
  const endpoint = `${GITHUB_API_BASE_URL}${path}`;
  const { accept, raw = false } = options;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: buildHeaders(accept),
    });
  } catch (error) {
    throw createApiError('Unable to reach the GitHub API', 502, error);
  }

  if (response.status === 404) {
    throw createApiError('Repository not found on GitHub', 404);
  }

  if (response.status === 403) {
    throw createApiError(
      'GitHub API rate limit exceeded or access denied',
      403
    );
  }

  if (!response.ok) {
    throw createApiError(
      `GitHub API request failed (${response.status})`,
      response.status
    );
  }

  if (raw) {
    return response.text();
  }

  return response.json();
}

function mapRepoData(data) {
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    owner: data.owner?.login ?? null,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count ?? data.watchers_count,
    language: data.language,
    defaultBranch: data.default_branch,
    license: data.license?.spdx_id || data.license?.name || null,
    url: data.html_url,
    topics: Array.isArray(data.topics) ? data.topics : [],
    size: data.size ?? null,
  };
}

/**
 * Fetch public repository metadata from the GitHub REST API.
 */
async function getRepository(owner, repo) {
  const data = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  );
  return mapRepoData(data);
}

/**
 * Fetch language breakdown for a repository.
 * Returns {} when unavailable.
 */
async function getLanguages(owner, repo) {
  try {
    const data = await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`
    );
    return data && typeof data === 'object' ? data : {};
  } catch (error) {
    if (error.status === 404) {
      return {};
    }
    console.error('[github] Failed to fetch languages:', error.message);
    return {};
  }
}

/**
 * Fetch README content (raw). Returns null when missing.
 */
async function getReadme(owner, repo) {
  try {
    const content = await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      {
        accept: 'application/vnd.github.raw+json',
        raw: true,
      }
    );
    return truncateText(content, MAX_README_CHARS);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    console.error('[github] Failed to fetch README:', error.message);
    return null;
  }
}

/**
 * Decode a GitHub Contents API file payload into UTF-8 text.
 */
function decodeContentPayload(data) {
  if (!data || data.type !== 'file' || typeof data.content !== 'string') {
    return null;
  }

  if (typeof data.size === 'number' && data.size > MAX_FILE_BYTES) {
    return null;
  }

  try {
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch (error) {
    console.error('[github] Failed to decode file content:', error.message);
    return null;
  }
}

/**
 * Fetch a single file by path. Returns null when missing or too large.
 */
async function getFileContent(owner, repo, path) {
  try {
    const data = await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`
    );
    return decodeContentPayload(data);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    console.error(`[github] Failed to fetch file ${path}:`, error.message);
    return null;
  }
}

function truncateText(text, maxChars) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n…[truncated]`;
}

function findStructurePaths(structure = []) {
  return new Set(
    structure.filter((entry) => entry.type === 'file').map((entry) => entry.path)
  );
}

/**
 * Pick a small set of high-signal source files from the tree.
 */
function selectRelevantSourcePaths(structure = []) {
  const available = findStructurePaths(structure);
  const selected = [];

  for (const candidate of PRIORITY_SOURCE_FILES) {
    if (selected.length >= MAX_SOURCE_FILES) break;
    if (!available.has(candidate)) continue;
    if (candidate.toLowerCase() === 'readme.md') continue;
    if (candidate === 'package.json') continue;
    selected.push(candidate);
  }

  if (selected.length < MAX_SOURCE_FILES) {
    const fallbackExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs'];
    for (const path of available) {
      if (selected.length >= MAX_SOURCE_FILES) break;
      if (selected.includes(path)) continue;
      if (path.toLowerCase().includes('readme')) continue;
      if (path === 'package.json') continue;
      if (path.includes('node_modules/') || path.includes('dist/')) continue;

      const lower = path.toLowerCase();
      if (fallbackExtensions.some((ext) => lower.endsWith(ext))) {
        // Prefer shallow paths
        if (path.split('/').length <= 3) {
          selected.push(path);
        }
      }
    }
  }

  return selected;
}

/**
 * Gather a bounded AI-ready context for a repository.
 * Never downloads the entire codebase.
 */
async function gatherAnalysisContext(owner, repo, repository, structure) {
  const [languages, readme, packageJson] = await Promise.all([
    getLanguages(owner, repo),
    getReadme(owner, repo),
    getFileContent(owner, repo, 'package.json').then((content) =>
      content ? truncateText(content, MAX_PACKAGE_CHARS) : null
    ),
  ]);

  const sourcePaths = selectRelevantSourcePaths(structure);
  const sourceFiles = (
    await Promise.all(
      sourcePaths.map(async (path) => {
        const content = await getFileContent(owner, repo, path);
        if (!content) return null;
        return {
          path,
          content: truncateText(content, MAX_SOURCE_FILE_CHARS),
        };
      })
    )
  ).filter(Boolean);

  const structureSummary = (structure || [])
    .slice(0, 200)
    .map((entry) => `${entry.type === 'directory' ? 'dir' : 'file'}: ${entry.path}`);

  return {
    name: repository.name,
    fullName: repository.fullName || `${owner}/${repo}`,
    description: repository.description,
    primaryLanguage: repository.language,
    languages,
    topics: repository.topics || [],
    packageJson,
    readme,
    structure: structureSummary,
    structureTruncated: Boolean(repository.truncated),
    sourceFiles,
  };
}

module.exports = {
  parseGitHubUrl,
  githubRequest,
  getRepository,
  getLanguages,
  getReadme,
  getFileContent,
  gatherAnalysisContext,
};
