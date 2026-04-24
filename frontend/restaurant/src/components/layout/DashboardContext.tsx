'use client'
import { createContext, useContext } from 'react'
import type { ConnectionState } from '@/hooks/useRestaurantSocket'

export interface DashboardCtx {
  connectionState: ConnectionState
}

export const DashboardContext = createContext<DashboardCtx>({ connectionState: 'disconnected' })

export const useDashboard = () => useContext(DashboardContext)
