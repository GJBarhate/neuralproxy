import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'

function PlanBadge({ plan }) {
  const p = (plan || '').toUpperCase()
  if (p === 'PRO') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">PRO</span>
  if (p === 'ENTERPRISE') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white">ENTERPRISE</span>
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">FREE</span>
}

function TenantCard({ tenant }) {
  const [expanded, setExpanded] = useState(false)
  const [keys, setKeys] = useState([])
  const [keysLoaded, setKeysLoaded] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [newKeyCopied, setNewKeyCopied] = useState(false)
  const [timer, setTimer] = useState(30)

  async function loadKeys() {
    if (keysLoaded) return
    try {
      const res = await api.get(`/tenants/${tenant.id}/api-keys`)
      setKeys(res.data)
      setKeysLoaded(true)
    } catch (e) {
      console.error('Failed to load keys', e)
    }
  }

  function handleToggle() {
    setExpanded(v => !v)
    if (!expanded) loadKeys()
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await api.post(`/tenants/${tenant.id}/api-keys`)
      setNewKey(res.data.key)
      setTimer(30)
      setKeys(prev => [{ id: 'new', keyPrefix: res.data.keyPrefix, active: true, createdAt: new Date().toISOString() }, ...prev])

      const countdown = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(countdown); setNewKey(null); return 30 }
          return t - 1
        })
      }, 1000)
    } catch (e) {
      console.error('Failed to generate key', e)
    } finally {
      setGenerating(false)
    }
  }

  function copyNewKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setNewKeyCopied(true)
      setTimeout(() => { setNewKeyCopied(false); setNewKey(null) }, 2000)
    }
  }

  const initial = (tenant.name || '?')[0].toUpperCase()
  const gradients = ['from-indigo-400 to-violet-500', 'from-cyan-400 to-blue-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500']
  const grad = gradients[tenant.name?.charCodeAt(0) % gradients.length] || gradients[0]

  return (
    <div className="bg-white dark:bg-[#13131A] rounded-2xl border border-slate-100 dark:border-slate-800/50 p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{tenant.name}</h3>
            <PlanBadge plan={tenant.plan} />
            {!tenant.active && <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">Inactive</span>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Created {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* API Keys accordion */}
          <button
            onClick={handleToggle}
        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
          </svg>
          API Keys {keysLoaded && `(${keys.length})`}
        </span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 animate-slide-up space-y-2">
          {newKey && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3 shadow-glow-emerald">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                New API Key, copy now. Disappears in {timer}s
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs text-emerald-800 dark:text-emerald-300 break-all">{newKey}</code>
                <button onClick={copyNewKey} className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors">
                  {newKeyCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {keysLoaded && keys.length === 0 && !newKey && (
            <p className="text-xs text-slate-400 text-center py-2">No API keys yet</p>
          )}

          {keys.map((k, i) => (
            <div key={k.id || i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${k.active ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                <code className="font-mono text-slate-700 dark:text-slate-300">{k.keyPrefix}***</code>
              </div>
              <span className="text-slate-400">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : ''}</span>
            </div>
          ))}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
            Generate New Key
          </button>
          <Link to={`/tenants/${tenant.id}`} className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors">
            View workspace
          </Link>
        </div>
      )}
    </div>
  )
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlan, setNewPlan] = useState('FREE')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.get('/tenants')
      .then(res => setTenants(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await api.post('/tenants', { name: newName.trim(), plan: newPlan })
      setTenants(prev => [res.data, ...prev])
      setNewName('')
      setNewPlan('FREE')
      setShowCreateForm(false)
    } catch (err) {
      console.error('Create tenant failed', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Tenant management"
        title="Workspaces"
        description="Keep the overview page light, then open each tenant in its own detailed workspace for keys, usage, and errors."
        breadcrumbs={[{ label: 'Overview', to: '/' }, { label: 'Tenants' }]}
        meta={[{ label: 'Count', value: tenants.length || 0 }]}
        actions={[
          <button
            key="new"
            onClick={() => setShowCreateForm(v => !v)}
            className="button-primary"
          >
            New tenant
          </button>
        ]}
      />

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 panel-surface animate-slide-up">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">New Tenant</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-slate-50 dark:bg-[#0A0A0F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan</label>
              <select
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                className="bg-slate-50 dark:bg-[#0A0A0F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all"
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="button-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-[#13131A] rounded-2xl border border-slate-100 dark:border-slate-800/50 p-6 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 rounded-full skeleton" />
                <div className="flex-1 space-y-2"><div className="h-4 skeleton rounded w-3/4" /><div className="h-3 skeleton rounded w-1/2" /></div>
              </div>
              <div className="h-9 skeleton rounded-xl" />
            </div>
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm">No tenants yet</p>
          <p className="text-xs mt-1 text-slate-500">Create your first tenant above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tenants.map(t => <TenantCard key={t.id} tenant={t} />)}
        </div>
      )}
    </div>
  )
}
