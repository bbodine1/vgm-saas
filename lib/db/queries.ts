import { desc, and, eq, isNull, inArray } from 'drizzle-orm'
import { db } from './drizzle'
import { activityLogs, teamMembers, teams, users, invitations } from './schema'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/session'
import { getSession } from '@/lib/auth/session'
import type { User } from './schema'

export async function getUser() {
	const sessionCookie = (await cookies()).get('session')
	if (!sessionCookie || !sessionCookie.value) {
		return null
	}

	const sessionData = await verifyToken(sessionCookie.value)
	if (!sessionData || !sessionData.user || typeof sessionData.user.id !== 'number') {
		return null
	}

	if (new Date(sessionData.expires) < new Date()) {
		return null
	}

	const user = await db
		.select()
		.from(users)
		.where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
		.limit(1)

	if (user.length === 0) {
		return null
	}

	return user[0]
}

export async function getTeamByStripeCustomerId(customerId: string) {
	const result = await db.select().from(teams).where(eq(teams.stripeCustomerId, customerId)).limit(1)

	return result.length > 0 ? result[0] : null
}

export async function updateTeamSubscription(
	teamId: number,
	subscriptionData: {
		stripeSubscriptionId: string | null
		stripeProductId: string | null
		planName: string | null
		subscriptionStatus: string
	}
) {
	await db
		.update(teams)
		.set({
			...subscriptionData,
			updatedAt: new Date(),
		})
		.where(eq(teams.id, teamId))
}

export async function getActivityLogs() {
	const user = await getUser()
	if (!user) {
		throw new Error('User not authenticated')
	}

	return await db
		.select({
			id: activityLogs.id,
			action: activityLogs.action,
			timestamp: activityLogs.timestamp,
			ipAddress: activityLogs.ipAddress,
			userName: users.name,
		})
		.from(activityLogs)
		.leftJoin(users, eq(activityLogs.userId, users.id))
		.where(eq(activityLogs.userId, user.id))
		.orderBy(desc(activityLogs.timestamp))
		.limit(10)
}

// Returns the active team for the current user, using activeTeamId from session if present
export async function getActiveTeam() {
	const session = await getSession()
	if (!session || !session.user) return null
	const userId = session.user.id
	const activeTeamId = session.activeTeamId

	// Get user for role check
	const user = await db
		.select()
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1)
	if (user.length === 0) return null
	const isSuperAdmin = user[0].role === 'super_admin'
	const isAdmin = user[0].role === 'admin'

	if (!activeTeamId) return null

	// If super admin or admin, allow any team
	if (isSuperAdmin || isAdmin) {
		const team = await db.select().from(teams).where(eq(teams.id, activeTeamId)).limit(1)
		return team.length > 0 ? team[0] : null
	}

	// Otherwise, only allow if user is a member
	const membership = await db
		.select()
		.from(teamMembers)
		.where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, activeTeamId)))
	if (membership.length === 0) return null
	const team = await db.select().from(teams).where(eq(teams.id, activeTeamId)).limit(1)
	return team.length > 0 ? team[0] : null
}

// Update getTeamForUser to use activeTeamId if present, otherwise fallback to first team
export async function getTeamForUser() {
	const session = await getSession()
	if (!session || !session.user) return null
	const userId = session.user.id
	const activeTeamId = session.activeTeamId

	// Get user for role check
	const user = await db
		.select()
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1)
	if (user.length === 0) return null
	const isSuperAdmin = user[0].role === 'super_admin'
	const isAdmin = user[0].role === 'admin'

	if (activeTeamId) {
		if (isSuperAdmin || isAdmin) {
			// Super admin or admin: allow any team by ID
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, activeTeamId),
				with: {
					teamMembers: {
						with: {
							user: {
								columns: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
				},
			})
			if (team) return team
		} else {
			// Try to get the active team for regular users
			const result = await db.query.teamMembers.findFirst({
				where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, activeTeamId)),
				with: {
					team: {
						with: {
							teamMembers: {
								with: {
									user: {
										columns: {
											id: true,
											name: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			})
			if (result?.team) return result.team
		}
	}

	// Fallback: first team for user
	const result = await db.query.teamMembers.findFirst({
		where: eq(teamMembers.userId, userId),
		with: {
			team: {
				with: {
					teamMembers: {
						with: {
							user: {
								columns: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
				},
			},
		},
	})
	return result?.team || null
}

// Returns all teams for the current user, or all teams if super admin or admin
export async function getAllTeamsForUser() {
	const session = await getSession()
	if (!session || !session.user) return []
	const userId = session.user.id

	// Get user for role check
	const user = await db
		.select()
		.from(users)
		.where(and(eq(users.id, userId), isNull(users.deletedAt)))
		.limit(1)
	if (user.length === 0) return []
	const isSuperAdmin = user[0].role === 'super_admin'
	const isAdmin = user[0].role === 'admin'

	if (isSuperAdmin || isAdmin) {
		// Return all teams
		return await db.select().from(teams)
	}

	// Return teams where user is a member
	const memberships = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId))
	const teamIds = memberships.map(m => m.teamId)
	if (teamIds.length === 0) return []
	return await db.select().from(teams).where(inArray(teams.id, teamIds))
}

// Get all pending invitations for a team
export async function getPendingInvitationsForTeam(teamId: number) {
	return await db
		.select()
		.from(invitations)
		.where(and(eq(invitations.teamId, teamId), eq(invitations.status, 'pending')))
}

// Approve a pending invitation: set status to 'accepted' and add as team member if not already present
export async function approveInvitation(invitationId: number) {
	// Get the invitation
	const [invite] = await db.select().from(invitations).where(eq(invitations.id, invitationId)).limit(1)
	if (!invite || invite.status !== 'pending') return false

	// Update invitation status
	await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitationId))

	// Check if user already exists
	const [user] = await db.select().from(users).where(eq(users.email, invite.email)).limit(1)
	if (!user) return false // Can't add as team member if user doesn't exist

	// Check if already a team member
	const existing = await db
		.select()
		.from(teamMembers)
		.where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, invite.teamId)))
		.limit(1)
	if (existing.length === 0) {
		await db.insert(teamMembers).values({ userId: user.id, teamId: invite.teamId, role: invite.role })
	}
	return true
}

// Delete a pending invitation
export async function deleteInvitation(invitationId: number) {
	// First check if the invitation exists and is pending
	const [invite] = await db.select().from(invitations).where(eq(invitations.id, invitationId)).limit(1)
	if (!invite || invite.status !== 'pending') return false

	// Delete the invitation
	await db.delete(invitations).where(eq(invitations.id, invitationId))
	return true
}

// Update the team name (organization name) with uniqueness check
export async function updateTeamName(teamId: number, newName: string) {
	// Check uniqueness
	const existing = await db.select().from(teams).where(eq(teams.name, newName)).limit(1)
	if (existing.length > 0 && existing[0].id !== teamId) {
		throw new Error('Organization name is already taken.')
	}
	await db.update(teams).set({ name: newName, updatedAt: new Date() }).where(eq(teams.id, teamId))
}

// Helper: can currentUser manage (update/delete) targetUser's role?
export function canManageUserRoles(currentUser: User, targetUser: User): boolean {
	if (currentUser.role === 'super_admin') return true
	if (currentUser.role === 'admin' && targetUser.role !== 'super_admin') return true
	return false
}
