import { getUser } from '@/lib/db/queries'
import { redirect } from 'next/navigation'

export default async function SettingsHomePage() {
	const user = await getUser()

	if (!user) {
		redirect('/')
	}

	return (
		<section className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium mb-6">Settings</h1>
			<p className="text-gray-700 mb-4">
				Welcome to your organization and account settings. Select a section from the sidebar to manage your team, users,
				account, security, or view activity logs.
			</p>
		</section>
	)
}
