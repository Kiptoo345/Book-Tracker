import { useState } from 'react'
import { supabase } from './supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()          // stop the page reloading, same as handleAddBook
    setErrorMsg('')             // clear any old error
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,                 // don't trim passwords, spaces can be real characters
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message) // e.g. "Invalid login credentials"
      return
    }
    // Success: nothing to do here.
    // onAuthStateChange in App sees the login and calls setSession.
  }

  return (
    <section id="center">
      <h1>Home Book-Tracker</h1>
      <h2>Log in to continue</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {errorMsg && <p className="error">{errorMsg}</p>}
    </section>
  )
}

export default Login