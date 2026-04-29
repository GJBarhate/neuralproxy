import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'
import UserIdentity from '../components/UserIdentity'
import useStore from '../store/useStore'
import { getDisplayName } from '../utils/userDisplay'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'keys', label: 'API Keys' }
]

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
          : 'bg-white/70 text-slate-600 hover:text-slate-950 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:text-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

function SnapshotCard({ label, value, note }) {
  return (
    <div className="rounded-[1.8rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_30%),rgba(255,255,255,0.78)] px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_30%),rgba(2,8,19,0.72)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 break-words text-[1.8rem] font-semibold leading-tight text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  )
}

export default function SettingsPage() {
  const { user, setUser, setToken } = useStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState([])
  const [summary, setSummary] = useState(null)
  const [billing, setBilling] = useState(null)
  const [profileForm, setProfileForm] = useState({ email: '', username: '' })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [userKey, setUserKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    setUserKey(localStorage.getItem('np-user-gemini-key') || '')
    Promise.all([
      api.get('/account/me'),
      api.get('/account/activity'),
      api.get('/analytics/my/summary')
    ])
      .then(([profileRes, activityRes, summaryRes]) => {
        setProfile(profileRes.data)
        setActivity(activityRes.data || [])
        setSummary(summaryRes.data || null)
        setProfileForm({
          email: profileRes.data?.email || '',
          username: profileRes.data?.username || ''
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab !== 'billing' || billing) return

    api.get('/billing/config')
      .then((billingRes) => {
        setBilling(billingRes.data || null)
      })
      .catch(() => {
        setBilling(null)
      })
  }, [activeTab, billing])

  const meta = useMemo(() => ([
    { label: 'Plan', value: billing?.currentSubscription?.planCode || profile?.plan || 'FREE' },
    { label: 'Role', value: profile?.role || user?.role || 'USER' },
    { label: 'Workspace', value: profile?.tenantName || 'Workspace' }
  ]), [billing?.currentSubscription?.planCode, profile?.plan, profile?.role, profile?.tenantName, user?.role])

  const profileIdentity = useMemo(() => ({
    username: profile?.username,
    email: profile?.email
  }), [profile?.email, profile?.username])

  async function saveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const res = await api.patch('/account/profile', profileForm)
      setProfile((current) => ({ ...current, email: res.data.email, username: res.data.username }))
      setUser({ ...(user || {}), email: res.data.email, username: res.data.username, role: res.data.role, tenantId: res.data.tenantId })
      if (res.data.token) {
        setToken(res.data.token)
      }
      setProfileMessage('Profile saved')
    } catch (error) {
      setProfileMessage(error.response?.data?.message || error.response?.data?.error || 'Could not save profile')
    } finally {
      setProfileSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New passwords do not match')
      return
    }
    setPasswordSaving(true)
    setPasswordMessage('')
    try {
      const res = await api.post('/account/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage(res.data?.message || 'Password updated')
    } catch (error) {
      setPasswordMessage(error.response?.data?.message || error.response?.data?.error || 'Could not update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  function saveUserKey() {
    localStorage.setItem('np-user-gemini-key', userKey)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Settings"
        title="Profile and workspace controls"
        description="One premium place for account details, security, billing visibility, and API key preferences."
        meta={meta}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[1.8rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_30%),rgba(255,255,255,0.78)] px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_30%),rgba(2,8,19,0.72)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Account</p>
          <div className="mt-4">
            <UserIdentity user={profileIdentity} subtitle="Identity and sign-in info" avatarSize="lg" />
          </div>
        </div>
        <SnapshotCard label="Workspace plan" value={billing?.currentSubscription?.planCode || profile?.plan || 'FREE'} note={`${profile?.activeApiKeys || 0} active workspace keys`} />
        <SnapshotCard label="Requests" value={Number(summary?.totalRequests || 0).toLocaleString()} note="Total routed prompts" />
        <SnapshotCard label="Savings" value={`$${Number(summary?.cacheSavingsUsd || 0).toFixed(4)}`} note="Estimated cache savings" />
      </div>

      <div className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-white/60 p-2 dark:border-slate-800 dark:bg-slate-950/45">
        <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <TabButton key={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
        ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          {activeTab === 'profile' ? (
            <SurfaceCard title="Account details" subtitle="Keep identity details crisp and current.">
              <div className="mb-5 rounded-[1.5rem] border border-slate-200/80 bg-white/65 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/45">
                <UserIdentity
                  user={profileIdentity}
                  subtitle={profile?.tenantName || 'Workspace profile'}
                  avatarSize="lg"
                />
              </div>
              <form onSubmit={saveProfile} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Email</span>
                    <input
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((current) => ({ ...current, email: e.target.value }))}
                      className="input-field"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Username</span>
                    <input
                      value={profileForm.username}
                      onChange={(e) => setProfileForm((current) => ({ ...current, username: e.target.value }))}
                      className="input-field"
                    />
                  </label>
                </div>
                {profileMessage ? (
                  <p className={`rounded-2xl border px-4 py-3 text-sm ${
                    profileMessage.toLowerCase().includes('saved')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300'
                  }`}
                  >
                    {profileMessage}
                  </p>
                ) : null}
                <div className="flex justify-end pt-2">
                  <button className="button-primary" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save profile'}</button>
                </div>
              </form>
            </SurfaceCard>
          ) : null}

          {activeTab === 'security' ? (
            <SurfaceCard title="Password and recovery" subtitle="A cleaner security surface with proper reset support.">
              <form onSubmit={changePassword} className="grid gap-4">
                <label className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Current password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))}
                    className="input-field"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">New password</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}
                      className="input-field"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">Confirm password</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                      className="input-field"
                    />
                  </label>
                </div>
                {passwordMessage ? (
                  <p className={`rounded-2xl border px-4 py-3 text-sm ${
                    passwordMessage.toLowerCase().includes('updated')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300'
                  }`}
                  >
                    {passwordMessage}
                  </p>
                ) : null}
                <div className="flex justify-end pt-2">
                  <button className="button-primary" disabled={passwordSaving}>{passwordSaving ? 'Updating...' : 'Update password'}</button>
                </div>
              </form>
            </SurfaceCard>
          ) : null}

          {activeTab === 'billing' ? (
            <SurfaceCard title="Current plan view" subtitle="Billing clarity without leaving settings.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/80 px-5 py-5 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Subscription</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-50">{billing?.currentSubscription?.planCode || 'FREE'}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{billing?.currentSubscription?.subscriptionStatus || 'Starter tier'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 px-5 py-5 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cycle end</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    {billing?.currentSubscription?.billingCycleEnd ? new Date(billing.currentSubscription.billingCycleEnd).toLocaleDateString() : 'Free plan'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Requests per minute: {billing?.currentSubscription?.limits?.requestsPerMinute || 60}</p>
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'keys' ? (
            <SurfaceCard title="Personal Gemini key" subtitle="Keep your personal key handy without mixing it into account settings.">
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Saved key</span>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={userKey}
                      onChange={(e) => setUserKey(e.target.value)}
                      className="input-field pr-12 font-mono"
                      placeholder="AIza..."
                    />
                    <button type="button" onClick={() => setShowKey((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </label>
                <div className="flex justify-end">
                  <button type="button" onClick={saveUserKey} className="button-primary">Save key locally</button>
                </div>
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <SurfaceCard title="Workspace snapshot" subtitle="Premium overview instead of scattered settings.">
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Workspace</p>
                <p className="mt-1 break-words font-medium text-slate-950 dark:text-slate-50">{profile?.tenantName || 'Workspace'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Display name</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{getDisplayName(profileIdentity)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Saved prompts</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{profile?.savedPrompts || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Cache hit rate</p>
                <p className="mt-1 font-medium text-slate-950 dark:text-slate-50">{summary?.cacheHitRate || 0}%</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Recent activity" subtitle="A small event feed adds polish and clarity.">
            <div className="space-y-3">
              {activity.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Activity will appear here once you use the workspace.
                </div>
              ) : activity.map((item, index) => (
                <div key={`${item.type}-${index}`} className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                    <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                      item.tone === 'positive' ? 'bg-emerald-400' : item.tone === 'warning' ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Now'}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  )
}
