import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: replace with your Supabase project details
const SUPABASE_URL = 'https://wxjwxtespwphzpaftxoh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4and4dGVzcHdwaHpwYWZ0eG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTQzNzYsImV4cCI6MjA3MDk3MDM3Nn0.jTZpl7gxNmmqDIxsPZ5v8-lHZjrOhjCGH1CUNvQ8hAA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// UI elements
const emailEl = document.getElementById('email')
const btnSignin = document.getElementById('btn-signin')
const btnSkip = document.getElementById('btn-skip')
const signedInEl = document.getElementById('signed-in')
const signedOutEl = document.getElementById('signed-out')
const userEmailEl = document.getElementById('user-email')
const btnSignout = document.getElementById('btn-signout')

const profileForm = document.getElementById('profile-form')
const inputs = ['name','place','birth','phone','education','experience','profession'].map(id=>document.getElementById(id))
const btnSave = document.getElementById('btn-save')
const btnLoad = document.getElementById('btn-load')
const statusEl = document.getElementById('status')

let currentUser = null

function showStatus(msg, ok=true){
  statusEl.textContent = msg
  statusEl.style.color = ok ? 'green' : 'red'
}

async function updateUIForUser(user){
  currentUser = user
  if(user){
    signedInEl.classList.remove('hidden')
    signedOutEl.classList.add('hidden')
    profileForm.classList.remove('hidden')
    userEmailEl.textContent = user.email || 'anonymous'
  } else {
    signedInEl.classList.add('hidden')
    signedOutEl.classList.remove('hidden')
    profileForm.classList.add('hidden')
  }
}

btnSignin.onclick = async ()=>{
  const email = emailEl.value.trim()
  if(!email){ showStatus('Enter an email', false); return }
  btnSignin.disabled = true
  const { error } = await supabase.auth.signInWithOtp({ email })
  if(error){ showStatus('Error sending link: '+error.message, false) }
  else { showStatus('Magic link sent — check your email (may take a moment).') }
  btnSignin.disabled = false
}

btnSkip.onclick = ()=>{
  updateUIForUser({ id: 'local-'+Date.now(), email: null })
}

btnSignout.onclick = async ()=>{
  await supabase.auth.signOut()
  updateUIForUser(null)
}

btnSave.onclick = async ()=>{
  const payload = {}
  ['name','place','birth','phone','education','experience','profession'].forEach(id=>payload[id]=document.getElementById(id).value)
  if(currentUser && currentUser.id && !currentUser.id.startsWith('local-')){
    // save to Supabase table 'profiles' with user_id = currentUser.id
    const { data, error } = await supabase.from('profiles').upsert([{ user_id: currentUser.id, ...payload }])
    if(error) showStatus('Save error: '+error.message, false)
    else showStatus('Saved to Supabase')
  } else {
    localStorage.setItem('profile', JSON.stringify(payload))
    showStatus('Saved locally (no auth)')
  }
}

btnLoad.onclick = async ()=>{
  if(currentUser && currentUser.id && !currentUser.id.startsWith('local-')){
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', currentUser.id).single()
    if(error){ showStatus('Load error: '+error.message, false); return }
    if(data){ ['name','place','birth','phone','education','experience','profession'].forEach(id=>document.getElementById(id).value = data[id] || '')
      showStatus('Loaded profile from Supabase')
    } else showStatus('No profile found', false)
  } else {
    const raw = localStorage.getItem('profile')
    if(!raw){ showStatus('No local profile', false); return }
    const obj = JSON.parse(raw)
    ['name','place','birth','phone','education','experience','profession'].forEach(id=>document.getElementById(id).value = obj[id] || '')
    showStatus('Loaded local profile')
  }
}

// Monitor auth changes & initial state
supabase.auth.onAuthStateChange((event, session)=>{
  // when user follows magic link, session will be available
  if(session && session.user){
    updateUIForUser(session.user)
  }
})

;(async function init(){
  const { data: { session } } = await supabase.auth.getSession()
  if(session && session.user) updateUIForUser(session.user)
})()
