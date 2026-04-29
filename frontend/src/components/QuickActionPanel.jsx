import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function QuickActionPanel({ open, onClose, isAdmin, onOpenKey, onLogout }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const actions = useMemo(() => {
    const base = [
      { id: 'dashboard', label: isAdmin ? 'Open overview' : 'Open dashboard', hint: 'Jump to your main command center', run: () => navigate('/') },
      { id: 'playground', label: 'Open playground', hint: 'Start a new prompt quickly', run: () => navigate('/playground') },
      { id: 'library', label: 'Open prompt library', hint: 'Replay saved prompts and history', run: () => navigate('/playground-library') },
      { id: 'settings', label: 'Open settings', hint: 'Manage profile, security, billing, and keys', run: () => navigate('/settings') },
      { id: 'key', label: 'Manage my key', hint: 'Open your personal Gemini key panel', run: onOpenKey },
      { id: 'billing', label: 'Open billing', hint: 'Review plans and workspace limits', run: () => navigate('/billing') },
      { id: 'logout', label: 'Sign out', hint: 'End this session safely', run: onLogout }
    ]

    if (isAdmin) {
      base.splice(4, 0,
        { id: 'tenants', label: 'Open tenants', hint: 'Review workspaces and API keys', run: () => navigate('/tenants') },
        { id: 'health', label: 'Open system health', hint: 'Check platform readiness', run: () => navigate('/system-health') }
      )
    }

    return base
  }, [isAdmin, navigate, onLogout, onOpenKey])

  const filtered = actions.filter((item) => {
    const search = query.trim().toLowerCase()
    if (!search) return true
    return `${item.label} ${item.hint}`.toLowerCase().includes(search)
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-24">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} aria-label="Close quick actions" />
      <div className="animate-scale-in relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 shadow-[0_30px_120px_rgba(15,23,42,0.25)] dark:bg-[#0B111B]/95">
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actions"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              autoFocus
            />
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Esc</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filtered.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                action.run?.()
                onClose()
              }}
              className="flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-900/70"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{action.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{action.hint}</p>
              </div>
              <span className="text-xs text-slate-400">↵</span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No actions match that search.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
