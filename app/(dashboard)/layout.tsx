'use client'

import Link from 'next/link'
import { use, useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { CircleIcon, Home, LogOut } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from '@/app/(login)/actions'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/db/schema'
import useSWR, { mutate } from 'swr'
import { Combobox } from '@/components/ui/combobox'
import { useTransition } from 'react'

const fetcher = async (url: string) => {
	try {
		const res = await fetch(url)
		if (!res.ok) {
			return null
		}
		return await res.json()
	} catch {
		return null
	}
}

function UserMenu() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const { data: user, error: userError } = useSWR<User>('/api/user', fetcher)
	const router = useRouter()

	async function handleSignOut() {
		await signOut()
		mutate('/api/user')
		router.push('/')
	}

	if (userError) {
		return <div className="text-red-500">Failed to load user info.</div>
	}

	if (!user) {
		return (
			<>
				<Link
					href="/pricing"
					className="text-sm font-medium text-gray-700 hover:text-gray-900"
				>
					Pricing
				</Link>
				<Button
					asChild
					className="rounded-full"
				>
					<Link href="/sign-up">Sign Up</Link>
				</Button>
			</>
		)
	}

	return (
		<DropdownMenu
			open={isMenuOpen}
			onOpenChange={setIsMenuOpen}
		>
			<DropdownMenuTrigger>
				<Avatar className="cursor-pointer size-9">
					<AvatarImage alt={user.name || ''} />
					<AvatarFallback>
						{user.email
							.split(' ')
							.map(n => n[0])
							.join('')}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="flex flex-col gap-1"
			>
				<DropdownMenuItem className="cursor-pointer">
					<Link
						href="/dashboard"
						className="flex w-full items-center"
					>
						<Home className="mr-2 h-4 w-4" />
						<span>Dashboard</span>
					</Link>
				</DropdownMenuItem>
				<form
					action={handleSignOut}
					className="w-full"
				>
					<button
						type="submit"
						className="flex w-full"
					>
						<DropdownMenuItem className="w-full flex-1 cursor-pointer">
							<LogOut className="mr-2 h-4 w-4" />
							<span>Sign out</span>
						</DropdownMenuItem>
					</button>
				</form>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function Header() {
	const { data: allTeamsRaw, isLoading, error: teamsError } = useSWR('/api/team', fetcher)
	const allTeams = Array.isArray(allTeamsRaw) ? allTeamsRaw : []
	const { data: userData } = useSWR('/api/user', fetcher)
	const activeTeamId = userData?.activeTeamId
	const team = allTeams && allTeams.length > 0 ? allTeams.find((t: any) => t.id === activeTeamId) || allTeams[0] : null
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	async function handleSwitchTeam(value: string | number) {
		const teamId = typeof value === 'string' ? parseInt(value, 10) : value
		await fetch('/api/user', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ teamId }),
		})
		startTransition(() => {
			router.refresh()
		})
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
					{team && allTeams && allTeams.length === 1 && (
						<span className="text-xl font-semibold text-gray-900">{team.name}</span>
					)}
					{team && allTeams && allTeams.length > 1 && (
						<Combobox
							options={allTeams
								.filter((t: any) => t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trialing')
								.map((t: any) => ({ value: t.id, label: t.name }))}
							value={team.id}
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

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section className="flex flex-col min-h-screen">
			<Header />
			{children}
		</section>
	)
}
