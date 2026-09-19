const EXTENSION_TECH = {
  '.js': 'JavaScript',
  '.jsx': 'React',
  '.ts': 'TypeScript',
  '.tsx': 'React',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.css': 'CSS',
  '.scss': 'Sass',
  '.html': 'HTML',
  '.md': 'Markdown',
  '.json': 'JSON',
  '.yml': 'YAML',
  '.yaml': 'YAML',
  '.toml': 'TOML',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.dockerfile': 'Docker',
}

const FILE_TECH = {
  'package.json': 'Node.js',
  'package-lock.json': 'npm',
  'yarn.lock': 'Yarn',
  'pnpm-lock.yaml': 'pnpm',
  'cargo.toml': 'Rust / Cargo',
  'go.mod': 'Go modules',
  'requirements.txt': 'Python',
  'pyproject.toml': 'Python',
  'pom.xml': 'Maven',
  'build.gradle': 'Gradle',
  'dockerfile': 'Docker',
  'docker-compose.yml': 'Docker Compose',
  'docker-compose.yaml': 'Docker Compose',
  'tsconfig.json': 'TypeScript',
  'vite.config.js': 'Vite',
  'vite.config.ts': 'Vite',
  'next.config.js': 'Next.js',
  'next.config.ts': 'Next.js',
  'remix.config.js': 'Remix',
  'tailwind.config.js': 'Tailwind CSS',
  'tailwind.config.ts': 'Tailwind CSS',
  'webpack.config.js': 'Webpack',
  'makefile': 'Make',
  'cmakelists.txt': 'CMake',
  'gemfile': 'RubyGems',
  'composer.json': 'PHP / Composer',
}

/**
 * Infer a readable tech stack from primary language + file paths.
 * Frontend-only — no backend changes.
 */
export function detectTechStack(repo) {
  const found = new Set()

  if (repo?.language) {
    found.add(repo.language)
  }

  for (const entry of repo?.structure || []) {
    if (entry.type !== 'file') continue

    const fileName = entry.path.split('/').pop() || ''
    const lower = fileName.toLowerCase()

    if (FILE_TECH[lower]) {
      found.add(FILE_TECH[lower])
    }

    const dot = lower.lastIndexOf('.')
    if (dot !== -1) {
      const ext = lower.slice(dot)
      if (EXTENSION_TECH[ext]) {
        found.add(EXTENSION_TECH[ext])
      }
    }
  }

  return [...found].sort((a, b) => a.localeCompare(b))
}

const SIGNAL_RULES = [
  {
    match: (dirs) => dirs.has('client') && dirs.has('server'),
    label: 'Client / server split',
    detail: 'Separate frontend and backend packages suggest a full-stack layout.',
  },
  {
    match: (dirs) => dirs.has('apps') && dirs.has('packages'),
    label: 'Monorepo layout',
    detail: 'Top-level apps and packages folders point to a multi-package workspace.',
  },
  {
    match: (dirs) => dirs.has('src') && dirs.has('public'),
    label: 'Frontend application',
    detail: 'src + public is a common pattern for web UI projects.',
  },
  {
    match: (dirs) => dirs.has('api') || dirs.has('routes') || dirs.has('controllers'),
    label: 'API-oriented structure',
    detail: 'Route/controller folders indicate an HTTP service architecture.',
  },
  {
    match: (dirs) => dirs.has('components') || dirs.has('src/components'),
    label: 'Component-driven UI',
    detail: 'A components directory suggests modular view composition.',
  },
  {
    match: (dirs) => dirs.has('lib') || dirs.has('utils') || dirs.has('helpers'),
    label: 'Shared utilities layer',
    detail: 'Shared helper modules are separated from feature entry points.',
  },
  {
    match: (dirs) => dirs.has('test') || dirs.has('tests') || dirs.has('__tests__'),
    label: 'Dedicated test suite',
    detail: 'Automated tests live in their own top-level area of the tree.',
  },
  {
    match: (dirs) => dirs.has('docs') || dirs.has('documentation'),
    label: 'Documented codebase',
    detail: 'Project docs are kept alongside the implementation.',
  },
]

/**
 * Lightweight architecture notes derived from folder names in the tree.
 */
export function detectArchitecture(repo) {
  const dirs = new Set()

  for (const entry of repo?.structure || []) {
    if (entry.type !== 'directory') continue
    dirs.add(entry.path)
    for (const segment of entry.path.split('/')) {
      dirs.add(segment)
    }
  }

  const insights = SIGNAL_RULES.filter((rule) => rule.match(dirs)).map(
    ({ label, detail }) => ({ label, detail })
  )

  if (insights.length === 0) {
    return [
      {
        label: 'Flat or unconventional layout',
        detail:
          'No strong conventional architecture signals were detected from the visible tree.',
      },
    ]
  }

  return insights
}

export function formatCount(value) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value)
}
