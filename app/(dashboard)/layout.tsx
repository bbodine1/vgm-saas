'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Home, LogOut, Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from '@/app/(login)/actions'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/db/schema'
import useSWR, { mutate } from 'swr'
import Header from '@/components/layout/Header'

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

export function UserMenu() {
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
						{user.name && user.name.length > 0 ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
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
				<DropdownMenuItem className="cursor-pointer">
					<Link
						href="/settings"
						className="flex w-full items-center"
					>
						<Settings className="mr-2 h-4 w-4" />
						<span>Settings</span>
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

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section className="flex flex-col min-h-screen">
			<Header />
			{children}
		</section>
	)
}
