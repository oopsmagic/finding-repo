import ResultCard from './ResultCard'

function FileTree({ structure, truncated, repoName }) {
  if (!structure?.length) {
    return (
      <ResultCard title="REPOSITORY STRUCTURE" accent="cyan">
        <p className="empty-copy">{'>'} No files found in this repository.</p>
      </ResultCard>
    )
  }

  const lines = buildTreeLines(structure, repoName || 'PROJECT')

  return (
    <ResultCard title="REPOSITORY STRUCTURE" accent="cyan" className="structure-card">
      {truncated && (
        <p className="tree-note">
          {'>'} Showing a limited subset — large repository detected.
        </p>
      )}
      <pre className="tree-panel" tabIndex={0}>
        {lines.map((line) => (
          <div
            key={line.key}
            className={`tree-line ${line.isDir ? 'is-dir' : 'is-file'}`}
          >
            <span className="tree-prefix">{line.prefix}</span>
            <span className="tree-name">{line.name}</span>
          </div>
        ))}
      </pre>
    </ResultCard>
  )
}

/**
 * Build a classic tree view (├── └── │) from a flat path list.
 */
function buildTreeLines(structure, rootName) {
  const root = { name: rootName, children: new Map(), isDir: true }

  for (const entry of structure) {
    const parts = entry.path.split('/').filter(Boolean)
    let node = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          children: new Map(),
          isDir: isLast ? entry.type === 'directory' : true,
        })
      } else if (!isLast) {
        node.children.get(part).isDir = true
      }
      node = node.children.get(part)
    })
  }

  const lines = [
    {
      key: 'root',
      prefix: '',
      name: `${rootName}/`,
      isDir: true,
    },
  ]

  walk(root, '', lines)
  return lines
}

function walk(node, prefix, lines) {
  const entries = [...node.children.values()]
  entries.forEach((child, index) => {
    const isLast = index === entries.length - 1
    const branch = isLast ? '└── ' : '├── '
    const childPrefix = prefix + (isLast ? '    ' : '│   ')
    const label = child.isDir ? `${child.name}/` : child.name

    lines.push({
      key: `${prefix}${child.name}-${index}`,
      prefix: `${prefix}${branch}`,
      name: label,
      isDir: child.isDir,
    })

    if (child.children.size > 0) {
      walk(child, childPrefix, lines)
    }
  })
}

export default FileTree
