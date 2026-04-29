import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ProviderBadge from '../components/ProviderBadge'
import useStore from '../store/useStore'

export default function PlaygroundPage() {
  const { playgroundDraft, clearPlaygroundDraft } = useStore()
  const [prompt, setPrompt] = useState('')
  const [keySource, setKeySource] = useState('system')
  const [userKey, setUserKey] = useState('')
  const [showUserKey, setShowUserKey] = useState(false)
  const [validStatus, setValidStatus] = useState(null)
  const [validationMessage, setValidationMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const submitRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('np-user-gemini-key') || ''
    setUserKey(saved)
  }, [])

  useEffect(() => {
    if (!playgroundDraft) return
    setPrompt(playgroundDraft)
    clearPlaygroundDraft()
  }, [playgroundDraft, clearPlaygroundDraft])

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prompt, keySource, userKey, validStatus, loading])

  function getPromptErrorMessage(err) {
    const status = err?.response?.status
    const apiMessage = err?.response?.data?.error || err?.response?.data?.message

    if (status === 403) {
      return keySource === 'user'
        ? apiMessage || 'This Gemini key was rejected. Validate it again or switch to system keys.'
        : apiMessage || 'System-key access was denied. Check your workspace plan, role, or active Gemini key setup.'
    }

    if (status === 400) {
      return apiMessage || 'The prompt request is invalid. Check the input and try again.'
    }

    if (status === 429) {
      return apiMessage || 'Too many requests right now. Wait a moment and try again.'
    }

    return apiMessage || 'An error occurred. Please try again.'
  }

  async function validateKey(k) {
    if (!k.trim()) return false
    setValidStatus('validating')
    setValidationMessage('')
    try {
      const res = await api.get(`/gateway/validate-key?key=${encodeURIComponent(k.trim())}`)
      if (res.data.valid) {
        setValidStatus('valid')
        setValidationMessage('Valid Gemini API key.')
        return true
      }
      setValidStatus('invalid')
      return false
    } catch (err) {
      setValidStatus('invalid')
      setValidationMessage(err.response?.data?.error || 'Could not validate key.')
      return false
    }
  }

  async function handleSubmit() {
    if (!prompt.trim() || loading) return
    setError('')

    if (keySource === 'user') {
      if (validStatus !== 'valid') {
        const ok = await validateKey(userKey)
        if (!ok) {
          setError('Please enter a valid Gemini API key.')
          return
        }
      }
    }

    setLoading(true)
    setResult(null)
    try {
      const headers = {}
      if (keySource === 'user' && userKey.trim()) {
        headers['X-User-Gemini-Key'] = userKey.trim()
      }
      const res = await api.post('/gateway/prompt', { prompt: prompt.trim() }, { headers })
      setResult(res.data)
    } catch (err) {
      setError(getPromptErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSavePrompt() {
    if (!prompt.trim()) return
    setSavingPrompt(true)
    setSaveMessage('')
    try {
      await api.post('/playground/saved-prompts', {
        title: `Prompt ${new Date().toLocaleDateString()}`,
        prompt: prompt.trim(),
        tags: keySource === 'user' ? 'personal-key' : 'system-key'
      })
      setSaveMessage('Prompt saved to your library.')
      setTimeout(() => setSaveMessage(''), 2500)
    } catch {
      setSaveMessage('Could not save prompt right now.')
    } finally {
      setSavingPrompt(false)
    }
  }

  const MAX_CHARS = 4000
  const charPct = prompt.length / MAX_CHARS
  const charColor = charPct > 0.9 ? 'text-rose-500' : 'text-slate-400'

  return (
    <div className="page-shell">
      <div className="mb-4 flex flex-col gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/65 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950/45 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-2xl">Prompt playground</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500">Mode</span>
              <span className="ml-2 text-slate-900 dark:text-slate-100">{keySource === 'user' ? 'Personal key' : 'System keys'}</span>
            </div>
            <div className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
              <span className="text-slate-400 dark:text-slate-500">Send</span>
              <span className="ml-2 text-slate-900 dark:text-slate-100">Ctrl+Enter</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <button type="button" onClick={handleSavePrompt} disabled={savingPrompt || !prompt.trim()} className="button-secondary justify-center">
            {savingPrompt ? 'Saving...' : 'Save prompt'}
          </button>
          <Link to="/playground-library" className="button-primary justify-center">Open library</Link>
        </div>
      </div>

      {saveMessage ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">{saveMessage}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5">
        <div className="lg:col-span-2">
          <div className="panel-surface lg:sticky lg:top-24">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prompt</label>
              <span className={`text-xs font-mono ${charColor}`}>{prompt.length}/{MAX_CHARS}</span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
              rows={6}
              placeholder="Ask anything..."
              className="w-full font-mono text-sm bg-slate-50 dark:bg-[#0A0A0F] border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
            />

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Key Source</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 gap-1">
                <button
                  onClick={() => setKeySource('system')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    keySource === 'system'
                      ? 'bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  System Keys
                </button>
                <button
                  onClick={() => setKeySource('user')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    keySource === 'user'
                      ? 'bg-white dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  My Key
                </button>
              </div>

              {keySource === 'system' && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Using round-robin rotation across configured Gemini keys.
                </p>
              )}

              {keySource === 'user' && (
                <div className="mt-3 animate-slide-up">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showUserKey ? 'text' : 'password'}
                        value={userKey}
                        onChange={(e) => { setUserKey(e.target.value); setValidStatus(null); setValidationMessage('') }}
                        placeholder="AIza..."
                        className="w-full font-mono text-sm bg-slate-50 dark:bg-[#0A0A0F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => validateKey(userKey)}
                      disabled={validStatus === 'validating' || !userKey.trim()}
                      className="text-xs px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {validStatus === 'validating' ? '...' : 'Validate'}
                    </button>
                  </div>
                  <div className="mt-2 text-xs">
                    {validStatus === null && <span className="text-slate-400">Your key is validated before use and never stored on our servers.</span>}
                    {validStatus === 'validating' && <span className="text-slate-500 flex items-center gap-1">Validating...</span>}
                    {validStatus === 'valid' && <span className="text-emerald-600 dark:text-emerald-400">{validationMessage || 'Key valid'}</span>}
                    {validStatus === 'invalid' && <span className="text-rose-500 dark:text-rose-400">{validationMessage || 'Invalid key, please check and retry'}</span>}
                  </div>
                </div>
              )}
            </div>

            <button
              ref={submitRef}
              onClick={handleSubmit}
              disabled={loading || !prompt.trim() || (keySource === 'user' && validStatus !== 'valid' && validStatus !== null && validStatus !== 'validating')}
              className="button-primary mt-3 w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Send Prompt'}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">Ctrl+Enter to send</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="panel-surface min-h-[280px] sm:min-h-[320px]">
            {!result && !loading && !error && (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400 sm:h-52">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 animate-float">
                  <svg className="h-7 w-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Send a prompt to see the response</p>
                <p className="mt-1 text-xs text-slate-500">Results will appear here</p>
              </div>
            )}

            {loading && !result && (
              <div className="space-y-3">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-5/6" />
                <div className="h-4 skeleton rounded w-4/5" />
                <div className="h-4 skeleton rounded w-2/3" />
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/50 dark:bg-rose-900/20">
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-slide-up">
                <div className="mb-4 flex flex-wrap gap-2">
                  <ProviderBadge provider={result.provider} />
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full px-2.5 py-1">
                    {result.latencyMs}ms
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full px-2.5 py-1">
                    {result.tokenCount} tokens
                  </span>
                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs rounded-full px-2.5 py-1">
                    ${Number(result.costUsd || 0).toFixed(6)}
                  </span>
                </div>

                <div className="app-scrollbar relative max-h-[420px] overflow-y-auto rounded-xl bg-slate-50 p-4 dark:bg-[#0A0A0F] sm:max-h-[500px]">
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <pre className="pr-16 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {result.text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
