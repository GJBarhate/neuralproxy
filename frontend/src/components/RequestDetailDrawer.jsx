import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import ProviderBadge from './ProviderBadge'
import StatusBadge from './StatusBadge'

function MetaItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 break-words">{value ?? '—'}</p>
    </div>
  )
}

export default function RequestDetailDrawer({ requestId, open, onClose }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !requestId) return
    let active = true
    setLoading(true)
    setError('')
    api.get(`/analytics/requests/${requestId}`)
      .then((res) => {
        if (active) setData(res.data)
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.error || 'Failed to load request details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, requestId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-label="Close request details" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0D1118] animate-slide-in-right">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Request inspector</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">Request details</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Inspect the full prompt, response, source, cost, and failure signals.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => <div key={index} className="h-20 rounded-2xl skeleton" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>
        ) : data ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <ProviderBadge provider={data.provider} />
              <StatusBadge status={data.errorMessage ? 'DOWN' : (data.cacheHit ? 'ACTIVE' : 'HEALTHY')} />
              <span className="chip">{data.keySource === 'USER' ? 'My key' : 'System key'}</span>
              <span className="chip">{data.cacheSource || 'NONE'} cache</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetaItem label="Latency" value={data.latencyMs != null ? `${data.latencyMs} ms` : '—'} />
              <MetaItem label="Tokens" value={data.tokenCount ?? '—'} />
              <MetaItem label="Cost" value={data.costUsd != null ? `$${Number(data.costUsd).toFixed(6)}` : '—'} />
              <MetaItem label="Created" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">Prompt</p>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 whitespace-pre-wrap">
                {data.prompt || 'No prompt stored.'}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">Response</p>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 whitespace-pre-wrap min-h-36">
                {data.responseText || 'No response captured for this request.'}
              </div>
            </div>

            {data.errorMessage ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">Failure signal</p>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                  {data.errorMessage}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  )
}
