import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://wxjwxtespwphzpaftxoh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4and4dGVzcHdwaHpwYWZ0eG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTQzNzYsImV4cCI6MjA3MDk3MDM3Nn0.jTZpl7gxNmmqDIxsPZ5v8-lHZjrOhjCGH1CUNvQ8hAA'
const ADMIN_TOKEN = 'REPLACE_WITH_A_SECRET'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const params = new URLSearchParams(window.location.search)
const token = params.get('admin')
const adminContent = document.getElementById('admin-content')
const listEl = document.getElementById('list')
const statusEl = document.getElementById('admin-status')

if(token !== ADMIN_TOKEN){
  statusEl.textContent = 'Invalid admin token or missing. This page is hidden.'
} else {
  adminContent.classList.remove('hidden')
  statusEl.textContent = 'Admin mode'
  loadPending()
}

async function loadPending(){
  const { data, error } = await supabase.from('enrollments').select('*').eq('status','pending')
  if(error){ statusEl.textContent = 'Error: '+error.message; return }
  listEl.innerHTML = ''
  data.forEach(row=>{
    const div = document.createElement('div')
    div.className = 'enroll-row'
    div.innerHTML = `<strong>${row.user_id}</strong> - ${row.course} - PKR ${row.price_pkr} <button data-id="${row.id}" class="btn-verify">Verify & Reserve</button>`
    listEl.appendChild(div)
  })
  Array.from(document.getElementsByClassName('btn-verify')).forEach(b=>b.onclick = verify)
}

async function verify(e){
  const id = e.target.getAttribute('data-id')
  const { error } = await supabase.from('enrollments').update({ status: 'verified', reserved_at: new Date() }).eq('id', id)
  if(error){ statusEl.textContent = 'Verify error: '+error.message; return }
  statusEl.textContent = 'Enrollment verified'
  loadPending()
}
