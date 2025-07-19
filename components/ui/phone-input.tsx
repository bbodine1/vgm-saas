'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import PhoneInputWithCountry from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

interface PhoneInputProps {
	value?: string
	onChange?: (value: string | undefined) => void
	placeholder?: string
	className?: string
	disabled?: boolean
	required?: boolean
	id?: string
	name?: string
}

export function PhoneInput({
	value,
	onChange,
	placeholder = 'Enter phone number',
	className,
	disabled = false,
	required = false,
	id,
	name,
}: PhoneInputProps) {
	const handleChange = (phoneValue: string | undefined) => {
		onChange?.(phoneValue || undefined)
	}

	return (
		<PhoneInputWithCountry
			international
			defaultCountry="US"
			value={value}
			onChange={handleChange}
			placeholder={placeholder}
			disabled={disabled}
			required={required}
			id={id}
			name={name}
			className={cn(
				'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
		/>
	)
}
