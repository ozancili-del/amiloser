import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  const { id } = params

  const { data: post, error } = await supabase
    .from('posts')
    .select(`*, votes(choice)`)
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })

  const votes = [0, 0, 0, 0]
  post.votes?.forEach(v => votes[v.choice]++)
  const total = votes.reduce((a, b) => a + b, 0)
  const loserPct = total ? Math.round(((votes[2] + votes[3]) / total) * 100) : 0

  return Response.json({ ...post, voteCounts: votes, total, loserPct })
}