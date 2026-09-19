import ResultCard from './ResultCard'

function BeginnerExplanation({ text }) {
  return (
    <ResultCard title="BEGINNER EXPLANATION" accent="pink" className="beginner-card">
      {text ? (
        <div className="beginner-body">
          <p className="beginner-lead">
            {'>'} If you just opened this repository for the first time…
          </p>
          <p className="beginner-text">{text}</p>
        </div>
      ) : (
        <p className="empty-copy">{'>'} No beginner explanation available.</p>
      )}
    </ResultCard>
  )
}

export default BeginnerExplanation
