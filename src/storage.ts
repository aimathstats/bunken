import { Paper } from './types'

const KEY = 'bunken_papers'

export function loadPapers(): Paper[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Paper[]) : []
  } catch {
    return []
  }
}

export function savePapers(papers: Paper[]): void {
  localStorage.setItem(KEY, JSON.stringify(papers))
}

export function exportJson(papers: Paper[]): void {
  const blob = new Blob([JSON.stringify(papers, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bunken-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJson(file: File): Promise<Paper[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Paper[]
        resolve(data)
      } catch {
        reject(new Error('JSONファイルの解析に失敗しました'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
