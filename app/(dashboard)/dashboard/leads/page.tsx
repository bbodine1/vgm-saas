'use client'

import useSWR from 'swr'
import { useState, useContext } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TeamContext } from '../layout'

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

	return (
		<main className="flex flex-col gap-8 p-4">
			<h1 className="text-2xl font-bold">Leads</h1>
			<Card className="p-4 max-w-xl">
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
					<Button
						type="submit"
						disabled={loading}
					>
						{loading ? 'Adding...' : 'Add Lead'}
					</Button>
				</form>
			</Card>
			<Card className="p-4">
				<table className="w-full text-left">
					<thead>
						<tr>
							<th>Business Name</th>
							<th>Date of First Contact</th>
							<th>Decision Maker</th>
							<th>Phone</th>
							<th>Medium</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{leads.map((lead: Lead) => (
							<tr
								key={lead.id}
								className={lead.completed ? 'opacity-50' : ''}
							>
								{editingId === lead.id ? (
									<>
										<td>
											<Input
												name="businessName"
												value={editForm?.businessName || ''}
												onChange={handleEditChange}
											/>
										</td>
										<td>
											<Input
												name="firstContactDate"
												type="date"
												value={editForm?.firstContactDate || ''}
												onChange={handleEditChange}
											/>
										</td>
										<td>
											<Input
												name="decisionMakerName"
												value={editForm?.decisionMakerName || ''}
												onChange={handleEditChange}
											/>
										</td>
										<td>
											<Input
												name="decisionMakerPhone"
												value={editForm?.decisionMakerPhone || ''}
												onChange={handleEditChange}
											/>
										</td>
										<td>
											<Input
												name="medium"
												value={editForm?.medium || ''}
												onChange={handleEditChange}
											/>
										</td>
										<td>{lead.completed ? 'Completed' : 'Open'}</td>
										<td>
											<Button
												size="sm"
												type="button"
												onClick={handleEditSubmit}
												disabled={loading}
											>
												Save
											</Button>
											<Button
												size="sm"
												type="button"
												variant="ghost"
												onClick={() => {
													setEditingId(null)
													setEditForm(null)
												}}
											>
												Cancel
											</Button>
										</td>
									</>
								) : (
									<>
										<td>{lead.businessName}</td>
										<td>{lead.firstContactDate?.slice(0, 10)}</td>
										<td>{lead.decisionMakerName}</td>
										<td>{lead.decisionMakerPhone}</td>
										<td>{lead.medium}</td>
										<td>{lead.completed ? 'Completed' : 'Open'}</td>
										<td className="flex gap-2">
											<Button
												size="sm"
												type="button"
												variant="outline"
												onClick={() => handleEdit(lead)}
												disabled={loading || !!lead.completed}
											>
												Edit
											</Button>
											<Button
												size="sm"
												type="button"
												variant="destructive"
												onClick={() => handleDelete(lead.id)}
												disabled={loading}
											>
												Delete
											</Button>
											{!lead.completed && (
												<Button
													size="sm"
													type="button"
													variant="secondary"
													onClick={() => handleMarkCompleted(lead)}
													disabled={loading}
												>
													Mark Completed
												</Button>
											)}
										</td>
									</>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</Card>
		</main>
	)
}
