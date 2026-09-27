const MAX_URL_LENGTH = 2048

// Optional URL fields may be empty/null, but when present they must be
// absolute http(s) URLs — blocks `javascript:` / `data:` stored-XSS vectors
// that the frontend later renders as hrefs (#22).
function isValidHttpUrl(value) {
  if (value === null || value === undefined || value === '') {
    return true
  }
  const str = String(value).trim()
  if (str.length > MAX_URL_LENGTH || /\s/.test(str)) {
    return false
  }
  try {
    const parsed = new URL(str)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

module.exports = { isValidHttpUrl, MAX_URL_LENGTH }
