import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { LOCATIONS } from '../constants'

const DAY = 24 * 60 * 60 * 1000

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// milliseconds → "3 days" / "2 weeks" / "4 months" / "1 year"
function duration(ms) {
  const days = Math.max(0, Math.round(ms / DAY))
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  if (days < 1) return 'less than a day'
  if (days < 14) return plural(days, 'day')
  if (days < 60) return plural(Math.round(days / 7), 'week')
  if (days < 365) return plural(Math.round(days / 30), 'month')
  return plural(Math.round(days / 365), 'year')
}

// Timeline of who had a book and where, newest first.
// Rows are written by a database trigger whenever holder/location changes.
function BookHistory({ bookId, people }) {
  const [rows, setRows] = useState(null) // null = still loading
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false // ignore the answer if the user already left the page

    async function fetchHistory() {
      const { data, error } = await supabase
        .from('book_history')
        .select('*')
        .eq('book_id', bookId)
        .order('changed_at', { ascending: true })

      if (cancelled) return
      if (error) {
        console.error(error)
        setErrorMsg("Couldn't load this book's history.")
        setRows([])
      } else {
        setRows(data)
      }
    }
    fetchHistory()

    return () => { cancelled = true }
  }, [bookId])

  const personName = id => people.find(p => p.id === id)?.name ?? 'No holder'
  const placeName = value => LOCATIONS.find(l => l.value === value)?.label ?? 'No location'
  const changedBy = userId => people.find(p => p.user_id === userId)?.name

  // Each row starts a "period" that lasts until the next row (or until now)
  const periods = (rows ?? []).map((row, i) => {
    const next = rows[i + 1]
    const start = new Date(row.changed_at)
    const end = next ? new Date(next.changed_at) : null
    return { ...row, end, length: duration((end ?? new Date()) - start) }
  }).reverse()

  return (
    <section className="history">
      <h3>History</h3>

      {errorMsg && <p className="error-msg" role="alert">{errorMsg}</p>}
      {rows === null && <p className="hint">Loading…</p>}
      {rows?.length === 0 && !errorMsg && <p className="hint">No history yet.</p>}

      <ol className="timeline">
        {periods.map(p => {
          const by = changedBy(p.changed_by)
          return (
            <li key={p.id} className={p.end ? '' : 'current'}>
              <div className="timeline-main">
                <strong>{personName(p.holder_id)}</strong>
                <span className={`tag tag-${p.location ?? 'none'}`}>{placeName(p.location)}</span>
              </div>
              <div className="timeline-dates">
                {p.end
                  ? `${shortDate(p.changed_at)} → ${shortDate(p.end)} · ${p.length}`
                  : `Since ${shortDate(p.changed_at)} · ${p.length} so far`}
              </div>
              {by && <div className="timeline-by">Updated by {by}</div>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default BookHistory
