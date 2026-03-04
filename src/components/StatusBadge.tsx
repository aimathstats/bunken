import { ReadingStatus } from '../types'

interface Props {
  status: ReadingStatus
  onClick?: () => void
}

const CONFIG: Record<ReadingStatus, { label: string; classes: string }> = {
  unread: { label: '未読', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  reading: { label: '読書中', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  read: { label: '読了', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export default function StatusBadge({ status, onClick }: Props) {
  const { label, classes } = CONFIG[status]
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${classes} ${onClick ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
    >
      {label}
    </span>
  )
}
