import './App.css'
import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import BookList from './pages/BookList'
import AddBook from './pages/AddBook'
import EditBook from './pages/EditBook'

function App() {
  // State shared by every page
  const [session, setSession] = useState(null)
  const [books, setBooks] = useState([])
  const [people, setPeople] = useState([])
  const [loadError, setLoadError] = useState('')

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
      if (error) {
        console.error(error)
        setLoadError("Couldn't load the books. Check your connection and refresh the page.")
      } else {
        setBooks(data)   
        setLoadError('')
      }
    }
    fetchBooks()
  }, [session])

  useEffect(() => {
    if (!session) {
      setPeople([])
      return
    }

    async function fetchPeople() {
      const { data, error } = await supabase.from('people').select('*')
      if (error) {
        console.error(error)
        setLoadError("Couldn't load the books. Check your connection and refresh the page.")
      } else {
        setPeople(data)  
        setLoadError('')
      }
    }
    fetchPeople()
  }, [session])

  // Derived value (calculated every render, not state)
  const me = people.find(p => p.user_id === session?.user.id)

  if (!session) return <Login />

  // UI
  return (
    <>
      <header className="top-bar">
        <Link to="/" className="brand">📚 Book-Tracker</Link>

        <div className="user-info">
          {me && (
            <span>
              <span className="label">Logged in as </span>
              <strong>{me.name}</strong>
            </span>
          )}
          <button className="logout-btn" onClick={() => supabase.auth.signOut()}>
            Log out
          </button>
        </div>
      </header>

      <section id="center">
        {loadError && <p className="error-msg" role="alert">{loadError}</p>}

        
        <Routes>
          <Route
            path="/"
            element={<BookList books={books} people={people} me={me} />}
          />
          <Route
            path="/add"
            element={<AddBook setBooks={setBooks} people={people} me={me} />}
          />
          <Route
            path="/book/:id"
            element={<EditBook books={books} setBooks={setBooks} people={people} />}
          />
        </Routes>
      </section>
    </>
  )
}

export default App