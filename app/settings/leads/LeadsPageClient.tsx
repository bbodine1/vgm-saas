'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import useSWR from 'swr'
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Plus, Edit, Trash2, Loader2, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

function DraggableRow({ id, children }: { id: number; children: (props: { listeners: any }) => React.ReactNode }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
	return (
		<tr
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				background: isDragging ? '#f3f4f6' : undefined,
			}}
			{...attributes}
			className={isDragging ? 'opacity-70' : ''}
		>
			{children({ listeners })}
		</tr>
	)
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

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
	const [draggedSources, setDraggedSources] = useState<LeadSource[] | null>(null)

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

	const handleDragEnd = async (event: any) => {
		const { active, over } = event
		if (!active || !over || active.id === over.id) return
		const oldIndex = leadSources.findIndex(ls => ls.id === active.id)
		const newIndex = leadSources.findIndex(ls => ls.id === over.id)
		if (oldIndex === -1 || newIndex === -1) return
		const newOrder = arrayMove(leadSources, oldIndex, newIndex)
		setDraggedSources(newOrder)
		// Prepare order update payload
		const orderPayload = newOrder.map((ls, idx) => ({ id: ls.id, order: idx + 1 }))
		setLoading(true)
		await fetch('/api/lead-sources', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderPayload),
		})
		await mutate()
		setDraggedSources(null)
		setLoading(false)
	}

	return (
		<section className="flex-1 p-4 lg:p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-lg lg:text-2xl font-medium text-gray-900">Lead Management</h1>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Lead Sources Card */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
						<CardTitle className="text-lg font-medium">Lead Sources</CardTitle>
						<Dialog
							open={dialogOpen}
							onOpenChange={setDialogOpen}
						>
							<DialogTrigger asChild>
								<Button
									size="sm"
									className="bg-orange-500 hover:bg-orange-600 text-white"
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Source
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add New Lead Source</DialogTitle>
									<DialogDescription>
										Create a new lead source to categorize where your leads come from.
									</DialogDescription>
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
					</CardHeader>
					<CardContent>
						{leadSources.length > 0 ? (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={leadSources.map(ls => ls.id)}
									strategy={verticalListSortingStrategy}
								>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead></TableHead>
												<TableHead>Name</TableHead>
												<TableHead className="w-[100px]">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(draggedSources || leadSources).map(leadSource => (
												<DraggableRow
													key={`${leadSource.id}-${leadSource.name}`}
													id={leadSource.id}
												>
													{({ listeners }: { listeners: any }) => (
														<>
															<TableCell
																className="cursor-grab"
																{...listeners}
															>
																<GripVertical className="h-4 w-4" />
															</TableCell>
															<TableCell className="font-medium">{leadSource.name}</TableCell>
															<TableCell>
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
															</TableCell>
														</>
													)}
												</DraggableRow>
											))}
										</TableBody>
									</Table>
								</SortableContext>
							</DndContext>
						) : (
							<div className="text-center py-8">
								<p className="text-muted-foreground">No lead sources found. Add your first one to get started.</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Empty Card 1 */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg font-medium">Coming Soon</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-center py-8">
							<p className="text-muted-foreground">Additional lead management features coming soon.</p>
						</div>
					</CardContent>
				</Card>

				{/* Empty Card 2 */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg font-medium">Coming Soon</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-center py-8">
							<p className="text-muted-foreground">Additional lead management features coming soon.</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Lead Source</DialogTitle>
						<DialogDescription>Update the name of this lead source.</DialogDescription>
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
