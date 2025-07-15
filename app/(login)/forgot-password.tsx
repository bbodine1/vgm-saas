'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CircleIcon, Loader2 } from 'lucide-react'
import { requestPasswordReset } from './actions'
import { ActionState } from '@/lib/auth/middleware'

export default function ForgotPassword() {
	const [state, formAction, pending] = useActionState<ActionState, FormData>(requestPasswordReset, {
		error: '',
		success: '',
	})

	return (
		<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex justify-center">
					<CircleIcon className="h-12 w-12 text-orange-500" />
				</div>
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<form
					className="space-y-6"
					action={formAction}
				>
					<div>
						<Label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700"
						>
							Email
						</Label>
						<div className="mt-1">
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								maxLength={50}
								className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
								placeholder="Enter your email"
							/>
						</div>
					</div>

					{state?.error && <div className="text-red-500 text-sm">{state.error}</div>}
					{state?.success && <div className="text-green-500 text-sm">{state.success}</div>}

					<div>
						<Button
							type="submit"
							className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
							disabled={pending}
						>
							{pending ? (
								<>
									<Loader2 className="animate-spin mr-2 h-4 w-4" />
									Sending...
								</>
							) : (
								'Send reset link'
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
