import { getUser } from '@/lib/db/queries'
import { db } from '@/lib/db/drizzle'
import { teamMembers, users } from '@/lib/db/schema'
import { setSession, getSession } from '@/lib/auth/session'
import { and, eq } from 'drizzle-orm'

export async function GET() {
	const user = await getUser()
	if (!user) {
		return Response.json(null)
	}

	// Get the session to include activeTeamId
	const session = await getSession()
	const userWithTeam = {
		...user,
		activeTeamId: session?.activeTeamId || null,
	}

	return Response.json(userWithTeam)
}

export async function POST(request: Request) {
	const { teamId } = await request.json()
	if (!teamId || typeof teamId !== 'number') {
		return Response.json({ error: 'Invalid teamId' }, { status: 400 })
	}

	// Get user from session
	const user = await getUser()
	if (!user) {
		return Response.json({ error: 'Not authenticated' }, { status: 401 })
	}

	// Check if user is super admin or admin
	const isSuperAdmin = user.role === 'super_admin'
	const isAdmin = user.role === 'admin'

	// Check if user is a member of the team
	let isMember = false
	if (!isSuperAdmin && !isAdmin) {
		const membership = await db
			.select()
			.from(teamMembers)
			.where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
		isMember = membership.length > 0
	}

	if (!isSuperAdmin && !isAdmin && !isMember) {
		return Response.json({ error: 'Not authorized for this team' }, { status: 403 })
	}

	// Update session with new activeTeamId
	await setSession(user, teamId)
	return Response.json({ success: true })
}
