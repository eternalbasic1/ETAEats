'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface HourlyRevenueChartProps {
  data: { hour: string; revenue: number; orders: number }[]
}

export function HourlyRevenueChart({ data }: HourlyRevenueChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#4B5563' }} stroke="#E5E7EB" />
          <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} stroke="#E5E7EB" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#FF6B2B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
