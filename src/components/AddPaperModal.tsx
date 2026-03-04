import { useState, useRef } from 'react'
import { X, Search, Plus, Loader2, Upload } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Paper, ReadingStatus } from '../types'
import { fetchByDoi } from '../utils/doi'
import { importBibtex } from '../utils/bibtex'
import TagBadge from './TagBadge'

interface Props {
  initial?: Paper | null
  onSave: (p: Paper) => void
  onImportBibtex: (papers: Paper[]) => void
  onClose: () => void
}

type Tab = 'manual' | 'bibtex'

function emptyForm(): Paper {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    title: '',
    authors: [],
    year: null,
    venue: '',
    volume: '',
    issue: '',
    pages: '',
    doi: '',
    url: '',
    abstract: '',
    tags: [],
    status: 'unread',
    starred: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export default function AddPaperModal({ initial, onSave, onImportBibtex, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('manual')
  const [form, setForm] = useState<Paper>(initial ?? emptyForm())
  const [doiInput, setDoiInput] = useState(initial?.doi ?? '')
  const [doiLoading, setDoiLoading] = useState(false)
  const [doiError, setDoiError] = useState('')
  const [authorInput, setAuthorInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [bibtexText, setBibtexText] = useState('')
  const [bibtexError, setBibtexError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!initial

  const set = (key: keyof Paper, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleDoiFetch() {
    if (!doiInput.trim()) return
    setDoiLoading(true)
    setDoiError('')
    try {
      const data = await fetchByDoi(doiInput)
      setForm((f) => ({
        ...f,
        ...data,
        id: f.id,
        tags: f.tags,
        status: f.status,
        starred: f.starred,
        notes: f.notes,
        createdAt: f.createdAt,
        updatedAt: new Date().toISOString(),
      }))
      setDoiInput(data.doi ?? doiInput)
    } catch (err) {
      setDoiError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setDoiLoading(false)
    }
  }

  function addAuthor() {
    const a = authorInput.trim()
    if (!a || form.authors.includes(a)) return
    set('authors', [...form.authors, a])
    setAuthorInput('')
  }

  function removeAuthor(a: string) {
    set('authors', form.authors.filter((x) => x !== a))
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function removeTag(t: string) {
    set('tags', form.tags.filter((x) => x !== t))
  }

  function handleSave() {
    if (!form.title.trim()) return
    onSave({ ...form, updatedAt: new Date().toISOString() })
  }

  function handleBibtexImport() {
    setBibtexError('')
    try {
      const papers = importBibtex(bibtexText)
      if (papers.length === 0) { setBibtexError('エントリが見つかりませんでした'); return }
      onImportBibtex(papers)
      onClose()
    } catch (err) {
      setBibtexError(err instanceof Error ? err.message : 'パースエラー')
    }
  }

  function handleBibtexFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBibtexText(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200">
          <h2 className="font-bold text-base text-slate-900">
            {isEdit ? '文献を編集' : '文献を追加'}
          </h2>
          <div className="flex items-center gap-3">
            {!isEdit && (
              <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
                {(['manual', 'bibtex'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1 rounded-md transition-all font-medium
                      ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t === 'manual' ? '手動入力' : 'BibTeX'}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
        </div>

        {tab === 'bibtex' && !isEdit ? (
          // ---- BibTeX import tab ----
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                <Upload size={14} /> .bibファイルを開く
              </button>
              <input ref={fileRef} type="file" accept=".bib,.txt" className="hidden" onChange={handleBibtexFile} />
            </div>
            <textarea
              value={bibtexText}
              onChange={(e) => setBibtexText(e.target.value)}
              placeholder={'@article{key,\n  title = {Paper Title},\n  author = {Doe, John},\n  year = {2024}\n}'}
              rows={12}
              className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            {bibtexError && <p className="text-xs text-red-500">{bibtexError}</p>}
            <button
              onClick={handleBibtexImport}
              disabled={!bibtexText.trim()}
              className="w-full py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              インポート
            </button>
          </div>
        ) : (
          // ---- Manual entry tab ----
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* DOI lookup */}
              {!isEdit && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">DOIから自動入力</label>
                  <div className="flex gap-2">
                    <input
                      value={doiInput}
                      onChange={(e) => setDoiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDoiFetch()}
                      placeholder="10.xxxx/xxxxx または https://doi.org/..."
                      className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={handleDoiFetch}
                      disabled={doiLoading || !doiInput.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                      {doiLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      取得
                    </button>
                  </div>
                  {doiError && <p className="text-xs text-red-500 mt-1">{doiError}</p>}
                </div>
              )}

              {/* Title */}
              <Field label="タイトル *">
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="論文タイトル"
                  className={inputCls}
                />
              </Field>

              {/* Authors */}
              <Field label="著者">
                <div className="flex gap-2 mb-2">
                  <input
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAuthor()}
                    placeholder="姓, 名  (Enterで追加)"
                    className={inputCls}
                  />
                  <button onClick={addAuthor} className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <Plus size={15} />
                  </button>
                </div>
                {form.authors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.authors.map((a) => (
                      <span key={a} className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 rounded-full px-2.5 py-1">
                        {a}
                        <button onClick={() => removeAuthor(a)} className="text-slate-400 hover:text-slate-700"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              {/* Year + Venue */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="出版年">
                  <input
                    type="number"
                    value={form.year ?? ''}
                    onChange={(e) => set('year', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="2024"
                    min={1900}
                    max={2100}
                    className={inputCls}
                  />
                </Field>
                <Field label="掲載誌 / 会議">
                  <input
                    value={form.venue}
                    onChange={(e) => set('venue', e.target.value)}
                    placeholder="Nature, NeurIPS..."
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Volume + Issue + Pages */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="巻 (Volume)">
                  <input value={form.volume} onChange={(e) => set('volume', e.target.value)} placeholder="12" className={inputCls} />
                </Field>
                <Field label="号 (Issue)">
                  <input value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="3" className={inputCls} />
                </Field>
                <Field label="ページ">
                  <input value={form.pages} onChange={(e) => set('pages', e.target.value)} placeholder="123-145" className={inputCls} />
                </Field>
              </div>

              {/* DOI + URL */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="DOI">
                  <input value={form.doi} onChange={(e) => set('doi', e.target.value)} placeholder="10.xxxx/xxxxx" className={inputCls} />
                </Field>
                <Field label="URL">
                  <input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." className={inputCls} />
                </Field>
              </div>

              {/* Abstract */}
              <Field label="Abstract">
                <textarea
                  value={form.abstract}
                  onChange={(e) => set('abstract', e.target.value)}
                  placeholder="論文のAbstract…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* Tags */}
              <Field label="タグ">
                <div className="flex gap-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="タグ名 (Enterで追加)"
                    className={inputCls}
                  />
                  <button onClick={addTag} className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <Plus size={15} />
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <TagBadge key={t} tag={t} onRemove={() => removeTag(t)} />
                    ))}
                  </div>
                )}
              </Field>

              {/* Status */}
              <Field label="読書状況">
                <div className="flex gap-2">
                  {(['unread', 'reading', 'read'] as ReadingStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => set('status', s)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all
                        ${form.status === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'text-slate-600 border-slate-300 hover:border-indigo-300'}`}
                    >
                      {s === 'unread' ? '未読' : s === 'reading' ? '読書中' : '読了'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {isEdit ? '更新' : '追加'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-slate-300'
