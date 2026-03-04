import { BookOpen, Star, Eye, CheckCircle, Clock, Tag, Download, Upload } from 'lucide-react'
import { Paper } from '../types'
import { FilterState } from '../types'

interface Props {
  papers: Paper[]
  filter: FilterState
  onFilterChange: (f: Partial<FilterState>) => void
  onExport: () => void
  onImportJson: () => void
}

export default function Sidebar({ papers, filter, onFilterChange, onExport, onImportJson }: Props) {
  const allTags = Array.from(new Set(papers.flatMap((p) => p.tags))).sort()

  const counts = {
    all: papers.length,
    starred: papers.filter((p) => p.starred).length,
    unread: papers.filter((p) => p.status === 'unread').length,
    reading: papers.filter((p) => p.status === 'reading').length,
    read: papers.filter((p) => p.status === 'read').length,
  }

  function navItem(
    label: string,
    icon: React.ReactNode,
    active: boolean,
    count: number,
    onClick: () => void,
  ) {
    return (
      <button
        key={label}
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
          ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span className={`text-xs tabular-nums ${active ? 'text-indigo-500' : 'text-slate-400'}`}>{count}</span>
      </button>
    )
  }

  const isStatus = (s: string) => filter.status === s && filter.tag === null
  const isTag = (t: string) => filter.tag === t

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Main nav */}
        <div className="space-y-0.5">
          {navItem('すべて', <BookOpen size={15} />, isStatus('all'), counts.all, () =>
            onFilterChange({ status: 'all', tag: null })
          )}
          {navItem('スター付き', <Star size={15} />, isStatus('starred'), counts.starred, () =>
            onFilterChange({ status: 'starred', tag: null })
          )}
        </div>

        {/* By status */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-1">ステータス</p>
          <div className="space-y-0.5">
            {navItem('未読', <Clock size={15} />, isStatus('unread'), counts.unread, () =>
              onFilterChange({ status: 'unread', tag: null })
            )}
            {navItem('読書中', <Eye size={15} />, isStatus('reading'), counts.reading, () =>
              onFilterChange({ status: 'reading', tag: null })
            )}
            {navItem('読了', <CheckCircle size={15} />, isStatus('read'), counts.read, () =>
              onFilterChange({ status: 'read', tag: null })
            )}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-1 flex items-center gap-1">
              <Tag size={11} /> タグ
            </p>
            <div className="space-y-0.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => onFilterChange({ tag: isTag(t) ? null : t, status: 'all' })}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                    ${isTag(t) ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="flex-1 text-left truncate">#{t}</span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {papers.filter((p) => p.tags.includes(t)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-slate-200 space-y-1">
        <button
          onClick={onExport}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Download size={14} /> エクスポート
        </button>
        <button
          onClick={onImportJson}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Upload size={14} /> JSONインポート
        </button>
      </div>
    </aside>
  )
}
