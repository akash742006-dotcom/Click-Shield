/**
 * Step 1 of SQLite → Neon PostgreSQL migration.
 * Exports ALL rows from every model in the current SQLite database to JSON.
 * MUST be run while the Prisma client is still generated for SQLite.
 */
import { db } from '../src/lib/db'
import { writeFileSync } from 'fs'

async function main() {
  const [users, posts, scans, privacy] = await Promise.all([
    db.user.findMany(),
    db.post.findMany(),
    db.scanHistory.findMany(),
    db.privacyAnalysis.findMany(),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'sqlite:/home/z/my-project/db/custom.db',
    user: users,
    post: posts,
    scanHistory: scans,
    privacyAnalysis: privacy,
  }

  writeFileSync('/tmp/clickshield-export.json', JSON.stringify(payload, null, 2))

  console.log('Export summary:')
  console.log('  User ............ ', users.length)
  console.log('  Post ............ ', posts.length)
  console.log('  ScanHistory ..... ', scans.length)
  console.log('  PrivacyAnalysis . ', privacy.length)
  console.log('Saved to /tmp/clickshield-export.json')

  if (scans.length > 0) {
    console.log('Sample ScanHistory:', JSON.stringify(scans[0], null, 2).slice(0, 400))
  }
}

main()
  .catch((e) => {
    console.error('EXPORT FAILED:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
