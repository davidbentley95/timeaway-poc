import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jaauansnxkisyogfttxc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphYXVhbnNueGtpc3lvZ2Z0dHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzA3MzAsImV4cCI6MjA5NDQ0NjczMH0.dnprDUVQiKKN45sYvK0vuYHQJEhTzJYC7vHBPr7-axY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
