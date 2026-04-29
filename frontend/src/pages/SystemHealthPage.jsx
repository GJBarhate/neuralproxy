import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'
import StatusBadge from '../components/StatusBadge'

export default function SystemHealthPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/system/health').then((res) => setData(res.data))
  }, [])

  const cards = [
    ['Database', data?.database],
    ['Redis', data?.redis],
    ['WebSocket', data?.websocket],
    ['Provider', data?.provider]
  ]

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Operations"
        title="System health"
        description="A single page for infrastructure readiness so admins can spot issues before they reach users."
        breadcrumbs={[{ label: 'Overview', to: '/' }, { label: 'System health' }]}
        meta={[{ label: 'Overall', value: data?.overallStatus || 'Checking' }]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map(([label, value]) => (
          <SurfaceCard
            key={label}
            title={label}
            subtitle={value?.message || 'Status overview'}
            action={<StatusBadge status={String(value?.status || 'inactive').toUpperCase()} />}
          >
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {value ? Object.entries(value).map(([key, fieldValue]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
                  <span className="capitalize text-slate-500 dark:text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{String(fieldValue)}</span>
                </div>
              )) : <div className="h-24 rounded-2xl skeleton" />}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}
