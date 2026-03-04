import { Paper } from '../types'

function formatAuthorApa(a: string): string {
  // "Doe, John" → "Doe, J."
  const parts = a.split(',')
  if (parts.length >= 2) {
    const last = parts[0].trim()
    const first = parts[1].trim()
    const initials = first
      .split(/\s+/)
      .map((n) => n[0] + '.')
      .join(' ')
    return `${last}, ${initials}`
  }
  return a
}

export function toApa(paper: Paper): string {
  const authors = paper.authors.map(formatAuthorApa)
  let authorStr = ''
  if (authors.length === 0) authorStr = 'Unknown'
  else if (authors.length === 1) authorStr = authors[0]
  else if (authors.length <= 7) authorStr = authors.slice(0, -1).join(', ') + ', & ' + authors[authors.length - 1]
  else authorStr = authors.slice(0, 6).join(', ') + ', ... ' + authors[authors.length - 1]

  const year = paper.year ? `(${paper.year})` : '(n.d.)'
  const venue = paper.venue ? `*${paper.venue}*` : ''
  const vol = paper.volume
  const issue = paper.issue ? `(${paper.issue})` : ''
  const pages = paper.pages
  const doi = paper.doi ? `https://doi.org/${paper.doi}` : paper.url

  let volumeInfo = ''
  if (vol && pages) volumeInfo = `, *${vol}*${issue}, ${pages}`
  else if (vol) volumeInfo = `, *${vol}*${issue}`

  const parts = [
    `${authorStr} ${year}. ${paper.title}.`,
    venue ? `${venue}${volumeInfo}.` : '',
    doi || '',
  ].filter(Boolean)

  return parts.join(' ')
}

export function toMla(paper: Paper): string {
  // Last, First, and First Last. "Title." *Journal*, vol. V, no. N, Year, pp. P.
  const formatMlaAuthor = (a: string, i: number): string => {
    if (i === 0) return a // "Doe, John"
    const parts = a.split(',')
    if (parts.length >= 2) return `${parts[1].trim()} ${parts[0].trim()}`
    return a
  }

  const authors = paper.authors
  let authorStr = ''
  if (authors.length === 0) authorStr = 'Unknown'
  else if (authors.length === 1) authorStr = formatMlaAuthor(authors[0], 0)
  else if (authors.length === 2)
    authorStr = `${formatMlaAuthor(authors[0], 0)}, and ${formatMlaAuthor(authors[1], 1)}`
  else authorStr = `${formatMlaAuthor(authors[0], 0)}, et al.`

  const parts = [
    `${authorStr}.`,
    `"${paper.title}."`,
    paper.venue ? `*${paper.venue}*,` : '',
    paper.volume ? `vol. ${paper.volume},` : '',
    paper.issue ? `no. ${paper.issue},` : '',
    paper.year ? `${paper.year},` : '',
    paper.pages ? `pp. ${paper.pages}.` : '',
    paper.doi ? `https://doi.org/${paper.doi}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/,\s*\./g, '.')

  return parts
}
