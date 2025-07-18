'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useSWR from 'swr'
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { TeamDataWithMembers, LeadSource } from '@/lib/db/schema'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type LeadsPageClientProps = {
	team: TeamDataWithMembers
	leadSources: LeadSource[]
}

export default function LeadsPageClient({ team, leadSources: initialLeadSources }: LeadsPageClientProps) {
	const { data: leadSources = initialLeadSources, mutate } = useSWR<LeadSource[]>(
		`/api/lead-sources?teamId=${team.id}`,
		fetcher,
		{ fallbackData: initialLeadSources }
	)
	const [form, setForm] = useState({ name: '' })
	const [editForm, setEditForm] = useState<{ id: number; name: string } | null>(null)
	const [loading, setLoading] = useState(false)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editDialogOpen, setEditDialogOpen] = useState(false)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (editForm) setEditForm({ ...editForm, [e.target.name]: e.target.value })
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const res = await fetch('/api/lead-sources', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		if (res.ok) {
			await mutate()
			setForm({ name: '' })
			setDialogOpen(false)
		}
		setLoading(false)
	}

	const handleEdit = (leadSource: LeadSource) => {
		setEditForm({ id: leadSource.id, name: leadSource.name })
		setEditDialogOpen(true)
	}

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editForm) return
		setLoading(true)
		const res = await fetch('/api/lead-sources', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editForm),
		})
		if (res.ok) {
			await mutate()
			setEditForm(null)
			setEditDialogOpen(false)
		}
		setLoading(false)
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Delete this lead source?')) return
		setLoading(true)
		await fetch('/api/lead-sources', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id }),
		})
		await mutate()
		setLoading(false)
	}

	return (
		<section className="flex-1 p-4 lg:p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-lg lg:text-2xl font-medium text-gray-900">Lead Sources</h1>
				<Dialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
				>
					<DialogTrigger asChild>
						<Button className="bg-orange-500 hover:bg-orange-600 text-white">
							<Plus className="h-4 w-4 mr-2" />
							Add Lead Source
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Lead Source</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={handleSubmit}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="name">Name</Label>
								<Input
									name="name"
									id="name"
									value={form.name}
									onChange={handleChange}
									required
									placeholder="e.g., Website Form"
								/>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button
										type="button"
										variant="outline"
									>
										Cancel
									</Button>
								</DialogClose>
								<Button
									type="submit"
									disabled={loading}
									className="bg-orange-500 hover:bg-orange-600 text-white"
								>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Adding...
										</>
									) : (
										'Add Lead Source'
									)}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Manage Lead Sources</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{leadSources.map(leadSource => (
							<div
								key={leadSource.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div>
									<h3 className="font-medium">{leadSource.name}</h3>
									<p className="text-sm text-muted-foreground">
										Created {new Date(leadSource.createdAt).toLocaleDateString()}
									</p>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 w-8 p-0"
										>
											<span className="sr-only">Open menu</span>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Actions</DropdownMenuLabel>
										<DropdownMenuItem
											onClick={() => handleEdit(leadSource)}
											disabled={loading}
										>
											<Edit className="h-4 w-4 mr-2" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => handleDelete(leadSource.id)}
											disabled={loading}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
					</div>

					{leadSources.length === 0 && (
						<div className="text-center py-8">
							<p className="text-muted-foreground">No lead sources found. Add your first one to get started.</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Lead Source</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={handleEditSubmit}
						className="space-y-4"
					>
						<div>
							<Label htmlFor="edit-name">Name</Label>
							<Input
								name="name"
								id="edit-name"
								value={editForm?.name || ''}
								onChange={handleEditChange}
								required
								placeholder="e.g., Website Form"
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={loading}
								className="bg-orange-500 hover:bg-orange-600 text-white"
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									'Save Changes'
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	)
}
