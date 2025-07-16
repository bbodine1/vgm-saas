'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import {
	User,
	users,
	teams,
	teamMembers,
	activityLogs,
	type NewUser,
	type NewTeam,
	type NewTeamMember,
	type NewActivityLog,
	ActivityType,
	invitations,
} from '@/lib/db/schema'
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createCheckoutSession } from '@/lib/payments/stripe'
import { getUser, getTeamForUser, deleteInvitation } from '@/lib/db/queries'
import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware'
import { sendEmail } from '@/lib/server/email'
import crypto from 'crypto'
import { passwordResetTokens } from '@/lib/db/schema'

async function logActivity(teamId: number | null | undefined, userId: number, type: ActivityType, ipAddress?: string) {
	if (teamId === null || teamId === undefined) {
		return
	}
	const newActivity: NewActivityLog = {
		teamId,
		userId,
		action: type,
		ipAddress: ipAddress || '',
	}
	await db.insert(activityLogs).values(newActivity)
}

const signInSchema = z.object({
	email: z.string().email().min(3).max(255),
	password: z.string().min(8).max(100),
})

export const signIn = validatedAction(signInSchema, async (data, formData) => {
	const { email, password } = data

	const [foundUser] = await db.select().from(users).where(eq(users.email, email)).limit(1)

	if (!foundUser) {
		return {
			error: 'Invalid email or password. Please try again.',
			email,
			password,
		}
	}

	const isPasswordValid = await comparePasswords(password, foundUser.passwordHash)

	if (!isPasswordValid) {
		return {
			error: 'Invalid email or password. Please try again.',
			email,
			password,
		}
	}

	await setSession(foundUser)
	const team = await getTeamForUser()
	await logActivity(team?.id, foundUser.id, ActivityType.SIGN_IN)

	// Check if there's an invitation to accept
	const inviteId = formData.get('inviteId') as string | null
	if (inviteId) {
		// Try to accept the invitation
		const [invitation] = await db
			.select()
			.from(invitations)
			.where(
				and(
					eq(invitations.id, parseInt(inviteId)),
					eq(invitations.email, foundUser.email),
					eq(invitations.status, 'pending')
				)
			)
			.limit(1)

		if (invitation) {
			// Check if user is already a member of this team
			const existingMembership = await db
				.select()
				.from(teamMembers)
				.where(and(eq(teamMembers.userId, foundUser.id), eq(teamMembers.teamId, invitation.teamId)))
				.limit(1)

			if (existingMembership.length === 0) {
				// Add user as team member
				const newTeamMember: NewTeamMember = {
					userId: foundUser.id,
					teamId: invitation.teamId,
					role: invitation.role,
				}
				await db.insert(teamMembers).values(newTeamMember)
			}

			// Update invitation status and set session to this team
			await Promise.all([
				db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitation.id)),
				setSession(foundUser, invitation.teamId),
				logActivity(invitation.teamId, foundUser.id, ActivityType.ACCEPT_INVITATION),
			])

			redirect('/dashboard')
		}
	}

	const redirectTo = formData.get('redirect') as string | null
	if (redirectTo === 'checkout') {
		const priceId = formData.get('priceId') as string
		return createCheckoutSession({ team, priceId })
	}

	redirect('/dashboard')
})

const signUpSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	inviteId: z.string().optional(),
	orgName: z.string().min(4).max(20).optional(),
})

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
	const { email, password, inviteId, orgName } = data

	const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)

	if (existingUser.length > 0) {
		// If user exists and there's an invitation, redirect them to sign in
		if (inviteId) {
			return {
				error: 'An account with this email already exists. Please sign in to accept your invitation.',
				email,
				password,
				redirectToSignIn: true,
			}
		}
		return {
			error: 'Failed to create user. Please try again.',
			email,
			password,
		}
	}

	const passwordHash = await hashPassword(password)

	const newUser: NewUser = {
		email,
		passwordHash,
		role: 'owner', // Default role, will be overridden if there's an invitation
	}

	const [createdUser] = await db.insert(users).values(newUser).returning()

	if (!createdUser) {
		return {
			error: 'Failed to create user. Please try again.',
			email,
			password,
		}
	}

	let teamId: number
	let userRole: string
	let createdTeam: typeof teams.$inferSelect | null = null

	if (inviteId) {
		// Check if there's a valid invitation
		const [invitation] = await db
			.select()
			.from(invitations)
			.where(
				and(eq(invitations.id, parseInt(inviteId)), eq(invitations.email, email), eq(invitations.status, 'pending'))
			)
			.limit(1)

		if (invitation) {
			teamId = invitation.teamId
			userRole = invitation.role

			await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitation.id))

			await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION)
			;[createdTeam] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
		} else {
			return { error: 'Invalid or expired invitation.', email, password }
		}
	} else {
		// Validate orgName
		if (!orgName || orgName.length < 4 || orgName.length > 20) {
			return {
				error: 'Failed to create user. Please try again.',
				email,
				password,
				orgName,
				orgNameError: 'Organization name must be between 4 and 20 characters.',
			}
		}
		// Check uniqueness
		const existingOrg = await db.select().from(teams).where(eq(teams.name, orgName)).limit(1)
		if (existingOrg.length > 0) {
			return {
				error: 'Failed to create user. Please try again.',
				email,
				password,
				orgName,
				orgNameError: 'Organization name is already taken.',
			}
		}
		// Create a new team if there's no invitation
		const newTeam: NewTeam = {
			name: orgName,
		}
		;[createdTeam] = await db.insert(teams).values(newTeam).returning()
		if (!createdTeam) {
			return {
				error: 'Failed to create team. Please try again.',
				email,
				password,
				orgName,
			}
		}
		teamId = createdTeam.id
		userRole = 'owner'
		await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM)
	}

	const newTeamMember: NewTeamMember = {
		userId: createdUser.id,
		teamId: teamId,
		role: userRole,
	}

	await Promise.all([
		db.insert(teamMembers).values(newTeamMember),
		logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
		setSession(createdUser, teamId),
	])

	const redirectTo = formData.get('redirect') as string | null
	if (redirectTo === 'checkout') {
		const priceId = formData.get('priceId') as string
		return createCheckoutSession({ team: createdTeam, priceId })
	}

	redirect('/dashboard')
})

export async function signOut() {
	const user = (await getUser()) as User
	const team = await getTeamForUser()
	await logActivity(team?.id, user.id, ActivityType.SIGN_OUT)
	;(await cookies()).delete('session')
}

const updatePasswordSchema = z.object({
	currentPassword: z.string().min(8).max(100),
	newPassword: z.string().min(8).max(100),
	confirmPassword: z.string().min(8).max(100),
})

export const updatePassword = validatedActionWithUser(updatePasswordSchema, async (data, _, user) => {
	const { currentPassword, newPassword, confirmPassword } = data

	const isPasswordValid = await comparePasswords(currentPassword, user.passwordHash)

	if (!isPasswordValid) {
		return {
			currentPassword,
			newPassword,
			confirmPassword,
			error: 'Current password is incorrect.',
		}
	}

	if (currentPassword === newPassword) {
		return {
			currentPassword,
			newPassword,
			confirmPassword,
			error: 'New password must be different from the current password.',
		}
	}

	if (confirmPassword !== newPassword) {
		return {
			currentPassword,
			newPassword,
			confirmPassword,
			error: 'New password and confirmation password do not match.',
		}
	}

	const newPasswordHash = await hashPassword(newPassword)
	const team = await getTeamForUser()

	await Promise.all([
		db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, user.id)),
		logActivity(team?.id, user.id, ActivityType.UPDATE_PASSWORD),
	])

	return {
		success: 'Password updated successfully.',
	}
})

const deleteAccountSchema = z.object({
	password: z.string().min(8).max(100),
})

