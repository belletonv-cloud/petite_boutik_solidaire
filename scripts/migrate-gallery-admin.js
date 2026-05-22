#!/usr/bin/env node
/*
 Admin migration script
 Usage:
   # dry run (default) - lists documents that would be updated
   node scripts/migrate-gallery-admin.js --key /path/to/serviceAccount.json --export out.json

   # apply changes
   node scripts/migrate-gallery-admin.js --key /path/to/serviceAccount.json --apply

 Options:
   --key PATH     Path to service account JSON (or set GOOGLE_APPLICATION_CREDENTIALS env var)
   --apply        Actually perform updates. Without this flag the script runs in dry-run mode.
   --limit N      Limit number of docs to process (useful for testing)
   --export PATH  Export list of affected docs to PATH (JSON)

 This script updates documents in the 'photos' collection where gallery == 'collection'
 and sets gallery = 'boutique'. It uses batched writes (500 per batch).
*/

import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { key: process.env.GOOGLE_APPLICATION_CREDENTIALS || null, apply: false, limit: null, export: null }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--key') out.key = args[++i]
    else if (a === '--apply') out.apply = true
    else if (a === '--limit') out.limit = parseInt(args[++i], 10)
    else if (a === '--export') out.export = args[++i]
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/migrate-gallery-admin.js --key /path/to/key.json [--apply] [--limit N] [--export out.json]')
      process.exit(0)
    }
  }
  return out
}

async function main() {
  const opts = parseArgs()
  if (!opts.key) {
    console.error('No service account key provided. Use --key PATH or set GOOGLE_APPLICATION_CREDENTIALS env var.')
    process.exit(2)
  }

  const keyPath = path.resolve(opts.key)
  if (!fs.existsSync(keyPath)) {
    console.error('Service account file not found:', keyPath)
    process.exit(2)
  }

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(key) })
  const db = admin.firestore()

  console.log('Connected to Firestore project:', key.project_id)

  // Query docs where gallery == 'collection'
  const photosRef = db.collection('photos')
  const q = photosRef.where('gallery', '==', 'collection')
  const snap = await q.get()
  console.log('Found', snap.size, "documents with gallery == 'collection'")

  const docs = []
  snap.forEach(d => docs.push({ id: d.id, ref: d.ref, data: d.data() }))

  if (opts.limit && opts.limit > 0) {
    console.log('Limiting to', opts.limit, 'documents for this run')
  }

  const toProcess = opts.limit && opts.limit > 0 ? docs.slice(0, opts.limit) : docs

  if (opts.export) {
    const epath = path.resolve(opts.export)
    fs.writeFileSync(epath, JSON.stringify(toProcess.map(d => ({ id: d.id, data: d.data })), null, 2))
    console.log('Exported list to', epath)
  }

  if (!opts.apply) {
    console.log('Dry run mode — no changes will be made. Re-run with --apply to perform updates.')
    toProcess.forEach(d => console.log('-', d.id))
    process.exit(0)
  }

  console.log('Applying updates...')
  const BATCH_SIZE = 500
  let updated = 0
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const chunk = toProcess.slice(i, i + BATCH_SIZE)
    const batch = db.batch()
    for (const d of chunk) {
      batch.update(d.ref, { gallery: 'boutique' })
    }
    await batch.commit()
    updated += chunk.length
    console.log('Committed batch, total updated:', updated)
  }

  console.log('Migration complete. Updated', updated, 'documents.')
}

main().catch(err => { console.error(err); process.exit(1) })
