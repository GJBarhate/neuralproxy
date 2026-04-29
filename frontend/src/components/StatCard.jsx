import React from 'react'

export default function StatCard({ label, value, unit, trend, trendUp, accentColor = 'indigo', icon, loading }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-500', bar: 'from-indigo-500 to-indigo-400' },
    cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-950/30',     text: 'text-cyan-500',   bar: 'from-cyan-500 to-cyan-400' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-950/30',   text: 'text-amber-500',  bar: 'from-amber-500 to-amber-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-500', bar: 'from-violet-500 to-violet-400' },
    emerald:{ bg: 'bg-emerald-50 dark:bg-emerald-950/30',text:'text-emerald-500',bar: 'from-emerald-500 to-emerald-400' },
    rose:   { bg: 'bg-rose-50 dark:bg-rose-950/30',     text: 'text-rose-500',   bar: 'from-rose-500 to-rose-400' },
  }
  const c = colorMap[accentColor] || colorMap.indigo

  if (loading) {
    return (
      <div className="relative bg-white dark:bg-[#13131A] rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="animate-pulse space-y-3">
          <div className="h-4 skeleton rounded w-1/2" />
          <div className="h-8 skeleton rounded w-3/4" />
          <div className="h-3 skeleton rounded w-1/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white dark:bg-[#13131A] rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default overflow-hidden">
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.bar} rounded-b-2xl`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          {icon && (
            <svg className={`w-5 h-5 ${c.text}`} fill="currentColor" viewBox="0 0 20 20">
              <path d={icon} />
            </svg>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</span>
        {unit && <span className="text-lg text-slate-500 dark:text-slate-400 ml-1">{unit}</span>}
      </div>
      {trend && (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          trendUp
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
        }`}>
          {trendUp ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {trend}
        </div>
      )}
    </div>
  )
}
