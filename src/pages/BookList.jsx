import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LOCATIONS, CATEGORIES } from '../constants'

// "2026-11-18T09:56:00Z" → "18 Nov 2026"
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function BookList({ books, people, me }) {
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [holderFilter, setHolderFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const navigate = useNavigate()

  function locationLabel(value) {
    return LOCATIONS.find(l => l.value === value)?.label ?? 'No location'
  }

  // Summary numbers (from ALL books, not just the filtered ones)
  const total = books.length
  const atHome = books.filter(b => b.current_location === 'main').length
  const atWilly = books.filter(b => b.current_location === 'brother').length
  const withMe = me ? books.filter(b => b.current_holder_id === me.id).length : 0

  const filteredBooks = books.filter(book => {
    const text = search.trim().toLowerCase()

    const matchesSearch =
      (book.title ?? '').toLowerCase().includes(text) ||
      (book.author ?? '').toLowerCase().includes(text)

    const matchesLocation =
      locationFilter === '' || book.current_location === locationFilter

    const matchesHolder =
      holderFilter === '' ||
      (holderFilter === 'me' && me && book.current_holder_id === me.id) ||
      (holderFilter === 'none' && book.current_holder_id == null) ||
      String(book.current_holder_id) === holderFilter

    const matchesCategory =
      categoryFilter === '' ||
      (categoryFilter === 'none' && !book.category) ||
      book.category === categoryFilter

    return matchesSearch && matchesLocation && matchesHolder && matchesCategory
  })

  return (
    <>
      <h1>Home Book-Tracker</h1>
      <h2>Keeps a record of our books and where each one is.</h2>

      <div className="summary">
        <div className="stat">
          <span className="stat-number">{total}</span>
          <span className="stat-label">Books</span>
        </div>
        <div className="stat">
          <span className="stat-number">{atHome}</span>
          <span className="stat-label">Home</span>
        </div>
        <div className="stat">
          <span className="stat-number">{atWilly}</span>
          <span className="stat-label">At Willy's</span>
        </div>
        <div className="stat">
          <span className="stat-number">{withMe}</span>
          <span className="stat-label">With you</span>
        </div>
      </div>

      <Link to="/add" className="add-book-btn">+ Add book</Link>

      <div className="filters">
        <input
          type="text"
          placeholder="Search title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
          <option value="">All locations</option>
          {LOCATIONS.map(loc => (
            <option key={loc.value} value={loc.value}>{loc.label}</option>
          ))}
        </select>

        <select value={holderFilter} onChange={(e) => setHolderFilter(e.target.value)}>
          <option value="">All holders</option>
          {me && <option value="me">My books</option>}
          <option value="none">No holder</option>
          {people.map(person => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          <option value="none">No category</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <table className="book-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Holder</th>
              <th>Location</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map(book => {
              // Look up the holder once, then use it twice (initial + name)
              const holder = people.find(p => p.id === book.current_holder_id)

              return (
                <tr
                  key={book.id}
                  className="clickable"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <td data-label="Title">{book.title}</td>
                  <td data-label="Author">{book.author}</td>
                  <td data-label="Category">{book.category ?? '—'}</td>

                  <td data-label="Holder">
                    <span className="holder">
                      <span className={holder ? 'avatar' : 'avatar empty'}>
                        {holder ? holder.name[0].toUpperCase() : '–'}
                      </span>
                      {holder ? holder.name : 'No holder'}
                    </span>
                  </td>

                  <td data-label="Location">
                    <span className={`tag tag-${book.current_location ?? 'none'}`}>
                      {locationLabel(book.current_location)}
                    </span>
                  </td>

                  <td data-label="Last updated">{formatDate(book.last_updated)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredBooks.length === 0 && (
          <div className="empty-state">
            <span className="icon">📚</span>
            {books.length === 0
              ? 'No books yet. Tap "+ Add book" to add the first one.'
              : 'No books match. Try clearing the search or filters.'}
          </div>
        )}
      </div>
    </>
  )
}

export default BookList