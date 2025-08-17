import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://wxjwxtespwphzpaftxoh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4and4dGVzcHdwaHpwYWZ0eG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTQzNzYsImV4cCI6MjA3MDk3MDM3Nn0.jTZpl7gxNmmqDIxsPZ5v8-lHZjrOhjCGH1CUNvQ8hAA'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const btnEnroll = document.getElementById('btn-enroll')
const status = document.getElementById('enroll-status')

btnEnroll.onclick = async ()=>{
  btnEnroll.disabled = true
  // require login or allow anonymous save
  const { data: { session } } = await supabase.auth.getSession()
  if(session && session.user){
    // create enrollment row
    const { error } = await supabase.from('enrollments').insert([{ user_id: session.user.id, course: 'fullstack-devops', price_pkr: 50000, status: 'pending' }])
    if(error) { status.textContent = 'Enroll error: '+error.message; btnEnroll.disabled=false; return }
    status.textContent = 'Enrolled (pending). Admin can verify and reserve a seat.'
  } else {
    // store in localStorage as fallback
    const pending = JSON.parse(localStorage.getItem('pending_enroll')||'[]')
    pending.push({ id: Date.now(), course: 'fullstack-devops', price_pkr: 50000 })
    localStorage.setItem('pending_enroll', JSON.stringify(pending))
    status.textContent = 'Enrollment saved locally. Sign in later to persist.'
  }
}

// Simple UI to show discount percentage (computed)
const original = 60000
const discounted = 50000
const pct = Math.round((original - discounted) / original * 100)
// Update DOM where needed
const el = document.querySelector('.original')
if(el) el.textContent = 'PKR '+original.toLocaleString()
const el2 = document.querySelector('.discounted')
if(el2) el2.textContent = 'PKR '+discounted.toLocaleString() + ' ('+pct+'% off)'

