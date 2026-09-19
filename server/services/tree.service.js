const { githubRequest } = require('./github.service');

const DEFAULT_TREE_LIMIT = 300;

function getTreeLimit() {
  const parsed = Number.parseInt(process.env.GITHUB_TREE_LIMIT || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TREE_LIMIT;
}

/**
 * Map GitHub tree entries to a simplified { path, type } list.
 * Caps the result so large repositories stay manageable.
 */
function simplifyTree(tree, limit) {
  const structure = [];

  for (const entry of tree) {
    if (structure.length >= limit) {
      break;
    }

    if (entry.type === 'tree') {
      structure.push({ path: entry.path, type: 'directory' });
    } else if (entry.type === 'blob') {
      structure.push({ path: entry.path, type: 'file' });
    }
  }

  return structure;
}

/**
 * Retrieve a repository's file/folder tree via the Git Trees API
 * (recursive listing — does not download file contents).
 */
async function getRepositoryTree(owner, repo, branch) {
  const data = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  );

  const limit = getTreeLimit();
  const structure = simplifyTree(data.tree || [], limit);
  const truncated =
    Boolean(data.truncated) || (data.tree || []).length > structure.length;

  return {
    structure,
    truncated,
    totalEntries: (data.tree || []).length,
  };
}

module.exports = {
  getRepositoryTree,
};
