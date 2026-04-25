'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface HourlyRevenueChartProps {
  data: { hour: string; revenue: number; orders: number }[]
}

export function HourlyRevenueChart({ data }: HourlyRevenueChartProps) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#EFEFEA" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: '#8C8C84', fontFamily: 'Satoshi, sans-serif' }}
            stroke="#E8E8E2"
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8C8C84', fontFamily: 'Satoshi, sans-serif' }}
            stroke="#E8E8E2"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(17,17,17,0.04)' }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 14,
              border: '1px solid #E8E8E2',
              boxShadow: '0 12px 28px rgba(17, 17, 17, 0.07), 0 2px 4px rgba(17, 17, 17, 0.04)',
              fontFamily: 'Satoshi, sans-serif',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#8C8C84', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}
            formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#0D0D0D" radius={[8, 8, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
