import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import ThemeToggle from './ThemeToggle'
import ApiKeyModal from './ApiKeyModal'
import TopStatusBar from './TopStatusBar'

export default function Navbar() {
  const { user, logout, wsConnected } = useStore()
  const navigate = useNavigate()
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    setShowLogoutModal(false)
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
    }`

  const isAdmin = user?.role === 'ADMIN'
  const primaryLinks = isAdmin
    ? [
        { to: '/', label: 'Operations' },
        { to: '/billing', label: 'Revenue' },
        { to: '/tenants', label: 'Tenants' }
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/playground', label: 'Playground' },
        { to: '/playground-library', label: 'History' }
      ]

  const secondaryLinks = isAdmin
    ? [
        { to: '/playground-library', label: 'Library' },
        { to: '/system-health', label: 'Health' },
        { to: '/account', label: 'Workspace' }
      ]
    : [
        { to: '/account', label: 'Usage' },
        { to: '/billing', label: 'Plan' },
        { to: '/system-health', label: 'Health' }
      ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0A0F16]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_12px_30px_rgba(37,99,235,0.18)] flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-950 dark:text-slate-50">NeuralProxy</span>
            <div className="ml-2 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-slate-400'}`} />
              <span className="text-xs text-slate-500">{wsConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50/80 p-1 flex gap-1 dark:border-slate-800 dark:bg-slate-900/70">
              {primaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass}>{link.label}</NavLink>
              ))}
            </div>
            <div className="rounded-full border border-slate-200/80 bg-white/70 p-1 flex gap-1 dark:border-slate-800 dark:bg-slate-950/60">
              {secondaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass}>{link.label}</NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setKeyModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
              My Key
            </button>
            {user?.email && (
              <div
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold text-sm cursor-pointer hover:shadow-lg transition-shadow"
                title={user.email}
              >
                {(user.username || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setShowLogoutModal(true)}
              aria-label="Logout"
              className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="md:hidden w-9 h-9 rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-300"
            >
              <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div className="border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-800 dark:bg-[#0A0F16]/95 md:hidden">
            <div className="grid gap-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{isAdmin ? 'Admin' : 'Workspace'}</p>
              {primaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">More</p>
              {secondaryLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative z-10 w-full max-w-sm mx-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-in">
              <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 dark:from-rose-900/20 dark:to-orange-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign Out</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Are you sure?</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                  You will be logged out and redirected to the login page.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Session: <span className="font-mono">{user?.email}</span>
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 text-white font-medium hover:from-rose-600 hover:to-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TopStatusBar />
      <ApiKeyModal isOpen={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </>
  )
}
