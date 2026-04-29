import React from 'react'
import ProviderBadge from './ProviderBadge'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return '—'
  }
}

function latencyColor(ms) {
  if (ms == null) return 'text-slate-400'
  if (ms < 100) return 'text-cyan-500 dark:text-cyan-400'
  if (ms < 500) return 'text-amber-500 dark:text-amber-400'
  return 'text-rose-500 dark:text-rose-400'
}

export default function RequestTable({ requests = [], onSelectRequest }) {
  return (
    <div className="panel-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Requests</h3>
      </div>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No requests yet</p>
          <p className="text-xs mt-1 text-slate-500">Send a prompt in the Playground to see data here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1E1E2E]/80 backdrop-blur-sm">
                {['Time', 'Provider', 'Key', 'Latency', 'Tokens', 'Cost', 'Cache'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {requests.map((req, i) => (
                <tr
                  key={req.id || i}
                  className={`hover:bg-blue-50/70 dark:hover:bg-blue-950/20 transition-colors ${onSelectRequest ? 'cursor-pointer' : ''}`}
                  onClick={() => onSelectRequest?.(req)}
                >
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                    {timeAgo(req.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ProviderBadge provider={req.provider} />
                  </td>
                  <td className="px-4 py-3">
                    {req.keySource === 'USER' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">My Key</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">System</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 font-mono font-medium whitespace-nowrap ${latencyColor(req.latencyMs)}`}>
                    {req.latencyMs != null ? `${req.latencyMs}ms` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                    {req.tokenCount ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-mono text-xs">
                    {req.costUsd != null ? `$${Number(req.costUsd).toFixed(6)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {req.cacheHit ? (
                      <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
