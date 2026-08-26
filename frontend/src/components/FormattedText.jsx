import React from 'react'

/**
 * FormattedText: Safely parses structured plain text (paragraphs, headings, and bullet points)
 * and renders it cleanly with preserved line breaks and list structures.
 */
export default function FormattedText({ text, className = '' }) {
  if (!text) return null

  // Split lines
  const lines = String(text).split(/\r?\n/)
  const elements = []
  let currentBulletGroup = []

  const flushBullets = () => {
    if (currentBulletGroup.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1 pl-1 text-sm text-slate-700">
          {currentBulletGroup.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-slate-400 select-none">•</span>
              <span className="flex-1 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )
      currentBulletGroup = []
    }
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()
    if (!line) {
      flushBullets()
      return
    }

    // Check if line is a bullet item (starts with •, -, *, or digit.)
    const bulletMatch = line.match(/^([•\-\*]|\d+\.)\s*(.+)$/)
    if (bulletMatch) {
      currentBulletGroup.push(bulletMatch[2])
      return
    }

    flushBullets()

    // Check if line is a heading/label (e.g. "Overview", "Key Responsibilities:", "Responsibilities")
    const isHeading =
      /^(overview|key responsibilities|responsibilities|technologies used|achievements|what i learned):?$/i.test(line) ||
      (line.length < 40 && line.endsWith(':'))

    if (isHeading) {
      elements.push(
        <h5
          key={`h-${idx}`}
          className="mt-3 mb-1 text-xs font-bold uppercase tracking-wider text-slate-900"
        >
          {line.replace(/:$/, '')}
        </h5>
      )
    } else {
      elements.push(
        <p key={`p-${idx}`} className="my-1.5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {line}
        </p>
      )
    }
  })

  flushBullets()

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>
}
