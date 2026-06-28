#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const TARGET_DIRS = ['public', 'src/assets']
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MiB hard stop for static assets

function walk(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

const files = TARGET_DIRS.flatMap(rel => walk(path.join(ROOT, rel)))
const offenders = files
  .map(file => ({
    file: path.relative(ROOT, file),
    size: fs.statSync(file).size,
  }))
  .filter(({ size }) => size > MAX_FILE_BYTES)
  .sort((a, b) => b.size - a.size)

if (offenders.length) {
  console.error(`Static asset size check failed: ${offenders.length} file(s) exceed ${MAX_FILE_BYTES / 1048576} MiB`)
  for (const { file, size } of offenders) {
    console.error(`${(size / 1048576).toFixed(2)} MiB\t${file}`)
  }
  process.exit(1)
}

console.log(`Static asset size check passed (${files.length} file(s) scanned, max ${MAX_FILE_BYTES / 1048576} MiB per file)`)