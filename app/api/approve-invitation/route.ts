import { approveInvitation } from '@/lib/db/queries'

export async function POST(req: Request) {
	const { invitationId } = await req.json()
	const success = await approveInvitation(Number(invitationId))
	return Response.json({ success })
}
