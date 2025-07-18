'use client'

import { createContext } from 'react'

export const TeamContext = createContext<{ teamId: number | null }>({ teamId: null })
