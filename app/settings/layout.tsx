'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Users as TeamIcon, Settings, Activity, Shield, Home, ArrowLeft, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'

const settingsNavItems = [
	{ href: '/settings/users', icon: Users, label: 'Users' },
	{ href: '/settings/team', icon: TeamIcon, label: 'Team' },
	{ href: '/settings/general', icon: Settings, label: 'General' },
	{ href: '/settings/activity', icon: Activity, label: 'Activity' },
	{ href: '/settings/security', icon: Shield, label: 'Security' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	// Mobile sidebar overlay
	const mobileSidebar = (
		<>
			{isSidebarOpen && (
				<>
					<div
						className="fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity lg:hidden"
						onClick={() => setIsSidebarOpen(false)}
					/>
					<aside
						className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
							isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
						}`}
						role="dialog"
						aria-modal="true"
					>
						<div className="flex items-center justify-between p-4 border-b border-gray-200">
							<span className="font-medium">Settings</span>
							<Button
								variant="ghost"
								onClick={() => setIsSidebarOpen(false)}
							>
								<X className="h-6 w-6" />
								<span className="sr-only">Close sidebar</span>
							</Button>
						</div>
						<nav className="h-full overflow-y-auto p-4">
							<Link
								href="/dashboard"
								passHref
								onClick={() => setIsSidebarOpen(false)}
							>
								<Button
									variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
									className="w-full justify-start mb-2"
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Back to Dashboard
								</Button>
							</Link>
							{settingsNavItems.map(item => (
								<Link
									key={item.href}
									href={item.href}
									passHref
									onClick={() => setIsSidebarOpen(false)}
								>
									<Button
										variant={pathname === item.href ? 'secondary' : 'ghost'}
										className="w-full justify-start"
									>
										<item.icon className="h-4 w-4 mr-2" />
										{item.label}
									</Button>
								</Link>
							))}
						</nav>
					</aside>
				</>
			)}
		</>
	)

	// Mobile header (always visible on small screens)
	const mobileHeader = (
		<div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
			<span className="font-medium text-xl">Settings</span>
			<Button
				className="-mr-3"
				variant="ghost"
				onClick={() => setIsSidebarOpen(!isSidebarOpen)}
			>
				<Menu className="h-6 w-6" />
				<span className="sr-only">Toggle sidebar</span>
			</Button>
		</div>
	)

	return (
		<section className="flex flex-col min-h-screen">
			<Header />
			{mobileHeader}
			{mobileSidebar}
			<div className="flex flex-1 min-h-0">
				{/* Desktop sidebar */}
				<aside className="hidden lg:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
					<nav className="flex flex-col gap-2 p-4">
						<Link
							href="/dashboard"
							passHref
						>
							<Button
								variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
								className="w-full justify-start"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Dashboard
							</Button>
						</Link>
						{settingsNavItems.map(item => (
							<Link
								key={item.href}
								href={item.href}
								passHref
							>
								<Button
									variant={pathname === item.href ? 'secondary' : 'ghost'}
									className="w-full justify-start"
								>
									<item.icon className="h-4 w-4 mr-2" />
									{item.label}
								</Button>
							</Link>
						))}
					</nav>
				</aside>
				<main className="flex-1">{children}</main>
			</div>
		</section>
	)
}
