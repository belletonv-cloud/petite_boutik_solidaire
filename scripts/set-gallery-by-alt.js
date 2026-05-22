#!/usr/bin/env node
/*
 Set gallery='boutique' for photos whose alt matches one of the provided labels.

 Usage:
   node scripts/set-gallery-by-alt.js --key /path/to/key.json --alts "alt1|alt2|alt3" [--apply]

 By default runs in dry-run and will list matching documents. Use --apply to write.
*/

import fs from 'fs'
import path from 'path'
import admin from 'firebase-admin'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { key: process.env.GOOGLE_APPLICATION_CREDENTIALS || null, alts: null, apply: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--key') out.key = args[++i]
    else if (a === '--alts') out.alts = args[++i]
    else if (a === '--apply') out.apply = true
    else if (a === '--help' || a === '-h') { console.log('Usage: node scripts/set-gallery-by-alt.js --key /path/to/key.json --alts "a|b|c" [--apply]'); process.exit(0) }
  }
  return out
}

async function main() {
  const opts = parseArgs()
  if (!opts.key) { console.error('No service account key provided. Use --key PATH'); process.exit(2) }
  if (!opts.alts) { console.error('No alts provided. Use --alts "label1|label2|..."'); process.exit(2) }
  const keyPath = path.resolve(opts.key)
  if (!fs.existsSync(keyPath)) { console.error('Service account file not found:', keyPath); process.exit(2) }

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(key) })
  const db = admin.firestore()

  const labels = opts.alts.split('|').map(s => s.trim()).filter(Boolean)
  console.log('Looking for docs with alt in:', labels)

  const snap = await db.collection('photos').get()
  const matches = []
  snap.forEach(d => {
    const data = d.data()
    if (data && data.alt && labels.includes(String(data.alt).trim())) {
      matches.push({ id: d.id, alt: data.alt, gallery: data.gallery || null })
    }
  })

  console.log('Found', matches.length, 'matching documents')
  matches.forEach(m => console.log('-', m.id, m.alt, 'current gallery=', m.gallery))

  if (!opts.apply) { console.log('Dry-run — no changes made. Re-run with --apply to update matching docs.'); process.exit(0) }

  // apply updates in a batch
  const BATCH_SIZE = 500
  let updated = 0
  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const chunk = matches.slice(i, i + BATCH_SIZE)
    const batch = db.batch()
    for (const m of chunk) {
      const ref = db.collection('photos').doc(m.id)
      batch.update(ref, { gallery: 'boutique' })
    }
    await batch.commit()
    updated += chunk.length
    console.log('Committed batch, total updated:', updated)
  }
  console.log('Done. Updated', updated, 'documents.')
}

main().catch(err => { console.error(err); process.exit(1) })
