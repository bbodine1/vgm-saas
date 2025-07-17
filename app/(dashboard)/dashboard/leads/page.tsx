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
	businessName: string
	firstContactDate: string
	decisionMakerName: string
	decisionMakerPhone?: string
	medium?: string
	completed: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LeadsPage() {
	const { teamId } = useContext(TeamContext)
	const { data: leads = [], mutate } = useSWR<Lead[]>(teamId ? ['/api/leads', teamId] : null, ([url]) => fetcher(url))
	const [form, setForm] = useState({
		businessName: '',
		firstContactDate: '',
		decisionMakerName: '',
		decisionMakerPhone: '',
		medium: '',
	})
	const [loading, setLoading] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editForm, setEditForm] = useState<typeof form | null>(null)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
			setForm({ businessName: '', firstContactDate: '', decisionMakerName: '', decisionMakerPhone: '', medium: '' })
		}
		setLoading(false)
	}

	const handleEdit = (lead: Lead) => {
		setEditingId(lead.id)
		setEditForm({
			businessName: lead.businessName,
			firstContactDate: lead.firstContactDate.slice(0, 10),
			decisionMakerName: lead.decisionMakerName,
			decisionMakerPhone: lead.decisionMakerPhone || '',
			medium: lead.medium || '',
		})
	}

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingId || !editForm) return
		setLoading(true)
		const res = await fetch('/api/leads', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: editingId, ...editForm }),
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
			{
				accessorKey: 'businessName',
				header: 'Business Name',
				cell: info => info.getValue(),
			},
			{
				accessorKey: 'firstContactDate',
				header: 'Date of First Contact',
				cell: info => (info.getValue() as string)?.slice(0, 10),
			},
			{
				accessorKey: 'decisionMakerName',
				header: 'Decision Maker',
				cell: info => info.getValue(),
			},
			{
				accessorKey: 'decisionMakerPhone',
				header: 'Phone',
				cell: info => info.getValue(),
			},
			{
				accessorKey: 'medium',
				header: 'Medium',
				cell: info => info.getValue(),
			},
			{
				accessorKey: 'completed',
				header: 'Status',
				cell: info => (info.row.original.completed ? 'Completed' : 'Open'),
			},
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
									disabled={loading || !!lead.completed}
								>
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDelete(lead.id)}
									disabled={loading}
								>
									Delete
								</DropdownMenuItem>
								{!lead.completed && (
									<DropdownMenuItem
										onClick={() => handleMarkCompleted(lead)}
										disabled={loading}
									>
										Mark Completed
									</DropdownMenuItem>
								)}
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
						</DialogHeader>
						<form
							onSubmit={handleSubmit}
							className="flex flex-col gap-4"
						>
							<Input
								name="businessName"
								placeholder="Business Name"
								value={form.businessName}
								onChange={handleChange}
								required
							/>
							<Input
								name="firstContactDate"
								type="date"
								placeholder="Date of First Contact"
								value={form.firstContactDate}
								onChange={handleChange}
								required
							/>
							<Input
								name="decisionMakerName"
								placeholder="Decision Maker Name"
								value={form.decisionMakerName}
								onChange={handleChange}
								required
							/>
							<Input
								name="decisionMakerPhone"
								placeholder="Decision Maker Phone"
								value={form.decisionMakerPhone}
								onChange={handleChange}
							/>
							<Input
								name="medium"
								placeholder="Medium"
								value={form.medium}
								onChange={handleChange}
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
								<TableRow
									key={row.id}
									className={row.original.completed ? 'opacity-50' : ''}
								>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{editingId === row.original.id && cell.column.id !== 'actions'
												? (() => {
														const col = cell.column.id
														if (
															col === 'businessName' ||
															col === 'decisionMakerName' ||
															col === 'decisionMakerPhone' ||
															col === 'medium'
														) {
															return (
																<Input
																	name={col}
																	value={editForm?.[col] || ''}
																	onChange={handleEditChange}
																/>
															)
														}
														if (col === 'firstContactDate') {
															return (
																<Input
																	name="firstContactDate"
																	type="date"
																	value={editForm?.firstContactDate || ''}
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
