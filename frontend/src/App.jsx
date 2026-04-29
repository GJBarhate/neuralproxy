import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import useStore from './store/useStore'
import useWebSocket from './hooks/useWebSocket'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'))
const TenantsPage = lazy(() => import('./pages/TenantsPage'))
const TenantDetailPage = lazy(() => import('./pages/TenantDetailPage'))
const PromptLibraryPage = lazy(() => import('./pages/PromptLibraryPage'))
const SystemHealthPage = lazy(() => import('./pages/SystemHealthPage'))
const BillingPage = lazy(() => import('./pages/BillingPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function ShellRoute({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

function AppInner() {
  const { theme, setTheme, token } = useStore()
  useWebSocket()

  useEffect(() => {
    setTheme(theme || 'dark')
  }, [theme, setTheme])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0F] transition-colors duration-300">
      <Suspense fallback={<div className="pt-28 px-6 text-sm text-slate-500 dark:text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<ShellRoute><DashboardPage /></ShellRoute>} />
          <Route path="/playground" element={<ShellRoute><PlaygroundPage /></ShellRoute>} />
          <Route path="/playground-library" element={<ShellRoute><PromptLibraryPage /></ShellRoute>} />
          <Route path="/system-health" element={<ShellRoute adminOnly><SystemHealthPage /></ShellRoute>} />
          <Route path="/billing" element={<ShellRoute><BillingPage /></ShellRoute>} />
          <Route path="/settings" element={<ShellRoute><SettingsPage /></ShellRoute>} />
          <Route path="/account" element={<Navigate to="/settings" replace />} />
          <Route path="/tenants" element={<ShellRoute adminOnly><TenantsPage /></ShellRoute>} />
          <Route path="/tenants/:tenantId" element={<ShellRoute adminOnly><TenantDetailPage /></ShellRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
