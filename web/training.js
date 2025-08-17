import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://wxjwxtespwphzpaftxoh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4and4dGVzcHdwaHpwYWZ0eG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTQzNzYsImV4cCI6MjA3MDk3MDM3Nn0.jTZpl7gxNmmqDIxsPZ5v8-lHZjrOhjCGH1CUNvQ8hAA'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const btnEnroll = document.getElementById('btn-enroll')
const status = document.getElementById('enroll-status')
const paymentInput = document.getElementById('payment-proof')

async function uploadPaymentProof(userId, enrollmentId, file){
  if(!file) return null
  const path = `${userId}/${Date.now()}_${file.name.replace(/\s+/g,'_')}`
  const { data: up, error: upErr } = await supabase.storage.from('payment-proofs').upload(path, file)
  if(upErr) throw upErr
  const { data: pub } = supabase.storage.from('payment-proofs').getPublicUrl(path)
  const publicUrl = pub.publicUrl
  const { error: uErr } = await supabase.from('enrollments').update({ payment_proof_url: publicUrl, payment_proof_uploaded_at: new Date() }).eq('id', enrollmentId)
  if(uErr) throw uErr
  return publicUrl
}

btnEnroll.onclick = async ()=>{
  btnEnroll.disabled = true
  const file = paymentInput.files[0]
  if(!file){ status.textContent = 'Please attach payment proof before enrolling.'; btnEnroll.disabled=false; return }

  const { data: { session } } = await supabase.auth.getSession()
  if(session && session.user){
    // create enrollment row
    const { data, error } = await supabase.from('enrollments').insert([{ user_id: session.user.id, course: 'fullstack-devops', price_pkr: 50000, status: 'pending' }]).select().single()
    if(error) { status.textContent = 'Enroll error: '+error.message; btnEnroll.disabled=false; return }
    try{
      await uploadPaymentProof(session.user.id, data.id, file)
      status.textContent = 'Enrolled (pending). Payment proof uploaded.'
    }catch(e){ status.textContent = 'Upload failed: '+e.message }
  } else {
    // store in localStorage as fallback (files cannot be stored in localStorage)
    status.textContent = 'Please sign in to enroll and upload payment proof.'
  }
  btnEnroll.disabled = false
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

