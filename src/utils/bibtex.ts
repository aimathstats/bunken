import { Paper } from '../types'
import { v4 as uuidv4 } from 'uuid'

function makeBibKey(paper: Paper): string {
  const firstAuthorLast = paper.authors[0]?.split(',')[0]?.replace(/\s+/g, '') ?? 'Unknown'
  const year = paper.year ?? '????'
  const firstWord = paper.title.split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '') ?? 'untitled'
  return `${firstAuthorLast}${year}${firstWord}`
}

function escape(s: string): string {
  return s.replace(/[&%$#_{}~^\\]/g, (c) => `\\${c}`)
}

export function paperToBibtex(paper: Paper): string {
  const key = makeBibKey(paper)
  const authorStr = paper.authors.join(' and ')
  const type = paper.venue ? 'article' : 'misc'

  const fields: [string, string][] = [
    ['title', paper.title],
    ['author', authorStr],
    ['year', String(paper.year ?? '')],
    ['journal', paper.venue],
    ['volume', paper.volume],
    ['number', paper.issue],
    ['pages', paper.pages],
    ['doi', paper.doi],
    ['url', paper.url],
    ['abstract', paper.abstract],
  ]

  const body = fields
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `  ${k} = {${escape(v)}}`)
    .join(',\n')

  return `@${type}{${key},\n${body}\n}`
}

export function papersToBibtex(papers: Paper[]): string {
  return papers.map(paperToBibtex).join('\n\n')
}

// ---- BibTeX importer ----

interface BibEntry {
  type: string
  key: string
  fields: Record<string, string>
}

function parseBibtex(raw: string): BibEntry[] {
  const entries: BibEntry[] = []
  // Match @type{key, ...}
  const entryRe = /@(\w+)\s*\{\s*([^,\s]+)\s*,([^@]*)\}/gs
  let match: RegExpExecArray | null
  while ((match = entryRe.exec(raw)) !== null) {
    const type = match[1].toLowerCase()
    const key = match[2]
    const body = match[3]
    const fields: Record<string, string> = {}
    // Match field = {value} or field = "value" or field = number
    const fieldRe = /(\w+)\s*=\s*(?:\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}|"([^"]*)"|([\w\d]+))/g
    let fm: RegExpExecArray | null
    while ((fm = fieldRe.exec(body)) !== null) {
      const k = fm[1].toLowerCase()
      const v = (fm[2] ?? fm[3] ?? fm[4] ?? '').replace(/\s+/g, ' ').trim()
      fields[k] = v
    }
    entries.push({ type, key, fields })
  }
  return entries
}

function parseAuthors(raw: string): string[] {
  return raw
    .split(/\s+and\s+/i)
    .map((a) => a.trim())
    .filter(Boolean)
}

export function importBibtex(raw: string): Paper[] {
  const entries = parseBibtex(raw)
  const now = new Date().toISOString()
  return entries.map((e) => ({
    id: uuidv4(),
    title: e.fields.title ?? '',
    authors: parseAuthors(e.fields.author ?? ''),
    year: e.fields.year ? parseInt(e.fields.year, 10) : null,
    venue: e.fields.journal ?? e.fields.booktitle ?? '',
    volume: e.fields.volume ?? '',
    issue: e.fields.number ?? '',
    pages: e.fields.pages ?? '',
    doi: e.fields.doi ?? '',
    url: e.fields.url ?? '',
    abstract: e.fields.abstract ?? '',
    tags: [],
    status: 'unread' as const,
    starred: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }))
}
