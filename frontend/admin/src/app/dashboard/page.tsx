'use client'
import { useQuery } from '@tanstack/react-query'
import { Store, Building2, Route as RouteIcon, Bus as BusIcon } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import api from '@/lib/api'
import type {
  BusOperator,
  Bus,
  Restaurant,
  Route,
  Paginated,
} from '@/lib/api.types'

interface StatProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  sub?: string
}

function Stat({ label, value, icon: Icon, sub }: StatProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase">{label}</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
          {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
        </div>
        <div className="h-10 w-10 rounded-md bg-primary-soft flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  )
}

export default function OverviewPage() {
  const restaurantsQ = useQuery({
    queryKey: ['admin', 'restaurants'],
    queryFn: () => api.get<Paginated<Restaurant>>('/restaurants/?page_size=200').then((r) => r.data),
  })
  const operatorsQ = useQuery({
    queryKey: ['admin', 'operators'],
    queryFn: () => api.get<Paginated<BusOperator>>('/fleet/operators/?page_size=200').then((r) => r.data),
  })
  const routesQ = useQuery({
    queryKey: ['admin', 'routes'],
    queryFn: () => api.get<Paginated<Route>>('/fleet/routes/?page_size=200').then((r) => r.data),
  })
  const busesQ = useQuery({
    queryKey: ['admin', 'buses'],
    queryFn: () => api.get<Paginated<Bus>>('/fleet/buses/?page_size=500').then((r) => r.data),
  })

  const isLoading =
    restaurantsQ.isLoading || operatorsQ.isLoading || routesQ.isLoading || busesQ.isLoading

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="h-8 w-8" /></div>
  }

  const restaurants = restaurantsQ.data?.results ?? []
  const operators   = operatorsQ.data?.results ?? []
  const routes      = routesQ.data?.results ?? []
  const buses       = busesQ.data?.results ?? []

  const activeRestaurants = restaurants.filter((r) => r.is_active).length
  const activeOperators   = operators.filter((o) => o.is_active).length
  const activeBuses       = buses.filter((b) => b.is_active).length

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Restaurants"
          value={restaurants.length}
          icon={Store}
          sub={`${activeRestaurants} active`}
        />
        <Stat
          label="Bus Operators"
          value={operators.length}
          icon={Building2}
          sub={`${activeOperators} active`}
        />
        <Stat
          label="Routes"
          value={routes.length}
          icon={RouteIcon}
        />
        <Stat
          label="Buses"
          value={buses.length}
          icon={BusIcon}
          sub={`${activeBuses} active`}
        />
      </div>

      <Card>
        <h2 className="text-sm font-bold text-text-primary mb-3">Welcome, admin</h2>
        <p className="text-sm text-text-secondary">
          Manage restaurants, operators, routes, buses, and their assignments from the sidebar.
        </p>
      </Card>
    </div>
  )
}
