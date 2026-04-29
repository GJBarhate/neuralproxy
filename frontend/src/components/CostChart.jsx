import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

function formatTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function CustomCostTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white dark:bg-[#1E1E2E] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-glow-indigo text-sm">
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{formatTime(label)}</p>
      <p className="font-semibold text-indigo-600 dark:text-indigo-400">
        ${Number(payload[0].value).toFixed(6)}
      </p>
    </div>
  )
}

export default function CostChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + Number(d.cost || 0), 0)

  return (
    <div className="bg-white dark:bg-[#13131A] rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Cost Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 24 hours</p>
        </div>
        <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full">
          ${total.toFixed(6)} total
        </span>
      </div>
      {data.length === 0 ? (
        <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickFormatter={(v) => `$${Number(v).toFixed(4)}`}
            />
            <Tooltip content={<CustomCostTooltip />} />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#6366F1"
              strokeWidth={2.5}
              fill="url(#costGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#6366F1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
