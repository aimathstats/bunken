import { Star, ExternalLink, FileText } from 'lucide-react'
import { Paper, ReadingStatus } from '../types'
import StatusBadge from './StatusBadge'
import TagBadge from './TagBadge'

interface Props {
  paper: Paper
  selected: boolean
  query: string
  onSelect: () => void
  onStatusChange: (s: ReadingStatus) => void
  onStarToggle: () => void
}

function highlight(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(escaped, 'gi'), (m) => `<mark>${m}</mark>`)
}

const STATUS_CYCLE: Record<ReadingStatus, ReadingStatus> = {
  unread: 'reading',
  reading: 'read',
  read: 'unread',
}

export default function PaperCard({ paper, selected, query, onSelect, onStatusChange, onStarToggle }: Props) {
  const authorStr = paper.authors.length
    ? paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : '')
    : '著者不明'

  return (
    <div
      onClick={onSelect}
      className={`relative p-4 rounded-xl border cursor-pointer transition-all
        ${selected
          ? 'bg-indigo-50 border-indigo-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
    >
      {/* Top row */}
      <div className="flex items-start gap-2 mb-1">
        <h3
          className="flex-1 font-semibold text-sm text-slate-900 leading-snug line-clamp-2"
          dangerouslySetInnerHTML={{ __html: highlight(paper.title || '(タイトルなし)', query) }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onStarToggle() }}
          className={`shrink-0 mt-0.5 transition-colors ${paper.starred ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
        >
          <Star size={15} fill={paper.starred ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Authors + year + venue */}
      <p className="text-xs text-slate-500 mb-2 line-clamp-1">
        <span dangerouslySetInnerHTML={{ __html: highlight(authorStr, query) }} />
        {paper.year ? ` · ${paper.year}` : ''}
        {paper.venue ? ` · ${paper.venue}` : ''}
      </p>

      {/* Bottom row */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={paper.status} onClick={() => onStatusChange(STATUS_CYCLE[paper.status])} />
        {paper.tags.slice(0, 3).map((t) => (
          <TagBadge key={t} tag={t} />
        ))}
        {paper.tags.length > 3 && (
          <span className="text-xs text-slate-400">+{paper.tags.length - 3}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {paper.notes && <span title="メモあり"><FileText size={13} className="text-slate-400" /></span>}
          {(paper.doi || paper.url) && (
            <a
              href={paper.doi ? `https://doi.org/${paper.doi}` : paper.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-indigo-600"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
