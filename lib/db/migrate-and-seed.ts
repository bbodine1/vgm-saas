import { exec } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { promisify } from 'node:util'
import readline from 'node:readline'
import path from 'node:path'

const execAsync = promisify(exec)

function question(query: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise(resolve =>
		rl.question(query, ans => {
			rl.close()
			resolve(ans)
		})
	)
}

async function checkForPendingMigrations(): Promise<boolean> {
	try {
		// Check if there are any pending migrations
		const { stdout } = await execAsync('npx drizzle-kit migrate --dry-run')
		return stdout.includes('Pending migrations:') && !stdout.includes('No pending migrations')
	} catch (error) {
		// If there's an error, assume there might be pending migrations
		return true
	}
}

async function applyMigrations(): Promise<void> {
	console.log('Applying database migrations...')
	try {
		await execAsync('npx drizzle-kit migrate')
		console.log('✅ Migrations applied successfully')
	} catch (error) {
		console.error('❌ Failed to apply migrations:', error)
		throw error
	}
}

async function resetAndSeedDatabase(): Promise<void> {
	console.log('Resetting and seeding database...')
	try {
		// Import and run the reset script
		await import('./reset')
		console.log('✅ Database reset and seeded successfully')
	} catch (error) {
		console.error('❌ Failed to reset and seed database:', error)
		throw error
	}
}

async function seedDatabase(): Promise<void> {
	console.log('Seeding database...')
	try {
		// Import and run the seed script
		await import('./seed')
		console.log('✅ Database seeded successfully')
	} catch (error) {
		console.error('❌ Failed to seed database:', error)
		throw error
	}
}

async function checkSchemaVersion(): Promise<string | null> {
	try {
		// Try to read the latest migration file to determine schema version
		const migrationsDir = path.join(process.cwd(), 'lib/db/migrations')
		const files = await fs.readdir(migrationsDir)
		const sqlFiles = files.filter(file => file.endsWith('.sql') && !file.includes('meta'))
		if (sqlFiles.length === 0) return null

		// Sort by migration number and get the latest
		sqlFiles.sort()
		const latestMigration = sqlFiles[sqlFiles.length - 1]
		return latestMigration.split('_')[0] // Return the migration number
	} catch (error) {
		return null
	}
}

async function main() {
	console.log('🔄 Checking database schema and migrations...')

	try {
		// Check for pending migrations
		const hasPendingMigrations = await checkForPendingMigrations()

		if (hasPendingMigrations) {
			console.log('⚠️  Pending migrations detected!')

			// Apply migrations
			await applyMigrations()

			// Ask user if they want to reset and seed the database
			const resetChoice = await question(
				'Database schema has changed. Do you want to reset and reseed the database? This will delete all existing data. (y/n): '
			)

			if (resetChoice.toLowerCase() === 'y') {
				await resetAndSeedDatabase()
			} else {
				console.log('⚠️  Database schema changed but not reset. You may need to manually handle data migration.')
			}
		} else {
			console.log('✅ No pending migrations found')

			// Check if database is empty (no users table or no users)
			try {
				const { db } = await import('./drizzle')
				const { users } = await import('./schema')
				const userCount = await db.select().from(users).limit(1)

				if (userCount.length === 0) {
					console.log('📝 Database appears to be empty, seeding...')
					await seedDatabase()
				} else {
					console.log('✅ Database is up to date and contains data')
				}
			} catch (error) {
				console.log('📝 Database appears to be empty or not properly set up, seeding...')
				await seedDatabase()
			}
		}

		console.log('🎉 Database setup complete!')
	} catch (error) {
		console.error('❌ Database setup failed:', error)
		process.exit(1)
	}
}

// Allow running this script directly or importing it
if (require.main === module) {
	main()
}

export { main as migrateAndSeed }
