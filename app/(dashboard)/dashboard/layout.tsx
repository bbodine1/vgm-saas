'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Users, Settings, Shield, Activity, Menu, LayoutDashboard } from 'lucide-react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Combobox } from '@/components/ui/combobox'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const { data: currentTeam } = useSWR('/api/team', fetcher)
	const { data: allTeams } = useSWR('/api/team', fetcher)

	const navItems = [
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/dashboard/users', icon: Users, label: 'Users' },
		{ href: '/dashboard/team', icon: Users, label: 'Team' },
		{ href: '/dashboard/general', icon: Settings, label: 'General' },
		{ href: '/dashboard/activity', icon: Activity, label: 'Activity' },
		{ href: '/dashboard/security', icon: Shield, label: 'Security' },
	]

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
			{/* Main header with org switcher and user avatar */}

			{/* Mobile header */}
			<div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
				<div className="flex items-center">
					<span className="font-medium">Settings</span>
				</div>
				<Button
					className="-mr-3"
					variant="ghost"
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
				>
					<Menu className="h-6 w-6" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>
			</div>

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
