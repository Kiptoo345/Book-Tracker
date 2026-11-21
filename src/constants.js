// fixed list of homes (never changes, so it isn't state)
export const LOCATIONS = [
  { value: 'main', label: 'Home' },
  { value: 'brother', label: "Willy's home" },
]

// Book categories. Saved in the database as this exact text,
// so a new one can be added here without touching Supabase.
export const CATEGORIES = [
  'Fiction',
  'Christian',
  'Self-help',
  'Biography',
  'Business & Finance',
  'History',
  'Science',
  'Children',
  'Education',
  'Other',
]
