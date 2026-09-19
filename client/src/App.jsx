import { useState } from 'react'
import AiSummary from './components/AiSummary'
import Architecture from './components/Architecture'
import BeginnerExplanation from './components/BeginnerExplanation'
import ErrorState from './components/ErrorState'
import FileTree from './components/FileTree'
import Improvements from './components/Improvements'
import LoadingState from './components/LoadingState'
import RepoOverview from './components/RepoOverview'
import Strengths from './components/Strengths'
import TechStack from './components/TechStack'
import {
  detectArchitecture,
  detectTechStack,
} from './utils/repoInsights'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [repository, setRepository] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleAnalyze(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setRepository(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/repos/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data)
        return
      }

      setRepository(data.repository)
      setAnalysis(data.analysis)
    } catch (err) {
      setError({
        success: false,
        message: err.message || 'Failed to reach the API',
      })
    } finally {
      setLoading(false)
    }
  }

  const techStack =
    analysis?.techStack?.length > 0
      ? analysis.techStack
      : repository
        ? detectTechStack(repository)
        : []

  return (
    <div className="app-shell">
      <div className="app-grid" aria-hidden="true" />
      <div className="app-scanline" aria-hidden="true" />

      <main className="app">
        <header className="hero">
          <p className="status-line">
            <span className="status-dot" aria-hidden="true" />
            SYSTEM ONLINE
          </p>
          <div className="hero-title-row">
  
  <h1 className="hero-title">FINDING REPO</h1>
  <img src="/nemo.png" alt="" className="nemo-logo" />
</div>
          <div className="hero-rule" aria-hidden="true" />
          <p className="hero-tagline">UNDERSTAND ANY CODEBASE.</p>
          <p className="hero-subtitle">
            Paste a GitHub URL. Finding repo  scans the repository structure and runs
            AI-powered software engineering analysis — without sending the entire
            codebase.
          </p>
          <p className="hero-pipeline">
            {'>'} paste repository → scan → analyze → understand
          </p>
        </header>

        <form className="terminal-form" onSubmit={handleAnalyze}>
          <div className="terminal-form__chrome">
            <span className="terminal-form__label">REPOSITORY INPUT</span>
            <span className="terminal-form__dots" aria-hidden="true">
              ● ● ●
            </span>
          </div>

          <label className="sr-only" htmlFor="repo-url">
            GitHub repository URL
          </label>

          <div className="terminal-form__row">
            <span className="terminal-form__prompt" aria-hidden="true">
              {'>'}
            </span>
            <input
              id="repo-url"
              type="url"
              name="url"
              placeholder="https://github.com/user/repository"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={loading}
              required
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <button
            type="submit"
            className="terminal-form__submit"
            disabled={loading || !url.trim()}
          >
            {loading ? '[ SCANNING... ]' : '[ ANALYZE REPOSITORY ]'}
          </button>
        </form>

        {error && (
          <ErrorState error={error} onDismiss={() => setError(null)} />
        )}

        {loading && <LoadingState />}

        {repository && !loading && (
          <div className="results">
            <RepoOverview repo={repository} />
            <TechStack technologies={techStack} />
            <FileTree
              structure={repository.structure}
              truncated={repository.truncated}
              repoName={repository.name}
            />
            <AiSummary summary={analysis?.summary} />
            <Architecture
              architecture={analysis?.architecture}
              insights={detectArchitecture(repository)}
            />
            <Strengths items={analysis?.strengths} />
            <Improvements items={analysis?.potentialImprovements} />
            <BeginnerExplanation text={analysis?.beginnerExplanation} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
