export type ReadingStatus = 'unread' | 'reading' | 'read'

export interface Paper {
  id: string
  title: string
  authors: string[]        // ["Doe, John", "Smith, Jane"]
  year: number | null
  venue: string            // journal or conference name
  volume: string
  issue: string
  pages: string
  doi: string
  url: string
  abstract: string
  tags: string[]
  status: ReadingStatus
  starred: boolean
  notes: string
  createdAt: string        // ISO string
  updatedAt: string
}

export interface FilterState {
  query: string
  status: ReadingStatus | 'all' | 'starred'
  tag: string | null
  sortBy: 'createdAt' | 'year' | 'title' | 'updatedAt'
  sortDir: 'asc' | 'desc'
}
