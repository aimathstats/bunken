import { Paper } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface CrossRefAuthor {
  given?: string
  family?: string
  name?: string
}

interface CrossRefMessage {
  title?: string[]
  author?: CrossRefAuthor[]
  'published'?: { 'date-parts'?: number[][] }
  'published-print'?: { 'date-parts'?: number[][] }
  'published-online'?: { 'date-parts'?: number[][] }
  'container-title'?: string[]
  DOI?: string
  abstract?: string
  volume?: string
  issue?: string
  page?: string
  URL?: string
}

function normalizeDoi(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
}

function formatAuthor(a: CrossRefAuthor): string {
  if (a.family && a.given) return `${a.family}, ${a.given}`
  if (a.family) return a.family
  if (a.name) return a.name
  return ''
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

export async function fetchByDoi(rawDoi: string): Promise<Partial<Paper>> {
  const doi = normalizeDoi(rawDoi)
  if (!doi) throw new Error('DOIを入力してください')

  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'Bunken/1.0 (academic reference manager)' },
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error('DOIが見つかりませんでした')
    throw new Error(`CrossRef APIエラー: ${res.status}`)
  }

  const data = (await res.json()) as { message: CrossRefMessage }
  const m = data.message

  const authors = (m.author ?? []).map(formatAuthor).filter(Boolean)

  const dateParts =
    m.published?.['date-parts']?.[0] ??
    m['published-print']?.['date-parts']?.[0] ??
    m['published-online']?.['date-parts']?.[0]
  const year = dateParts?.[0] ?? null

  return {
    id: uuidv4(),
    title: m.title?.[0] ?? '',
    authors,
    year,
    venue: m['container-title']?.[0] ?? '',
    volume: m.volume ?? '',
    issue: m.issue ?? '',
    pages: m.page ?? '',
    doi: m.DOI ?? doi,
    url: m.URL ?? '',
    abstract: m.abstract ? stripHtml(m.abstract) : '',
  }
}
