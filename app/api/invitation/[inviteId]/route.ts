import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { invitations, teams } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
	const { inviteId: inviteIdParam } = await params
	const inviteId = parseInt(inviteIdParam)

	if (isNaN(inviteId)) {
		return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 })
	}

	try {
		// Get invitation with team details
		const [invitation] = await db
			.select({
				id: invitations.id,
				teamId: invitations.teamId,
				email: invitations.email,
				role: invitations.role,
				status: invitations.status,
				teamName: teams.name,
			})
			.from(invitations)
			.leftJoin(teams, eq(invitations.teamId, teams.id))
			.where(and(eq(invitations.id, inviteId), eq(invitations.status, 'pending')))
			.limit(1)

		if (!invitation) {
			return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 })
		}

		return NextResponse.json(invitation)
	} catch (error) {
		console.error('Error fetching invitation:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
