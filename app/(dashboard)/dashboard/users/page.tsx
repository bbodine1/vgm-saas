import { redirect } from 'next/navigation'
import { getTeamForUser, getUser, getPendingInvitationsForTeam, approveInvitation } from '@/lib/db/queries'
import { User } from '@/lib/db/schema'
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { revalidatePath } from 'next/cache'
import PendingInvitationsTable from './PendingInvitationsTable'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'

export default async function UsersPage() {
	// Get the current user and their team
	const team = await getTeamForUser()
	const currentUser = await getUser()

	if (!currentUser) {
		return <div className="text-red-500">Error: No user found. Please log in.</div>
	}

	if (!team) {
		return (
			<div className="text-red-500">
				Error: No team found. Please select an organization.
				<br />
				Debug: user={JSON.stringify(currentUser)}
			</div>
		)
	}

	// Find the current user's membership
	const currentMembership = team.teamMembers.find(member => member.user.id === currentUser.id)

	const isSuperAdmin = currentUser.role === 'super_admin'
	const isAdmin = currentUser.role === 'admin'
	const isOwnerOrSuperAdmin = isSuperAdmin || isAdmin || (currentMembership && currentMembership.role === 'owner')

	if (!isOwnerOrSuperAdmin) {
		return (
			<div className="text-red-500">
				Access denied. You must be an owner, admin, or super admin to view this page.
				<br />
				Debug: user={JSON.stringify(currentUser)} team={JSON.stringify(team)} membership=
				{JSON.stringify(currentMembership)}
			</div>
		)
	}

	// Fetch pending invitations for this team
	const pendingInvitations = await getPendingInvitationsForTeam(team.id)

	// Fetch all registered user emails
	const registeredUsers = await db.select({ email: users.email }).from(users)
	const registeredUserEmails = new Set(registeredUsers.map(u => u.email))

	return (
		<section className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium mb-6">Users</h1>
			<Card>
				<CardHeader>
					<CardTitle>Users</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-gray-100">
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{team.teamMembers.map(member => (
									<TableRow
										key={member.user.id}
										className="border-t"
									>
										<TableCell>{member.user.name || '-'}</TableCell>
										<TableCell>{member.user.email}</TableCell>
										<TableCell className="capitalize">{member.role}</TableCell>
										<TableCell>Active</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<PendingInvitationsTable
						pendingInvitations={pendingInvitations}
						isOwnerOrSuperAdmin={isOwnerOrSuperAdmin}
						registeredUserEmails={Array.from(registeredUserEmails)}
					/>
				</CardContent>
			</Card>
		</section>
	)
}
