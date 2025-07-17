import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { leads } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'
import { getSession } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'

// List all leads for the current team
export async function GET() {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const allLeads = await db.select().from(leads).where(eq(leads.teamId, teamId))
	return NextResponse.json(allLeads)
}

// Create a new lead
export async function POST(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const body = await request.json()
	const { businessName, firstContactDate, decisionMakerName, decisionMakerPhone, medium } = body
	if (!businessName || !firstContactDate || !decisionMakerName) {
		return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
	}
	const [newLead] = await db
		.insert(leads)
		.values({
			businessName,
			firstContactDate: new Date(firstContactDate),
			decisionMakerName,
			decisionMakerPhone,
			medium,
			teamId,
			completed: 0,
		})
		.returning()
	return NextResponse.json(newLead)
}

// Update a lead
export async function PATCH(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const body = await request.json()
	const { id, businessName, firstContactDate, decisionMakerName, decisionMakerPhone, medium, completed } = body
	if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 })
	const [updatedLead] = await db
		.update(leads)
		.set({
			businessName,
			firstContactDate: new Date(firstContactDate),
			decisionMakerName,
			decisionMakerPhone,
			medium,
			completed,
		})
		.where(and(eq(leads.id, id), eq(leads.teamId, teamId)))
		.returning()
	return NextResponse.json(updatedLead)
}

// Delete a lead
export async function DELETE(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const { id } = await request.json()
	if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 })
	await db.delete(leads).where(and(eq(leads.id, id), eq(leads.teamId, teamId)))
	return NextResponse.json({ success: true })
}
