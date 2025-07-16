'use client'

import React from 'react'
import { deleteInvitationAction } from '@/app/(login)/actions'
import { Button } from '@/components/ui/button'
import { useActionState } from 'react'

type ActionState = {
	error?: string
	success?: string
}

type PendingInvitationsTableProps = {
	pendingInvitations: any[]
	isOwnerOrSuperAdmin: boolean
	registeredUserEmails: string[]
}

const PendingInvitationsTable: React.FC<PendingInvitationsTableProps> = ({
	pendingInvitations,
	isOwnerOrSuperAdmin,
	registeredUserEmails,
}) => {
	const [deleteState, deleteAction, isDeletePending] = useActionState<ActionState, FormData>(deleteInvitationAction, {})

	if (!pendingInvitations || pendingInvitations.length === 0) {
		return <div className="mt-4 text-gray-500">No pending invitations.</div>
	}

	return (
		<div className="mt-6">
			<h2 className="font-semibold mb-2">Pending Invitations</h2>
			{deleteState?.error && <p className="text-red-500 mb-2">{deleteState.error}</p>}
			{deleteState?.success && <p className="text-green-500 mb-2">{deleteState.success}</p>}
			<table className="min-w-full text-sm">
				<thead>
					<tr>
						<th className="text-left p-2">Email</th>
						<th className="text-left p-2">Role</th>
						<th className="text-left p-2">Status</th>
						{isOwnerOrSuperAdmin && <th className="text-left p-2">Action</th>}
					</tr>
				</thead>
				<tbody>
					{pendingInvitations.map((invite, idx) => (
						<tr
							key={invite.id || idx}
							className="border-t"
						>
							<td className="p-2">{invite.email}</td>
							<td className="p-2 capitalize">{invite.role}</td>
							<td className="p-2 capitalize">{invite.status}</td>
							{isOwnerOrSuperAdmin && (
								<td className="p-2">
									<form action={deleteAction}>
										<input
											type="hidden"
											name="invitationId"
											value={invite.id}
										/>
										<Button
											type="submit"
											variant="destructive"
											size="sm"
											disabled={isDeletePending}
										>
											{isDeletePending ? 'Deleting...' : 'Delete'}
										</Button>
									</form>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default PendingInvitationsTable
