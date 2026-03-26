import { supabase } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') || 'new'

  let query = supabase
    .from('posts')
    .select(`*, votes(choice)`)
    .order('created_at', { ascending: false })

  const { data: posts, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const postsWithVotes = posts.map(post => {
    const votes = [0, 0, 0, 0]
    post.votes?.forEach(v => votes[v.choice]++)
    const total = votes.reduce((a, b) => a + b, 0)
    const loserPct = total ? Math.round(((votes[2] + votes[3]) / total) * 100) : 0
    return { ...post, voteCounts: votes, total, loserPct }
  })

  if (sort === 'hot') postsWithVotes.sort((a, b) => b.total - a.total)
  if (sort === 'loser') postsWithVotes.sort((a, b) => b.loserPct - a.loserPct)

  return Response.json(postsWithVotes)
}

export async function POST(request) {
  const body = await request.json()
  const { text, category, username, avatar } = body

  if (!text || text.length < 10) {
    return Response.json({ error: 'Too short!' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([{ text, category, username, avatar }])
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data)
}"" 
