import type { ShortlistItem, Note } from '../types/domain'

export function exportShortlistAsCSV(shortlist: ShortlistItem[], notes: Note[]): string {
  const header = 'github_username,notes,shortlisted_at'
  const rows = shortlist.map(item => {
    const note = notes.find(n => n.github_username === item.github_username)
    const noteContent = note ? `"${note.content.replace(/"/g, '""')}"` : ''
    return `${item.github_username},${noteContent},${item.created_at}`
  })
  return [header, ...rows].join('\n')
}

export function exportShortlistAsJSON(shortlist: ShortlistItem[], notes: Note[]): string {
  const data = shortlist.map(item => {
    const note = notes.find(n => n.github_username === item.github_username)
    return {
      github_username: item.github_username,
      note: note?.content || '',
      shortlisted_at: item.created_at,
    }
  })
  return JSON.stringify(data, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
