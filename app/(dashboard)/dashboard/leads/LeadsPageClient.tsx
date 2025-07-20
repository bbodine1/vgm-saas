'use client'

import useSWR from 'swr'
import { useState, useContext } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PhoneInput } from '@/components/ui/phone-input'
import { TeamContext } from '@/lib/context/TeamContext'
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMemo } from 'react'
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Lead {
	id: number
	leadSource?: string
	dateReceived: string
	contactName: string
	emailAddress?: string
	phoneNumber?: string
	serviceInterest?: string
	leadStatus: string
	potentialValue?: number
	followUpDate?: string
	notes?: string
}

interface EditFormData {
	leadSource: string
	contactName: string
	emailAddress: string
	phoneNumber: string
	serviceInterest: string
	leadStatus: string
	potentialValue: string
	followUpDate: string
	notes: string
	dateReceived: string
}

interface LeadSource {
	id: number
	name: string
	order?: number
}

interface ServiceInterest {
	id: number
	name: string
	order?: number
}

interface LeadStatus {
	id: number
	name: string
	order?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LeadsPageClient() {
	const { teamId } = useContext(TeamContext)
	const {
		data: leads = [],
		mutate,
		isLoading: leadsLoading,
	} = useSWR<Lead[]>(teamId ? `/api/leads?teamId=${teamId}` : null, fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	})
	const { data: leadSources = [], isLoading: sourcesLoading } = useSWR<LeadSource[]>(
		teamId ? `/api/lead-sources?teamId=${teamId}` : null,
		fetcher,
		{ fallbackData: [] }
	)
	const { data: serviceInterests = [], isLoading: serviceInterestsLoading } = useSWR<ServiceInterest[]>(
		teamId ? `/api/service-interests?teamId=${teamId}` : null,
		fetcher,
		{ fallbackData: [] }
	)
	const { data: leadStatuses = [], isLoading: leadStatusesLoading } = useSWR<LeadStatus[]>(
		teamId ? `/api/lead-statuses?teamId=${teamId}` : null,
		fetcher,
		{ fallbackData: [] }
	)

