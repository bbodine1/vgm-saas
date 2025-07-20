import { getUser } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import LeadsPageClient from './LeadsPageClient'

export default async function LeadsPage() {
	const user = await getUser()

	if (!user) {
		redirect('/')
	}

	return <LeadsPageClient />
}
