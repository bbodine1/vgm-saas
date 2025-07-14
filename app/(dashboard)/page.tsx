import React from 'react'

export default function Dashboard() {
	return (
		<main className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium mb-6">Dashboard</h1>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white border border-gray-200 rounded-lg">
					<thead>
						<tr>{/* Empty header for now */}</tr>
					</thead>
					<tbody>{/* No rows */}</tbody>
				</table>
			</div>
		</main>
	)
}
