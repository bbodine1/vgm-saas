'use client'

import { useState, useEffect } from 'react'
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
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { TeamDataWithMembers, LeadSource, ServiceInterest, LeadStatus } from '@/lib/db/schema'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type LeadsPageClientProps = {
	team: TeamDataWithMembers
	leadSources: LeadSource[]
	serviceInterests: ServiceInterest[]
	leadStatuses: LeadStatus[]
}

// Client-only drag and drop wrapper
function DragDropWrapper({ children }: { children: React.ReactNode }) {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return <div className="animate-pulse">Loading...</div>
	}

	return <>{children}</>
}

export default function LeadsPageClient({
	team,
	leadSources: initialLeadSources,
	serviceInterests: initialServiceInterests,
	leadStatuses: initialLeadStatuses,
}: LeadsPageClientProps) {
	const [isClient, setIsClient] = useState(false)
	const [dndKit, setDndKit] = useState<any>(null)

	useEffect(() => {
		setIsClient(true)
		// Dynamic import of all drag and drop functionality
		Promise.all([import('@dnd-kit/core'), import('@dnd-kit/sortable'), import('@dnd-kit/utilities')]).then(
			([core, sortable, utilities]) => {
				setDndKit({ core, sortable, utilities })
			}
		)
	}, [])

	const { data: leadSources = initialLeadSources, mutate: mutateLeadSources } = useSWR<LeadSource[]>(
		`/api/lead-sources?teamId=${team.id}`,
		fetcher,
		{ fallbackData: initialLeadSources }
	)
	const { data: serviceInterests = initialServiceInterests, mutate: mutateServiceInterests } = useSWR<
		ServiceInterest[]
	>(`/api/service-interests?teamId=${team.id}`, fetcher, { fallbackData: initialServiceInterests })
	const { data: leadStatuses = initialLeadStatuses, mutate: mutateLeadStatuses } = useSWR<LeadStatus[]>(
		`/api/lead-statuses?teamId=${team.id}`,
		fetcher,
		{ fallbackData: initialLeadStatuses }
	)
	const [form, setForm] = useState({ name: '' })
	const [editForm, setEditForm] = useState<{ id: number; name: string } | null>(null)
	const [serviceForm, setServiceForm] = useState({ name: '' })
	const [editServiceForm, setEditServiceForm] = useState<{ id: number; name: string } | null>(null)
	const [statusForm, setStatusForm] = useState({ name: '' })
	const [editStatusForm, setEditStatusForm] = useState<{ id: number; name: string } | null>(null)
	const [loading, setLoading] = useState(false)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
	const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false)
	const [statusDialogOpen, setStatusDialogOpen] = useState(false)
	const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false)

	const [draggedSources, setDraggedSources] = useState<LeadSource[] | null>(null)
	const [draggedServices, setDraggedServices] = useState<ServiceInterest[] | null>(null)
	const [draggedStatuses, setDraggedStatuses] = useState<LeadStatus[] | null>(null)

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
			await mutateLeadSources()
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
			await mutateLeadSources()
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
		await mutateLeadSources()
		setLoading(false)
	}

	const handleDragEnd = async (event: any) => {
		if (!dndKit) return
		const { arrayMove } = dndKit.sortable
		const { active, over } = event
		if (!active || !over || active.id === over.id) return
		const oldIndex = leadSources.findIndex((ls: LeadSource) => ls.id === active.id)
		const newIndex = leadSources.findIndex((ls: LeadSource) => ls.id === over.id)
		if (oldIndex === -1 || newIndex === -1) return
		const newOrder = arrayMove(leadSources, oldIndex, newIndex)
		setDraggedSources(newOrder)
		// Prepare order update payload
		const orderPayload = newOrder.map((ls: LeadSource, idx: number) => ({ id: ls.id, order: idx + 1 }))
		setLoading(true)
		await fetch('/api/lead-sources', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderPayload),
		})
		await mutateLeadSources()
		setDraggedSources(null)
		setLoading(false)
	}

	const handleServiceDragEnd = async (event: any) => {
		if (!dndKit) return
		const { arrayMove } = dndKit.sortable
		const { active, over } = event
		if (!active || !over || active.id === over.id) return
		const oldIndex = serviceInterests.findIndex((si: ServiceInterest) => si.id === active.id)
		const newIndex = serviceInterests.findIndex((si: ServiceInterest) => si.id === over.id)
		if (oldIndex === -1 || newIndex === -1) return
		const newOrder = arrayMove(serviceInterests, oldIndex, newIndex)
		setDraggedServices(newOrder)
		// Prepare order update payload
		const orderPayload = newOrder.map((si: ServiceInterest, idx: number) => ({ id: si.id, order: idx + 1 }))
		setLoading(true)
		await fetch('/api/service-interests', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderPayload),
		})
		await mutateServiceInterests()
		setDraggedServices(null)
		setLoading(false)
	}

	const handleStatusDragEnd = async (event: any) => {
		if (!dndKit) return
		const { arrayMove } = dndKit.sortable
		const { active, over } = event
		if (!active || !over || active.id === over.id) return
		const oldIndex = leadStatuses.findIndex((ls: LeadStatus) => ls.id === active.id)
		const newIndex = leadStatuses.findIndex((ls: LeadStatus) => ls.id === over.id)
		if (oldIndex === -1 || newIndex === -1) return
		const newOrder = arrayMove(leadStatuses, oldIndex, newIndex)
		setDraggedStatuses(newOrder)
		// Prepare order update payload
		const orderPayload = newOrder.map((ls: LeadStatus, idx: number) => ({ id: ls.id, order: idx + 1 }))
		setLoading(true)
		await fetch('/api/lead-statuses', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderPayload),
		})
		await mutateLeadStatuses()
		setDraggedStatuses(null)
		setLoading(false)
	}

	// Service Interest handlers
	const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setServiceForm({ ...serviceForm, [e.target.name]: e.target.value })
	}

	const handleServiceEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (editServiceForm) setEditServiceForm({ ...editServiceForm, [e.target.name]: e.target.value })
	}

	const handleServiceSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const res = await fetch('/api/service-interests', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...serviceForm, teamId: team.id }),
		})
		if (res.ok) {
			await mutateServiceInterests()
			setServiceForm({ name: '' })
			setServiceDialogOpen(false)
		}
		setLoading(false)
	}

	const handleServiceEdit = (serviceInterest: ServiceInterest) => {
		setEditServiceForm({ id: serviceInterest.id, name: serviceInterest.name })
		setEditServiceDialogOpen(true)
	}

	const handleServiceEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editServiceForm) return
		setLoading(true)
		const res = await fetch('/api/service-interests', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editServiceForm),
		})
		if (res.ok) {
			await mutateServiceInterests()
			setEditServiceForm(null)
			setEditServiceDialogOpen(false)
		}
		setLoading(false)
	}

	const handleServiceDelete = async (id: number) => {
		if (!confirm('Delete this service interest?')) return
		setLoading(true)
		await fetch('/api/service-interests', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id }),
		})
		await mutateServiceInterests()
		setLoading(false)
	}

	// Lead Status handlers
	const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setStatusForm({ ...statusForm, [e.target.name]: e.target.value })
	}

	const handleStatusEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (editStatusForm) setEditStatusForm({ ...editStatusForm, [e.target.name]: e.target.value })
	}

	const handleStatusSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const res = await fetch('/api/lead-statuses', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...statusForm, teamId: team.id }),
		})
		if (res.ok) {
			await mutateLeadStatuses()
			setStatusForm({ name: '' })
			setStatusDialogOpen(false)
		}
		setLoading(false)
	}

	const handleStatusEdit = (leadStatus: LeadStatus) => {
		setEditStatusForm({ id: leadStatus.id, name: leadStatus.name })
		setEditStatusDialogOpen(true)
	}

	const handleStatusEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editStatusForm) return
		setLoading(true)
		const res = await fetch('/api/lead-statuses', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editStatusForm),
		})
		if (res.ok) {
			await mutateLeadStatuses()
			setEditStatusForm(null)
			setEditStatusDialogOpen(false)
		}
		setLoading(false)
	}

	const handleStatusDelete = async (id: number) => {
		if (!confirm('Delete this lead status?')) return
		setLoading(true)
		await fetch('/api/lead-statuses', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id }),
		})
		await mutateLeadStatuses()
		setLoading(false)
	}

	// Separate component for drag and drop table to avoid hook order issues
	const DragDropTable = ({
		items,
		onDragEnd,
		draggedItems,
		renderRow,
	}: {
		items: any[]
		onDragEnd: (event: any) => void
		draggedItems: any[] | null
		renderRow: (item: any, listeners: any) => React.ReactNode
	}) => {
		if (!isClient || !dndKit) {
			// Fallback to regular table
			return (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map(item => (
							<TableRow key={item.id}>
								<TableCell className="font-medium">{item.name}</TableCell>
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
											<DropdownMenuItem disabled={loading}>
												<Edit className="h-4 w-4 mr-2" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem disabled={loading}>
												<Trash2 className="h-4 w-4 mr-2" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)
		}

		const { DndContext, closestCenter, PointerSensor, useSensor, useSensors } = dndKit.core
		const { SortableContext, verticalListSortingStrategy, useSortable } = dndKit.sortable
		const { CSS } = dndKit.utilities

		const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

		// DraggableRow component
		const DraggableRow = ({
			id,
			children,
		}: {
			id: number
			children: (props: { listeners: any }) => React.ReactNode
		}) => {
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

		return (
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={onDragEnd}
			>
				<SortableContext
					items={items.map(item => item.id)}
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
							{(draggedItems || items).map(item => (
								<DraggableRow
									key={`${item.id}-${item.name}`}
									id={item.id}
								>
									{({ listeners }) => renderRow(item, listeners)}
								</DraggableRow>
							))}
						</TableBody>
					</Table>
				</SortableContext>
			</DndContext>
		)
	}

	return (
		<DragDropWrapper>
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
								<DragDropTable
									items={leadSources}
									onDragEnd={handleDragEnd}
									draggedItems={draggedSources}
									renderRow={(leadSource: LeadSource, listeners: any) => (
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
								/>
							) : (
								<div className="text-center py-8">
									<p className="text-muted-foreground">No lead sources found. Add your first one to get started.</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Service Interests Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
							<CardTitle className="text-lg font-medium">Service Interests</CardTitle>
							<Dialog
								open={serviceDialogOpen}
								onOpenChange={setServiceDialogOpen}
							>
								<DialogTrigger asChild>
									<Button
										size="sm"
										className="bg-blue-500 hover:bg-blue-600 text-white"
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Service
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add New Service Interest</DialogTitle>
										<DialogDescription>
											Create a new service interest to categorize what services your leads are interested in.
										</DialogDescription>
									</DialogHeader>
									<form
										onSubmit={handleServiceSubmit}
										className="space-y-4"
									>
										<div>
											<Label htmlFor="service-name">Name</Label>
											<Input
												name="name"
												id="service-name"
												value={serviceForm.name}
												onChange={handleServiceChange}
												required
												placeholder="e.g., Web Development"
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
												className="bg-blue-500 hover:bg-blue-600 text-white"
											>
												{loading ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Adding...
													</>
												) : (
													'Add Service Interest'
												)}
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>
						</CardHeader>
						<CardContent>
							{serviceInterests.length > 0 ? (
								<DragDropTable
									items={serviceInterests}
									onDragEnd={handleServiceDragEnd}
									draggedItems={draggedServices}
									renderRow={(serviceInterest: ServiceInterest, listeners: any) => (
										<>
											<TableCell
												className="cursor-grab"
												{...listeners}
											>
												<GripVertical className="h-4 w-4" />
											</TableCell>
											<TableCell className="font-medium">{serviceInterest.name}</TableCell>
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
															onClick={() => handleServiceEdit(serviceInterest)}
															disabled={loading}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleServiceDelete(serviceInterest.id)}
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
								/>
							) : (
								<div className="text-center py-8">
									<p className="text-muted-foreground">
										No service interests found. Add your first one to get started.
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Lead Statuses Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
							<CardTitle className="text-lg font-medium">Lead Statuses</CardTitle>
							<Dialog
								open={statusDialogOpen}
								onOpenChange={setStatusDialogOpen}
							>
								<DialogTrigger asChild>
									<Button
										size="sm"
										className="bg-green-500 hover:bg-green-600 text-white"
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Status
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add New Lead Status</DialogTitle>
										<DialogDescription>Create a new lead status to track the progress of your leads.</DialogDescription>
									</DialogHeader>
									<form
										onSubmit={handleStatusSubmit}
										className="space-y-4"
									>
										<div>
											<Label htmlFor="status-name">Name</Label>
											<Input
												name="name"
												id="status-name"
												value={statusForm.name}
												onChange={handleStatusChange}
												required
												placeholder="e.g., Qualified"
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
												className="bg-green-500 hover:bg-green-600 text-white"
											>
												{loading ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Adding...
													</>
												) : (
													'Add Lead Status'
												)}
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>
						</CardHeader>
						<CardContent>
							{leadStatuses.length > 0 ? (
								<DragDropTable
									items={leadStatuses}
									onDragEnd={handleStatusDragEnd}
									draggedItems={draggedStatuses}
									renderRow={(leadStatus: LeadStatus, listeners: any) => (
										<>
											<TableCell
												className="cursor-grab"
												{...listeners}
											>
												<GripVertical className="h-4 w-4" />
											</TableCell>
											<TableCell className="font-medium">{leadStatus.name}</TableCell>
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
															onClick={() => handleStatusEdit(leadStatus)}
															disabled={loading}
														>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleStatusDelete(leadStatus.id)}
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
								/>
							) : (
								<div className="text-center py-8">
									<p className="text-muted-foreground">No lead statuses found. Add your first one to get started.</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Empty Card */}
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

				<Dialog
					open={editServiceDialogOpen}
					onOpenChange={setEditServiceDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Service Interest</DialogTitle>
							<DialogDescription>Update the name of this service interest.</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={handleServiceEditSubmit}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="edit-service-name">Name</Label>
								<Input
									name="name"
									id="edit-service-name"
									value={editServiceForm?.name || ''}
									onChange={handleServiceEditChange}
									required
									placeholder="e.g., Web Development"
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setEditServiceDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={loading}
									className="bg-blue-500 hover:bg-blue-600 text-white"
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

				<Dialog
					open={editStatusDialogOpen}
					onOpenChange={setEditStatusDialogOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Lead Status</DialogTitle>
							<DialogDescription>Update the name of this lead status.</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={handleStatusEditSubmit}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="edit-status-name">Name</Label>
								<Input
									name="name"
									id="edit-status-name"
									value={editStatusForm?.name || ''}
									onChange={handleStatusEditChange}
									required
									placeholder="e.g., Qualified"
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setEditStatusDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={loading}
									className="bg-green-500 hover:bg-green-600 text-white"
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
		</DragDropWrapper>
	)
}
