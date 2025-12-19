import { createClient } from '@supabase/supabase-js'

// Use your actual strings here temporarily to test if .env is the problem
const supabaseUrl =   'https://rukqgjsosqzbfimrctqa.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1a3FnanNvc3F6YmZpbXJjdHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzM2NDksImV4cCI6MjA4MTYwOTY0OX0.N3cdpmHupTmjZmM6Y7aXhEnFFcojK9djyylXQ_1Pn0A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)




 