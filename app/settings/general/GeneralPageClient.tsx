'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { updateAccount } from '@/app/(login)/actions'
import { updateOrganizationName } from '@/app/(login)/actions'
import { User, TeamDataWithMembers } from '@/lib/db/schema'
import { Suspense } from 'react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type ActionState = {
	name?: string
	error?: string
	success?: string
}

type AccountFormProps = {
	state: ActionState
	nameValue?: string
	emailValue?: string
}

function AccountForm({ state, nameValue = '', emailValue = '' }: AccountFormProps) {
	return (
		<>
			<div>
				<Label
					htmlFor="name"
					className="mb-2"
				>
					Name
				</Label>
				<Input
					id="name"
					name="name"
					placeholder="Enter your name"
					defaultValue={state.name || nameValue}
					required
				/>
			</div>
			<div>
				<Label
					htmlFor="email"
					className="mb-2"
				>
					Email
				</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="Enter your email"
					defaultValue={emailValue}
					required
				/>
			</div>
		</>
	)
}

type GeneralPageClientProps = {
	team: TeamDataWithMembers | null
	user: User | null
}

function AccountFormWithData({ state, user }: { state: ActionState; user: User | null }) {
	return (
		<AccountForm
			state={state}
			nameValue={user?.name ?? ''}
			emailValue={user?.email ?? ''}
		/>
	)
}

export default function GeneralPageClient({ team, user }: GeneralPageClientProps) {
	const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateAccount, {})
	const [orgState, orgFormAction, isOrgPending] = useActionState<any, FormData>(updateOrganizationName, {})
	const isOwnerOrSuperAdmin = user?.role === 'owner' || user?.role === 'super_admin'

	return (
		<section className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">General Settings</h1>

			{isOwnerOrSuperAdmin && (
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Organization Name</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							className="space-y-4"
							action={orgFormAction}
						>
							<Label htmlFor="orgName">Organization Name</Label>
							<Input
								id="orgName"
								name="name"
								defaultValue={orgState.name || team?.name || ''}
								placeholder="Enter organization name"
								required
								minLength={4}
								maxLength={100}
								disabled={isOrgPending}
							/>
							{orgState.error && <p className="text-red-500 text-sm">{orgState.error}</p>}
							{orgState.success && <p className="text-green-500 text-sm">{orgState.success}</p>}
							<Button
								type="submit"
								className="bg-orange-500 hover:bg-orange-600 text-white"
								disabled={isOrgPending}
							>
								{isOrgPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									'Save Organization Name'
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						action={formAction}
					>
						<Suspense fallback={<AccountForm state={state} />}>
							<AccountFormWithData
								state={state}
								user={user}
							/>
						</Suspense>
						{state.error && <p className="text-red-500 text-sm">{state.error}</p>}
						{state.success && <p className="text-green-500 text-sm">{state.success}</p>}
						<Button
							type="submit"
							className="bg-orange-500 hover:bg-orange-600 text-white"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								'Save Changes'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</section>
	)
}
