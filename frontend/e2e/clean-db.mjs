import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const e2eDbPath = path.resolve(__dirname, '../../backend/calendar.e2e.db')

for (const file of [e2eDbPath, `${e2eDbPath}-journal`, `${e2eDbPath}-wal`, `${e2eDbPath}-shm`]) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file)
  }
}

console.log(`Cleaned e2e database at ${e2eDbPath}`)