export const deleteAccount = validatedActionWithUser(deleteAccountSchema, async (data, _, user) => {
	const { password } = data

	const isPasswordValid = await comparePasswords(password, user.passwordHash)
	if (!isPasswordValid) {
		return {
			password,
			error: 'Incorrect password. Account deletion failed.',
		}
	}

	const team = await getTeamForUser()

	await logActivity(team?.id, user.id, ActivityType.DELETE_ACCOUNT)

	// Soft delete
	await db
		.update(users)
		.set({
			deletedAt: sql`CURRENT_TIMESTAMP`,
			email: sql`CONCAT(email, '-', id, '-deleted')`, // Ensure email uniqueness
		})
		.where(eq(users.id, user.id))

	await db.delete(teamMembers).where(eq(teamMembers.userId, user.id))
	;(await cookies()).delete('session')
	redirect('/sign-in')
})

const updateAccountSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	email: z.string().email('Invalid email address'),
})

export const updateAccount = validatedActionWithUser(updateAccountSchema, async (data, _, user) => {
	const { name, email } = data
	const team = await getTeamForUser()

	await Promise.all([
		db.update(users).set({ name, email }).where(eq(users.id, user.id)),
		logActivity(team?.id, user.id, ActivityType.UPDATE_ACCOUNT),
	])

	return { name, success: 'Account updated successfully.' }
})

const removeTeamMemberSchema = z.object({
	memberId: z.number(),
})

export const removeTeamMember = validatedActionWithUser(removeTeamMemberSchema, async (data, _, user) => {
	const { memberId } = data
	const team = await getTeamForUser()

	if (!team) {
		return { error: 'You must be part of a team to remove members' }
	}

	await db.delete(teamMembers).where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, team.id)))

	await logActivity(team.id, user.id, ActivityType.REMOVE_TEAM_MEMBER)

	return { success: 'Team member removed successfully' }
})

const inviteTeamMemberSchema = z.object({
	email: z.string().email('Invalid email address'),
	role: z.enum(['member', 'owner']),
})

export const inviteTeamMember = validatedActionWithUser(inviteTeamMemberSchema, async (data, _, user) => {
	const { email, role } = data
	const team = await getTeamForUser()

	if (!team) {
		return { error: 'You must be part of a team to invite members' }
	}

	const existingMember = await db
		.select()
		.from(users)
		.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
		.where(and(eq(users.email, email), eq(teamMembers.teamId, team.id)))
		.limit(1)

	if (existingMember.length > 0) {
		return { error: 'User is already a member of this team' }
	}

	// Check if there's an existing invitation
	const existingInvitation = await db
		.select()
		.from(invitations)
		.where(and(eq(invitations.email, email), eq(invitations.teamId, team.id), eq(invitations.status, 'pending')))
		.limit(1)

	if (existingInvitation.length > 0) {
		return { error: 'An invitation has already been sent to this email' }
	}

	// Create a new invitation and get the inserted row
	const [invitation] = await db
		.insert(invitations)
		.values({
			teamId: team.id,
			email,
			role,
			invitedBy: user.id,
			status: 'pending',
		})
		.returning()

	await logActivity(team.id, user.id, ActivityType.INVITE_TEAM_MEMBER)

	// Fetch the team name for the email
	const teamName = team.name

	// Send invitation email
	if (invitation) {
		const invitationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/accept-invitation?inviteId=${
			invitation.id
		}`
		await sendEmail({
			to: email,
			subject: `You're invited to join ${teamName} on Very Good SaaS!`,
			html: `<p>Hello,</p><p>You have been invited to join <b>${teamName}</b> as a <b>${role}</b> on Very Good SaaS.</p><p><a href="${invitationUrl}">Click here to accept your invitation</a>.</p><p>If you did not expect this invitation, you can ignore this email.</p>`,
		})
	}

	return { success: 'Invitation sent successfully' }
})

