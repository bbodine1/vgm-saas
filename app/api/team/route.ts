import { getTeamForUser, getAllTeamsForUser } from '@/lib/db/queries'

export async function GET() {
	const teams = await getAllTeamsForUser()
	return Response.json(teams)
}
