import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const post_id = searchParams.get('post_id')
  if (!post_id) return Response.json({ error: 'post_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('judge_sessions')
    .select('*')
    .eq('post_id', post_id)
    .single()

  if (error) return Response.json(null)
  return Response.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { post_id, messages, closed, final_verdict } = body

  const { data: existing } = await supabase
    .from('judge_sessions')
    .select('id')
    .eq('post_id', post_id)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('judge_sessions')
      .update({ messages, closed, final_verdict })
      .eq('post_id', post_id)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } else {
    const { data, error } = await supabase
      .from('judge_sessions')
      .insert([{ post_id, messages, closed, final_verdict }])
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }
}
