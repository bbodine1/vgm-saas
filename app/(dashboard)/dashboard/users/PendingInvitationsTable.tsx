'use client'

import { useState, useTransition } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

interface PendingInvitationsTableProps {
	pendingInvitations: any[]
	isOwnerOrSuperAdmin: boolean
}

export default function PendingInvitationsTable({
	pendingInvitations,
	isOwnerOrSuperAdmin,
}: PendingInvitationsTableProps) {
	const [feedback, setFeedback] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	async function approveInvitationAction(formData: FormData) {
		const invitationId = Number(formData.get('invitationId'))
		// Call the server action via fetch (API route or server action endpoint)
		const res = await fetch('/api/approve-invitation', {
			method: 'POST',
			body: JSON.stringify({ invitationId }),
			headers: { 'Content-Type': 'application/json' },
		})
		const data = await res.json()
		if (data.success) {
			setFeedback('Invitation approved successfully.')
			startTransition(() => window.location.reload())
		} else {
			setFeedback('Failed to approve invitation. Make sure the invited user has registered.')
		}
	}

	if (!pendingInvitations.length) return null

	return (
		<div className="mt-8">
			<h2 className="text-lg font-semibold mb-2">Pending Invitations</h2>
			<Table>
				<TableHeader>
					<TableRow className="bg-gray-100">
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Invited At</TableHead>
						{isOwnerOrSuperAdmin && <TableHead>Action</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{pendingInvitations.map(invite => (
						<TableRow
							key={invite.id}
							className="border-t"
						>
							<TableCell>{invite.email}</TableCell>
							<TableCell className="capitalize">{invite.role}</TableCell>
							<TableCell>Pending</TableCell>
							<TableCell>{new Date(invite.invitedAt).toLocaleDateString()}</TableCell>
							{isOwnerOrSuperAdmin && (
								<TableCell>
									<form
										action={approveInvitationAction}
										onSubmit={e => {
											e.preventDefault()
											const form = e.currentTarget as HTMLFormElement
											approveInvitationAction(new FormData(form))
										}}
									>
										<input
											type="hidden"
											name="invitationId"
											value={invite.id}
										/>
										<button
											type="submit"
											className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
											disabled={isPending}
										>
											{isPending ? 'Approving...' : 'Approve'}
										</button>
									</form>
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
			{feedback && (
				<p className={`mt-4 text-sm ${feedback.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</p>
			)}
		</div>
	)
}
