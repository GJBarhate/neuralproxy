import React from 'react'
import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <span className="text-slate-300 dark:text-slate-700">/</span> : null}
          {item.to ? (
            <Link to={item.to} className="transition hover:text-slate-900 dark:hover:text-slate-100">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-slate-100">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
