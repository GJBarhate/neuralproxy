import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useStore from '../store/useStore'
import StatCard from '../components/StatCard'
import CostChart from '../components/CostChart'
import RequestTable from '../components/RequestTable'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'
import RequestDetailDrawer from '../components/RequestDetailDrawer'

const ICONS = {
  chart: 'M4 19h16M7 16V8m5 8V5m5 11v-6',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6l1-8z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  coin: 'M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10v10m0-10c2.21 0 4 .895 4 2M12 8c-2.21 0-4 .895-4 2m0 0v4c0 1.105 1.79 2 4 2s4-.895 4-2v-4'
}

function ActionTile({ to, title, description }) {
  return (
    <Link to={to} className="rounded-3xl border border-slate-200/80 bg-white/70 px-5 py-5 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700">
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </Link>
  )
}

function FeedItem({ title, detail, tone = 'neutral', timestamp }) {
  const dotClass = tone === 'critical'
    ? 'bg-rose-400'
    : tone === 'warning'
      ? 'bg-amber-400'
      : tone === 'positive'
        ? 'bg-emerald-400'
        : 'bg-slate-300 dark:bg-slate-600'

  return (
    <div className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass}`} />
      </div>
      {timestamp ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{new Date(timestamp).toLocaleString()}</p> : null}
    </div>
  )
}

export default function DashboardPage() {
  const { analytics, setAnalyticsFull, wsConnected, user } = useStore()
  const [loading, setLoading] = useState(true)
  const [recentRequests, setRecentRequests] = useState([])
  const [tenantCount, setTenantCount] = useState(0)
  const [adminBilling, setAdminBilling] = useState(null)
  const [adminHome, setAdminHome] = useState(null)
  const [systemHealth, setSystemHealth] = useState(null)
  const [selectedRequestId, setSelectedRequestId] = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const isAdmin = user?.role === 'ADMIN'
        const prefix = isAdmin ? '/analytics' : '/analytics/my'
        const [summary, costTime, keySrc, recent] = await Promise.all([
          api.get(`${prefix}/summary`),
          api.get(`${prefix}/cost-over-time`),
          api.get(`${prefix}/key-source-breakdown`),
          api.get(`${prefix}/requests?limit=10`)
        ])

        if (isAdmin) {
          const [tenants, billing, adminHomeSnapshot, health] = await Promise.all([
            api.get('/tenants'),
            api.get('/billing/admin-summary'),
            api.get('/analytics/admin-home'),
            api.get('/system/health')
          ])
          setTenantCount(tenants.data?.length || 0)
          setAdminBilling(billing.data || null)
          setAdminHome(adminHomeSnapshot.data || null)
          setSystemHealth(health.data || null)
        }

        setAnalyticsFull({
          totalRequests: summary.data.totalRequests ?? 0,
          cacheHitRate: summary.data.cacheHitRate ?? 0,
          avgLatency: summary.data.avgLatency ?? 0,
          totalCost: summary.data.totalCost ?? 0,
          totalTokens: summary.data.totalTokens ?? 0,
          cacheSavingsUsd: summary.data.cacheSavingsUsd ?? 0,
          errorCount: summary.data.errorCount ?? 0,
          costOverTime: costTime.data ?? [],
          keySourceBreakdown: keySrc.data ?? { user: 0, system: 0 },
        })
        setRecentRequests(recent.data ?? [])
      } catch (error) {
        console.error('Dashboard load failed', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [setAnalyticsFull, user?.role])

  const {
    totalRequests,
    cacheHitRate,
    avgLatency,
    totalCost,
    totalTokens,
    cacheSavingsUsd,
    errorCount,
    costOverTime
  } = analytics

  const isAdmin = user?.role === 'ADMIN'
  const heroMeta = isAdmin
    ? [
        { label: 'Live', value: wsConnected ? 'Connected' : 'Offline' },
        { label: 'Tenants', value: tenantCount || 0 },
        { label: 'Health', value: systemHealth?.overallStatus || 'Unknown' }
      ]
    : [
        { label: 'Live', value: wsConnected ? 'Connected' : 'Offline' },
        { label: 'Workspace', value: 'Active' },
        { label: 'Tokens', value: Number(totalTokens || 0).toLocaleString() }
      ]

  const quickActions = isAdmin
    ? [
        { to: '/tenants', title: 'Open tenant list', description: 'Manage workspaces, keys, and plan context.' },
        { to: '/billing', title: 'Review revenue', description: 'Track plan distribution and payment activity.' },
        { to: '/system-health', title: 'Check health', description: 'See database, Redis, provider, and WebSocket status.' }
      ]
    : [
        { to: '/playground', title: 'Run a prompt', description: 'Send a new request from the cleaner playground.' },
        { to: '/playground-library', title: 'Reuse saved prompts', description: 'Replay the prompts that already work well.' },
        { to: '/billing', title: 'Review plan limits', description: 'See request allowance and billing cycle details.' }
      ]

  const feedItems = isAdmin
    ? (adminHome?.notifications || []).slice(0, 4).map((item) => ({
        title: item.title,
        detail: item.detail,
        tone: item.tone,
        timestamp: item.timestamp
      }))
    : [
        { title: 'Cache savings', detail: `You have saved $${Number(cacheSavingsUsd || 0).toFixed(4)} through reuse so far.`, tone: 'positive' },
        { title: 'Prompt reliability', detail: `${errorCount || 0} error events recorded across your recent requests.`, tone: errorCount > 0 ? 'warning' : 'positive' },
        { title: 'Workspace speed', detail: `Average response time is ${avgLatency || 0} ms.`, tone: 'neutral' }
      ]

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={isAdmin ? 'Admin overview' : 'Workspace overview'}
        title={isAdmin ? 'Operations command center' : 'Workspace command center'}
        description={isAdmin
          ? 'A cleaner admin surface with business signals first and dedicated pages for tenant, billing, and infrastructure detail.'
          : 'A lighter dashboard focused on usage, savings, and the next best action.'
        }
        meta={heroMeta}
      />

      <div className="hero-panel">
        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Today&apos;s posture</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {isAdmin ? 'High-signal operations, without the clutter.' : 'Your prompt workspace, cleaner and easier to scan.'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {isAdmin
                ? `Track ${tenantCount || 0} workspaces, live system status, and revenue performance from a tighter command view.`
                : 'Monitor request volume, cache savings, and response quality while keeping the rest of the workflow in dedicated pages.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/60 bg-white/65 px-4 py-4 dark:border-white/5 dark:bg-slate-950/45">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Requests</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{Number(totalRequests || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/65 px-4 py-4 dark:border-white/5 dark:bg-slate-950/45">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cache savings</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">${Number(cacheSavingsUsd || 0).toFixed(4)}</p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/65 px-4 py-4 dark:border-white/5 dark:bg-slate-950/45">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{isAdmin ? 'Revenue' : 'Errors'}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                {isAdmin ? `Rs ${Number(adminBilling?.monthlyRevenueInr || 0).toLocaleString()}` : errorCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={totalRequests} accentColor="indigo" icon={ICONS.chart} loading={loading} />
        <StatCard label="Cache Hit Rate" value={cacheHitRate} unit="%" accentColor="cyan" icon={ICONS.bolt} loading={loading} />
        <StatCard label="Avg Latency" value={avgLatency} unit="ms" accentColor="amber" icon={ICONS.clock} loading={loading} />
        <StatCard label={isAdmin ? 'Platform Cost' : 'Total Cost'} value={`$${Number(totalCost || 0).toFixed(4)}`} accentColor="violet" icon={ICONS.coin} loading={loading} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard title="Cost and usage trend" subtitle="One strong chart beats a wall of competing cards.">
          <CostChart data={costOverTime} />
        </SurfaceCard>

        <SurfaceCard title="Quick actions" subtitle="Fast paths into the surfaces that matter most.">
          <div className="grid gap-3">
            {quickActions.map((item) => (
              <ActionTile key={item.to} {...item} />
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <SurfaceCard title={isAdmin ? 'Admin feed' : 'Workspace feed'} subtitle="A smaller event stream adds confidence without adding noise.">
          <div className="space-y-3">
            {feedItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No new updates right now.
              </div>
            ) : feedItems.map((item, index) => (
              <FeedItem key={`${item.title}-${index}`} {...item} />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title={isAdmin ? 'Business snapshot' : 'Workspace snapshot'} subtitle="Keep the supporting numbers compact and readable.">
          <div className="grid gap-3">
            {(isAdmin
              ? [
                  ['Paid workspaces', adminBilling?.activePaidSubscriptions || 0],
                  ['Total revenue', `Rs ${Number(adminBilling?.totalRevenueInr || 0).toLocaleString()}`],
                  ['Failed payments', adminHome?.failedPayments || 0],
                  ['System status', systemHealth?.overallStatus || 'Unknown']
                ]
              : [
                  ['Requests', Number(totalRequests || 0).toLocaleString()],
                  ['Saved prompts', 'Available in library'],
                  ['Cache savings', `$${Number(cacheSavingsUsd || 0).toFixed(4)}`],
                  ['Errors', errorCount || 0]
                ]).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{value}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-6">
        <RequestTable requests={recentRequests} onSelectRequest={(item) => setSelectedRequestId(item.id)} />
      </div>

      <RequestDetailDrawer requestId={selectedRequestId} open={Boolean(selectedRequestId)} onClose={() => setSelectedRequestId(null)} />
    </div>
  )
}
