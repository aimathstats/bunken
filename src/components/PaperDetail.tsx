import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Star, Pencil, Trash2, ExternalLink, Copy, ChevronDown } from 'lucide-react'
import { Paper, ReadingStatus } from '../types'
import StatusBadge from './StatusBadge'
import TagBadge from './TagBadge'
import { toApa, toMla } from '../utils/citation'
import { paperToBibtex } from '../utils/bibtex'

interface Props {
  paper: Paper
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdate: (p: Paper) => void
}

const STATUS_CYCLE: Record<ReadingStatus, ReadingStatus> = {
  unread: 'reading',
  reading: 'read',
  read: 'unread',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function PaperDetail({ paper, onClose, onEdit, onDelete, onUpdate }: Props) {
  const [notes, setNotes] = useState(paper.notes)
  const [citationOpen, setCitationOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const debouncedNotes = useDebounce(notes, 600)
  const isFirstRender = useRef(true)

  // Sync notes when paper changes
  useEffect(() => {
    setNotes(paper.notes)
    isFirstRender.current = true
  }, [paper.id, paper.notes])

  // Auto-save debounced notes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onUpdate({ ...paper, notes: debouncedNotes, updatedAt: new Date().toISOString() })
  }, [debouncedNotes]) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const authorStr = paper.authors.join('; ') || '—'
  const doiUrl = paper.doi ? `https://doi.org/${paper.doi}` : null

  const citations = [
    { key: 'bibtex', label: 'BibTeX', value: paperToBibtex(paper) },
    { key: 'apa', label: 'APA', value: toApa(paper) },
    { key: 'mla', label: 'MLA', value: toMla(paper) },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-start gap-2 p-4 border-b border-slate-200">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base text-slate-900 leading-snug">{paper.title || '(タイトルなし)'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{authorStr}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onUpdate({ ...paper, starred: !paper.starred, updatedAt: new Date().toISOString() })}
            className={`p-1.5 rounded-lg transition-colors ${paper.starred ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Star size={16} fill={paper.starred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <MetaRow label="年" value={paper.year?.toString() ?? '—'} />
          <MetaRow label="掲載誌/会議" value={paper.venue || '—'} />
          {paper.volume && <MetaRow label="巻号" value={`Vol.${paper.volume}${paper.issue ? ` No.${paper.issue}` : ''}`} />}
          {paper.pages && <MetaRow label="ページ" value={paper.pages} />}
          {paper.doi && (
            <div className="col-span-2">
              <span className="text-xs text-slate-400 block">DOI</span>
              <a
                href={doiUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                {paper.doi} <ExternalLink size={11} />
              </a>
            </div>
          )}
          {paper.url && !paper.doi && (
            <div className="col-span-2">
              <span className="text-xs text-slate-400 block">URL</span>
              <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 break-all">
                {paper.url} <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Status + Tags */}
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge
            status={paper.status}
            onClick={() => onUpdate({ ...paper, status: STATUS_CYCLE[paper.status], updatedAt: new Date().toISOString() })}
          />
          {paper.tags.map((t) => <TagBadge key={t} tag={t} />)}
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Abstract</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{paper.abstract}</p>
          </div>
        )}

        {/* Notes */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">メモ</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="メモを入力…（自動保存）"
            rows={6}
            className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-slate-300"
          />
        </div>

        {/* Citation export */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setCitationOpen(!citationOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            引用フォーマット
            <ChevronDown size={15} className={`transition-transform ${citationOpen ? 'rotate-180' : ''}`} />
          </button>
          {citationOpen && (
            <div className="border-t border-slate-200 divide-y divide-slate-100">
              {citations.map(({ key, label, value }) => (
                <div key={key} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">{label}</span>
                    <button
                      onClick={() => copy(value, key)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <Copy size={11} />
                      {copied === key ? 'コピー済み！' : 'コピー'}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-700 bg-slate-50 rounded p-2 whitespace-pre-wrap break-all font-mono">
                    {value}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-slate-400 block">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  )
}
