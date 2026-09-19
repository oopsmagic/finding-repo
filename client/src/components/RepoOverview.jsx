import ResultCard from './ResultCard'
import { formatCount } from '../utils/repoInsights'

function RepoOverview({ repo }) {
  return (
    <ResultCard title="REPOSITORY OVERVIEW" accent="cyan" className="repo-overview">
      <div className="overview-header">
        <div>
          <h3 className="overview-name">{repo.name}</h3>
          {repo.owner && <p className="overview-owner">@{repo.owner}</p>}
        </div>
        {repo.url && (
          <a
            className="overview-link"
            href={repo.url}
            target="_blank"
            rel="noreferrer"
          >
            OPEN_GITHUB
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <p className="overview-description">
        {repo.description || '> No description provided for this repository.'}
      </p>

      <dl className="overview-stats">
        <div>
          <dt>STARS</dt>
          <dd>{formatCount(repo.stars)}</dd>
        </div>
        <div>
          <dt>FORKS</dt>
          <dd>{formatCount(repo.forks)}</dd>
        </div>
        <div>
          <dt>LANGUAGE</dt>
          <dd>{repo.language || 'Unknown'}</dd>
        </div>
      </dl>
    </ResultCard>
  )
}

export default RepoOverview
