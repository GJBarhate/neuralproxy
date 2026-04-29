import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import SurfaceCard from '../components/SurfaceCard'
import useStore from '../store/useStore'

function SectionEmpty({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  )
}

export default function PromptLibraryPage() {
  const navigate = useNavigate()
  const { setPlaygroundDraft } = useStore()
  const [history, setHistory] = useState([])
  const [saved, setSaved] = useState([])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftTags, setDraftTags] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadAll() {
    const [historyRes, savedRes] = await Promise.all([
      api.get('/playground/history?limit=30'),
      api.get('/playground/saved-prompts')
    ])
    setHistory(historyRes.data || [])
    setSaved(savedRes.data || [])
  }

  useEffect(() => {
    loadAll()
  }, [])

  function replayPrompt(prompt) {
    setPlaygroundDraft(prompt)
    navigate('/playground')
  }

  async function savePrompt(e) {
    e.preventDefault()
    if (!draftTitle.trim() || !draftPrompt.trim()) return
    setSaving(true)
    try {
      await api.post('/playground/saved-prompts', {
        title: draftTitle.trim(),
        prompt: draftPrompt.trim(),
        tags: draftTags.trim()
      })
      setDraftTitle('')
      setDraftPrompt('')
      setDraftTags('')
      await loadAll()
    } finally {
      setSaving(false)
    }
  }

  async function deletePrompt(id) {
    await api.delete(`/playground/saved-prompts/${id}`)
    await loadAll()
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Prompt workflow"
        title="Prompt library"
        description="Use one dedicated page for history, saved prompts, and replay so the playground stays focused."
        breadcrumbs={[{ label: 'Workspace', to: '/' }, { label: 'Prompt library' }]}
        meta={[
          { label: 'Saved', value: saved.length || 0 },
          { label: 'History', value: history.length || 0 }
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard title="Saved prompts" subtitle="Keep reusable prompts close at hand for repeat workflows.">
          <form onSubmit={savePrompt} className="grid gap-3">
            <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Weekly summary prompt" className="input-field" />
            <textarea value={draftPrompt} onChange={(e) => setDraftPrompt(e.target.value)} rows={5} placeholder="Paste a prompt you want to reuse..." className="input-field min-h-32 resize-y" />
            <input value={draftTags} onChange={(e) => setDraftTags(e.target.value)} placeholder="analytics, support, sales" className="input-field" />
            <div className="flex justify-end">
              <button className="button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save prompt'}</button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {saved.length === 0 ? <SectionEmpty title="No saved prompts yet" description="Save your best prompts here, then replay them instantly in the playground." /> : saved.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200/80 px-5 py-4 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.tags || 'No tags'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => replayPrompt(item.prompt)} className="button-secondary">Replay</button>
                    <button type="button" onClick={() => deletePrompt(item.id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30">Delete</button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.prompt}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Recent history" subtitle="Replay recent requests without cluttering the main playground layout.">
          <div className="space-y-3">
            {history.length === 0 ? <SectionEmpty title="No history yet" description="Your recent prompts and requests will appear here after you use the playground." /> : history.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200/80 px-5 py-4 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.provider}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'} • {item.cacheHit ? 'Cache hit' : `${item.latencyMs || 0} ms`}
                    </p>
                  </div>
                  <button type="button" onClick={() => replayPrompt(item.prompt)} className="button-secondary">Replay</button>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.prompt}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
