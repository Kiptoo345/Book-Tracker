import './App.css'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

// fixed list of homes (never changes, so it isn't state)
const LOCATIONS = [
  { value: 'main', label: 'Home' },
  { value: 'brother', label: "Willy's home" },
]

function App() {
  // State 
  const [session, setSession] = useState(null)
  const [books, setBooks] = useState([])
  const [people, setPeople] = useState([])
  const [selectedHolder, setSelectedHolder] = useState({})
  const [selectedLocation, setSelectedLocation] = useState({}) 
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newHolder, setNewHolder] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [holderFilter, setHolderFilter] = useState('')
  


  // Load data 
  useEffect(() => {
    // 1. Is someone already logged in? (session saved in localStorage)
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // 2. Listen for future logins/logouts
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => setSession(session))

    // 3. Cleanup: stop listening if App unmounts
      return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setBooks([]) 
      return 
    }

    async function fetchBooks() {
      const { data, error } = await supabase.from('books').select('*')
      if (error) console.error(error)
      else setBooks(data)
    }
    fetchBooks()
  }, [session])

  useEffect(() => {
     if (!session)  {
      setPeople([]) 
      return 
    }

    async function fetchPeople() {
      const { data, error } = await supabase.from('people').select('*')
      if (error) console.error(error)
      else setPeople(data)
    }
    fetchPeople()
  }, [session])

  //  Save holder and/or location 
  async function handleSave(bookId) {
    const holderChoice = selectedHolder[bookId]
    const locationChoice = selectedLocation[bookId]

    // Nothing changed for this book
    if (holderChoice === undefined && locationChoice === undefined) return

    // Build the update with only the fields that changed
    const updates = { last_updated: new Date().toISOString() }

    if (holderChoice !== undefined) {
      updates.current_holder_id = holderChoice === '' ? null : holderChoice
    }
    if (locationChoice !== undefined) {
      updates.current_location = locationChoice === '' ? null : locationChoice
    }

    const { error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)

    if (error) {
      console.error(error)
      return
    }

    // Copy the changes into the book on screen
    setBooks(books.map(b =>
      b.id === bookId ? { ...b, ...updates } : b
    ))
  }

  async function handleDelete(bookId) {
    // Ask first, because deleting can't be undone
    if (!window.confirm('Delete this book? This cannot be undone.')) return

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    if (error) {
      console.error(error)
      return
    }

    // Keep every book EXCEPT the deleted one
    setBooks(books.filter(b => b.id !== bookId))
  }

  //  Add a new book 
  async function handleAddBook(e) {
    e.preventDefault()

    if (newTitle.trim() === '') return //removes extra spaces

    const { data, error } = await supabase
      .from('books')
      .insert({
        title: newTitle.trim(),
        author: newAuthor.trim(),
        current_holder_id: newHolder === '' ? null : newHolder,
        current_location: newLocation === '' ? null : newLocation, 
      })
      .select()

    if (error) {
      console.error(error)
      return
    }

    setBooks([...books, ...data])

    setNewTitle('')
    setNewAuthor('')
    setNewHolder('')
    setNewLocation('') 
  }

  const filteredBooks = books.filter(book => {
    const text = search.trim().toLowerCase()

    const matchesSearch =
      (book.title ?? '').toLowerCase().includes(text) ||
      (book.author ?? '').toLowerCase().includes(text)

    const matchesLocation =
      locationFilter === '' || book.current_location === locationFilter

    const matchesHolder =
      holderFilter === '' ||
      (holderFilter === 'none' && book.current_holder_id == null) ||
      String(book.current_holder_id) === holderFilter

    return matchesSearch && matchesLocation && matchesHolder
})

  if (!session) return <Login />

  // UI 
  return (
    <section id="center">
      <h1>Home Book-Tracker</h1>
      <h2>Keeps a record of our books and where each one is.</h2>

      <button onClick={() => supabase.auth.signOut()}>Log out</button>

      <form onSubmit={handleAddBook}>
        <input
          type="text"
          placeholder="Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Author"
          value={newAuthor}
          onChange={(e) => setNewAuthor(e.target.value)}
        />

        <select value={newHolder} onChange={(e) => setNewHolder(e.target.value)}>
          <option value="">No holder</option>
          {people.map(person => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>

        {/* location dropdown */}
        <select value={newLocation} onChange={(e) => setNewLocation(e.target.value)}>
          <option value="">No location</option>
          {LOCATIONS.map(loc => (
            <option key={loc.value} value={loc.value}>{loc.label}</option>
          ))}
        </select>

        <button type="submit">Add Book</button>
      </form>

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
          <option value="none">No holder</option>
          {people.map(person => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select> 
      </div>

      <table className="book-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Holder</th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map(book => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author}</td>

              <td>
                <select
                  value={selectedHolder[book.id] ?? book.current_holder_id ?? ''}
                  onChange={(e) => setSelectedHolder({ ...selectedHolder, [book.id]: e.target.value })}
                >
                  <option value="">No holder</option>
                  {people.map(person => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </td>

               <td>
                <select
                  value={selectedLocation[book.id] ?? book.current_location ?? ''}
                  onChange={(e) => setSelectedLocation({ ...selectedLocation, [book.id]: e.target.value })}
                >
                  <option value="">No location</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </td>

              <td>
                <button onClick={() => handleSave(book.id)}>Save</button>
                <button className="delete-btn" onClick={() => handleDelete(book.id)}>Delete</button>
              </td>            
            </tr>
          ))}
        </tbody>
      </table>

    {filteredBooks.length === 0 && <p>No books found.</p>}  
    </section>
  )
}

export default App