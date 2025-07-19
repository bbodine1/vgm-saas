import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { leadSources } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'
import { getSession } from '@/lib/auth/session'
import { eq, and, asc, max, ne } from 'drizzle-orm'

// List all lead sources for the current team
export async function GET(request: NextRequest) {
	try {
		const user = await getUser()
		if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

		const { searchParams } = new URL(request.url)
		const teamIdParam = searchParams.get('teamId')
		let teamId = teamIdParam ? Number(teamIdParam) : null

		if (!teamId) {
			const session = await getSession()
			teamId = session?.activeTeamId ?? null
		}

		if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })

		const allLeadSources = await db
			.select()
			.from(leadSources)
			.where(eq(leadSources.teamId, teamId))
			.orderBy(asc(leadSources.order))
		return NextResponse.json(allLeadSources)
	} catch (error) {
		console.error('Error in /api/lead-sources GET:', error)
		return NextResponse.json({ error: 'Database error' }, { status: 500 })
	}
}

// Create a new lead source
export async function POST(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const body = await request.json()
	const { name } = body
	if (!name) {
		return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
	}

	// Check if lead source with this name already exists for this team
	const existing = await db
		.select()
		.from(leadSources)
		.where(and(eq(leadSources.teamId, teamId), eq(leadSources.name, name)))
		.limit(1)

	if (existing.length > 0) {
		return NextResponse.json({ error: 'A lead source with this name already exists' }, { status: 400 })
	}

	// Get the current max order for this team
	const [{ max: maxOrder }] = await db
		.select({ max: max(leadSources.order) })
		.from(leadSources)
		.where(eq(leadSources.teamId, teamId))
	const nextOrder = (maxOrder ?? 0) + 1
	const [newLeadSource] = await db
		.insert(leadSources)
		.values({
			name,
			teamId,
			order: nextOrder,
		})
		.returning()
	return NextResponse.json(newLeadSource)
}

// Update a lead source
export async function PATCH(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const body = await request.json()

	if (Array.isArray(body)) {
		// Bulk update order
		await Promise.all(
			body.map((item: { id: number; order: number }) =>
				db
					.update(leadSources)
					.set({ order: item.order })
					.where(and(eq(leadSources.id, item.id), eq(leadSources.teamId, teamId)))
			)
		)
		return NextResponse.json({ success: true })
	}

	const { id, name } = body
	if (!id) return NextResponse.json({ error: 'Missing lead source id' }, { status: 400 })

	// Check if lead source with this name already exists for this team (excluding current item)
	const existing = await db
		.select()
		.from(leadSources)
		.where(and(eq(leadSources.teamId, teamId), eq(leadSources.name, name), ne(leadSources.id, id)))
		.limit(1)

	if (existing.length > 0) {
		return NextResponse.json({ error: 'A lead source with this name already exists' }, { status: 400 })
	}

	const [updatedLeadSource] = await db
		.update(leadSources)
		.set({
			name,
		})
		.where(and(eq(leadSources.id, id), eq(leadSources.teamId, teamId)))
		.returning()
	return NextResponse.json(updatedLeadSource)
}

// Delete a lead source
export async function DELETE(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const { id } = await request.json()
	if (!id) return NextResponse.json({ error: 'Missing lead source id' }, { status: 400 })
	await db.delete(leadSources).where(and(eq(leadSources.id, id), eq(leadSources.teamId, teamId)))
	return NextResponse.json({ success: true })
}
