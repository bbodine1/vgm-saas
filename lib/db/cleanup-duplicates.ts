import { db } from './drizzle'
import { leadSources } from './schema'
import { eq, and } from 'drizzle-orm'

async function cleanupDuplicateLeadSources() {
	console.log('🔍 Checking for duplicate lead sources...')

	try {
		// Get all lead sources grouped by team and name
		const allLeadSources = await db.select().from(leadSources)

		// Group by team and name to find duplicates
		const grouped = allLeadSources.reduce((acc, source) => {
			const key = `${source.teamId}-${source.name}`
			if (!acc[key]) {
				acc[key] = []
			}
			acc[key].push(source)
			return acc
		}, {} as Record<string, typeof allLeadSources>)

		// Find duplicates
		const duplicates = Object.entries(grouped).filter(([key, sources]) => sources.length > 1)

		if (duplicates.length === 0) {
			console.log('✅ No duplicate lead sources found')
			return
		}

		console.log(`⚠️  Found ${duplicates.length} duplicate lead source groups:`)

		// Clean up duplicates - keep the one with the lowest ID
		for (const [key, sources] of duplicates) {
			const [teamId, name] = key.split('-')
			console.log(`  - Team ${teamId}, Name: "${name}" (${sources.length} duplicates)`)

			// Sort by ID and keep the first one
			const sortedSources = sources.sort((a, b) => a.id - b.id)
			const toKeep = sortedSources[0]
			const toDelete = sortedSources.slice(1)

			console.log(`    Keeping ID ${toKeep.id}, deleting IDs: ${toDelete.map(s => s.id).join(', ')}`)

			// Delete the duplicates
			for (const source of toDelete) {
				await db.delete(leadSources).where(eq(leadSources.id, source.id))
			}
		}

		console.log('✅ Duplicate cleanup completed')
	} catch (error) {
		console.error('❌ Error cleaning up duplicates:', error)
		throw error
	}
}

// Run if called directly
if (require.main === module) {
	cleanupDuplicateLeadSources()
		.then(() => {
			console.log('🎉 Cleanup finished')
			process.exit(0)
		})
		.catch(error => {
			console.error('💥 Cleanup failed:', error)
			process.exit(1)
		})
}

export { cleanupDuplicateLeadSources }
