import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Paper, FilterState, ReadingStatus } from './types'
import { loadPapers, savePapers, importJson } from './storage'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import PaperCard from './components/PaperCard'
import PaperDetail from './components/PaperDetail'
import AddPaperModal from './components/AddPaperModal'
import ExportModal from './components/ExportModal'

const DEFAULT_FILTER: FilterState = {
  query: '',
  status: 'all',
  tag: null,
  sortBy: 'createdAt',
  sortDir: 'desc',
}

function applyFilter(papers: Paper[], filter: FilterState): Paper[] {
  let result = [...papers]

  // Status filter
  if (filter.status === 'starred') {
    result = result.filter((p) => p.starred)
  } else if (filter.status !== 'all') {
    result = result.filter((p) => p.status === filter.status)
  }

  // Tag filter
  if (filter.tag) {
    result = result.filter((p) => p.tags.includes(filter.tag!))
  }

  // Search query
  if (filter.query.trim()) {
    const q = filter.query.toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some((a) => a.toLowerCase().includes(q)) ||
        p.venue.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.abstract.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
    )
  }

  // Sort
  result.sort((a, b) => {
    let va: string | number
    let vb: string | number
    switch (filter.sortBy) {
      case 'year':
        va = a.year ?? 0
        vb = b.year ?? 0
        break
      case 'title':
        va = a.title.toLowerCase()
        vb = b.title.toLowerCase()
        break
      case 'updatedAt':
        va = a.updatedAt
        vb = b.updatedAt
        break
      default:
        va = a.createdAt
        vb = b.createdAt
    }
    if (va < vb) return filter.sortDir === 'asc' ? -1 : 1
    if (va > vb) return filter.sortDir === 'asc' ? 1 : -1
    return 0
  })

  return result
}

export default function App() {
  const [papers, setPapers] = useState<Paper[]>(() => loadPapers())
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editPaper, setEditPaper] = useState<Paper | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // Persist on change
  useEffect(() => {
    savePapers(papers)
  }, [papers])

  // Keyboard shortcut: Ctrl/Cmd+K → focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[placeholder*="検索"]')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const updatePapers = useCallback((next: Paper[]) => {
    setPapers(next)
  }, [])

  function addPaper(p: Paper) {
    updatePapers([...papers, p])
    setSelectedId(p.id)
    setShowAdd(false)
  }

  function updatePaper(p: Paper) {
    updatePapers(papers.map((x) => (x.id === p.id ? p : x)))
  }

  function deletePaper(id: string) {
    updatePapers(papers.filter((p) => p.id !== id))
    if (selectedId === id) setSelectedId(null)
    setDeleteConfirm(null)
  }

  function handleStatusChange(id: string, status: ReadingStatus) {
    updatePapers(papers.map((p) => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
  }

  function handleStarToggle(id: string) {
    updatePapers(papers.map((p) => p.id === id ? { ...p, starred: !p.starred, updatedAt: new Date().toISOString() } : p))
  }

  function handleImportBibtex(imported: Paper[]) {
    // Avoid duplicate DOIs
    const existingDois = new Set(papers.filter((p) => p.doi).map((p) => p.doi))
    const newPapers = imported.filter((p) => !p.doi || !existingDois.has(p.doi))
    updatePapers([...papers, ...newPapers])
  }

  async function handleImportJson() {
    jsonInputRef.current?.click()
  }

  async function onJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importJson(file)
      const existingIds = new Set(papers.map((p) => p.id))
      const newPapers = imported
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({ ...p, id: p.id || uuidv4() }))
      updatePapers([...papers, ...newPapers])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'インポートに失敗しました')
    }
    e.target.value = ''
  }

  const filteredPapers = useMemo(() => applyFilter(papers, filter), [papers, filter])
  const selectedPaper = useMemo(() => papers.find((p) => p.id === selectedId) ?? null, [papers, selectedId])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">文献管理</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setEditPaper(null); setShowAdd(true) }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> 追加
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          papers={papers}
          filter={filter}
          onFilterChange={(f) => setFilter((prev) => ({ ...prev, ...f }))}
          onExport={() => setShowExport(true)}
          onImportJson={handleImportJson}
        />

        {/* Main list */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <SearchBar
            filter={filter}
            onFilterChange={(f) => setFilter((prev) => ({ ...prev, ...f }))}
            resultCount={filteredPapers.length}
          />

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredPapers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <BookOpen size={40} className="opacity-30" />
                {papers.length === 0 ? (
                  <>
                    <p className="text-sm font-medium">文献がまだありません</p>
                    <button
                      onClick={() => { setEditPaper(null); setShowAdd(true) }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      最初の文献を追加する →
                    </button>
                  </>
                ) : (
                  <p className="text-sm">検索結果が見つかりませんでした</p>
                )}
              </div>
            ) : (
              filteredPapers.map((p) => (
                <PaperCard
                  key={p.id}
                  paper={p}
                  selected={p.id === selectedId}
                  query={filter.query}
                  onSelect={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  onStatusChange={(s) => handleStatusChange(p.id, s)}
                  onStarToggle={() => handleStarToggle(p.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedPaper && (
          <div className="w-96 shrink-0 border-l border-slate-200 overflow-hidden flex flex-col">
            <PaperDetail
              paper={selectedPaper}
              onClose={() => setSelectedId(null)}
              onEdit={() => { setEditPaper(selectedPaper); setShowAdd(true) }}
              onDelete={() => setDeleteConfirm(selectedPaper.id)}
              onUpdate={updatePaper}
            />
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-900 mb-2">削除の確認</h3>
            <p className="text-sm text-slate-600 mb-5">
              この文献を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => deletePaper(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showAdd && (
        <AddPaperModal
          initial={editPaper}
          onSave={(p) => {
            if (editPaper) {
              updatePaper(p)
              setShowAdd(false)
              setEditPaper(null)
            } else {
              addPaper(p)
            }
          }}
          onImportBibtex={handleImportBibtex}
          onClose={() => { setShowAdd(false); setEditPaper(null) }}
        />
      )}

      {/* Export modal */}
      {showExport && (
        <ExportModal papers={papers} onClose={() => setShowExport(false)} />
      )}

      {/* JSON import input */}
      <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={onJsonFile} />
    </div>
  )
}
