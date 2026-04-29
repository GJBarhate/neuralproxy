import React from 'react'
import { Link } from 'react-router-dom'
import SurfaceCard from './SurfaceCard'

function Step({ done, title, description, to, cta }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-4 py-4">
      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${done ? 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500'}`}>
        {done ? (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {!done && to ? (
        <Link
          to={to}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  )
}

export default function OnboardingChecklist({ user, summary, tenantCount, onDismiss }) {
  const steps = user?.role === 'ADMIN'
    ? [
        {
          done: Number(tenantCount || 0) > 1,
          title: 'Create your first customer workspace',
          description: 'Set up separate tenants so billing, keys, and analytics stay organized.',
          to: '/tenants',
          cta: 'Manage tenants'
        },
        {
          done: Number(summary?.totalRequests || 0) > 0,
          title: 'Drive live traffic',
          description: 'Use the playground or API keys so the operations dashboard starts filling with real data.',
          to: '/playground',
          cta: 'Open playground'
        },
        {
          done: false,
          title: 'Review revenue and health',
          description: 'Keep an eye on billing activity, cache savings, and system readiness in one place.',
          to: '/billing',
          cta: 'Open billing'
        },
        {
          done: false,
          title: 'Check system health',
          description: 'Verify database, Redis, provider, and WebSocket readiness before scaling.',
          to: '/system-health',
          cta: 'Open health'
        }
      ]
    : [
        {
          done: Number(summary?.totalRequests || 0) > 0,
          title: 'Send your first prompt',
          description: 'Use the playground to verify routing, latency, and model response quality.',
          to: '/playground',
          cta: 'Open playground'
        },
        {
          done: Number(summary?.cacheHitRate || 0) > 0,
          title: 'Generate a cache hit',
          description: 'Repeat a prompt so you can immediately see cost savings in your workspace.',
          to: '/playground-library',
          cta: 'View history'
        },
        {
          done: false,
          title: 'Review your plan limits',
          description: 'See request limits, token allowance, and billing cycle in one place.',
          to: '/account',
          cta: 'Open usage'
        },
        {
          done: false,
          title: 'Save your best prompts',
          description: 'Turn useful prompts into repeatable workflows for faster reuse later.',
          to: '/playground-library',
          cta: 'Open library'
        }
      ]

  return (
    <SurfaceCard
      title="Quick start checklist"
      subtitle="A short guided path so each role sees value quickly."
      action={
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Dismiss
        </button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {steps.map((step) => <Step key={step.title} {...step} />)}
      </div>
    </SurfaceCard>
  )
}
