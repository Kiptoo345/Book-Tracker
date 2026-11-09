# 📚 Home Book-Tracker

A small web app for keeping track of books shared between two family homes — which home each book is at, and who currently has it.

Built as a personal learning project with **React** and **Supabase**.

**Live app:** _coming soon_

## Features

- 🔐 **Login** — email + password authentication (Supabase Auth); public sign-ups disabled, accounts are created by the admin
- 🛡️ **Row Level Security** — the database itself only allows signed-in users to read or change data
- ➕ **Add books** with title, author, current holder and location
- ✏️ **Update** who holds a book and which home it's at
- 🗑️ **Delete** books (with confirmation)
- 🔍 **Search** by title or author
- 🏠 **Filter** by location

## Tech stack

| Layer    | Tool                          |
|----------|-------------------------------|
| Frontend | React (Vite)                  |
| Backend  | Supabase (PostgreSQL + Auth)  |
| Hosting  | Vercel                        |

## Database

**`people`**
| Column | Type |
|--------|------|
| id     | primary key |
| name   | text |

**`books`**
| Column            | Type |
|-------------------|------|
| id                | primary key |
| title             | text |
| author            | text |
| current_holder_id | references `people.id` |
| current_location  | text (`main` / `brother`) |
| created_at        | timestamp |
| last_updated      | timestamp |

RLS is enabled on both tables. Signed-in users can read, add, edit and delete books, and read people.

## Running locally

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/Kiptoo345/book-tracker.git
   cd book-tracker
   npm install
   ```
2. Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Planned

- Link `people` to login accounts ("My books" view)
- Loan history (who had each book, and when)
- Realtime updates between devices
