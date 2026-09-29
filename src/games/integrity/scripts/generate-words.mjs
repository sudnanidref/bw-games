// Offline word-bank generator. Not bundled and never imported by the game.
// Run: node --env-file=.env src/games/integrity/scripts/generate-words.mjs
// Writes data/integrity-words.candidates.json for human review. It never writes words.json.
import { mkdir, writeFile } from 'node:fs/promises'

// Foundry expects the deployment name here, not the raw model name.
const DEPLOYMENT = process.env.FOUNDRY_DEPLOYMENT ?? 'gpt-5-mini'
const OUTPUT_PATH = 'data/integrity-words.candidates.json'
const MAX_LENGTH = 18
const MAX_WORDS = 2

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    aligned: { type: 'array', items: { type: 'string' } },
    violation: { type: 'array', items: { type: 'string' } },
  },
  required: ['aligned', 'violation'],
  additionalProperties: false,
}

const INSTRUCTIONS = `Kamu membantu menyusun bank kata untuk game "Integrity" bertema perbankan Indonesia.
Buat sekitar 80 kata atau frasa "aligned" (perilaku sejalan dengan integritas: jujur, taat aturan, sadar risiko)
dan sekitar 80 "violation" (perilaku yang melanggar integritas), semuanya dalam Bahasa Indonesia, konteks tempat kerja/perbankan.
Aturan: setiap entri 1-2 kata, maksimal ${MAX_LENGTH} karakter, huruf kecil, tanpa nama orang atau merek,
tanpa kata ambigu atau bergantung konteks, dan jelas hanya cocok di satu kategori.`

function isValidEntry(entry) {
  const trimmed = entry.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_LENGTH && trimmed.split(/\s+/).length <= MAX_WORDS
}

function cleanCategory(entries, alreadySeen) {
  const kept = []
  for (const entry of entries) {
    const normalized = entry.trim().toLowerCase()
    if (!isValidEntry(normalized) || alreadySeen.has(normalized)) continue
    alreadySeen.add(normalized)
    kept.push(normalized)
  }
  return kept
}

// Accept either the project endpoint or the full Responses API URL.
async function requestCandidates(endpoint, apiKey) {
  const configuredUrl = new URL(endpoint)
  const responseUrl = configuredUrl.pathname.startsWith('/api/projects/')
    ? new URL('/openai/v1/responses', configuredUrl)
    : configuredUrl
  const response = await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: DEPLOYMENT,
      instructions: INSTRUCTIONS,
      input: 'Hasilkan daftar kandidat sekarang.',
      text: { format: { type: 'json_schema', name: 'integrity_words', strict: true, schema: RESPONSE_SCHEMA } },
    }),
  })
  if (!response.ok) throw new Error(`Foundry request failed with status ${response.status}`)

  const body = await response.json()
  const message = body.output?.find((item) => item.type === 'message')
  const text = message?.content?.find((part) => part.type === 'output_text')?.text
  if (!text) throw new Error('Foundry response contained no output text')
  return JSON.parse(text)
}

async function main() {
  const endpoint = process.env.FOUNDRY_ENDPOINT
  const apiKey = process.env.FOUNDRY_API_KEY
  const missing = [!endpoint && 'FOUNDRY_ENDPOINT', !apiKey && 'FOUNDRY_API_KEY'].filter(Boolean)
  if (missing.length > 0) {
    console.error(`${missing.join(' and ')} not set. Put them in .env and run: node --env-file=.env src/games/integrity/scripts/generate-words.mjs`)
    process.exitCode = 1
    return
  }

  const candidates = await requestCandidates(endpoint, apiKey)
  const seen = new Set()
  const output = {
    aligned: cleanCategory(candidates.aligned, seen),
    violation: cleanCategory(candidates.violation, seen),
  }

  await mkdir('data', { recursive: true })
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Wrote ${output.aligned.length} aligned and ${output.violation.length} violation candidates to ${OUTPUT_PATH}. Review before copying into words.json.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
