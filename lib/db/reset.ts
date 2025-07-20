import { db } from './drizzle'
import {
	users,
	teams,
	teamMembers,
	activityLogs,
	invitations,
	passwordResetTokens,
	leads,
	leadSources,
	serviceInterests,
	leadStatuses,
} from './schema'

async function resetDatabase() {
	// Delete from child tables first to avoid FK constraint errors
	await db.delete(activityLogs)
	await db.delete(invitations)
	await db.delete(passwordResetTokens)
	await db.delete(leads)
	await db.delete(leadSources)
	await db.delete(serviceInterests)
	await db.delete(leadStatuses)
	await db.delete(teamMembers)
	await db.delete(teams)
	await db.delete(users)

	// Reseed
	await import('./seed')
}

resetDatabase()
	.catch(error => {
		console.error('Database reset failed:', error)
		process.exit(1)
	})
	.finally(() => {
		console.log('Database reset finished. Exiting...')
		process.exit(0)
	})
