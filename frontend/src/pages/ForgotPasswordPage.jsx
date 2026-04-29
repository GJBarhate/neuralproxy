import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setMessage(res.data?.message || 'Reset link prepared')
      setResetUrl(res.data?.resetUrl || '')
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Could not prepare reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_28%),linear-gradient(180deg,#06101d_0%,#0b1320_100%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/8 p-8 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">Recovery</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Reset your password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Enter your account email and we’ll prepare a secure reset link for this environment.</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gauravjbarhate554@gmail.com"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
            />
            <button className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100" disabled={loading}>
              {loading ? 'Preparing...' : 'Prepare reset link'}
            </button>
          </form>

          {message ? <p className="mt-5 text-sm text-slate-300">{message}</p> : null}
          {resetUrl ? (
            <Link to={resetUrl} className="mt-4 inline-flex text-sm font-medium text-sky-300 hover:text-sky-200">
              Open reset screen
            </Link>
          ) : null}

          <Link to="/login" className="mt-8 inline-flex text-sm text-slate-400 hover:text-white">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
