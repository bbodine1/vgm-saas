import GeneralPageClient from './GeneralPageClient'
import { getTeamForUser, getUser } from '@/lib/db/queries'
import { redirect } from 'next/navigation'

export default async function GeneralPage() {
	const user = await getUser()

	if (!user) {
		redirect('/')
	}

	const team = await getTeamForUser()

	return (
		<GeneralPageClient
			team={team}
			user={user}
		/>
	)
}
