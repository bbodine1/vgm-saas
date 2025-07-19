import { exec } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { promisify } from 'node:util'
import path from 'node:path'

const execAsync = promisify(exec)

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

async function checkDatabaseIsEmpty(): Promise<boolean> {
	try {
		const { db } = await import('./drizzle')
		const { users } = await import('./schema')
		const userCount = await db.select().from(users).limit(1)
		return userCount.length === 0
	} catch (error) {
		// If we can't connect or query, assume database is empty
		return true
	}
}

async function main(autoReset: boolean = false) {
	console.log('🔄 Checking database schema and migrations...')

	try {
		// Check for pending migrations
		const hasPendingMigrations = await checkForPendingMigrations()

		if (hasPendingMigrations) {
			console.log('⚠️  Pending migrations detected!')

			// Apply migrations
			await applyMigrations()

			// If autoReset is true, automatically reset and seed
			if (autoReset) {
				console.log('🔄 Auto-reset enabled, resetting and seeding database...')
				await resetAndSeedDatabase()
			} else {
				console.log(
					'⚠️  Database schema changed. Consider running "npm run db:reset" to reset and reseed the database.'
				)
			}
		} else {
			console.log('✅ No pending migrations found')

			// Check if database is empty
			const isEmpty = await checkDatabaseIsEmpty()

			if (isEmpty) {
				console.log('📝 Database appears to be empty, seeding...')
				await seedDatabase()
			} else {
				console.log('✅ Database is up to date and contains data')
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
	// Check if --auto-reset flag is provided
	const autoReset = process.argv.includes('--auto-reset')
	main(autoReset)
}

export { main as migrateAndSeedAuto }
