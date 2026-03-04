import { X } from 'lucide-react'

interface Props {
  tag: string
  onRemove?: () => void
  onClick?: () => void
  active?: boolean
}

export default function TagBadge({ tag, onRemove, onClick, active }: Props) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium border transition-colors
        ${active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      #{tag}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="ml-0.5 hover:text-indigo-900"
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}
