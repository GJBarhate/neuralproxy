import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import useStore from '../store/useStore'

function Pill({ label, value, tone = 'neutral' }) {
  const styles = {
    neutral: 'border-slate-200 bg-white/80 text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
    info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${styles[tone] || styles.neutral}`}>
      <span className="text-slate-400 dark:text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function TopStatusBar() {
  const { token, user, wsConnected } = useStore()
  const [subscription, setSubscription] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!token) return
    const summaryPath = user?.role === 'ADMIN' ? '/analytics/summary' : '/analytics/my/summary'

    Promise.all([
      api.get('/billing/config').then((res) => setSubscription(res.data?.currentSubscription || null)).catch(() => setSubscription(null)),
      api.get(summaryPath).then((res) => setSummary(res.data || null)).catch(() => setSummary(null))
    ])
  }, [token, user?.role])

  if (!token) return null

  return (
    <div className="fixed left-0 right-0 top-16 z-40 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#081018]/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
        <Pill label="Role" value={user?.role === 'ADMIN' ? 'Admin' : 'Workspace'} tone="neutral" />
        <Pill label="Plan" value={subscription?.planCode || 'FREE'} tone="info" />
        <Pill label="Live" value={wsConnected ? 'Connected' : 'Offline'} tone={wsConnected ? 'success' : 'neutral'} />
        {summary ? <Pill label="Requests" value={summary.totalRequests || 0} /> : null}
        {summary ? <Pill label="Cache" value={`${summary.cacheHitRate || 0}%`} /> : null}
        {subscription?.billingCycleEnd ? <Pill label="Cycle ends" value={new Date(subscription.billingCycleEnd).toLocaleDateString()} /> : null}
      </div>
    </div>
  )
}
