import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { serviceInterests } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const teamId = searchParams.get('teamId')

		if (!teamId) {
			return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
		}

		const interests = await db
			.select()
			.from(serviceInterests)
			.where(eq(serviceInterests.teamId, parseInt(teamId)))
			.orderBy(serviceInterests.order)

		return NextResponse.json(interests)
	} catch (error) {
		console.error('Error fetching service interests:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { name, teamId } = body

		if (!name || !teamId) {
			return NextResponse.json({ error: 'Name and team ID are required' }, { status: 400 })
		}

		// Get the highest order value for this team
		const maxOrderResult = await db
			.select({ maxOrder: serviceInterests.order })
			.from(serviceInterests)
			.where(eq(serviceInterests.teamId, teamId))
			.orderBy(serviceInterests.order)
			.limit(1)

		const newOrder = maxOrderResult.length > 0 ? maxOrderResult[0].maxOrder + 1 : 1

		const newInterest = await db
			.insert(serviceInterests)
			.values({
				name,
				teamId,
				order: newOrder,
			})
			.returning()

		return NextResponse.json(newInterest[0])
	} catch (error) {
		console.error('Error creating service interest:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()

		// Handle single update (edit)
		if (body.id && body.name) {
			const updatedInterest = await db
				.update(serviceInterests)
				.set({
					name: body.name,
					updatedAt: new Date(),
				})
				.where(eq(serviceInterests.id, body.id))
				.returning()

			return NextResponse.json(updatedInterest[0])
		}

		// Handle bulk order update
		if (Array.isArray(body)) {
			for (const item of body) {
				await db
					.update(serviceInterests)
					.set({
						order: item.order,
						updatedAt: new Date(),
					})
					.where(eq(serviceInterests.id, item.id))
			}

			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
	} catch (error) {
		console.error('Error updating service interest:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { id } = body

		if (!id) {
			return NextResponse.json({ error: 'ID is required' }, { status: 400 })
		}

		await db.delete(serviceInterests).where(eq(serviceInterests.id, id))

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting service interest:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
