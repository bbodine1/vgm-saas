'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useActionState, Suspense } from 'react'
import { getUser } from '@/lib/db/queries'
import { acceptInvitation } from '@/app/(login)/actions'
import { Button } from '@/components/ui/button'
import { Loader2, CircleIcon } from 'lucide-react'
import { db } from '@/lib/db/drizzle'
import { invitations, users } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

type Invitation = {
	id: number
	teamId: number
	email: string
	role: string
	status: string
	teamName?: string
}

function AcceptInvitationPageContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const inviteId = searchParams.get('inviteId')

	const [loading, setLoading] = useState(true)
	const [invitation, setInvitation] = useState<Invitation | null>(null)
	const [user, setUser] = useState<any>(null)
	const [error, setError] = useState<string | null>(null)
	const [acceptState, acceptAction, accepting] = useActionState(acceptInvitation, { error: '' })

	useEffect(() => {
		if (!inviteId) {
			setError('No invitation ID provided')
			setLoading(false)
			return
		}

		const fetchData = async () => {
			try {
				// Check if user is authenticated
				const response = await fetch('/api/user')
				const currentUser = response.ok ? await response.json() : null
				setUser(currentUser)

				// Get invitation details
				const inviteResponse = await fetch(`/api/invitation/${inviteId}`)
				if (!inviteResponse.ok) {
					setError('Invitation not found or expired')
					setLoading(false)
					return
				}

				const inviteData = await inviteResponse.json()
				setInvitation(inviteData)

				// Handle different scenarios
				if (currentUser) {
					// User is authenticated
					if (currentUser.email === inviteData.email) {
						// Email matches - they can accept the invitation
						setLoading(false)
					} else {
						// Email doesn't match - wrong user
						setError(
							`This invitation is for ${inviteData.email}. Please sign out and sign in with the correct account.`
						)
						setLoading(false)
					}
				} else {
					// User is not authenticated
					// Check if user exists in system
					const userExistsResponse = await fetch(`/api/user/exists?email=${encodeURIComponent(inviteData.email)}`)
					const userExists = userExistsResponse.ok ? await userExistsResponse.json() : { exists: false }

					if (userExists.exists) {
						// User exists - redirect to sign in
						router.push(`/sign-in?inviteId=${inviteId}&email=${encodeURIComponent(inviteData.email)}`)
					} else {
						// User doesn't exist - redirect to sign up
						router.push(`/sign-up?inviteId=${inviteId}&email=${encodeURIComponent(inviteData.email)}`)
					}
				}
			} catch (err) {
				setError('Failed to load invitation details')
				setLoading(false)
			}
		}

		fetchData()
	}, [inviteId, router])

	useEffect(() => {
		if (acceptState && 'success' in acceptState) {
			router.push('/dashboard')
		}
		if (acceptState && acceptState.error) {
			setError(acceptState.error)
		}
	}, [acceptState, router])

	if (loading) {
		return (
			<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<div className="flex justify-center">
						<CircleIcon className="h-12 w-12 text-orange-500" />
					</div>
					<div className="mt-6 text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto" />
						<p className="mt-2 text-gray-600">Loading invitation...</p>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<div className="flex justify-center">
						<CircleIcon className="h-12 w-12 text-orange-500" />
					</div>
					<div className="mt-6 text-center">
						<h2 className="text-2xl font-bold text-gray-900">Invitation Error</h2>
						<p className="mt-2 text-red-600">{error}</p>
						<Button
							onClick={() => router.push('/dashboard')}
							className="mt-4"
						>
							Go to Dashboard
						</Button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex justify-center">
					<CircleIcon className="h-12 w-12 text-orange-500" />
				</div>
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Accept Invitation</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{invitation && (
						<div className="text-center">
							<p className="text-lg font-medium text-gray-900">
								You're invited to join{' '}
								<span className="font-bold text-orange-600">{invitation.teamName || 'an organization'}</span>
							</p>
							<p className="mt-2 text-sm text-gray-600">
								Role: <span className="font-medium capitalize">{invitation.role}</span>
							</p>
							<p className="mt-1 text-sm text-gray-600">
								Email: <span className="font-medium">{invitation.email}</span>
							</p>

							<div className="mt-6">
								<form action={acceptAction}>
									<input
										type="hidden"
										name="inviteId"
										value={inviteId || ''}
									/>
									<Button
										type="submit"
										disabled={accepting}
										className="w-full bg-orange-600 hover:bg-orange-700 text-white"
									>
										{accepting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Accepting...
											</>
										) : (
											'Accept Invitation'
										)}
									</Button>
								</form>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default function AcceptInvitationPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
					<div className="sm:mx-auto sm:w-full sm:max-w-md">
						<div className="flex justify-center">
							<CircleIcon className="h-12 w-12 text-orange-500" />
						</div>
						<div className="mt-6 text-center">
							<Loader2 className="h-8 w-8 animate-spin mx-auto" />
							<p className="mt-2 text-gray-600">Loading...</p>
						</div>
					</div>
				</div>
			}
		>
			<AcceptInvitationPageContent />
		</Suspense>
	)
}