	const [loading, setLoading] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [form, setForm] = useState({
		leadSource: '',
		dateReceived: format(new Date(), 'yyyy-MM-dd'),
		contactName: '',
		emailAddress: '',
		phoneNumber: '',
		serviceInterest: '',
		leadStatus: 'New',
		potentialValue: '',
		followUpDate: '',
		notes: '',
	})
	const [editForm, setEditForm] = useState<EditFormData | null>(null)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [sorting, setSorting] = useState<SortingState>([])
	const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)
	const [originalLead, setOriginalLead] = useState<Lead | null>(null)

	// Helper function to render sortable headers
	const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => {
		return (
			<div
				className="flex items-center gap-1 cursor-pointer select-none font-medium"
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				{children}
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className="h-4 w-4" />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className="h-4 w-4" />
				) : (
					<ArrowUpDown className="h-4 w-4" />
				)}
			</div>
		)
	}

	// Helper to get current page leads
	const columns = useMemo<ColumnDef<Lead>[]>(
		() => [
			{
				id: 'select',
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={value => row.toggleSelected(!!value)}
						aria-label="Select row"
						onClick={e => e.stopPropagation()}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: 'leadSource',
				header: ({ column }) => <SortableHeader column={column}>Lead Source</SortableHeader>,
				cell: ({ row }) => <div>{row.getValue('leadSource') || '-'}</div>,
			},
			{
				accessorKey: 'dateReceived',
				header: ({ column }) => <SortableHeader column={column}>Date Received</SortableHeader>,
				cell: ({ row }) => {
					const date = row.getValue('dateReceived') as string
					return <div>{date ? format(new Date(date), 'MMM dd, yyyy') : '-'}</div>
				},
			},
			{
				accessorKey: 'contactName',
				header: ({ column }) => <SortableHeader column={column}>Contact Name</SortableHeader>,
				cell: ({ row }) => <div className="font-medium">{row.getValue('contactName')}</div>,
			},
			{
				accessorKey: 'emailAddress',
				header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
				cell: ({ row }) => <div>{row.getValue('emailAddress') || '-'}</div>,
			},
			{
				accessorKey: 'phoneNumber',
				header: ({ column }) => <SortableHeader column={column}>Phone</SortableHeader>,
				cell: ({ row }) => <div>{row.getValue('phoneNumber') || '-'}</div>,
			},
			{
				accessorKey: 'serviceInterest',
				header: ({ column }) => <SortableHeader column={column}>Service Interest</SortableHeader>,
				cell: ({ row }) => <div>{row.getValue('serviceInterest') || '-'}</div>,
			},
			{
				accessorKey: 'leadStatus',
				header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
				cell: ({ row }) => <div>{row.getValue('leadStatus')}</div>,
			},
			{
				accessorKey: 'potentialValue',
				header: ({ column }) => <SortableHeader column={column}>Potential Value</SortableHeader>,
				cell: ({ row }) => {
					const value = row.getValue('potentialValue') as number
					return <div>{value ? `$${value.toLocaleString()}` : '-'}</div>
				},
			},
			{
				accessorKey: 'followUpDate',
				header: ({ column }) => <SortableHeader column={column}>Follow Up Date</SortableHeader>,
				cell: ({ row }) => {
					const date = row.getValue('followUpDate') as string
					return <div>{date ? format(new Date(date), 'MMM dd, yyyy') : '-'}</div>
				},
			},
			{
				id: 'actions',
				enableHiding: false,
				cell: ({ row }) => {
					const lead = row.original

					return (
						<div onClick={e => e.stopPropagation()}>
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
										onClick={() => handleEdit(lead)}
										disabled={loading}
									>
										Edit
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleDelete(lead.id)}
										disabled={loading}
										className="text-red-600"
									>
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			},
		],
		[loading]
	)

	const table = useReactTable({
		data: leads,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	})

	const handleBulkDelete = async () => {
		const selectedRows = table.getFilteredSelectedRowModel().rows
		const selectedIds = selectedRows.map(row => row.original.id)

		if (selectedIds.length === 0) {
			alert('No leads selected')
			return
		}

		if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) return
		setLoading(true)

		try {
			await Promise.all(
				selectedIds.map(id =>
					fetch('/api/leads', {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id }),
					})
				)
			)
			await mutate()
			table.toggleAllRowsSelected(false) // Clear all selections
		} catch (error) {
			console.error('Error deleting leads:', error)
			alert('Error deleting leads. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handlePhoneChange = (value: string | undefined) => {
		setForm({ ...form, phoneNumber: value || '' })
	}

	const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		if (editForm) setEditForm({ ...editForm, [e.target.name]: e.target.value })
	}

	const handleEditPhoneChange = (value: string | undefined) => {
		if (editForm) setEditForm({ ...editForm, phoneNumber: value || '' })
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const res = await fetch('/api/leads', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
			}),
		})
		if (res.ok) {
			await mutate()
			setForm({
				leadSource: '',
				dateReceived: format(new Date(), 'yyyy-MM-dd'),
				contactName: '',
				emailAddress: '',
				phoneNumber: '',
				serviceInterest: '',
				leadStatus: 'New',
				potentialValue: '',
				followUpDate: '',
				notes: '',
			})
		}
		setLoading(false)
	}

	const handleEdit = (lead: Lead) => {
		setOriginalLead(lead)
		setEditForm({
			leadSource: lead.leadSource || '',
			contactName: lead.contactName,
			emailAddress: lead.emailAddress || '',
			phoneNumber: lead.phoneNumber || '',
			serviceInterest: lead.serviceInterest || '',
			leadStatus: lead.leadStatus,
			potentialValue: lead.potentialValue?.toString() || '',
			followUpDate: lead.followUpDate ? format(new Date(lead.followUpDate), 'yyyy-MM-dd') : '',
			notes: lead.notes || '',
			dateReceived: lead.dateReceived ? format(new Date(lead.dateReceived), 'yyyy-MM-dd') : '',
		})
		setEditDialogOpen(true)
	}

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editForm || !originalLead) return
		setLoading(true)
		const res = await fetch('/api/leads', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: originalLead.id,
				...editForm,
			}),
		})
		if (res.ok) {
			await mutate()
			setEditForm(null)
			setEditDialogOpen(false)
			setOriginalLead(null)
		}
		setLoading(false)
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete this lead?')) return
		setLoading(true)
		await fetch('/api/leads', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id }),
		})
		await mutate()
		setLoading(false)
	}

	const handleMarkCompleted = async (lead: Lead) => {
		setLoading(true)
		await fetch('/api/leads', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: lead.id,
				leadStatus: 'Completed',
			}),
		})
		await mutate()
		setLoading(false)
	}

	if (leadsLoading || sourcesLoading || serviceInterestsLoading || leadStatusesLoading) {
		return (
			<div className="flex-1 p-4 lg:p-8">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					<div className="h-64 bg-gray-200 rounded"></div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex-1 p-4 lg:p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-lg lg:text-2xl font-medium text-gray-900">Leads</h1>
			</div>

			<div className="bg-white rounded-lg shadow">
				<div className="overflow-x-auto">
					<div className="p-4 border-b flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Dialog>
								<DialogTrigger asChild>
									<Button className="bg-orange-500 hover:bg-orange-600 text-white">Add Lead</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
									<DialogHeader>
										<DialogTitle>Add New Lead</DialogTitle>
										<DialogDescription>Enter the details for the new lead.</DialogDescription>
									</DialogHeader>
									<form
										onSubmit={handleSubmit}
										className="space-y-4"
									>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<Label htmlFor="leadSource">Lead Source</Label>
												<Select
													name="leadSource"
													value={form.leadSource}
													onValueChange={value => setForm({ ...form, leadSource: value })}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select lead source" />
													</SelectTrigger>
													<SelectContent>
														{leadSources.map(source => (
															<SelectItem
																key={source.id}
																value={source.name}
															>
																{source.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label htmlFor="dateReceived">Date Received</Label>
												<Input
													name="dateReceived"
													type="date"
													value={form.dateReceived}
													onChange={handleChange}
													required
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<Label htmlFor="contactName">Contact Name *</Label>
												<Input
													name="contactName"
													value={form.contactName}
													onChange={handleChange}
													required
												/>
											</div>
											<div>
												<Label htmlFor="emailAddress">Email Address</Label>
												<Input
													name="emailAddress"
													type="email"
													value={form.emailAddress}
													onChange={handleChange}
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<Label htmlFor="phoneNumber">Phone Number</Label>
												<PhoneInput
													name="phoneNumber"
													value={form.phoneNumber}
													onChange={handlePhoneChange}
												/>
											</div>
											<div>
												<Label htmlFor="serviceInterest">Service Interest</Label>
												<Select
													name="serviceInterest"
													value={form.serviceInterest}
													onValueChange={value => setForm({ ...form, serviceInterest: value })}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select service interest" />
													</SelectTrigger>
													<SelectContent>
														{serviceInterests.map(service => (
															<SelectItem
																key={service.id}
																value={service.name}
															>
																{service.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<Label htmlFor="leadStatus">Lead Status</Label>
												<Select
													name="leadStatus"
													value={form.leadStatus}
													onValueChange={value => setForm({ ...form, leadStatus: value })}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{leadStatuses.map(status => (
															<SelectItem
																key={status.id}
																value={status.name}
															>
																{status.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label htmlFor="potentialValue">Potential Value</Label>
												<Input
													name="potentialValue"
													type="number"
													value={form.potentialValue}
													onChange={handleChange}
													placeholder="0"
												/>
											</div>
										</div>

										<div>
											<Label htmlFor="followUpDate">Follow Up Date</Label>
											<Popover>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														className={cn(
															'w-full justify-start text-left font-normal',
															!form.followUpDate && 'text-muted-foreground'
														)}
													>
														<CalendarIcon className="mr-2 h-4 w-4" />
														{form.followUpDate ? format(new Date(form.followUpDate), 'PPP') : <span>Pick a date</span>}
													</Button>
												</PopoverTrigger>
												<PopoverContent
													className="w-auto p-0"
													align="start"
												>
													<Calendar
														mode="single"
														selected={form.followUpDate ? new Date(form.followUpDate) : undefined}
														onSelect={date =>
															setForm({ ...form, followUpDate: date ? format(date, 'yyyy-MM-dd') : '' })
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
										</div>

										<div>
											<Label htmlFor="notes">Notes</Label>
											<Textarea
												name="notes"
												value={form.notes}
												onChange={handleChange}
												rows={3}
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
												{loading ? 'Adding...' : 'Add Lead'}
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>
							{table.getFilteredSelectedRowModel().rows.length > 0 && (
								<div className="flex items-center space-x-2">
									<Button
										onClick={handleBulkDelete}
										variant="outline"
										size="sm"
										disabled={loading}
										className="text-red-600 border-red-200 hover:bg-red-50"
									>
										{loading ? 'Deleting...' : 'Delete'}
									</Button>
									<span className="text-sm text-orange-600 font-medium">
										{table.getFilteredSelectedRowModel().rows.length} selected
									</span>
								</div>
							)}
						</div>
					</div>
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map(headerGroup => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map(header => (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map(row => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && 'selected'}
										className="cursor-pointer hover:bg-gray-50"
										onClick={() => handleEdit(row.original)}
									>
										{row.getVisibleCells().map(cell => (
											<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No leads found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-end space-x-2 py-4 px-4">
					<div className="flex-1 text-sm text-muted-foreground">
						{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
						selected.
					</div>
					<div className="space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Next
						</Button>
					</div>
				</div>
			</div>

			{/* Edit Dialog */}
			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Lead</DialogTitle>
						<DialogDescription>Update the lead details.</DialogDescription>
					</DialogHeader>
					{editForm && (
						<>
							{/* Date Received Meta Box */}
							<div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
								<div className="flex items-center space-x-2">
									<span className="text-sm font-medium text-gray-700">Date Received:</span>
									<span className="text-sm text-gray-900">
										{editForm.dateReceived ? format(new Date(editForm.dateReceived), 'MMMM dd, yyyy') : 'Not set'}
									</span>
								</div>
							</div>

							<form
								onSubmit={handleEditSubmit}
								className="space-y-4"
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="edit-leadSource">Lead Source</Label>
										<Select
											name="leadSource"
											value={editForm.leadSource}
											onValueChange={value => setEditForm({ ...editForm, leadSource: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select lead source" />
											</SelectTrigger>
											<SelectContent>
												{leadSources.map(source => (
													<SelectItem
														key={source.id}
														value={source.name}
													>
														{source.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="edit-contactName">Contact Name *</Label>
										<Input
											name="contactName"
											value={editForm.contactName}
											onChange={handleEditChange}
											required
										/>
									</div>
									<div>
										<Label htmlFor="edit-emailAddress">Email Address</Label>
										<Input
											name="emailAddress"
											type="email"
											value={editForm.emailAddress}
											onChange={handleEditChange}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="edit-phoneNumber">Phone Number</Label>
										<PhoneInput
											name="phoneNumber"
											value={editForm.phoneNumber}
											onChange={handleEditPhoneChange}
										/>
									</div>
									<div>
										<Label htmlFor="edit-serviceInterest">Service Interest</Label>
										<Select
											name="serviceInterest"
											value={editForm.serviceInterest}
											onValueChange={value => setEditForm({ ...editForm, serviceInterest: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select service interest" />
											</SelectTrigger>
											<SelectContent>
												{serviceInterests.map(service => (
													<SelectItem
														key={service.id}
														value={service.name}
													>
														{service.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="edit-leadStatus">Lead Status</Label>
										<Select
											name="leadStatus"
											value={editForm.leadStatus}
											onValueChange={value => setEditForm({ ...editForm, leadStatus: value })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{leadStatuses.map(status => (
													<SelectItem
														key={status.id}
														value={status.name}
													>
														{status.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="edit-potentialValue">Potential Value</Label>
										<Input
											name="potentialValue"
											type="number"
											value={editForm.potentialValue}
											onChange={handleEditChange}
											placeholder="0"
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="edit-followUpDate">Follow Up Date</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className={cn(
													'w-full justify-start text-left font-normal',
													!editForm.followUpDate && 'text-muted-foreground'
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{editForm.followUpDate ? (
													format(new Date(editForm.followUpDate), 'PPP')
												) : (
													<span>Pick a date</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent
											className="w-auto p-0"
											align="start"
										>
											<Calendar
												mode="single"
												selected={editForm.followUpDate ? new Date(editForm.followUpDate) : undefined}
												onSelect={date =>
													setEditForm({ ...editForm, followUpDate: date ? format(date, 'yyyy-MM-dd') : '' })
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>

								<div>
									<Label htmlFor="edit-notes">Notes</Label>
									<Textarea
										name="notes"
										value={editForm.notes}
										onChange={handleEditChange}
										rows={3}
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
										{loading ? 'Saving...' : 'Save Changes'}
									</Button>
								</DialogFooter>
							</form>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}
