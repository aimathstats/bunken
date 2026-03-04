import { Search, X, ArrowUpDown } from 'lucide-react'
import { FilterState } from '../types'

interface Props {
  filter: FilterState
  onFilterChange: (f: Partial<FilterState>) => void
  resultCount: number
}

const SORT_OPTIONS: { value: FilterState['sortBy']; label: string }[] = [
  { value: 'createdAt', label: '追加日' },
  { value: 'updatedAt', label: '更新日' },
  { value: 'year', label: '出版年' },
  { value: 'title', label: 'タイトル' },
]

export default function SearchBar({ filter, onFilterChange, resultCount }: Props) {
  return (
    <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-white">
      {/* Search input */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filter.query}
          onChange={(e) => onFilterChange({ query: e.target.value })}
          placeholder="タイトル・著者・タグを検索…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
        />
        {filter.query && (
          <button
            onClick={() => onFilterChange({ query: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ArrowUpDown size={13} className="text-slate-400" />
        <select
          value={filter.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => onFilterChange({ sortDir: filter.sortDir === 'asc' ? 'desc' : 'asc' })}
          className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50"
          title={filter.sortDir === 'asc' ? '昇順' : '降順'}
        >
          {filter.sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Count */}
      <span className="text-xs text-slate-400 shrink-0 tabular-nums">{resultCount}件</span>
    </div>
  )
}
