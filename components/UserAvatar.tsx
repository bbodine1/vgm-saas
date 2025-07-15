import { AvatarImage, AvatarFallback } from './ui/avatar'

export function UserAvatar({ user }: { user: { name?: string | null; email: string } }) {
	const fallback = user.name && user.name.length > 0 ? user.name[0].toUpperCase() : user.email[0].toUpperCase()
	return (
		<>
			<AvatarImage alt={user.name || ''} />
			<AvatarFallback>{fallback}</AvatarFallback>
		</>
	)
}
