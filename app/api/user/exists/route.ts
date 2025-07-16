import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const email = searchParams.get('email')

	if (!email) {
		return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
	}

	try {
		const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)

		return NextResponse.json({ exists: !!user })
	} catch (error) {
		console.error('Error checking user existence:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
