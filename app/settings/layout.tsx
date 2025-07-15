'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Users as TeamIcon, Settings, Activity, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

const settingsNavItems = [
	{ href: '/settings/users', icon: Users, label: 'Users' },
	{ href: '/settings/team', icon: TeamIcon, label: 'Team' },
	{ href: '/settings/general', icon: Settings, label: 'General' },
	{ href: '/settings/activity', icon: Activity, label: 'Activity' },
	{ href: '/settings/security', icon: Shield, label: 'Security' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	return (
		<div className="flex min-h-[calc(100dvh-68px)] w-full">
			<aside className="w-56 bg-white border-r border-gray-200 p-4">
				<nav className="flex flex-col gap-2">
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
			<main className="flex-1 p-4 lg:p-8">{children}</main>
		</div>
	)
}
