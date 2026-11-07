import { fileURLToPath } from 'node:url'

// Keep Next.js's JSX configuration intact and use the automatic JSX runtime in tests.
process.env.TSX_TSCONFIG_PATH = fileURLToPath(new URL('./tsconfig.json', import.meta.url))
await import('tsx')
