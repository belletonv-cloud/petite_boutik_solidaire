#!/usr/bin/env node
/*
 Scan 'photos' collection and print distinct values for top-level fields.
 Usage: node scripts/scan-photo-fields.js --key /path/to/key.json [--limit 200]
*/
import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { key: process.env.GOOGLE_APPLICATION_CREDENTIALS || null, limit: 200 }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--key') out.key = args[++i]
    else if (a === '--limit') out.limit = parseInt(args[++i], 10)
  }
  return out
}

async function main() {
  const opts = parseArgs()
  if (!opts.key) { console.error('No service account key provided. Use --key PATH'); process.exit(2) }
  const keyPath = path.resolve(opts.key)
  if (!fs.existsSync(keyPath)) { console.error('Service account file not found:', keyPath); process.exit(2) }
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(key) })
  const db = admin.firestore()

  console.log('Connected to', key.project_id)
  const snap = await db.collection('photos').limit(opts.limit).get()
  console.log('Scanning', snap.size, 'documents')
  const values = {}
  let i = 0
  snap.forEach(d => {
    i++
    const data = d.data()
    for (const k of Object.keys(data)) {
      const v = data[k]
      if (!values[k]) values[k] = new Set()
      try { values[k].add(JSON.stringify(v).slice(0,200)) } catch(e) { values[k].add(String(v)) }
    }
  })

  const report = {}
  for (const k of Object.keys(values)) {
    report[k] = Array.from(values[k]).slice(0,50)
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })
