'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
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
				<Command>
					<CommandInput placeholder={placeholder} />
					<CommandEmpty>No options found.</CommandEmpty>
					<CommandGroup>
						{options.map(option => (
							<CommandItem
								key={option.value}
								value={option.label} // Use label for search
								disabled={option.disabled}
								onSelect={() => {
									onChange(option.value)
									setOpen(false)
								}}
							>
								<Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
								{option.label}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
