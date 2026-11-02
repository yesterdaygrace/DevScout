import DOMPurify from 'dompurify'

/**
 * Sanitize untrusted HTML generated from markdown or user input.
 * Strips dangerous tags (script, object, embed, iframe), event handlers (onerror, onload),
 * and unsafe URL protocols (javascript:, data:).
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'form', 'input'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    RETURN_TRUSTED_TYPE: false,
    SANITIZE_DOM: true,
  })
}

/**
 * Sanitize text for CSV export to prevent formula/CSV injection (CWE-1236).
 * Prepends a single quote if any line begins with =, +, -, @, %, |, tab, or carriage return.
 */
export function sanitizeCsvField(val: string): string {
  if (!val) return ''
  // Split on newlines to protect against multiline CSV formula execution
  const lines = val.split('\n')
  const sanitizedLines = lines.map(line => {
    if (/^[\t\r]/.test(line) || /^[=+\-@%|\t\r]/.test(line.trimStart())) {
      return `'${line}`
    }
    return line
  })
  return sanitizedLines.join('\n')
}
