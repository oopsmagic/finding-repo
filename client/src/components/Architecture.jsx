import ResultCard from './ResultCard'

function Architecture({ architecture, insights }) {
  const text =
    typeof architecture === 'string' && architecture.trim()
      ? architecture.trim()
      : null

  const flow = text ? extractFlow(text) : []

  return (
    <ResultCard title="ARCHITECTURE" accent="blue">
      {text ? (
        <>
          <p className="architecture-text">{text}</p>
          {flow.length > 1 && (
            <div className="architecture-flow" aria-label="Architecture flow">
              {flow.map((step, index) => (
                <div key={`${step}-${index}`} className="architecture-flow__step">
                  <span className="architecture-flow__label">{step}</span>
                  {index < flow.length - 1 && (
                    <span className="architecture-flow__arrow" aria-hidden="true">
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <ul className="insight-list">
          {(insights || []).map((insight) => (
            <li key={insight.label} className="insight-item">
              <strong>{insight.label}</strong>
              <p>{insight.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </ResultCard>
  )
}

function extractFlow(text) {
  const known = [
    'Frontend',
    'Client',
    'API',
    'Backend',
    'Server',
    'Database',
    'Cache',
    'Queue',
    'Workers',
  ]

  const found = []
  const lower = text.toLowerCase()

  for (const label of known) {
    if (lower.includes(label.toLowerCase()) && !found.includes(label)) {
      found.push(label)
    }
  }

  // Prefer a sensible default chain when both ends appear
  const preferred = ['Frontend', 'Client', 'API', 'Backend', 'Server', 'Database']
  return preferred.filter((label) => found.includes(label)).slice(0, 4)
}

export default Architecture
