'use client'

import useSWR from 'swr'
import { useState, useContext, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TeamContext } from '../layout'
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
	DialogDescription,
} from '@/components/ui/dialog'
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
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'

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
	dateReceived: string
	contactName: string
	emailAddress: string
	phoneNumber: string
	serviceInterest: string
	leadStatus: string
	potentialValue: string
	followUpDate: string
	notes: string
}

interface LeadSource {
	id: number
	name: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LeadsPage() {
	const { teamId } = useContext(TeamContext)
	const { data: leads = [], mutate } = useSWR<Lead[]>(teamId ? `/api/leads?teamId=${teamId}` : null, fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	})
	const { data: leadSources = [] } = useSWR<LeadSource[]>(teamId ? `/api/lead-sources?teamId=${teamId}` : null, fetcher)

	const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([])
	const [loading, setLoading] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [form, setForm] = useState({
		leadSource: '',
		dateReceived: '',
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

	// Helper function to render sortable headers
	const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => {
		return (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				className="h-auto p-0 font-medium hover:bg-transparent"
			>
				{children}
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className="ml-2 h-4 w-4" />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className="ml-2 h-4 w-4" />
				) : (
					<ArrowUpDown className="ml-2 h-4 w-4" />
				)}
			</Button>
		)
	}

	// Helper to get current page leads
	const columns = useMemo<ColumnDef<Lead>[]>(
		() => [
			{
				id: 'select',
				header: () => (
					<input
						type="checkbox"
						checked={leads.length > 0 && leads.every(l => selectedLeadIds.includes(l.id))}
						onClick={e => handleSelectAll((e.target as HTMLInputElement).checked)}
						onChange={() => {}}
						aria-label="Select all leads on page"
					/>
				),
				cell: ({ row }) => (
					<input
						type="checkbox"
						checked={selectedLeadIds.includes(row.original.id)}
						onClick={e => handleSelectOne(row.original.id, e)}
						onChange={() => {}}
						aria-label={`Select lead ${row.original.id}`}
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: 'leadSource',
				header: ({ column }) => <SortableHeader column={column}>Lead Source</SortableHeader>,
				cell: info => info.getValue(),
				enableSorting: true,
			},
			{
				accessorKey: 'dateReceived',
				header: ({ column }) => <SortableHeader column={column}>Date Received</SortableHeader>,
				cell: info => (info.getValue() as string)?.slice(0, 10),
				enableSorting: true,
			},
			{
				accessorKey: 'contactName',
				header: ({ column }) => <SortableHeader column={column}>Contact Name</SortableHeader>,
				cell: info => info.getValue(),
				enableSorting: true,
			},
			{ accessorKey: 'emailAddress', header: 'Email', cell: info => info.getValue() },
			{ accessorKey: 'phoneNumber', header: 'Phone', cell: info => info.getValue() },
			{ accessorKey: 'serviceInterest', header: 'Service Interest', cell: info => info.getValue() },
			{
				accessorKey: 'leadStatus',
				header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
				cell: info => info.getValue(),
				enableSorting: true,
			},
			{
				accessorKey: 'potentialValue',
				header: ({ column }) => <SortableHeader column={column}>Potential Value</SortableHeader>,
				cell: info => info.getValue(),
				enableSorting: true,
			},
			{
				accessorKey: 'followUpDate',
				header: ({ column }) => <SortableHeader column={column}>Follow-Up Date</SortableHeader>,
				cell: info => (info.getValue() as string)?.slice(0, 10),
				enableSorting: true,
			},
			{ accessorKey: 'notes', header: 'Notes', cell: info => info.getValue() },
			{
				id: 'actions',
				header: 'Actions',
				cell: ({ row }) => {
					const lead = row.original
					return (
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
									onClick={() => {
										navigator.clipboard.writeText(String(lead.id))
									}}
								>
									Copy Lead ID
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handleEdit(lead)}
									disabled={loading}
								>
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDelete(lead.id)}
									disabled={loading}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)
				},
			},
		],
		[loading, selectedLeadIds]
	)

	const table = useReactTable({
		data: leads,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	})

	const currentPageLeads = useMemo(
		() => table.getRowModel().rows.map(row => row.original),
		[table, table.getRowModel().rows]
	)

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedLeadIds(prev => Array.from(new Set([...prev, ...leads.map(l => l.id)])))
		} else {
			setSelectedLeadIds(prev => prev.filter(id => !leads.some(l => l.id === id)))
		}
	}

	const handleSelectOne = (id: number | string, event: React.MouseEvent<HTMLInputElement>) => {
		const numericId = typeof id === 'string' ? parseInt(id, 10) : id
		if (selectedLeadIds.includes(numericId)) {
			setSelectedLeadIds(selectedLeadIds.filter(i => i !== numericId))
		} else {
			setSelectedLeadIds([...selectedLeadIds, numericId])
		}
	}

	const handleBulkDelete = async () => {
		if (!selectedLeadIds.length) return
		if (!confirm(`Delete ${selectedLeadIds.length} selected lead(s)?`)) return
		setLoading(true)
		await Promise.all(
			selectedLeadIds.map(id =>
				fetch('/api/leads', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id }),
				})
			)
		)
		setSelectedLeadIds([])
		await mutate()
		setLoading(false)
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		if (editForm) setEditForm({ ...editForm, [e.target.name]: e.target.value })
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const res = await fetch('/api/leads', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		if (res.ok) {
			await mutate()
			setForm({
				leadSource: '',
				dateReceived: '',
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
		setEditingId(lead.id)
		setEditForm({
			leadSource: lead.leadSource || '',
			dateReceived: lead.dateReceived ? lead.dateReceived.slice(0, 10) : '',
			contactName: lead.contactName,
			emailAddress: lead.emailAddress || '',
			phoneNumber: lead.phoneNumber || '',
			serviceInterest: lead.serviceInterest || '',
			leadStatus: lead.leadStatus || 'New',
			potentialValue: lead.potentialValue?.toString() || '',
			followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : '',
			notes: lead.notes || '',
		})
		setEditDialogOpen(true)
	}

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingId || !editForm) return
		setLoading(true)

		const requestBody = {
			id: editingId,
			...editForm,
			potentialValue: editForm.potentialValue ? Number(editForm.potentialValue) : null,
		}

		const res = await fetch('/api/leads', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		})

		if (res.ok) {
			const updatedLead = await res.json()

			// Force a revalidation of the SWR cache
			await mutate(undefined, { revalidate: true })

			setEditingId(null)
			setEditForm(null)
			setEditDialogOpen(false)
		} else {
			const errorData = await res.json()
			console.error('Edit failed:', errorData)
		}
		setLoading(false)
	}

	const handleDelete = async (id: number) => {
		if (!confirm('Delete this lead?')) return
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
			body: JSON.stringify({ ...lead, completed: 1 }),
		})
		await mutate()
		setLoading(false)
	}

	return (
		<main className="flex flex-col gap-8 p-4">
			<h1 className="text-2xl font-bold">Leads</h1>
			<div className="mb-2 flex justify-end">
				<Button
					variant="destructive"
					size="sm"
					onClick={handleBulkDelete}
					disabled={selectedLeadIds.length === 0 || loading}
				>
					Delete Selected
				</Button>
			</div>
			<div className="mb-4">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="default">Add Lead</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add New Lead</DialogTitle>
							<DialogDescription>Fill out the form below to add a new lead to your organization.</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={handleSubmit}
							className="grid grid-cols-1 md:grid-cols-2 gap-4"
						>
							<div className="flex flex-col gap-2">
								<Label htmlFor="leadSource">Lead Source</Label>
								<select
									name="leadSource"
									id="leadSource"
									value={form.leadSource}
									onChange={handleChange}
									className="border rounded p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="">Select a lead source</option>
									{leadSources.map(source => (
										<option
											key={source.id}
											value={source.name}
										>
											{source.name}
										</option>
									))}
								</select>
								<Label htmlFor="dateReceived">Date Received</Label>
								<Input
									name="dateReceived"
									id="dateReceived"
									type="date"
									value={form.dateReceived}
									onChange={handleChange}
									required
									aria-label="Date Received"
								/>
								<Label htmlFor="contactName">Contact Name</Label>
								<Input
									name="contactName"
									id="contactName"
									value={form.contactName}
									onChange={handleChange}
									required
									aria-label="Contact Name"
								/>
								<Label htmlFor="emailAddress">Email Address</Label>
								<Input
									name="emailAddress"
									id="emailAddress"
									type="email"
									value={form.emailAddress}
									onChange={handleChange}
									aria-label="Email Address"
								/>
								<Label htmlFor="phoneNumber">Phone Number</Label>
								<Input
									name="phoneNumber"
									id="phoneNumber"
									value={form.phoneNumber}
									onChange={handleChange}
									aria-label="Phone Number"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="serviceInterest">Service Interest</Label>
								<Input
									name="serviceInterest"
									id="serviceInterest"
									value={form.serviceInterest}
									onChange={handleChange}
									aria-label="Service Interest"
								/>
								<Label htmlFor="leadStatus">Lead Status</Label>
								<Input
									name="leadStatus"
									id="leadStatus"
									value={form.leadStatus}
									onChange={handleChange}
									aria-label="Lead Status"
								/>
								<Label htmlFor="potentialValue">Potential Value</Label>
								<Input
									name="potentialValue"
									id="potentialValue"
									type="number"
									value={form.potentialValue}
									onChange={handleChange}
									aria-label="Potential Value"
								/>
								<Label htmlFor="followUpDate">Follow-Up Date</Label>
								<Input
									name="followUpDate"
									id="followUpDate"
									type="date"
									value={form.followUpDate}
									onChange={handleChange}
									aria-label="Follow-Up Date"
								/>
								<Label htmlFor="notes">Notes/Comments</Label>
								<textarea
									name="notes"
									id="notes"
									value={form.notes}
									onChange={handleChange}
									aria-label="Notes/Comments"
									className="border rounded p-2 w-full min-h-[60px] bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
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
								>
									{loading ? 'Adding...' : 'Add Lead'}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>
			{leads.length > 0 && currentPageLeads.length > 0 ? (
				<>
					<div className="rounded-md border">
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
								{table.getRowModel().rows.length ? (
									table.getRowModel().rows.map(row => (
										<TableRow
											key={row.original.id}
											className="cursor-pointer hover:bg-gray-50 transition-colors"
											onClick={e => {
												// Don't trigger row click if clicking on checkbox or dropdown
												if (
													(e.target as HTMLElement).closest('input[type="checkbox"]') ||
													(e.target as HTMLElement).closest('[role="button"]') ||
													(e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')
												) {
													return
												}
												handleEdit(row.original)
											}}
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
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					{/* Pagination controls */}
					<div className="flex justify-end items-center gap-2 mt-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
						<span>
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Next
						</Button>
					</div>
				</>
			) : (
				<div className="flex justify-center items-center h-32">Loading leads...</div>
			)}
			{/* Add Edit Dialog after the Add Dialog */}
			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Edit Lead</DialogTitle>
						<DialogDescription>Update the lead information below.</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={handleEditSubmit}
						className="grid grid-cols-1 md:grid-cols-2 gap-4"
					>
						<div className="flex flex-col gap-2">
							<Label htmlFor="edit-leadSource">Lead Source</Label>
							<select
								name="leadSource"
								id="edit-leadSource"
								value={editForm?.leadSource || ''}
								onChange={handleEditChange}
								className="border rounded p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="">Select a lead source</option>
								{leadSources.map(source => (
									<option
										key={source.id}
										value={source.name}
									>
										{source.name}
									</option>
								))}
							</select>
							<Label htmlFor="edit-dateReceived">Date Received</Label>
							<Input
								name="dateReceived"
								id="edit-dateReceived"
								type="date"
								value={editForm?.dateReceived || ''}
								onChange={handleEditChange}
								required
								aria-label="Date Received"
							/>
							<Label htmlFor="edit-contactName">Contact Name</Label>
							<Input
								name="contactName"
								id="edit-contactName"
								value={editForm?.contactName || ''}
								onChange={handleEditChange}
								required
								aria-label="Contact Name"
							/>
							<Label htmlFor="edit-emailAddress">Email Address</Label>
							<Input
								name="emailAddress"
								id="edit-emailAddress"
								type="email"
								value={editForm?.emailAddress || ''}
								onChange={handleEditChange}
								aria-label="Email Address"
							/>
							<Label htmlFor="edit-phoneNumber">Phone Number</Label>
							<Input
								name="phoneNumber"
								id="edit-phoneNumber"
								value={editForm?.phoneNumber || ''}
								onChange={handleEditChange}
								aria-label="Phone Number"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="edit-serviceInterest">Service Interest</Label>
							<Input
								name="serviceInterest"
								id="edit-serviceInterest"
								value={editForm?.serviceInterest || ''}
								onChange={handleEditChange}
								aria-label="Service Interest"
							/>
							<Label htmlFor="edit-leadStatus">Lead Status</Label>
							<Input
								name="leadStatus"
								id="edit-leadStatus"
								value={editForm?.leadStatus || ''}
								onChange={handleEditChange}
								aria-label="Lead Status"
							/>
							<Label htmlFor="edit-potentialValue">Potential Value</Label>
							<Input
								name="potentialValue"
								id="edit-potentialValue"
								type="number"
								value={editForm?.potentialValue || ''}
								onChange={handleEditChange}
								aria-label="Potential Value"
							/>
							<Label htmlFor="edit-followUpDate">Follow-Up Date</Label>
							<Input
								name="followUpDate"
								id="edit-followUpDate"
								type="date"
								value={editForm?.followUpDate || ''}
								onChange={handleEditChange}
								aria-label="Follow-Up Date"
							/>
							<Label htmlFor="edit-notes">Notes/Comments</Label>
							<textarea
								name="notes"
								id="edit-notes"
								value={editForm?.notes || ''}
								onChange={handleEditChange}
								aria-label="Notes/Comments"
								className="border rounded p-2 w-full min-h-[60px] bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>
						<div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
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
							>
								{loading ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</main>
	)
}
