import { Suspense } from 'react'
import { Login } from '../login'
import Link from 'next/link'

export default function SignInPage() {
	return (
		<Suspense>
			<Login mode="signin" />
			<Link
				href="/forgot-password"
				className="text-sm text-orange-600 hover:underline"
			>
				Forgot password?
			</Link>
		</Suspense>
	)
}
