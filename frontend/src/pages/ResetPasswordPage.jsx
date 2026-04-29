import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const res = await api.post('/auth/reset-password', { token, password })
      setMessage(res.data?.message || 'Password reset successfully')
      setTimeout(() => navigate('/login'), 1200)
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_26%),linear-gradient(180deg,#08111c_0%,#0b1320_100%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/8 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">Security</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Choose a new password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Finish the reset with a fresh password for your account.</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
            />
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100" disabled={loading || !token}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>

          {!token ? <p className="mt-5 text-sm text-amber-300">This reset link is missing a token.</p> : null}
          {message ? <p className="mt-5 text-sm text-slate-300">{message}</p> : null}

          <Link to="/login" className="mt-8 inline-flex text-sm text-slate-400 hover:text-white">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
