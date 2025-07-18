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
					if (editingId === lead.id) {
						return (
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={handleEditSubmit}
									disabled={loading}
								>
									{loading ? 'Saving...' : 'Save'}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setEditingId(null)
										setEditForm(null)
									}}
									disabled={loading}
								>
									Cancel
								</Button>
							</div>
						)
					}
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
		[editingId, editForm, loading]
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
							className="flex flex-col gap-4"
						>
							<Input
								name="leadSource"
								placeholder="Lead Source"
								value={form.leadSource}
								onChange={handleChange}
							/>
							<Input
								name="dateReceived"
								type="date"
								placeholder="Date Received"
								value={form.dateReceived}
								onChange={handleChange}
								required
							/>
							<Input
								name="contactName"
								placeholder="Contact Name"
								value={form.contactName}
								onChange={handleChange}
								required
							/>
							<Input
								name="emailAddress"
								placeholder="Email Address"
								value={form.emailAddress}
								onChange={handleChange}
							/>
							<Input
								name="phoneNumber"
								placeholder="Phone Number"
								value={form.phoneNumber}
								onChange={handleChange}
							/>
							<Input
								name="serviceInterest"
								placeholder="Service Interest"
								value={form.serviceInterest}
								onChange={handleChange}
							/>
							<Input
								name="leadStatus"
								placeholder="Lead Status"
								value={form.leadStatus}
								onChange={handleChange}
							/>
							<Input
								name="potentialValue"
								type="number"
								placeholder="Potential Value"
								value={form.potentialValue}
								onChange={handleChange}
							/>
							<Input
								name="followUpDate"
								type="date"
								placeholder="Follow-Up Date"
								value={form.followUpDate}
								onChange={handleChange}
							/>
							<textarea
								name="notes"
								placeholder="Notes/Comments"
								value={form.notes}
								onChange={handleChange}
								className="border rounded p-2"
							/>
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
								>
									{loading ? 'Adding...' : 'Add Lead'}
								</Button>
							</DialogFooter>
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
										<TableCell key={cell.id}>
											{editingId === row.original.id && cell.column.id !== 'actions'
												? (() => {
														const col = cell.column.id
														if (
															col === 'leadSource' ||
															col === 'contactName' ||
															col === 'emailAddress' ||
															col === 'phoneNumber' ||
															col === 'serviceInterest' ||
															col === 'leadStatus' ||
															col === 'potentialValue' ||
															col === 'followUpDate' ||
															col === 'notes'
														) {
															return (
																<Input
																	name={col}
																	value={editForm?.[col] || ''}
																	onChange={handleEditChange}
																/>
															)
														}
														if (col === 'dateReceived') {
															return (
																<Input
																	name="dateReceived"
																	type="date"
																	value={editForm?.dateReceived || ''}
																	onChange={handleEditChange}
																/>
															)
														}
														return String(cell.getValue())
												  })()
												: flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
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
		</main>
	)
}
