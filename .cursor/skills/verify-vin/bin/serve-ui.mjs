import { createRequire } from 'module'
import path from 'path'

const frontendRoot = path.resolve(process.argv[2])
const port = Number(process.argv[3])
if (!frontendRoot || !Number.isInteger(port)) {
  console.error('usage: serve-ui.mjs <frontend-root> <port>')
  process.exit(2)
}

const require = createRequire(path.join(frontendRoot, 'package.json'))
const { createServer } = require('vite')

const server = await createServer({
  configFile: path.join(frontendRoot, 'vite.config.ts'),
  root: frontendRoot,
  server: {
    port,
    strictPort: true,
    host: '127.0.0.1',
    open: false,
  },
})

await server.listen()
server.printUrls()
await new Promise(() => {})
