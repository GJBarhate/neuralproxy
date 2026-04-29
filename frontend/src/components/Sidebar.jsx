import React from 'react'
import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import UserIdentity from './UserIdentity'

function SidebarLink({ item, compact = false, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      title={compact ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-300 ${
          isActive
            ? 'bg-white text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-white/10 dark:text-white'
            : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
        } ${compact ? 'justify-center lg:px-2.5' : ''}`
      }
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconWrap}`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
        </svg>
      </span>
      <div className={`min-w-0 flex-1 ${compact ? 'lg:hidden' : ''}`}>
        <p>{item.label}</p>
        {item.caption ? <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{item.caption}</p> : null}
      </div>
      {compact ? (
        <span className="pointer-events-none absolute left-[calc(100%+0.85rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 opacity-0 shadow-[0_16px_50px_rgba(15,23,42,0.14)] transition duration-200 group-hover:opacity-100 dark:border-slate-800 dark:bg-[#09111c]/95 dark:text-slate-200 lg:block">
          {item.label}
        </span>
      ) : null}
    </NavLink>
  )
}

export default function Sidebar({
  user,
  wsConnected,
  isAdmin,
  navGroups,
  isSidebarOpen,
  isDesktop,
  profileMenuOpen,
  onToggleProfileMenu,
  onNavigateHome,
  onNavigateSettings,
  onRequestQuickActions,
  onRequestKeyModal,
  onRequestLogout,
  onCloseMobile
}) {
  const compact = false

  return (
    <aside
      className={`flex h-full w-64 flex-col overflow-y-auto rounded-[2rem] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))] p-5 shadow-[0_32px_100px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(7,11,18,0.96),rgba(7,13,23,0.9))] dark:shadow-[0_36px_120px_rgba(2,6,23,0.48)]`}
    >
      <div className={`flex items-center ${compact ? 'justify-center' : 'justify-between'}`}>
        <button type="button" onClick={onNavigateHome} className="flex items-center gap-3 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#0ea5e9] text-white shadow-[0_24px_60px_rgba(29,78,216,0.35)]">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">NeuralProxy</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isAdmin ? 'Admin command center' : 'Workspace control'}</p>
          </div>
        </button>
        <button type="button" onClick={onCloseMobile} className="rounded-xl p-2 text-slate-400 lg:hidden">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative mt-6 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-white/5">
        <div className="flex items-start gap-3">
          <UserIdentity
            user={user}
            compact={false}
            subtitle={wsConnected ? 'Live sync active' : 'Offline mode'}
            showSecondary
            className="flex-1"
          />
          <button
            type="button"
            onClick={onToggleProfileMenu}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Open profile menu"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5A1.5 1.5 0 1010 8.5a1.5 1.5 0 000 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
          </button>
        </div>
        {profileMenuOpen ? (
          <div className="absolute right-4 top-[4.5rem] z-10 w-56 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#09111c]/95">
            <button
              type="button"
              onClick={onNavigateSettings}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
                </svg>
              </span>
              Profile settings
            </button>
            <button
              type="button"
              onClick={onRequestLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              Sign out
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{group.title}</p>
            <div className="space-y-2">
              {group.items.map((item) => (
                <SidebarLink key={item.to} item={item} compact={false} onClick={onCloseMobile} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          onClick={onRequestQuickActions}
          className="shell-utility-button transition-all duration-300"
        >
          <span>Quick actions</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">Ctrl K</span>
        </button>
        <button
          type="button"
          onClick={onRequestKeyModal}
          className="shell-utility-button transition-all duration-300"
        >
          <span>My Gemini key</span>
          <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-7.9 1H4v4h3v3h3v3h4l2.4-2.4A4 4 0 0015 7z" />
          </svg>
        </button>
        <div className="shell-utility-button transition-all duration-300">
          <span>Theme</span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={onRequestLogout}
          className="flex w-full items-center justify-between rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-600 transition-all duration-300 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
        >
          <span>Sign out</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
