'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition, Suspense } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { CircleIcon, Menu, X, Users, Settings, Shield, Activity, LayoutDashboard } from 'lucide-react'
import { UserMenu } from '@/components/UserMenu'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const navItems = [{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]

const Header: React.FC = () => {
	const { data: allTeamsRaw, isLoading, error: teamsError } = useSWR('/api/teams', fetcher)
	const allTeams = Array.isArray(allTeamsRaw) ? allTeamsRaw : []
	const { data: userData, mutate: mutateUser } = useSWR('/api/user', fetcher)
	const activeTeamId = userData?.activeTeamId
	const team = allTeams && allTeams.length > 0 ? allTeams.find((t: any) => t.id === activeTeamId) || allTeams[0] : null
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	async function handleSwitchTeam(value: string | number) {
		const teamId = typeof value === 'string' ? parseInt(value, 10) : value

		try {
			const response = await fetch('/api/user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ teamId }),
			})

			if (response.ok) {
				// Invalidate user cache to refetch updated activeTeamId
				await mutateUser()
				startTransition(() => {
					router.refresh()
				})
			}
		} catch (error) {
			console.error('Error switching teams:', error)
		}
	}

	if (teamsError) {
		return (
			<header className="border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center min-h-[48px]">
					<div className="flex items-center space-x-4 text-red-500">Failed to load teams.</div>
					<div className="flex items-center space-x-4">
						<div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
					</div>
				</div>
			</header>
		)
	}

	if (isLoading || !allTeams) {
		return (
			<header className="border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center min-h-[48px]">
					<div className="flex items-center space-x-4">
						<div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
					</div>
					<div className="flex items-center space-x-4">
						<div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
					</div>
				</div>
			</header>
		)
	}

	return (
		<header className="border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
				<div className="flex items-center space-x-4">
					<Link
						href="/"
						className="flex items-center"
					>
						<CircleIcon className="h-6 w-6 text-orange-500" />
					</Link>
					{!userData && <span className="text-xl font-semibold text-gray-900">Acme</span>}
					{userData && team && allTeams && allTeams.length === 1 && (
						<span className="text-xl font-semibold text-gray-900">{team.name}</span>
					)}
					{userData && team && allTeams && allTeams.length > 1 && (
						<Combobox
							options={allTeams
								.filter(
									(t: any) =>
										t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trialing' || !t.subscriptionStatus
								)
								.map((t: any) => ({ value: String(t.id), label: t.name, disabled: false }))}
							value={String(team.id)}
							onChange={handleSwitchTeam}
							placeholder={team.name}
							disabled={false}
						/>
					)}
				</div>
				<div className="flex items-center space-x-4">
					<Suspense fallback={<div className="h-9" />}>
						<UserMenu />
					</Suspense>
				</div>
			</div>
		</header>
	)
}

export function TeamHeader() {
	const { data: allTeamsRaw, isLoading, error: teamsError } = useSWR('/api/teams', fetcher)
	const allTeams = Array.isArray(allTeamsRaw) ? allTeamsRaw : []
	const { data: userData, mutate: mutateUser } = useSWR('/api/user', fetcher)
	const activeTeamId = userData?.activeTeamId
	const team = allTeams && allTeams.length > 0 ? allTeams.find((t: any) => t.id === activeTeamId) || allTeams[0] : null
	const router = useRouter()
	const pathname = usePathname()
	const [isPending, startTransition] = useTransition()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	async function handleSwitchTeam(value: string | number) {
		const teamId = typeof value === 'string' ? parseInt(value, 10) : value
		const response = await fetch('/api/user', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ teamId }),
		})

		if (response.ok) {
			// Invalidate user cache to refetch updated activeTeamId
			await mutateUser()
			startTransition(() => {
				router.refresh()
			})
		}
	}

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
							<span className="font-medium">Menu</span>
							<Button
								variant="ghost"
								onClick={() => setIsSidebarOpen(false)}
							>
								<X className="h-6 w-6" />
								<span className="sr-only">Close sidebar</span>
							</Button>
						</div>
						<nav className="h-full overflow-y-auto p-4">
							{navItems.map(item => (
								<Link
									key={item.href}
									href={item.href}
									passHref
									onClick={() => setIsSidebarOpen(false)}
								>
									<Button
										variant={pathname === item.href ? 'secondary' : 'ghost'}
										className="shadow-none my-1 w-full justify-start"
									>
										<item.icon className="h-4 w-4" />
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
			<div className="flex items-center">
				{!userData && <span className="font-medium text-xl truncate max-w-[12rem]">Acme</span>}
				{userData && team ? <span className="font-medium text-xl truncate max-w-[12rem]">{team.name}</span> : null}
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
	)

	if (teamsError) {
		return (
			<>
				{mobileHeader}
				{mobileSidebar}
				<header className="hidden lg:block border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center min-h-[48px]">
						<div className="flex items-center space-x-4 text-red-500">Failed to load teams.</div>
						<div className="flex items-center space-x-4">
							<div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
						</div>
					</div>
				</header>
			</>
		)
	}

	if (isLoading || !allTeams) {
		return (
			<>
				{mobileHeader}
				{mobileSidebar}
				<header className="hidden lg:block border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center min-h-[48px]">
						<div className="flex items-center space-x-4">
							<div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
						</div>
						<div className="flex items-center space-x-4">
							<div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
						</div>
					</div>
				</header>
			</>
		)
	}

	return (
		<>
			{mobileHeader}
			{mobileSidebar}
			<header className="hidden lg:block border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
					<div className="flex items-center space-x-4">
						<Link
							href="/"
							className="flex items-center"
						>
							<CircleIcon className="h-6 w-6 text-orange-500" />
						</Link>
						{!userData && <span className="text-xl font-semibold text-gray-900">Acme</span>}
						{userData && team && allTeams && allTeams.length === 1 && (
							<span className="text-xl font-semibold text-gray-900">{team.name}</span>
						)}
						{userData && team && allTeams && allTeams.length > 1 && (
							<Combobox
								options={allTeams
									.filter(
										(t: any) =>
											t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trialing' || !t.subscriptionStatus
									)
									.map((t: any) => ({ value: String(t.id), label: t.name, disabled: false }))}
								value={String(team.id)}
								onChange={handleSwitchTeam}
								placeholder={team.name}
								disabled={false}
							/>
						)}
					</div>
					<div className="flex items-center space-x-4">
						<Suspense fallback={<div className="h-9" />}>
							<UserMenu />
						</Suspense>
					</div>
				</div>
			</header>
		</>
	)
}

export default Header
