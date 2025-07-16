'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Option = {
	value: string | number
	label: string
	disabled?: boolean
}

interface ComboboxProps {
	options: Option[]
	value: string | number | null
	onChange: (value: string | number) => void
	placeholder?: string
	disabled?: boolean
}

export function Combobox({ options, value, onChange, placeholder = 'Select...', disabled }: ComboboxProps) {
	const [open, setOpen] = React.useState(false)
	const selected = options.find(option => option.value === value)

	return (
		<Popover
			open={open}
			onOpenChange={setOpen}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="min-w-[160px] justify-between"
					disabled={disabled}
				>
					{selected ? selected.label : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<div className="p-1">
					{options.map(option => (
						<div
							key={option.value}
							className={cn(
								'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
								option.disabled && 'cursor-not-allowed opacity-50'
							)}
							onClick={e => {
								e.preventDefault()
								e.stopPropagation()
								if (!option.disabled) {
									onChange(option.value)
									setOpen(false)
								}
							}}
						>
							<Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
							{option.label}
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}
