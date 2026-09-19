import ResultCard from './ResultCard'

const ACCENTS = ['cyan', 'green', 'yellow', 'pink', 'blue', 'orange']

function TechStack({ technologies }) {
  const items = normalizeTechnologies(technologies)

  return (
    <ResultCard title="TECH STACK" accent="orange">
      {items.length === 0 ? (
        <p className="empty-copy">{'>'} No technologies detected.</p>
      ) : (
        <ul className="tech-list">
          {items.map((item, index) => (
            <li
              key={`${item.technology}-${index}`}
              className={`tech-chip accent-${ACCENTS[index % ACCENTS.length]}`}
              title={item.reason || undefined}
            >
              <span className="tech-chip__name">{item.technology}</span>
              {item.reason && (
                <span className="tech-chip__reason">{item.reason}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ResultCard>
  )
}

function normalizeTechnologies(technologies) {
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return []
  }

  return technologies.map((item) => {
    if (typeof item === 'string') {
      return { technology: item, reason: '' }
    }
    return {
      technology: item?.technology || 'Unknown',
      reason: item?.reason || '',
    }
  })
}

export default TechStack
