import { redirect } from 'next/navigation'
import { getTeamForUser, getUser } from '@/lib/db/queries'
import { User } from '@/lib/db/schema'
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

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
		<section className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium mb-6">Team Members</h1>
			<Card>
				<CardHeader>
					<CardTitle>Team Members</CardTitle>
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
				</CardContent>
			</Card>
		</section>
	)
}
