const {
  parseGitHubUrl,
  getRepository,
  gatherAnalysisContext,
} = require('../services/github.service');
const { getRepositoryTree } = require('../services/tree.service');
const { analyzeRepository } = require('../services/ai.service');

/**
 * Analyze a GitHub repository:
 * GitHub metadata/tree → curated context → AI analysis → response.
 */
const analyzeRepo = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Repository URL is required',
      });
    }

    const parsed = parseGitHubUrl(url);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid GitHub repository URL. Expected format: https://github.com/owner/repository',
      });
    }

    const { owner, repo } = parsed;

    const repository = await getRepository(owner, repo);
    const tree = await getRepositoryTree(
      owner,
      repo,
      repository.defaultBranch
    );

    const repositoryPayload = {
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      owner: repository.owner,
      stars: repository.stars,
      forks: repository.forks,
      watchers: repository.watchers,
      language: repository.language,
      defaultBranch: repository.defaultBranch,
      license: repository.license,
      url: repository.url,
      topics: repository.topics,
      structure: tree.structure,
      truncated: tree.truncated,
    };

    const context = await gatherAnalysisContext(
      owner,
      repo,
      { ...repository, truncated: tree.truncated },
      tree.structure
    );

    const analysis = await analyzeRepository(context);

    return res.json({
      success: true,
      repository: repositoryPayload,
      analysis,
    });
  } catch (error) {
    const status = error.status || 500;
    console.error(
      '[repo.controller] Analysis failed:',
      error.message,
      `(status ${status})`
    );

    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to analyze repository',
    });
  }
};

module.exports = {
  analyzeRepo,
};
