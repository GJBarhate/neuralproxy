import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import ApiKeyModal from './ApiKeyModal'
import QuickActionPanel from './QuickActionPanel'
import Sidebar from './Sidebar'
import { getDisplayName } from '../utils/userDisplay'

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= breakpoint)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= breakpoint)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isDesktop
}

export default function AppShell({ children }) {
  const user = useStore((state) => state.user)
  const wsConnected = useStore((state) => state.wsConnected)
  const logout = useStore((state) => state.logout)
  const isSidebarOpen = useStore((state) => state.isSidebarOpen)
  const setSidebarOpen = useStore((state) => state.setSidebarOpen)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const isMobileDrawerOpen = !isDesktop && isSidebarOpen
  const isDesktopSidebarOpen = isDesktop && isSidebarOpen

  useEffect(() => {
    if (isMobileDrawerOpen || quickOpen || logoutOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileDrawerOpen, quickOpen, logoutOpen])

  useEffect(() => {
    setProfileMenuOpen(false)
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }, [isDesktop, location.pathname, setSidebarOpen])

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setQuickOpen(true)
      }

      if (event.key === 'Escape') {
        setQuickOpen(false)
        setProfileMenuOpen(false)
        if (!isDesktop) {
          setSidebarOpen(false)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, setSidebarOpen])

  const isAdmin = user?.role === 'ADMIN'
  const displayName = getDisplayName(user)

  const navGroups = useMemo(
    () => (
      isAdmin
        ? [
            {
              title: 'Command',
              items: [
                { to: '/', label: 'Overview', caption: 'Platform pulse', icon: 'M3 12h18M3 6h18M3 18h18', iconWrap: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
                { to: '/tenants', label: 'Tenants', caption: 'Workspaces and access', icon: 'M17 20h5V4H2v16h5m10 0v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6m10 0H7', iconWrap: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
                { to: '/billing', label: 'Billing', caption: 'Revenue and plans', icon: 'M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10v10m0-10c2.21 0 4 .895 4 2M12 8c-2.21 0-4 .895-4 2m0 0v4c0 1.105 1.79 2 4 2s4-.895 4-2v-4', iconWrap: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
                { to: '/system-health', label: 'Health', caption: 'Infrastructure status', icon: 'M3 13h4l3 6 4-12 3 6h4', iconWrap: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' }
              ]
            },
            {
              title: 'Workspace',
              items: [
                { to: '/playground', label: 'Playground', caption: 'Run and compare prompts', icon: 'M14.752 11.168l-6.518-3.758A1 1 0 007 8.277v7.446a1 1 0 001.234.97l6.518-1.63A1 1 0 0015.5 14.09v-2.056a1 1 0 00-.748-.966z', iconWrap: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
                { to: '/playground-library', label: 'Library', caption: 'Saved prompts and history', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5 4.462 5 2 6.343 2 8v11c0-1.657 2.462-3 5.5-3 1.746 0 3.332.477 4.5 1.253m0-11.747C13.168 5.477 14.754 5 16.5 5c3.038 0 5.5 1.343 5.5 3v11c0-1.657-2.462-3-5.5-3-1.746 0-3.332.477-4.5 1.253', iconWrap: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
                { to: '/settings', label: 'Settings', caption: 'Profile and security', icon: 'M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.898 1.674 1.724 1.724 0 000 3.148 1.724 1.724 0 01-2.898 1.674 1.724 1.724 0 00-2.573 1.065 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.065 1.724 1.724 0 01-2.898-1.674 1.724 1.724 0 000-3.148A1.724 1.724 0 017.752 5.38a1.724 1.724 0 002.573-1.065z M12 15.25A3.25 3.25 0 1012 8.75a3.25 3.25 0 000 6.5z', iconWrap: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' }
              ]
            }
          ]
        : [
            {
              title: 'Workspace',
              items: [
                { to: '/', label: 'Dashboard', caption: 'Your AI gateway pulse', icon: 'M3 13h8V3H3v10zm10 8h8V3h-8v18zm-10 0h8v-6H3v6z', iconWrap: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
                { to: '/playground', label: 'Playground', caption: 'Compose and send prompts', icon: 'M14.752 11.168l-6.518-3.758A1 1 0 007 8.277v7.446a1 1 0 001.234.97l6.518-1.63A1 1 0 0015.5 14.09v-2.056a1 1 0 00-.748-.966z', iconWrap: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
                { to: '/playground-library', label: 'Library', caption: 'History and saved prompts', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5 4.462 5 2 6.343 2 8v11c0-1.657 2.462-3 5.5-3 1.746 0 3.332.477 4.5 1.253m0-11.747C13.168 5.477 14.754 5 16.5 5c3.038 0 5.5 1.343 5.5 3v11c0-1.657-2.462-3-5.5-3-1.746 0-3.332.477-4.5 1.253', iconWrap: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
                { to: '/billing', label: 'Billing', caption: 'Plans and limits', icon: 'M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-10v10m0-10c2.21 0 4 .895 4 2M12 8c-2.21 0-4 .895-4 2m0 0v4c0 1.105 1.79 2 4 2s4-.895 4-2v-4', iconWrap: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
                { to: '/settings', label: 'Settings', caption: 'Profile, security, keys', icon: 'M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.898 1.674 1.724 1.724 0 000 3.148 1.724 1.724 0 01-2.898 1.674 1.724 1.724 0 00-2.573 1.065 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.065 1.724 1.724 0 01-2.898-1.674 1.724 1.724 0 000-3.148A1.724 1.724 0 017.752 5.38a1.724 1.724 0 002.573-1.065z M12 15.25A3.25 3.25 0 1012 8.75a3.25 3.25 0 000 6.5z', iconWrap: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' }
              ]
            }
          ]
    ),
    [isAdmin]
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleNavigateSettings() {
    navigate('/settings')
    setProfileMenuOpen(false)
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  function handleRequestLogout() {
    setLogoutOpen(true)
    setProfileMenuOpen(false)
  }

  function handleOpenMobileSidebar() {
    setSidebarOpen(true)
  }

  function handleCloseMobileSidebar() {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  const activeTitle = navGroups.flatMap((group) => group.items).find((item) => item.to === location.pathname)?.label || 'Workspace'

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-transparent">
        <div className={`hidden h-full flex-shrink-0 overflow-hidden transition-all duration-300 lg:block ${isDesktopSidebarOpen ? 'w-64 p-4 pr-0' : 'w-0 p-0'}`}>
          <Sidebar
            user={user}
            wsConnected={wsConnected}
            isAdmin={isAdmin}
            navGroups={navGroups}
            isSidebarOpen={isSidebarOpen}
            isDesktop={isDesktop}
            profileMenuOpen={profileMenuOpen}
            onToggleProfileMenu={() => setProfileMenuOpen((value) => !value)}
            onNavigateHome={() => navigate('/')}
            onNavigateSettings={handleNavigateSettings}
            onRequestQuickActions={() => setQuickOpen(true)}
            onRequestKeyModal={() => setKeyModalOpen(true)}
            onRequestLogout={handleRequestLogout}
            onCloseMobile={handleCloseMobileSidebar}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-4 py-4 lg:pr-4">
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 pt-4 lg:px-6 lg:pt-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isDesktop ? toggleSidebar : handleOpenMobileSidebar}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 transition-all duration-300 hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
                aria-label={isDesktop ? (isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar') : 'Open sidebar'}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isDesktop && isSidebarOpen ? 'M5 6h14M5 12h14M5 18h14M15 6v12' : isDesktop ? 'M4 6h16M4 12h16M4 18h16M9 6v12' : 'M5 6h14M5 12h14M5 18h14'}
                  />
                </svg>
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">NeuralProxy</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{activeTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="hidden rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:text-slate-100 md:flex"
              >
                Search actions
              </button>
            </div>
          </header>

          <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5 lg:px-6">
            {children}
          </main>
        </div>

        {isMobileDrawerOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="h-full w-64 overflow-hidden p-4 pr-0">
              <Sidebar
                user={user}
                wsConnected={wsConnected}
                isAdmin={isAdmin}
                navGroups={navGroups}
                isSidebarOpen={isSidebarOpen}
                isDesktop={isDesktop}
                profileMenuOpen={profileMenuOpen}
                onToggleProfileMenu={() => setProfileMenuOpen((value) => !value)}
                onNavigateHome={() => navigate('/')}
                onNavigateSettings={handleNavigateSettings}
                onRequestQuickActions={() => setQuickOpen(true)}
                onRequestKeyModal={() => setKeyModalOpen(true)}
                onRequestLogout={handleRequestLogout}
                onCloseMobile={handleCloseMobileSidebar}
              />
            </div>
          </div>
        ) : null}

        {isMobileDrawerOpen ? (
          <button
            type="button"
            onClick={handleCloseMobileSidebar}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            aria-label="Close sidebar"
          />
        ) : null}
      </div>

      <QuickActionPanel
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        isAdmin={isAdmin}
        onOpenKey={() => setKeyModalOpen(true)}
        onLogout={handleLogout}
      />
      <ApiKeyModal isOpen={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
      {logoutOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setLogoutOpen(false)} aria-label="Close sign out dialog" />
          <div className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 shadow-[0_30px_120px_rgba(15,23,42,0.28)] dark:bg-[#0B111B]/96">
            <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.15),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.96))] px-6 py-5 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(28,25,23,0.96))]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Session</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Sign out of NeuralProxy?</h2>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                You'll leave the current workspace session and return to the login screen.
              </p>
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                Signed in as <span className="font-semibold text-slate-950 dark:text-slate-100">{displayName}</span>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/70">
              <button type="button" onClick={() => setLogoutOpen(false)} className="button-secondary flex-1 justify-center">
                Cancel
              </button>
              <button type="button" onClick={handleLogout} className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(244,63,94,0.28)] transition hover:translate-y-[-1px]">
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
