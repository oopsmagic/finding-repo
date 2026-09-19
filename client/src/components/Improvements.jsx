import ResultCard from './ResultCard'

function Improvements({ items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []

  return (
    <ResultCard title="POTENTIAL IMPROVEMENTS" accent="yellow">
      {list.length === 0 ? (
        <p className="empty-copy">{'>'} No improvements reported.</p>
      ) : (
        <ul className="signal-list signal-list--warn">
          {list.map((item, index) => (
            <li key={`${index}-${item.slice(0, 24)}`}>
              <span className="signal-list__marker" aria-hidden="true">
                !
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </ResultCard>
  )
}

export default Improvements
