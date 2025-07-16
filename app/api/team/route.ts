import { updateTeamName, getUser, getTeamForUser } from '@/lib/db/queries'

export async function GET() {
	const team = await getTeamForUser()
	return Response.json(team)
}

export async function PATCH(request: Request) {
	const user = await getUser()
	if (!user) {
		return Response.json({ error: 'Not authenticated' }, { status: 401 })
	}

	const team = await getTeamForUser()
	if (!team) {
		return Response.json({ error: 'No active organization found' }, { status: 404 })
	}

	// Only owners or super admins can update the org name
	const isSuperAdmin = user.role === 'super_admin'
	const isOwner = team.teamMembers?.some?.(m => m.userId === user.id && m.role === 'owner') || user.role === 'owner'
	if (!isSuperAdmin && !isOwner) {
		return Response.json({ error: 'Not authorized' }, { status: 403 })
	}

	const { name } = await request.json()
	if (!name || typeof name !== 'string' || name.length < 4 || name.length > 100) {
		return Response.json({ error: 'Organization name must be 4-100 characters.' }, { status: 400 })
	}

	try {
		await updateTeamName(team.id, name)
		return Response.json({ success: true })
	} catch (e: any) {
		return Response.json({ error: e.message || 'Failed to update organization name.' }, { status: 400 })
	}
}
