# 📚 Home Book-Tracker

A small web app for keeping track of books shared between two family homes — which home each book is at, and who currently has it.

Built as a personal learning project with **React** and **Supabase**.

**Live app:** https://book-tracker-xi-three.vercel.app

## Features

- 🔐 **Login** — email + password authentication (Supabase Auth); public sign-ups disabled, accounts are created by the admin
- 🛡️ **Row Level Security** — the database itself only allows signed-in users to read or change data
- ➕ **Add books** with title, author, current holder and location
- ✏️ **Update** who holds a book and which home it's at
- 🗑️ **Delete** books (with confirmation)
- 🔍 **Search** by title or author
- 🏠 **Filter** by location, holder and category
- 🏷️ **Categories** — Fiction, Christian, Self-help and more (list lives in `src/constants.js`)
- 🖼️ **Covers** — find a cover on Open Library by title/author, or take a photo (shrunk and stored in Supabase Storage)
- 🕓 **History** — a timeline on each book's page of who had it, where, and for how long (recorded automatically by a database trigger)

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
| category          | text (nullable) |
| cover_url         | text (nullable) |
| created_at        | timestamp |
| last_updated      | timestamp |

**`book_history`** — written only by the `books_log_history` trigger
| Column     | Type |
|------------|------|
| id         | primary key |
| book_id    | references `books.id` (cascade delete) |
| holder_id  | references `people.id` |
| location   | text |
| changed_at | timestamp |
| changed_by | the login (auth user id) that made the change |

The SQL for categories, covers and history is in [`sql/features-nov-2026.sql`](sql/features-nov-2026.sql).

RLS is enabled on all tables (`book_history` is read-only from the app). Signed-in users can read, add, edit and delete books, and read people.

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

- Realtime updates between devices
