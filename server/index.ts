import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { createApp } from './app'

const dataFile = resolve(process.env.DATA_FILE ?? 'data/leaderboard.db')
mkdirSync(dirname(dataFile), { recursive: true })
const database = new Database(dataFile)
const app = await createApp(database)

await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 3001) })