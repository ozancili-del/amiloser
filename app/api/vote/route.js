import { supabase } from '@/lib/supabase'

export async function POST(request) {
  const body = await request.json()
  const { post_id, choice, session_token } = body

  if (choice < 0 || choice > 3) {
    return Response.json({ error: 'Invalid choice' }, { status: 400 })
  }

  // Check if already voted
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('post_id', post_id)
    .eq('session_token', session_token)
    .single()

  if (existing) {
    return Response.json({ error: 'Already voted' }, { status: 409 })
  }

  const { error } = await supabase
    .from('votes')
    .insert([{ post_id, choice, session_token }])

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}"" 
