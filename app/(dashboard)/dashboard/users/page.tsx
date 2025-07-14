import { redirect } from 'next/navigation'
import { getTeamForUser, getUser } from '@/lib/db/queries'
import { User } from '@/lib/db/schema'
import React from 'react'

export default async function UsersPage() {
	// Get the current user and their team
	const team = await getTeamForUser()
	const currentUser = await getUser()

	if (!team || !currentUser) {
		redirect('/dashboard')
	}

	// Find the current user's membership
	const currentMembership = team.teamMembers.find(member => member.user.id === currentUser.id)

	if (!currentMembership || currentMembership.role !== 'owner') {
		redirect('/dashboard')
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Team Members</h1>
			<div className="overflow-x-auto">
				<table className="min-w-full border border-gray-200 rounded">
					<thead>
						<tr className="bg-gray-100">
							<th className="px-4 py-2 text-left">Name</th>
							<th className="px-4 py-2 text-left">Email</th>
							<th className="px-4 py-2 text-left">Role</th>
							<th className="px-4 py-2 text-left">Status</th>
						</tr>
					</thead>
					<tbody>
						{team.teamMembers.map(member => (
							<tr
								key={member.user.id}
								className="border-t"
							>
								<td className="px-4 py-2">{member.user.name || '-'}</td>
								<td className="px-4 py-2">{member.user.email}</td>
								<td className="px-4 py-2 capitalize">{member.role}</td>
								<td className="px-4 py-2">Active</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
