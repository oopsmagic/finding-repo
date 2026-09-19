import { useEffect, useState } from 'react'

const STAGES = [
  'CONNECTING TO GITHUB...',
  'READING REPOSITORY...',
  'MAPPING FILE STRUCTURE...',
  'IDENTIFYING TECHNOLOGIES...',
  'AI ANALYSIS IN PROGRESS...',
]

function LoadingState() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((current) =>
        current < STAGES.length - 1 ? current + 1 : current
      )
    }, 1400)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="loading-state" aria-live="polite" aria-busy="true">
      <div className="loading-panel">
        <div className="loading-panel__header">
          <span className="loading-panel__label">SCAN SEQUENCE</span>
          <span className="loading-spinner" aria-hidden="true" />
        </div>

        <ul className="loading-stages">
          {STAGES.map((stage, index) => {
            const status =
              index < stageIndex
                ? 'done'
                : index === stageIndex
                  ? 'active'
                  : 'pending'

            return (
              <li key={stage} className={`loading-stage is-${status}`}>
                <span className="loading-stage__prefix" aria-hidden="true">
                  {status === 'done' ? '✓' : status === 'active' ? '>' : '·'}
                </span>
                <span>{stage}</span>
              </li>
            )
          })}
        </ul>

        <p className="loading-footnote">
          Visual scan stages — waiting for server analysis to complete.
        </p>
      </div>
    </div>
  )
}

export default LoadingState
