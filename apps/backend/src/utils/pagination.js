// Shared pagination for list endpoints (issue #44 / AUD-024).
// parsePagination reads req.query and returns bounded page/limit/offset;
// paginated() builds the { data, page, limit, total, hasMore } envelope.

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 100

/**
 * @param {object} query  req.query
 * @param {object} [options]
 * @param {number} [options.defaultLimit] Page size when no/invalid limit is sent
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query = {}, { defaultLimit = DEFAULT_PAGE_SIZE } = {}) {
  const page = Math.min(Math.max(1, parseInt(query.page, 10) || 1), 1000000)
  let limit = parseInt(query.limit, 10)
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = defaultLimit
  }
  limit = Math.min(limit, MAX_PAGE_SIZE)
  return { page, limit, offset: (page - 1) * limit }
}

/**
 * @param {object} parts
 * @param {Array} parts.items   Serialized rows for the requested page
 * @param {number} parts.page
 * @param {number} parts.limit
 * @param {number} parts.total  Total rows matching the filter (across pages)
 */
function paginated({ items, page, limit, total }) {
  return {
    data: items,
    page,
    limit,
    total,
    hasMore: (page - 1) * limit + items.length < total,
  }
}

module.exports = { parsePagination, paginated, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE }
