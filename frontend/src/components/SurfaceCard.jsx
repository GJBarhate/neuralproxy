import React from 'react'

export default function SurfaceCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`panel-surface ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title ? <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
