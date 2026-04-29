import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'
import StatusBadge from '../components/StatusBadge'
import CostChart from '../components/CostChart'
import KeySourceChart from '../components/KeySourceChart'
import LatencyChart from '../components/LatencyChart'
import RequestTable from '../components/RequestTable'
import RequestDetailDrawer from '../components/RequestDetailDrawer'

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  )
}

export default function TenantDetailPage() {
  const { tenantId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [keyLabel, setKeyLabel] = useState('')
  const [keyExpiry, setKeyExpiry] = useState(90)
  const [workingKeyId, setWorkingKeyId] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get(`/tenants/${tenantId}`)
      .then((res) => {
        if (active) setData(res.data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [tenantId])

  const summary = data?.summary || {}
  const keys = data?.keys || []
  const requests = data?.recentRequests || []
  const subscription = data?.subscription || null

  const activeKeys = useMemo(() => keys.filter((item) => item.status === 'ACTIVE').length, [keys])

  async function refresh() {
    const res = await api.get(`/tenants/${tenantId}`)
    setData(res.data)
  }

  async function createKey(e) {
    e.preventDefault()
    setWorkingKeyId('new')
    try {
      await api.post(`/tenants/${tenantId}/api-keys`, {
        label: keyLabel || 'Primary key',
        expiresInDays: Number(keyExpiry) || 90
      })
      setKeyLabel('')
      setKeyExpiry(90)
      await refresh()
    } finally {
      setWorkingKeyId(null)
    }
  }

  async function revokeKey(id) {
    setWorkingKeyId(id)
    try {
      await api.patch(`/tenants/${tenantId}/api-keys/${id}/revoke`)
      await refresh()
    } finally {
      setWorkingKeyId(null)
    }
  }

  async function rotateKey(id) {
    setWorkingKeyId(id)
    try {
      await api.post(`/tenants/${tenantId}/api-keys/${id}/rotate`)
      await refresh()
    } finally {
      setWorkingKeyId(null)
    }
  }

  if (loading) {
    return <div className="page-shell"><div className="grid gap-4">{[...Array(5)].map((_, index) => <div key={index} className="h-28 rounded-3xl skeleton" />)}</div></div>
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Tenant workspace"
        title={data?.tenant?.name || 'Tenant detail'}
        description="Separate usage, cost, request quality, plan limits, and API key operations into one focused control surface."
        breadcrumbs={[{ label: 'Overview', to: '/' }, { label: 'Tenants', to: '/tenants' }, { label: data?.tenant?.name || 'Tenant detail' }]}
        meta={[
          { label: 'Plan', value: subscription?.planCode || 'FREE' },
          { label: 'Requests', value: summary.totalRequests || 0 }
        ]}
        actions={[
          <Link key="back" to="/tenants" className="button-secondary">Back to tenants</Link>
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <Stat label="Requests" value={summary.totalRequests || 0} hint="Total routed requests for this tenant." />
        <Stat label="Cache saved" value={`$${Number(summary.cacheSavingsUsd || 0).toFixed(4)}`} hint="Estimated cost saved from cache hits." />
        <Stat label="Errors" value={summary.errorCount || 0} hint="Fallbacks, failed requests, and validation errors." />
        <Stat label="Active keys" value={activeKeys} hint="Healthy tenant API keys currently in rotation." />
      </div>

      {subscription ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
          <SurfaceCard title="Subscription" subtitle="Current plan and workspace limits.">
            <div className="flex items-center gap-3">
              <StatusBadge status={subscription.subscriptionStatus || subscription.planCode} />
              <span className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{subscription.planCode}</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Billing cycle ends</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{subscription.billingCycleEnd ? new Date(subscription.billingCycleEnd).toLocaleDateString() : 'No active billing cycle'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Requests per minute</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{subscription.limits?.requestsPerMinute}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Monthly tokens</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{subscription.limits?.monthlyTokens}</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Plan details" subtitle="Make the tenant page explain exactly what this workspace gets.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Prompt library</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subscription.limits?.savedPrompts}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Analytics window</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subscription.limits?.analyticsDays} days of reporting depth</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Analytics mode</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subscription.limits?.analytics}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Support</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subscription.limits?.support}</p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SurfaceCard title="Usage trend" subtitle="See cost behavior for this tenant over the last 24 hours.">
          <CostChart data={data?.costOverTime || []} />
        </SurfaceCard>
        <SurfaceCard title="Key mix" subtitle="Track whether requests come from shared system keys or personal keys.">
          <KeySourceChart data={data?.keySourceBreakdown || { user: 0, system: 0 }} />
        </SurfaceCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard title="Latency snapshot" subtitle="Recent live requests for this tenant.">
          <LatencyChart requests={requests} />
        </SurfaceCard>
        <SurfaceCard title="API key control" subtitle="Create keys with expiry and handle rotation without leaving the page.">
          <form onSubmit={createKey} className="grid gap-3 sm:grid-cols-[1fr,120px,auto]">
            <input value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} placeholder="Billing key" className="input-field" />
            <input type="number" min="1" value={keyExpiry} onChange={(e) => setKeyExpiry(e.target.value)} className="input-field" />
            <button disabled={workingKeyId === 'new'} className="button-primary">
              {workingKeyId === 'new' ? 'Creating...' : 'Create key'}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="rounded-3xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{key.label || 'API key'}</p>
                      <StatusBadge status={key.status} />
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{key.keyPrefix}***</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => rotateKey(key.id)} disabled={workingKeyId === key.id} className="button-secondary">
                      Rotate
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeKey(key.id)}
                      disabled={workingKeyId === key.id || key.status !== 'ACTIVE'}
                      className="rounded-full border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                  <span>Created {key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}</span>
                  <span>Last used {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}</span>
                  <span>Expires {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-6">
        <RequestTable requests={requests} onSelectRequest={(item) => setSelectedRequestId(item.id)} />
      </div>

      <RequestDetailDrawer requestId={selectedRequestId} open={Boolean(selectedRequestId)} onClose={() => setSelectedRequestId(null)} />
    </div>
  )
}
