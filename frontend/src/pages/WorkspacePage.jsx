import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'

function Stat({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  )
}

function ProgressRow({ label, value, total, suffix = '', accent = 'bg-blue-500' }) {
  const safeTotal = total > 0 ? total : 1
  const pct = Math.min(100, Math.round((value / safeTotal) * 100))
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{value.toLocaleString()}{suffix} / {total.toLocaleString()}{suffix}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full ${accent} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Math.max(0, total - value).toLocaleString()}{suffix} left this cycle</p>
    </div>
  )
}

export default function WorkspacePage() {
  const [summary, setSummary] = useState(null)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/my/summary').then((res) => setSummary(res.data || null)),
      api.get('/billing/config').then((res) => setSubscription(res.data?.currentSubscription || null))
    ]).catch((error) => {
      console.error('Workspace data load failed', error)
    })
  }, [])

  const monthlyTokenLimit = useMemo(() => parseCompactNumber(subscription?.limits?.monthlyTokens), [subscription?.limits?.monthlyTokens])
  const requestAllowance = useMemo(() => {
    const rpm = Number(subscription?.limits?.requestsPerMinute || 60)
    return rpm * 60 * 24 * 30
  }, [subscription?.limits?.requestsPerMinute])
  const billingDaysLeft = useMemo(() => {
    if (!subscription?.billingCycleEnd) {
      return 0
    }
    const diff = new Date(subscription.billingCycleEnd).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [subscription?.billingCycleEnd])

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Workspace"
        title="Usage and plan"
        description="A clean customer-facing page for plan limits, usage clarity, and upgrade awareness."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Stat label="Plan" value={subscription?.planCode || 'FREE'} note="Current workspace tier." />
        <Stat label="Requests" value={Number(summary?.totalRequests || 0).toLocaleString()} note="Total routed requests so far." />
        <Stat label="Cache saved" value={`$${Number(summary?.cacheSavingsUsd || 0).toFixed(4)}`} note="Estimated cost reduced by caching." />
        <Stat label="Cycle left" value={subscription?.billingCycleEnd ? `${billingDaysLeft}d` : 'Free'} note="Days left in the current billing period." />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
        <SurfaceCard title="Usage progress" subtitle="Show people exactly how much plan headroom is left.">
          <div className="space-y-4">
            <ProgressRow label="Requests used" value={Number(summary?.totalRequests || 0)} total={requestAllowance} accent="bg-blue-500" />
            <ProgressRow label="Tokens used" value={Number(summary?.totalTokens || 0)} total={monthlyTokenLimit} accent="bg-teal-500" />
            <ProgressRow label="Errors" value={Number(summary?.errorCount || 0)} total={Math.max(10, Number(summary?.totalRequests || 0))} accent="bg-rose-500" />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Current limits" subtitle="Make plan value clear without turning the page into a sales screen.">
          <div className="grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Requests per minute</p>
              <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{subscription?.limits?.requestsPerMinute || 60}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Monthly tokens</p>
              <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{subscription?.limits?.monthlyTokens || '10k'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Saved prompts</p>
              <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{subscription?.limits?.savedPrompts || '3 saved prompts'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Billing cycle ends</p>
              <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">
                {subscription?.billingCycleEnd ? new Date(subscription.billingCycleEnd).toLocaleDateString() : 'No paid billing cycle'}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <SurfaceCard title="Upgrade value" subtitle="Smart nudges work better when the benefit is specific.">
          <div className="grid gap-4 md:grid-cols-3">
            {(subscription?.planCode === 'FREE'
              ? [
                  { title: 'Pro', detail: 'More throughput, 250k monthly tokens, 50 saved prompts, and deeper analytics.' },
                  { title: 'Enterprise', detail: 'Best for larger teams, bigger token pools, exports, and dedicated support.' }
                ]
              : subscription?.planCode === 'PRO'
                ? [
                    { title: 'Enterprise', detail: 'Unlock 2M monthly tokens, 1000 req/min, exports, and dedicated support.' }
                  ]
                : [
                    { title: 'Enterprise active', detail: 'You already have the strongest plan and broadest reporting access.' }
                  ]
            ).map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                <p className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Account snapshot" subtitle="A simple premium summary instead of hiding account health in settings.">
          <div className="space-y-3">
            <SnapshotRow label="Subscription status" value={subscription?.subscriptionStatus || 'FREE'} />
            <SnapshotRow label="Plan started" value={subscription?.planStartedAt ? new Date(subscription.planStartedAt).toLocaleDateString() : 'Not started'} />
            <SnapshotRow label="Current monthly tokens" value={Number(summary?.totalTokens || 0).toLocaleString()} />
            <SnapshotRow label="Prompt performance" value={`${summary?.cacheHitRate || 0}% cache hit rate`} />
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

function SnapshotRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-slate-800">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function parseCompactNumber(rawValue) {
  const value = String(rawValue || '0').trim().toUpperCase()
  if (value.endsWith('K')) {
    return Number(value.slice(0, -1)) * 1000
  }
  if (value.endsWith('M')) {
    return Number(value.slice(0, -1)) * 1000000
  }
  return Number(value) || 0
}
