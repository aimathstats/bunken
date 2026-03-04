import { useState } from 'react'
import { X, Copy, Download } from 'lucide-react'
import { Paper } from '../types'
import { papersToBibtex } from '../utils/bibtex'
import { exportJson } from '../storage'

interface Props {
  papers: Paper[]
  onClose: () => void
}

export default function ExportModal({ papers, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const bibtex = papersToBibtex(papers)

  async function copyAll() {
    await navigator.clipboard.writeText(bibtex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadBibtex() {
    const blob = new Blob([bibtex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bunken-${new Date().toISOString().slice(0, 10)}.bib`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200">
          <h2 className="font-bold text-base text-slate-900">エクスポート</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-slate-500">{papers.length}件の文献をエクスポートします</p>

          {/* BibTeX */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">BibTeX</span>
              <div className="flex gap-2">
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  <Copy size={12} />
                  {copied ? 'コピー済み！' : 'コピー'}
                </button>
                <button
                  onClick={downloadBibtex}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  <Download size={12} /> .bib ダウンロード
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto max-h-60 whitespace-pre-wrap break-all">
              {bibtex || '(文献なし)'}
            </pre>
          </div>

          {/* JSON backup */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 mb-2">ライブラリ全体のバックアップ（JSON）</p>
            <button
              onClick={() => exportJson(papers)}
              className="flex items-center gap-1.5 text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
            >
              <Download size={14} /> JSONをダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
