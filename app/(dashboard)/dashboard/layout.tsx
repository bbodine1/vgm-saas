'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Users, Settings, Shield, Activity, Home } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const { data: currentTeam } = useSWR('/api/team', fetcher)
	const { data: allTeams } = useSWR('/api/team', fetcher)

	const navItems = [{ href: '/dashboard', icon: Home, label: 'Dashboard' }]

	async function handleSwitchTeam(value: string | number) {
		const teamId = typeof value === 'string' ? parseInt(value, 10) : value
		await fetch('/api/user', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ teamId }),
		})
		// Refresh the page to update context
		startTransition(() => {
			router.refresh()
		})
	}

	return (
		<div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
			<div className="flex flex-1 overflow-hidden h-full">
				{/* Sidebar */}
				<aside
					className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
						isSidebarOpen ? 'block' : 'hidden'
					} lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
						isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
				>
					<nav className="h-full overflow-y-auto p-4">
						{navItems.map(item => (
							<Link
								key={item.href}
								href={item.href}
								passHref
							>
								<Button
									variant={pathname === item.href ? 'secondary' : 'ghost'}
									className={`shadow-none my-1 w-full justify-start ${pathname === item.href ? 'bg-gray-100' : ''}`}
									onClick={() => setIsSidebarOpen(false)}
								>
									<item.icon className="h-4 w-4" />
									{item.label}
								</Button>
							</Link>
						))}
					</nav>
				</aside>
				{/* Main content */}
				<main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
			</div>
		</div>
	)
}
