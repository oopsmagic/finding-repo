import ResultCard from './ResultCard'

function Strengths({ items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []

  return (
    <ResultCard title="STRENGTHS" accent="green">
      {list.length === 0 ? (
        <p className="empty-copy">{'>'} No strengths reported.</p>
      ) : (
        <ul className="signal-list signal-list--success">
          {list.map((item, index) => (
            <li key={`${index}-${item.slice(0, 24)}`}>
              <span className="signal-list__marker" aria-hidden="true">
                +
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </ResultCard>
  )
}

export default Strengths
