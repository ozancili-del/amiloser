'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const voteLabels = ['Not a loser','A little 🤏','Yes 😬','Certified 👑']
const voteColors = ['#00e676','#4fc3f7','#ff6d00','#ff3b3b']
const catMap = {Dating:'cat-dating',Money:'cat-money',Work:'cat-work',Friends:'cat-friends',Family:'cat-family',Tech:'cat-tech',Travel:'cat-travel',General:'cat-general'}
const verdicts = [
  {label:'Innocent ✨',cls:'verdict-innocent',threshold:0,color:'#00e676'},
  {label:'Questionable 🤨',cls:'verdict-question',threshold:20,color:'#4fc3f7'},
  {label:'Mild Loser 😬',cls:'verdict-mild',threshold:40,color:'#ff6d00'},
  {label:'Full Clown 🤡',cls:'verdict-clown',threshold:60,color:'#ffe135'},
  {label:'Elite Loser 👑',cls:'verdict-elite',threshold:80,color:'#ff3b3b'},
]

function getVerdict(votes){
  const total=votes.reduce((a,b)=>a+b,0)
  if(!total)return verdicts[0]
  const score=((votes[1]*20+votes[2]*60+votes[3]*100)/total)
  for(let i=verdicts.length-1;i>=0;i--)if(score>=verdicts[i].threshold)return verdicts[i]
  return verdicts[0]
}
function getSessionToken(){
  if(typeof window==='undefined')return ''
  let token=localStorage.getItem('ail_session')
  if(!token){token=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('ail_session',token)}
  return token
}

