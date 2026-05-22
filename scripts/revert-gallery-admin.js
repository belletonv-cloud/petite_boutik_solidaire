#!/usr/bin/env node
/*
 Revert migration: set gallery='collection' for docs in 'photos' whose
 updateTime is within the last N minutes (default 10).

 Usage:
   node scripts/revert-gallery-admin.js --key /path/to/key.json [--minutes 10] [--apply]

 By default the script runs in dry-run mode and will only list candidate docs.
 Use --apply to actually perform the revert.
*/

import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { key: process.env.GOOGLE_APPLICATION_CREDENTIALS || null, minutes: 10, apply: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--key') out.key = args[++i]
    else if (a === '--minutes') out.minutes = parseInt(args[++i], 10)
    else if (a === '--apply') out.apply = true
    else if (a === '--help' || a === '-h') { console.log('Usage: node scripts/revert-gallery-admin.js --key /path/to/key.json [--minutes N] [--apply]'); process.exit(0) }
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

  console.log('Connected to Firestore project:', key.project_id)

  // Fetch photos where gallery == 'boutique' (this includes legitimately boutique items)
  const snap = await db.collection('photos').where('gallery', '==', 'boutique').get()
  console.log('Found', snap.size, "documents with gallery == 'boutique'")

  const now = Date.now()
  const windowMs = opts.minutes * 60 * 1000

  const candidates = []
  snap.forEach(docSnap => {
    const ut = docSnap.updateTime ? docSnap.updateTime.toMillis() : 0
    if (now - ut <= windowMs) {
      candidates.push({ id: docSnap.id, updateTime: new Date(ut).toISOString(), ref: docSnap.ref })
    }
  })

  console.log('Candidates within', opts.minutes, 'minutes:', candidates.length)
  candidates.forEach(c => console.log('-', c.id, c.updateTime))

  if (candidates.length === 0) {
    console.log('No documents to revert. Exiting.')
    process.exit(0)
  }

  if (!opts.apply) {
    console.log('Dry-run mode — no updates made. Re-run with --apply to perform the revert.')
    process.exit(0)
  }

  // Apply in batches
  const BATCH_SIZE = 500
  let updated = 0
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const chunk = candidates.slice(i, i + BATCH_SIZE)
    const batch = db.batch()
    for (const c of chunk) {
      batch.update(c.ref, { gallery: 'collection' })
    }
    await batch.commit()
    updated += chunk.length
    console.log('Committed batch, total updated:', updated)
  }

  console.log('Revert complete. Updated', updated, 'documents.')
}

main().catch(err => { console.error(err); process.exit(1) })
