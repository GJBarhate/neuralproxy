import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function ApiKeyModal({ isOpen, onClose }) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validStatus, setValidStatus] = useState(null)
  const [toast, setToast] = useState('')
  const [validationMessage, setValidationMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('np-user-gemini-key') || ''
      setKey(saved)
      setValidStatus(null)
      setToast('')
      setValidationMessage('')
    }
  }, [isOpen])

  async function handleValidate() {
    if (!key.trim()) return
    setValidating(true)
    setValidStatus(null)
    setValidationMessage('')
    try {
      const res = await api.get(`/gateway/validate-key?key=${encodeURIComponent(key.trim())}`)
      if (res.data.valid) {
        setValidStatus('valid')
        setValidationMessage('Valid Gemini API key.')
      } else {
        setValidStatus('invalid')
      }
    } catch (err) {
      setValidStatus('invalid')
      setValidationMessage(err.response?.data?.error || 'Could not validate key.')
    } finally {
      setValidating(false)
    }
  }

  function handleSave() {
    localStorage.setItem('np-user-gemini-key', key.trim())
    setToast('Key saved. Use "My Key" mode in the Playground.')
    setTimeout(() => setToast(''), 3000)
  }

  function handleClear() {
    localStorage.removeItem('np-user-gemini-key')
    setKey('')
    setValidStatus(null)
    setValidationMessage('')
    setToast('Key cleared.')
    setTimeout(() => setToast(''), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#13131A] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up border border-slate-100 dark:border-slate-800/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Gemini API Key</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Save your personal Gemini API key for use in the Playground. It is stored only in your browser and validated before use.
        </p>

        <div className="relative mb-3">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setValidStatus(null); setValidationMessage('') }}
            placeholder="AIza..."
            className="w-full font-mono bg-slate-50 dark:bg-[#0A0A0F] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showKey ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={handleValidate}
          disabled={validating || !key.trim()}
          className="w-full mb-3 py-2 rounded-xl text-sm font-medium border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {validating ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Validating...</>
          ) : 'Validate Key'}
        </button>

        {validStatus === 'valid' && (
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {validationMessage || 'Key valid'}
          </div>
        )}
        {validStatus === 'invalid' && (
          <div className="mb-3 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            {validationMessage || 'Invalid key, please check and try again'}
          </div>
        )}

        {toast && (
          <div className="mb-3 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 animate-slide-in">
            {toast}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save Key
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
