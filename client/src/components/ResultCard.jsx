function ResultCard({ title, children, className = '', accent = 'cyan' }) {
  return (
    <section className={`result-card accent-${accent} ${className}`.trim()}>
      <div className="result-card__chrome">
        <span className="result-card__prompt" aria-hidden="true">
          ▸
        </span>
        <h2 className="result-card__title">{title}</h2>
        <span className="result-card__rule" aria-hidden="true" />
      </div>
      <div className="result-card__body">{children}</div>
    </section>
  )
}

export default ResultCard
