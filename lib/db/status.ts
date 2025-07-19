import { exec } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { promisify } from 'node:util'
import path from 'node:path'

const execAsync = promisify(exec)

async function checkDatabaseStatus() {
	console.log('🔍 Checking database status...\n')

	try {
		// Check database connection
		const { db } = await import('./drizzle')
		const { users, teams } = await import('./schema')

		// Get basic stats
		const userCount = await db.select().from(users)
		const teamCount = await db.select().from(teams)

		console.log('📊 Database Statistics:')
		console.log(`   Users: ${userCount.length}`)
		console.log(`   Teams: ${teamCount.length}`)

		// Check for pending migrations
		try {
			const { stdout } = await execAsync('npx drizzle-kit migrate --dry-run')
			if (stdout.includes('Pending migrations:')) {
				console.log('\n⚠️  Pending migrations detected!')
				console.log('   Run "npm run db:migrate" to apply them.')
			} else {
				console.log('\n✅ No pending migrations')
			}
		} catch (error) {
			console.log('\n❌ Could not check migration status')
		}

		// Show latest migration
		try {
			const migrationsDir = path.join(process.cwd(), 'lib/db/migrations')
			const files = await fs.readdir(migrationsDir)
			const sqlFiles = files.filter(file => file.endsWith('.sql') && !file.includes('meta'))

			if (sqlFiles.length > 0) {
				sqlFiles.sort()
				const latestMigration = sqlFiles[sqlFiles.length - 1]
				console.log(`\n📝 Latest migration: ${latestMigration}`)
			}
		} catch (error) {
			console.log('\n❌ Could not read migration files')
		}

		console.log('\n🎉 Database is ready!')
	} catch (error) {
		console.error('❌ Database connection failed:', error)
		console.log('\n💡 Try running: npm run db:setup')
		process.exit(1)
	}
}

// Run if called directly
if (require.main === module) {
	checkDatabaseStatus()
}

export { checkDatabaseStatus }
