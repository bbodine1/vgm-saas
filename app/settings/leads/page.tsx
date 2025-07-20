import LeadsPageClient from './LeadsPageClient'
import { getTeamForUser, getUser } from '@/lib/db/queries'
import { db } from '@/lib/db/drizzle'
import { leadSources, serviceInterests, leadStatuses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function LeadsPage() {
	const user = await getUser()

	if (!user) {
		redirect('/')
	}

	const team = await getTeamForUser()

	if (!team) {
		return (
			<section className="flex-1 p-4 lg:p-8">
				<h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">Lead Management</h1>
				<p>No team found. Please contact your administrator.</p>
			</section>
		)
	}

	const teamLeadSources = await db.select().from(leadSources).where(eq(leadSources.teamId, team.id))
	const teamServiceInterests = await db.select().from(serviceInterests).where(eq(serviceInterests.teamId, team.id))
	const teamLeadStatuses = await db.select().from(leadStatuses).where(eq(leadStatuses.teamId, team.id))

	return (
		<LeadsPageClient
			team={team}
			leadSources={teamLeadSources}
			serviceInterests={teamServiceInterests}
			leadStatuses={teamLeadStatuses}
		/>
	)
}
