'use client'

import useSWR from 'swr'
import { useState, useContext } from 'react'
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
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal } from 'lucide-react'
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

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LeadsPage() {
	const { teamId } = useContext(TeamContext)
	const { data: leads = [], mutate } = useSWR<Lead[]>(teamId ? `/api/leads?teamId=${teamId}` : null, fetcher)
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
	const [loading, setLoading] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editForm, setEditForm] = useState<typeof form | null>(null)
	// Add new state for edit dialog
	const [editDialogOpen, setEditDialogOpen] = useState(false)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
		const res = await fetch('/api/leads', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: editingId,
				...editForm,
				potentialValue: editForm.potentialValue ? Number(editForm.potentialValue) : null,
			}),
		})
		if (res.ok) {
			await mutate()
			setEditingId(null)
			setEditForm(null)
			setEditDialogOpen(false)
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

	// DataTable columns
	const columns = useMemo<ColumnDef<Lead>[]>(
		() => [
			{ accessorKey: 'leadSource', header: 'Lead Source', cell: info => info.getValue() },
			{ accessorKey: 'dateReceived', header: 'Date Received', cell: info => (info.getValue() as string)?.slice(0, 10) },
			{ accessorKey: 'contactName', header: 'Contact Name', cell: info => info.getValue() },
			{ accessorKey: 'emailAddress', header: 'Email', cell: info => info.getValue() },
			{ accessorKey: 'phoneNumber', header: 'Phone', cell: info => info.getValue() },
			{ accessorKey: 'serviceInterest', header: 'Service Interest', cell: info => info.getValue() },
			{ accessorKey: 'leadStatus', header: 'Status', cell: info => info.getValue() },
			{ accessorKey: 'potentialValue', header: 'Potential Value', cell: info => info.getValue() },
			{
				accessorKey: 'followUpDate',
				header: 'Follow-Up Date',
				cell: info => (info.getValue() as string)?.slice(0, 10),
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
		[loading]
	)

	// DataTable instance
	const table = useReactTable({
		data: leads,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	return (
		<main className="flex flex-col gap-8 p-4">
			<h1 className="text-2xl font-bold">Leads</h1>
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
								<Input
									name="leadSource"
									id="leadSource"
									value={form.leadSource}
									onChange={handleChange}
									aria-label="Lead Source"
								/>
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
								<TableRow key={row.id}>
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
			{/* Optionally, add pagination controls here */}
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
							<Input
								name="leadSource"
								id="edit-leadSource"
								value={editForm?.leadSource || ''}
								onChange={handleEditChange}
								aria-label="Lead Source"
							/>
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
