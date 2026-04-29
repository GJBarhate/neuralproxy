import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts'

function getBarColor(latency) {
  if (latency < 100) return '#06B6D4'
  if (latency < 500) return '#F59E0B'
  return '#F43F5E'
}

function CustomLatencyTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const v = payload[0].value
  return (
    <div className="bg-white dark:bg-[#1E1E2E] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow text-sm">
      <p className="font-semibold" style={{ color: getBarColor(v) }}>{v}ms</p>
    </div>
  )
}

export default function LatencyChart({ requests = [] }) {
  const data = requests
    .filter(r => !r.cacheHit && r.latencyMs != null)
    .slice(0, 20)
    .map((r, i) => ({ index: i + 1, latency: r.latencyMs }))
    .reverse()

  return (
    <div className="bg-white dark:bg-[#13131A] rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 h-full">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Response Latency</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 20 live requests</p>
      </div>
      <div className="flex gap-3 mb-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />{'<100ms'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />{'<500ms'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />{'≥500ms'}</span>
      </div>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" vertical={false} />
            <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(v) => `${v}ms`} />
            <Tooltip content={<CustomLatencyTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="latency" radius={[6, 6, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={getBarColor(entry.latency)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
