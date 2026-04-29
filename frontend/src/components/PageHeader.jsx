import React from 'react'
import Breadcrumbs from './Breadcrumbs'

export default function PageHeader({ eyebrow, title, description, actions, breadcrumbs = [], meta = [], compact = false }) {
  return (
    <div className={`page-header-card mb-6 flex flex-col md:flex-row md:justify-between ${compact ? 'gap-4 md:items-center' : 'gap-5 md:items-end'}`}>
      <div className="min-w-0">
        <Breadcrumbs items={breadcrumbs} />
        {eyebrow && (
          <p className={`${compact ? 'mt-2' : 'mt-3'} text-xs font-semibold uppercase tracking-[0.24em] text-slate-400`}>
            {eyebrow}
          </p>
        )}
        <h1 className={`${compact ? 'mt-1.5 text-[2rem] leading-tight' : 'mt-2 text-3xl'} font-semibold tracking-tight text-slate-950 dark:text-slate-50`}>
          {title}
        </h1>
        {description && (
          <p className={`${compact ? 'mt-2 max-w-3xl leading-7' : 'mt-3 max-w-2xl leading-6'} text-sm text-slate-600 dark:text-slate-400`}>
            {description}
          </p>
        )}
        {meta.length ? (
          <div className={`${compact ? 'mt-3' : 'mt-4'} flex flex-wrap gap-2`}>
            {meta.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">{item.label}</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className={`flex flex-wrap gap-3 ${compact ? 'md:self-end' : ''}`}>{actions}</div> : null}
    </div>
  )
}
