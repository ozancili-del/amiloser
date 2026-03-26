import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const JUDGE_SYSTEM_PROMPT = `You are Judge Loser, the most dramatic and unhinged judge presiding over the Court of Public Humiliation. 

Your personality:
- You speak in over-the-top legal theatrics but make it absurd and hilarious
- You cite completely fake laws like "Section 7(c) of the Embarrassing Human Conduct Act" 
- You are savage but never cruel or mean-spirited — this is comedy, not bullying
- You use words like "the defendant", "this court", "the record", "Exhibit A"
- You are always slightly offended by the confession but secretly entertained
- You end statements with dramatic pauses and legal flourishes
- Never break character. Ever.

Rules:
- First message: Give your opening reaction and preliminary verdict. Ask them to defend themselves.
- Second message (their defense round 1): Roast their defense. Make it worse for them. Ask for final plea.
- Third message (their final plea): Issue the FINAL VERDICT. Give a loser score 0-100. Close the case with 🔨 CASE CLOSED. No more appeals.

Keep responses under 100 words. Punchy. Funny. Savage.`

export async function POST(request) {
  const body = await request.json()
  const { post_id, confession, messages } = body

  // Build conversation history
  const conversationMessages = []

  if (messages && messages.length > 0) {
    messages.forEach(m => {
      conversationMessages.push({
        role: m.role,
        content: m.content
      })
    })
  } else {
    conversationMessages.push({
      role: 'user',
      content: `The defendant confesses: "${confession}"`
    })
  }

  // Check if API key exists
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_key_here') {
    // Fake responses for dev mode
    const round = conversationMessages.length
    const fakeResponses = [
      "The Court of Public Humiliation calls this case to order. 🔨 I have reviewed your confession with the gravity it deserves. Under Section 7(c) of the Embarrassing Human Conduct Act, this is deeply concerning. The preliminary evidence suggests you are, in fact, a loser. But this court is merciful. Defend yourself.",
      "Your defense has been noted, considered, and immediately dismissed. You have somehow made this worse by explaining it. The court thanks you for your honesty and condemns you for your choices. One final plea. Choose your words carefully.",
      "🔨 FINAL VERDICT: GUILTY. The defendant had every opportunity to redeem themselves and chose chaos instead. Loser Score: 87/100. Sentence: 30 days of self-reflection and one unsent apology text. CASE CLOSED. No further appeals will be heard."
    ]
    return Response.json({ 
      response: fakeResponses[Math.min(round - 1, 2)],
      closed: conversationMessages.length >= 5
    })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: JUDGE_SYSTEM_PROMPT,
      messages: conversationMessages,
    })

    const text = response.content[0].text
    const closed = conversationMessages.length >= 5

    return Response.json({ response: text, closed })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}