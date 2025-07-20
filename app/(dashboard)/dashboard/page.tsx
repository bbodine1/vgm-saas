import { getUser } from '@/lib/db/queries'
import { redirect } from 'next/navigation'

export default async function TeamPagePlaceholder() {
	const user = await getUser()

	if (!user) {
		redirect('/')
	}

	return (
		<main className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium mb-6">Dashboard</h1>
			<p>This is the Dashboard route. This page is a placeholder for the Dashboard.</p>
		</main>
	)
}
