import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useStore from '../store/useStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setToken, setUser } = useStore()
  const navigate = useNavigate()

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (isRegister) {
      if (!email || !username || !password || !confirmPassword) {
        setError('Please fill all fields')
        return
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    } else if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const payload = isRegister
        ? { email, username, password, tenantId: generateUUID() }
        : { email, password }

      const res = await api.post(endpoint, payload)
      setToken(res.data.token)
      setUser({ email: res.data.email, username: res.data.username, role: res.data.role, tenantId: res.data.tenantId })
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isRegister ? 'Registration failed. Please try again.' : 'Invalid credentials. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.12),transparent_20%),linear-gradient(180deg,#06101d_0%,#0a1320_100%)]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.08fr,0.92fr]">
          <div className="hidden lg:flex flex-col justify-between rounded-[2.25rem] border border-white/8 bg-white/6 p-10 text-white shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-white to-sky-200 text-slate-950 shadow-[0_24px_60px_rgba(14,165,233,0.2)]">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Premium gateway control</p>
              <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight tracking-tight">Operate prompts, billing, and tenants from one polished workspace.</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">A cleaner shell, focused pages, premium settings, and better visibility across requests, limits, and system health.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Prompt speed', 'Run prompts with cleaner routing and visibility.'],
                ['Workspace billing', 'Track plan value, cycle status, and request limits.'],
                ['Admin clarity', 'Separate tenant, revenue, and health surfaces.']
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[2.25rem] border border-white/10 bg-white/8 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-white to-sky-200 text-slate-950 shadow-[0_24px_60px_rgba(14,165,233,0.2)]">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">NeuralProxy</p>
                <p className="mt-1 text-sm text-slate-300">{isRegister ? 'Create your workspace' : 'Sign in to your workspace'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              {isRegister ? (
                <label className="grid gap-2 text-sm text-slate-300">
                  <span className="font-medium">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                    placeholder="Enter username"
                  />
                </label>
              ) : null}

              <label className="grid gap-2 text-sm text-slate-300">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                  placeholder="Enter your email"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                <span className="font-medium">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>

              {isRegister ? (
                <label className="grid gap-2 text-sm text-slate-300">
                  <span className="font-medium">Confirm password</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                    placeholder="Confirm your password"
                  />
                </label>
              ) : null}

              {!isRegister ? (
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm font-medium text-sky-300 hover:text-sky-200">
                    Forgot password?
                  </Link>
                </div>
              ) : null}

              {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}

              <button className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100" disabled={loading}>
                {loading ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              {isRegister ? 'Already have an account?' : 'Need a workspace?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister((value) => !value)
                  setError('')
                  setUsername('')
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="font-semibold text-sky-300 hover:text-sky-200"
              >
                {isRegister ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