const deleteInvitationSchema = z.object({
	invitationId: z.coerce.number(),
})

export const deleteInvitationAction = validatedActionWithUser(deleteInvitationSchema, async (data, _, user) => {
	const { invitationId } = data
	const team = await getTeamForUser()

	if (!team) {
		return { error: 'You must be part of a team to delete invitations' }
	}

	// Verify the invitation belongs to the current team
	const [invitation] = await db
		.select()
		.from(invitations)
		.where(and(eq(invitations.id, invitationId), eq(invitations.teamId, team.id)))
		.limit(1)

	if (!invitation) {
		return { error: 'Invitation not found or access denied' }
	}

	const success = await deleteInvitation(invitationId)

	if (!success) {
		return { error: 'Failed to delete invitation. It may have already been accepted or does not exist.' }
	}

	await logActivity(team.id, user.id, ActivityType.DELETE_INVITATION)

	return { success: 'Invitation deleted successfully' }
})

const requestPasswordResetSchema = z.object({
	email: z.string().email(),
})

export const requestPasswordReset = validatedAction(requestPasswordResetSchema, async data => {
	const { email } = data
	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
	if (!user) {
		return { success: 'If an account exists, a reset link has been sent.' }
	}
	const token = crypto.randomBytes(32).toString('hex')
	const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
	await db.insert(passwordResetTokens).values({
		userId: user.id,
		token,
		expiresAt,
	})
	const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`
	const html = `<p>To reset your password, click <a href="${resetLink}">here</a>.</p>`
	await sendEmail({ to: email, subject: 'Password Reset', html })
	return { success: 'If an account exists, a reset link has been sent.' }
})
const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(8),
	confirmPassword: z.string().min(8),
})

export const resetPassword = validatedAction(resetPasswordSchema, async data => {
	const { token, password, confirmPassword } = data
	if (password !== confirmPassword) {
		return { error: 'Passwords do not match' }
	}
	const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1)
	if (!resetToken || resetToken.expiresAt < new Date()) {
		return { error: 'Invalid or expired reset token' }
	}
	const passwordHash = await hashPassword(password)
	await db.transaction(async tx => {
		await tx.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId))
		await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))
	})
	return { success: 'Password reset successfully. You can now log in.' }
})

const acceptInvitationSchema = z.object({
	inviteId: z.string(),
})

export const acceptInvitation = validatedActionWithUser(acceptInvitationSchema, async (data, _, user) => {
	const { inviteId } = data

	// Get the invitation
	const [invitation] = await db
		.select()
		.from(invitations)
		.where(
			and(eq(invitations.id, parseInt(inviteId)), eq(invitations.email, user.email), eq(invitations.status, 'pending'))
		)
		.limit(1)

	if (!invitation) {
		return { error: 'Invalid or expired invitation.' }
	}

	// Check if user is already a member of this team
	const existingMembership = await db
		.select()
		.from(teamMembers)
		.where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, invitation.teamId)))
		.limit(1)

	if (existingMembership.length > 0) {
		// Update invitation status but don't add duplicate membership
		await db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitation.id))

		// Set session to this team and redirect
		await setSession(user, invitation.teamId)
		await logActivity(invitation.teamId, user.id, ActivityType.ACCEPT_INVITATION)
		return { success: 'Invitation accepted. You are now switched to this organization.', teamId: invitation.teamId }
	}

	// Add user as team member
	const newTeamMember: NewTeamMember = {
		userId: user.id,
		teamId: invitation.teamId,
		role: invitation.role,
	}

	await Promise.all([
		db.insert(teamMembers).values(newTeamMember),
		db.update(invitations).set({ status: 'accepted' }).where(eq(invitations.id, invitation.id)),
		setSession(user, invitation.teamId),
		logActivity(invitation.teamId, user.id, ActivityType.ACCEPT_INVITATION),
	])

	return {
		success: 'Invitation accepted successfully! You are now a member of this organization.',
		teamId: invitation.teamId,
	}
})