export default function PostPage(){
  const {id} = useParams()
  const [post, setPost] = useState(null)
  const [judgeSession, setJudgeSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if(id) loadPost()
  },[id])

  async function loadPost(){
    setLoading(true)
    const res = await fetch(`/api/posts/${id}`)
    const data = await res.json()
    setPost(data)

    const judgeRes = await fetch(`/api/judge-session?post_id=${id}`)
    const judgeData = await judgeRes.json()
    setJudgeSession(judgeData)

    setLoading(false)
  }

  async function vote(choice){
    const session_token = getSessionToken()
    await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:id,choice,session_token})})
    loadPost()
  }

  if(loading) return(
    <div style={{background:'#080808',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.4)',fontFamily:'monospace'}}>
      ⚖️ Loading case file...
    </div>
  )

  if(!post) return(
    <div style={{background:'#080808',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.4)',fontFamily:'monospace'}}>
      Case not found. Maybe they fled the jurisdiction.
    </div>
  )

  const verdict = getVerdict(post.voteCounts||[0,0,0,0])
  const total = post.total||0
  const catCls = catMap[post.category]||'cat-general'

  return(
    <>
      <style>{`
        :root{--black:#080808;--white:#f2ede3;--yellow:#ffe135;--red:#ff3b3b;--green:#00e676;--orange:#ff6d00;--purple:#c77dff;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:var(--black);color:var(--white);font-family:'Syne',sans-serif;}
        .cat-dating{background:rgba(255,99,132,.12);color:#ff6384;}.cat-money{background:rgba(255,206,86,.12);color:#ffce56;}.cat-work{background:rgba(54,162,235,.12);color:#36a2eb;}.cat-friends{background:rgba(153,102,255,.12);color:#9966ff;}.cat-family{background:rgba(255,159,64,.12);color:#ff9f40;}.cat-tech{background:rgba(75,192,192,.12);color:#4bc0c0;}.cat-travel{background:rgba(255,99,255,.12);color:#ff63ff;}.cat-general{background:rgba(255,255,255,.07);color:rgba(255,255,255,.38);}
        .verdict-innocent{background:rgba(0,230,118,.1);color:#00e676;}.verdict-question{background:rgba(79,195,247,.1);color:#4fc3f7;}.verdict-mild{background:rgba(255,109,0,.1);color:#ff6d00;}.verdict-clown{background:rgba(255,225,53,.1);color:#ffe135;}.verdict-elite{background:rgba(255,59,59,.1);color:#ff3b3b;}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>

      {/* NAV */}
      <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(8,8,8,0.94)'}}>
        <a href="/" style={{fontFamily:'Bebas Neue',fontSize:'22px',letterSpacing:'2px',color:'#ffe135',textDecoration:'none'}}>
          AM I A <span style={{color:'#ff3b3b'}}>LOSER</span>?
        </a>
        <a href="/" style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>← Back to feed</a>
      </div>

      <div style={{maxWidth:'640px',margin:'0 auto',padding:'40px 20px'}}>

        {/* POST CARD */}
        <div style={{background:'#111',border:'1px solid var(--border2)',borderRadius:'16px',padding:'24px',marginBottom:'20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'18px'}}>{post.avatar}</span>
              <span style={{fontFamily:'DM Mono, monospace',fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>{post.username}</span>
            </div>
            <span className={`cat-tag ${catCls}`} style={{fontFamily:'DM Mono, monospace',fontSize:'9px',letterSpacing:'.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'4px'}}>{post.category}</span>
          </div>

          <div style={{fontSize:'18px',lineHeight:'1.5',color:'rgba(255,255,255,0.9)',marginBottom:'16px',fontWeight:'600'}}>{post.text}</div>

          <div className={`verdict-badge ${verdict.cls}`} style={{display:'inline-flex',alignItems:'center',gap:'4px',fontFamily:'Bebas Neue',fontSize:'13px',letterSpacing:'1px',padding:'3px 10px',borderRadius:'5px',marginBottom:'14px'}}>{verdict.label}</div>

          <div style={{height:'5px',borderRadius:'4px',overflow:'hidden',background:'rgba(255,255,255,0.06)',display:'flex',gap:'2px',marginBottom:'8px'}}>
            {(post.voteCounts||[0,0,0,0]).map((v,i)=>(
              <div key={i} style={{height:'100%',width:total?`${Math.round((v/total)*100)}%`:'0%',background:voteColors[i]}}/>
            ))}
          </div>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:'10px',color:'rgba(255,255,255,0.25)',marginBottom:'16px'}}>{total.toLocaleString()} votes · {post.loserPct||0}% say loser</div>

          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {voteLabels.map((label,i)=>(
              <button key={i} onClick={()=>vote(i)} style={{fontFamily:'DM Mono, monospace',fontSize:'11px',padding:'8px 14px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>{label}</button>
            ))}
          </div>
        </div>

        {/* JUDGE SESSION */}
        {judgeSession && judgeSession.messages && judgeSession.messages.length > 0 && (
          <div style={{background:'rgba(199,125,255,0.05)',border:'1px solid rgba(199,125,255,0.15)',borderRadius:'16px',padding:'24px',marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#c77dff,#ff3b3b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>⚖️</div>
              <div>
                <div style={{fontFamily:'Bebas Neue',fontSize:'18px',letterSpacing:'1px',color:'#c77dff'}}>Judge Loser</div>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:'9px',color:'rgba(255,255,255,0.25)'}}>Court of Public Humiliation</div>
              </div>
              {judgeSession.closed && <div style={{marginLeft:'auto',fontFamily:'Bebas Neue',fontSize:'11px',letterSpacing:'1px',color:'rgba(255,59,59,0.6)'}}>🔨 CASE CLOSED</div>}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {judgeSession.messages.map((m,i)=>{
                if(m.role==='user' && !m.content.startsWith('↳')) return null
                return(
                  <div key={i} style={{
                    fontFamily:'Syne, sans-serif',fontSize:'14px',lineHeight:'1.6',
                    padding:'14px 16px',borderRadius:'10px',
                    background: m.role==='assistant' ? 'rgba(199,125,255,0.08)' : 'rgba(255,255,255,0.04)',
                    borderLeft: m.role==='assistant' ? '2px solid #c77dff' : '2px solid rgba(255,255,255,0.15)',
                    color: m.role==='assistant' ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.55)'
                  }}>{m.content}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* SHARE */}
        <div style={{background:'#111',border:'1px solid var(--border2)',borderRadius:'16px',padding:'24px',textAlign:'center'}}>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:'10px',color:'rgba(255,255,255,0.3)',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:'16px'}}>Share this case</div>
          <div style={{display:'flex',gap:'10px',flexDirection:'column'}}>
            <button onClick={()=>{
              const text = `"${post.text}"\n\nJudge Loser gave me ${post.loserPct||0}% ${verdict.label}\n\nAm I really a loser? Come vote → amiloser.com/post/${post.id}`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,'_blank')
            }} style={{width:'100%',background:'#000',color:'white',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'13px',fontSize:'15px',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',fontFamily:'Syne, sans-serif'}}>
              𝕏 Post to X / Twitter
            </button>
            <button onClick={()=>{
              const text = `"${post.text}"\n\nJudge Loser gave me ${post.loserPct||0}% ${verdict.label}\n\nAm I really a loser? → amiloser.com/post/${post.id}`
              navigator.clipboard.writeText(text)
              alert('Copied! Paste into your Instagram story or caption 📱')
            }} style={{width:'100%',background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',color:'white',border:'none',borderRadius:'10px',padding:'13px',fontSize:'15px',fontWeight:'500',cursor:'pointer',fontFamily:'Syne, sans-serif'}}>
              📸 Copy for Instagram
            </button>
            <button onClick={()=>{
              const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://amiloser.com/post/${post.id}`)}`
              window.open(url,'_blank')
            }} style={{width:'100%',background:'#1877f2',color:'white',border:'none',borderRadius:'10px',padding:'13px',fontSize:'15px',fontWeight:'500',cursor:'pointer',fontFamily:'Syne, sans-serif'}}>
              📘 Share to Facebook
            </button>
          </div>
        </div>

        {/* CTA */}
        <div style={{textAlign:'center',marginTop:'32px',padding:'24px',borderTop:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'28px',letterSpacing:'2px',color:'#ffe135',marginBottom:'8px'}}>AM I A LOSER?</div>
          <div style={{fontFamily:'DM Mono, monospace',fontSize:'12px',color:'rgba(255,255,255,0.35)',marginBottom:'20px'}}>Post your own L and let the internet decide</div>
          <a href="/" style={{background:'#ffe135',color:'#000',fontFamily:'Bebas Neue',fontSize:'20px',letterSpacing:'2px',padding:'14px 34px',borderRadius:'7px',textDecoration:'none',boxShadow:'4px 4px 0 #ff3b3b',display:'inline-block'}}>🪣 Post My L</a>
        </div>

      </div>
    </>
  )
}