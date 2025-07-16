import GeneralPageClient from './GeneralPageClient'
import { getTeamForUser, getUser } from '@/lib/db/queries'

export default async function GeneralPage() {
	const team = await getTeamForUser()
	const user = await getUser()
	return (
		<GeneralPageClient
			team={team}
			user={user}
		/>
	)
}
