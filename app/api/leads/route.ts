import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { leads } from '@/lib/db/schema'
import { getUser } from '@/lib/db/queries'
import { getSession } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'

// List all leads for the current team
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

		console.log('Fetching leads for teamId:', teamId)
		const allLeads = await db.select().from(leads).where(eq(leads.teamId, teamId))
		console.log('Leads fetched:', allLeads.length)
		return NextResponse.json(allLeads)
	} catch (error) {
		console.error('Error in /api/leads GET:', error)
		return NextResponse.json({ error: 'Database error' }, { status: 500 })
	}
}

// Create a new lead
export async function POST(request: NextRequest) {
	const user = await getUser()
	if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	const session = await getSession()
	const teamId = session?.activeTeamId
	if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
	const body = await request.json()
	const {
		leadSource,
		dateReceived,
		contactName,
		emailAddress,
		phoneNumber,
		serviceInterest,
		leadStatus,
		potentialValue,
		followUpDate,
		notes,
	} = body
	if (!contactName || !dateReceived) {
		return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
	}
	const [newLead] = await db
		.insert(leads)
		.values({
			leadSource,
			dateReceived: new Date(dateReceived),
			contactName,
			emailAddress,
			phoneNumber,
			serviceInterest,
			leadStatus: leadStatus || 'New',
			potentialValue: potentialValue ? Number(potentialValue) : null,
			followUpDate: followUpDate ? new Date(followUpDate) : null,
			notes,
			teamId,
		})
		.returning()
	return NextResponse.json(newLead)
}

// Update a lead
export async function PATCH(request: NextRequest) {
	try {
		const user = await getUser()
		if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
		const session = await getSession()
		const teamId = session?.activeTeamId
		if (!teamId) return NextResponse.json({ error: 'No active team' }, { status: 400 })
		const body = await request.json()
		console.log('PATCH request body:', body)

		const {
			id,
			leadSource: editLeadSource,
			dateReceived: editDateReceived,
			contactName: editContactName,
			emailAddress: editEmailAddress,
			phoneNumber: editPhoneNumber,
			serviceInterest: editServiceInterest,
			leadStatus: editLeadStatus,
			potentialValue: editPotentialValue,
			followUpDate: editFollowUpDate,
			notes: editNotes,
		} = body

		if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 })

		// Prepare update object, handling empty strings properly
		const updateData: any = {
			dateReceived: editDateReceived ? new Date(editDateReceived) : undefined,
			contactName: editContactName,
			leadStatus: editLeadStatus,
			potentialValue: editPotentialValue ? Number(editPotentialValue) : null,
			followUpDate: editFollowUpDate ? new Date(editFollowUpDate) : null,
		}

		// Handle optional fields that can be empty strings
		if (editLeadSource !== undefined) updateData.leadSource = editLeadSource || null
		if (editEmailAddress !== undefined) updateData.emailAddress = editEmailAddress || null
		if (editPhoneNumber !== undefined) updateData.phoneNumber = editPhoneNumber || null
		if (editServiceInterest !== undefined) updateData.serviceInterest = editServiceInterest || null
		if (editNotes !== undefined) updateData.notes = editNotes || null

		console.log('Update data:', updateData)

		const [updatedLead] = await db
			.update(leads)
			.set(updateData)
			.where(and(eq(leads.id, id), eq(leads.teamId, teamId)))
			.returning()

		console.log('Updated lead:', updatedLead)
		return NextResponse.json(updatedLead)
	} catch (error) {
		console.error('Error in PATCH /api/leads:', error)
		return NextResponse.json({ error: 'Database error' }, { status: 500 })
	}
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
