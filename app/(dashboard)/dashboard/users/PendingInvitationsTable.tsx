import React from 'react'

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
	if (!pendingInvitations || pendingInvitations.length === 0) {
		return <div className="mt-4 text-gray-500">No pending invitations.</div>
	}
	return (
		<div className="mt-6">
			<h2 className="font-semibold mb-2">Pending Invitations</h2>
			<table className="min-w-full text-sm">
				<thead>
					<tr>
						<th>Email</th>
						<th>Role</th>
						<th>Status</th>
						{isOwnerOrSuperAdmin && <th>Action</th>}
					</tr>
				</thead>
				<tbody>
					{pendingInvitations.map((invite, idx) => (
						<tr key={idx}>
							<td>{invite.email}</td>
							<td>{invite.role}</td>
							<td>{invite.status}</td>
							{isOwnerOrSuperAdmin && <td>--</td>}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default PendingInvitationsTable
