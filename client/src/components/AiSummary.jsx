import ResultCard from './ResultCard'

function AiSummary({ summary }) {
  return (
    <ResultCard title="AI SUMMARY" accent="pink" className="ai-summary">
      {summary ? (
        <p className="ai-summary__text">{summary}</p>
      ) : (
        <p className="empty-copy">{'>'} No AI summary available.</p>
      )}
    </ResultCard>
  )
}

export default AiSummary
