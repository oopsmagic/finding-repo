function ErrorState({ error, onDismiss }) {
  const message =
    error?.message || 'Something went wrong while analyzing the repository.'

  const hint = getHint(message)

  return (
    <div className="error-state" role="alert">
      <div className="error-state__content">
        <p className="error-state__title">{'>'} ERROR</p>
        <div className="error-state__rule" aria-hidden="true" />
  
        {message.toLowerCase().includes('not found') && (
          <img
            src="/nemo.png"
            alt=""
            className="nemo-error"
          />
        )}
  
        <p className="error-state__message">{message}</p>
  
        {hint && <p className="error-state__hint">{'>'} {hint}</p>}
      </div>
  
      {onDismiss && (
        <button
          type="button"
          className="error-dismiss"
          onClick={onDismiss}
        >
          [ DISMISS ]
        </button>
      )}
    </div>
  )}

function getHint(message) {
  const lower = message.toLowerCase()

  if (lower.includes('invalid github')) {
    return 'Use a full public URL like https://github.com/owner/repository'
  }

  if (lower.includes('not found')) {
    return 'Check the owner and repo name, or confirm the repository is public.'
  }

  if (lower.includes('rate limit')) {
    return 'GitHub rate limits may be exhausted. Try again later or set a GITHUB_TOKEN.'
  }

  if (lower.includes('ai api key') || lower.includes('not configured')) {
    return 'Set AI_API_KEY on the server environment and restart the API.'
  }

  if (lower.includes('invalid json') || lower.includes('ai returned')) {
    return 'The AI response could not be parsed. Try again in a moment.'
  }

  if (lower.includes('failed to fetch') || lower.includes('failed to reach')) {
    return 'Make sure the FindingRepo API is running on port 5000.'
  }

  return 'Check the URL and try again.'
}

export default ErrorState
