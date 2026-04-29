import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white dark:bg-[#1E1E2E] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow text-sm">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{payload[0].name}</p>
      <p className="text-slate-500 dark:text-slate-400">{payload[0].value} requests</p>
    </div>
  )
}

function CustomLegend({ payload }) {
  return (
    <div className="flex justify-center gap-4 mt-2">
      {(payload || []).map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  )
}

export default function KeySourceChart({ data = { user: 0, system: 0 } }) {
  const total = (data.user || 0) + (data.system || 0)
  const chartData = [
    { name: 'My Key', value: data.user || 0 },
    { name: 'System', value: data.system || 0 }
  ]
  const COLORS = ['#10B981', '#6366F1']

  return (
    <div className="bg-white dark:bg-[#13131A] rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Key Usage</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">User vs System keys</p>
      </div>
      {total === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 24 }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
