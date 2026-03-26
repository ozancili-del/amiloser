'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthModal from './components/AuthModal'

const avatarEmojis = ['🐸','🦆','🐢','🦎','🐧','🦉','🦝','🐨','🐻','🐼','🦊','🐺','🦁','🦄','🦋','🐙','🦑','🦀','🐡','🦩']
const anonNames = ['Anonymous Goblin','Brave Disaster','User_4821','CertifiedMess_99','RegrettableHuman','ChaoticNeutral_42','EmotionalSupport404','BrokeAndProud_88','SoftClownEnergy','UnhingedOptimist']
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
function rand(arr){return arr[Math.floor(Math.random()*arr.length)]}
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

// JUDGE PANEL
function JudgePanel({post,currentUser}){
  const [messages,setMessages]=useState([])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const [closed,setClosed]=useState(false)
  const [open,setOpen]=useState(false)
  const [started,setStarted]=useState(false)
  const [sessionLoaded,setSessionLoaded]=useState(false)

  useEffect(()=>{if(open&&!sessionLoaded)loadSession()},[open])

  async function loadSession(){
    const res=await fetch(`/api/judge-session?post_id=${post.id}`)
    const data=await res.json()
    if(data&&data.messages){setMessages(data.messages);setClosed(data.closed||false);setStarted(true)}
    setSessionLoaded(true)
  }

  async function saveSession(msgs,isClosed,finalVerdict=null){
    await fetch('/api/judge-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:post.id,messages:msgs,closed:isClosed,final_verdict:finalVerdict})})
  }

  async function sendMessage(content){
    const newMessages=[...messages,{role:'user',content}]
    setMessages(newMessages);setLoading(true);setInput('')
    try{
      const res=await fetch('/api/judge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:post.id,confession:post.text,messages:newMessages})})
      const data=await res.json()
      const updatedMessages=[...newMessages,{role:'assistant',content:data.response}]
      setMessages(updatedMessages)
      const isClosed=data.closed||false
      setClosed(isClosed)
      await saveSession(updatedMessages,isClosed,isClosed?data.response:null)
    }catch(e){setMessages(prev=>[...prev,{role:'assistant',content:'The court is temporarily unavailable.'}])}
    setLoading(false)
  }

  async function startJudge(){
    setOpen(!open)
    if(open)return
    if(!sessionLoaded)await loadSession()
    if(started)return
    setStarted(true)
    const firstMsg=[{role:'user',content:`The defendant confesses: "${post.text}"`}]
    setMessages(firstMsg);setLoading(true)
    try{
      const res=await fetch('/api/judge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:post.id,confession:post.text,messages:firstMsg})})
      const data=await res.json()
      const updatedMessages=[...firstMsg,{role:'assistant',content:data.response}]
      setMessages(updatedMessages)
      await saveSession(updatedMessages,false)
    }catch(e){setMessages([{role:'assistant',content:'The court is temporarily unavailable.'}])}
    setLoading(false)
  }

  const round=messages.filter(m=>m.role==='user').length
  const isDefendant=currentUser?.username===post.username

  return(
    <div>
      <button className="card-action-btn judge-btn" onClick={startJudge}>⚖️ Judge Loser {open?'▲':'▼'}</button>
      {open&&(
        <div className="judge-panel">
          <div className="judge-header">
            <div className="judge-avatar">⚖️</div>
            <div><div className="judge-name">Judge Loser</div><div className="judge-subtitle">Court of Public Humiliation</div></div>
            <button className="judge-close" onClick={()=>setOpen(false)}>✕</button>
          </div>
          <div className="judge-messages">
            {messages.map((m,i)=>(
              <div key={i} className={m.role==='assistant'?'judge-msg':'user-defense'}>{m.content}</div>
            ))}
            {loading&&<div className="judge-msg judge-typing">⚖️ The court is deliberating...</div>}
          </div>
          {!closed&&!loading&&isDefendant&&round<3&&round>0&&(
            <div className="judge-input-row">
              <input className="judge-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&input.trim()&&sendMessage('↳ '+input.trim())} placeholder={round===1?'Defend yourself...':'Your final plea'} maxLength={200}/>
              <button className="judge-submit" onClick={()=>input.trim()&&sendMessage('↳ '+input.trim())} disabled={!input.trim()}>{round===1?'Argue':'Final Plea'}</button>
            </div>
          )}
          {!closed&&!loading&&!isDefendant&&round>0&&<div className="spectator-note">👀 Watching this case unfold...</div>}
          {closed&&<div className="case-closed">🔨 CASE CLOSED — NO FURTHER APPEALS</div>}
        </div>
      )}
    </div>
  )
}

// EVIDENCE PANEL
function EvidencePanel({post,currentUser}){
  const [open,setOpen]=useState(false)
  const [evidence,setEvidence]=useState([])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const [submitted,setSubmitted]=useState(false)
  const [count,setCount]=useState(0)

  useEffect(()=>{if(open)loadEvidence()},[open])

  async function loadEvidence(){
    const res=await fetch(`/api/evidence?post_id=${post.id}`)
    const data=await res.json()
    if(Array.isArray(data)){setEvidence(data);setCount(data.length)}
  }

  async function submitEvidence(){
    if(!input.trim()||input.length>50)return
    setLoading(true)
    const username=currentUser?.username||'Anonymous'
    const session_token=getSessionToken()
    const res=await fetch('/api/evidence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:post.id,text:input.trim(),username,session_token})})
    const data=await res.json()
    if(res.status===409){alert('You already submitted evidence!');setLoading(false);return}
    if(data.evidence){
      setEvidence(prev=>[...prev,data.evidence])
      setCount(data.count)
      setSubmitted(true)
      setInput('')
    }
    setLoading(false)
  }

  const isFull=count>=10
  const isOwn=currentUser?.username===post.username

  return(
    <div>
      <button className="card-action-btn evidence-btn" onClick={()=>setOpen(!open)}>📢 Evidence {count}/10 {open?'▲':'▼'}</button>
      {open&&(
        <div className="evidence-panel">
          <div className="evidence-progress">
            <div className="evidence-bar"><div className="evidence-fill" style={{width:`${Math.min((count/10)*100,100)}%`}}></div></div>
            <div className="evidence-label">{isFull?'🔨 10/10 — Judge Loser has seen enough!':`${count}/10 — ${10-count} more to trigger final verdict`}</div>
          </div>
          <div className="evidence-list">
            {evidence.map((e,i)=>(
              <div key={e.id} className="evidence-item">
                <span className="evidence-exhibit">Exhibit {String.fromCharCode(65+i)}</span>
                <span className="evidence-text">"{e.text}"</span>
                <span className="evidence-user">— {e.username}</span>
              </div>
            ))}
            {evidence.length===0&&<div className="evidence-empty">No evidence yet. Be the first to condemn them.</div>}
          </div>
          {!isFull&&!submitted&&!isOwn&&(
            <div className="evidence-submit-row">
              <input className="evidence-input" value={input} onChange={e=>setInput(e.target.value.slice(0,50))} onKeyDown={e=>e.key==='Enter'&&submitEvidence()} placeholder="Your Honor, I submit that... (50 chars)" maxLength={50}/>
              <div className="evidence-input-meta">{input.length}/50</div>
              <button className="evidence-submit-btn" onClick={submitEvidence} disabled={loading||!input.trim()}>{loading?'...':'Submit Evidence'}</button>
            </div>
          )}
          {submitted&&<div className="evidence-submitted">✅ Evidence submitted! {10-count} more needed for final verdict.</div>}
          {isOwn&&!isFull&&<div className="spectator-note">⚠️ You cannot submit evidence against yourself.</div>}
          {isFull&&<div className="evidence-submitted">🔨 All evidence submitted! Judge Loser will issue final verdict.</div>}
        </div>
      )}
    </div>
  )
}

// VERDICT MODAL
function VerdictModal({post,onClose}){
  const verdict=getVerdict(post.voteCounts||[0,0,0,0])
  const loserPct=post.loserPct||0
  const text=`"${post.text}"\n\n${loserPct}% of the internet says I'm a loser.\nVerdict: ${verdict.label}\n\nAm I a loser? → amiloser.com`
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="verdict-card-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="verdict-card-preview">
          <div className="vc-site">AMILOSER.COM</div>
          <div className="vc-confession">"{post.text.slice(0,80)}{post.text.length>80?'...':''}"</div>
          <div className="vc-verdict-label" style={{color:verdict.color}}>{verdict.label}</div>
          <div className="vc-score">{loserPct}% of the internet voted YES</div>
          <div className="vc-badge" style={{color:verdict.color,borderColor:verdict.color,background:verdict.color+'22'}}>⚖️ Certified by Judge Loser</div>
          <div className="vc-footer">The Court of Public Humiliation · amiloser.com</div>
        </div>
        <button className="modal-copy-btn" onClick={()=>{navigator.clipboard.writeText(text);alert('Copied! Go post your shame 🌍')}}>📋 Copy & Share</button>
      </div>
    </div>
  )
}

// CARD
function Card({post,onVoted,currentUser}){
  const [sharePost,setSharePost]=useState(null)
  const verdict=getVerdict(post.voteCounts||[0,0,0,0])
  const total=post.total||0
  const catCls=catMap[post.category]||'cat-general'

  async function vote(choice){
    const session_token=getSessionToken()
    const res=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_id:post.id,choice,session_token})})
    if(res.ok)onVoted()
  }

  return(
    <div className={`card ${verdict.cls==='verdict-elite'?'elite-card':''}`}>
      {sharePost&&<VerdictModal post={sharePost} onClose={()=>setSharePost(null)}/>}
      <div className="card-header">
        <div className="card-meta">
          <span className="card-avatar">{post.avatar}</span>
          <span className="card-username">{post.username}</span>
          <span className="card-dot">·</span>
          <span className="card-time">just now</span>
        </div>
        <span className={`cat-tag ${catCls}`}>{post.category}</span>
      </div>
      <div className="card-text">{post.text}</div>
      <div className={`verdict-badge ${verdict.cls}`}>{verdict.label}</div>
      <div className="vote-bar">
        {(post.voteCounts||[0,0,0,0]).map((v,i)=>(
          <div key={i} className="vote-seg" style={{width:total?`${Math.round((v/total)*100)}%`:'0%',background:voteColors[i]}}/>
        ))}
      </div>
      <div className="vote-meta">{total.toLocaleString()} votes · {post.loserPct||0}% say loser</div>
      <div className="vote-buttons">
        {voteLabels.map((label,i)=>(
          <button key={i} className="vote-btn" onClick={()=>vote(i)}>{label}</button>
        ))}
      </div>
      <div className="card-actions">
        <JudgePanel post={post} currentUser={currentUser}/>
        <EvidencePanel post={post} currentUser={currentUser}/>
        <button className="card-action-btn share-btn" onClick={()=>setSharePost(post)}>🃏 Share</button>
      </div>
    </div>
  )
}

// MAIN
export default function Home(){
  const [posts,setPosts]=useState([])
  const [loading,setLoading]=useState(true)
  const [sort,setSort]=useState('new')
  const [text,setText]=useState('')
  const [category,setCategory]=useState('General')
  const [certifiedCount,setCertifiedCount]=useState(18304)
  const [liveCount,setLiveCount]=useState(4821)
  const [toast,setToast]=useState('')
  const [toastVisible,setToastVisible]=useState(false)
  const [showAuthModal,setShowAuthModal]=useState(false)
  const [user,setUser]=useState(null)
  const [anonUser,setAnonUser]=useState(null)
  const [showSubmit,setShowSubmit]=useState(false)
  const categories=['Dating','Money','Work','Friends','Family','Tech','Travel','General']

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setUser(session?.user??null))
    const anonUsername=localStorage.getItem('ail_anon_username')
    const anonAvatar=localStorage.getItem('ail_anon_avatar')
    if(anonUsername)setAnonUser({username:anonUsername,avatar:anonAvatar||'🐸'})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user??null))
    fetchPosts()
    const interval=setInterval(()=>{
      setLiveCount(n=>n+Math.floor(Math.random()*6)-3)
      if(Math.random()<0.3)setCertifiedCount(n=>n+1)
    },3000)
    return()=>{clearInterval(interval);subscription.unsubscribe()}
  },[sort])

  async function fetchPosts(){
    setLoading(true)
    const res=await fetch(`/api/posts?sort=${sort}`)
    const data=await res.json()
    setPosts(Array.isArray(data)?data:[])
    setLoading(false)
  }

  function showToast(msg){setToast(msg);setToastVisible(true);setTimeout(()=>setToastVisible(false),2800)}

  function handlePostClick(){
    if(user||anonUser){setShowSubmit(true);setTimeout(()=>document.getElementById('submit')?.scrollIntoView({behavior:'smooth'}),100)}
    else setShowAuthModal(true)
  }

  function handleAnon(anonData){
    setAnonUser(anonData);setShowSubmit(true)
    setTimeout(()=>document.getElementById('submit')?.scrollIntoView({behavior:'smooth'}),100)
  }

  async function submitPost(){
    if(!text||text.length<10){showToast('⚠️ Write something longer!');return}
    let username,avatar
    if(user){
      const {data:profile}=await supabase.from('profiles').select('username,avatar').eq('id',user.id).single()
      username=profile?.username||user.email?.split('@')[0]||'Anonymous'
      avatar=profile?.avatar||rand(avatarEmojis)
    }else if(anonUser){username=anonUser.username;avatar=anonUser.avatar}
    else{setShowAuthModal(true);return}
    const res=await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,category,username,avatar})})
    if(res.ok){setText('');fetchPosts();showToast('🎉 Posted! The internet is now judging you.');document.getElementById('feed')?.scrollIntoView({behavior:'smooth'})}
  }

  async function handleSignOut(){await supabase.auth.signOut();setUser(null);showToast('👋 Signed out.')}
  const currentUser=user?{username:user.email?.split('@')[0],avatar:'👤'}:anonUser

  return(
    <>
      <style>{`
        :root{--black:#080808;--white:#f2ede3;--yellow:#ffe135;--red:#ff3b3b;--green:#00e676;--blue:#4fc3f7;--orange:#ff6d00;--purple:#c77dff;--card-bg:#111;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);}
        *{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;}
        body{background:var(--black);color:var(--white);font-family:'Syne',sans-serif;overflow-x:hidden;}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9997;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .scanline{position:fixed;inset:0;pointer-events:none;z-index:9996;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px);animation:scanFade 5s linear forwards;}
        @keyframes scanFade{0%,100%{opacity:0}5%{opacity:1}85%{opacity:0.5}}
        .film-flash{position:fixed;inset:0;pointer-events:none;z-index:9995;background:#ff3b3b;opacity:0;animation:filmFlash 4.5s steps(1) forwards;}
        @keyframes filmFlash{0%{opacity:0}3%{opacity:0.6}3.5%{opacity:0}8%{opacity:0.4}8.3%{opacity:0}14%{opacity:0.3}14.2%{opacity:0}20%{opacity:0.2}20.2%{opacity:0}100%{opacity:0}}
        .impact-flash{position:fixed;inset:0;pointer-events:none;z-index:9994;background:white;opacity:0;animation:impactFlash 0.5s 6.5s ease-out forwards;}
        @keyframes impactFlash{0%{opacity:0}5%{opacity:0.9}15%{opacity:0}25%{opacity:0.3}40%{opacity:0}55%{opacity:0.1}100%{opacity:0}}
        .ticker-wrap{background:var(--yellow);color:var(--black);padding:8px 0;overflow:hidden;white-space:nowrap;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.06em;}
        .ticker-inner{display:inline-block;animation:ticker 35s linear infinite;}
        .ticker-inner span{margin:0 40px;}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        nav{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(8,8,8,0.94);backdrop-filter:blur(16px);z-index:100;}
        .nav-logo{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--yellow);}
        .nav-logo span{color:var(--red);}
        .nav-right{display:flex;align-items:center;gap:12px;}
        .nav-counter{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.35);display:flex;align-items:center;gap:6px;}
        .live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 1.2s ease-in-out infinite;flex-shrink:0;}
        @keyframes blink{50%{opacity:.2;}}
        .nav-user{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.4);display:flex;align-items:center;gap:8px;}
        .nav-signout{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,59,59,.6);cursor:pointer;background:none;border:none;padding:0;}
        .btn-nav-login{font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:6px 14px;background:transparent;border:1px solid rgba(255,255,255,.2);color:var(--white);border-radius:6px;cursor:pointer;}
        .btn-nav-login:hover{border-color:var(--yellow);color:var(--yellow);}
        .hero{min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 20px;position:relative;overflow:hidden;}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;}
        .hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(255,59,59,.12) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
        .hero-eyebrow{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--yellow);margin-bottom:16px;animation:fadeUp .6s ease both;position:relative;}
        .hero-title-wrap{position:relative;display:inline-block;animation:projector 4.5s steps(1) forwards,shake 1.4s 5.2s ease-in-out;}
        .title-line1{font-family:'Bebas Neue',sans-serif;font-size:clamp(72px,16vw,190px);line-height:.9;letter-spacing:-2px;display:block;color:var(--white);}
        .title-line2{font-family:'Bebas Neue',sans-serif;font-size:clamp(72px,16vw,190px);line-height:.9;letter-spacing:-2px;display:block;-webkit-text-stroke:3px var(--red);color:transparent;position:relative;}
        .original-a{display:inline-block;animation:fadeOutA 0.05s 6.48s forwards;}
        .falling-a{color:var(--white);-webkit-text-stroke:0;position:absolute;right:-0.05em;top:0;opacity:0;animation:aAppear 0.4s 6.0s ease-out forwards,aSlam 0.25s 6.5s cubic-bezier(1,0,1,0) forwards,aSettle 0.45s 6.75s cubic-bezier(.34,1.5,.64,1) forwards;}
        @keyframes projector{0%{opacity:0;transform:translateY(-40px) skewX(12deg) scaleY(0.3);filter:brightness(6) blur(8px) contrast(0.1) hue-rotate(90deg)}2%{opacity:0;transform:translateY(50px) skewX(-10deg) scaleY(1.4);filter:brightness(0.1) blur(4px)}4%{opacity:0.4;transform:translateY(-30px) skewX(8deg) scaleX(1.1);filter:brightness(5) blur(6px) contrast(0.2)}6%{opacity:0;transform:translateY(40px) skewX(-12deg);filter:brightness(0.05)}8%{opacity:0.3;transform:translateY(-50px) skewX(6deg) scaleY(0.6);filter:brightness(4) blur(10px) contrast(0.15)}10%{opacity:0;transform:translateY(30px) skewX(-8deg) scaleY(1.3);filter:brightness(0.1) blur(2px)}12%{opacity:0.5;transform:translateY(-20px) skewX(10deg);filter:brightness(3) blur(7px) contrast(0.2) hue-rotate(-45deg)}14%{opacity:0;transform:translateY(20px) skewX(-6deg);filter:brightness(0.05)}16%{opacity:0.4;transform:translateY(-35px) skewX(5deg) scaleY(0.7);filter:brightness(4) blur(5px) contrast(0.25)}18%{opacity:0;transform:translateY(25px) skewX(-7deg) scaleY(1.2);filter:brightness(0.1)}20%{opacity:0.6;transform:translateY(-15px) skewX(4deg);filter:brightness(3) blur(6px) contrast(0.3)}22%{opacity:0;transform:translateY(18px) skewX(-5deg);filter:brightness(0.05)}24%{opacity:0.5;transform:translateY(-25px) skewX(6deg) scaleY(0.8);filter:brightness(2.5) blur(4px) contrast(0.4)}26%{opacity:0.2;transform:translateY(15px) skewX(-4deg) scaleY(1.1);filter:brightness(0.2) blur(1px)}28%{opacity:0.7;transform:translateY(-18px) skewX(3deg);filter:brightness(2) blur(3px) contrast(0.5)}30%{opacity:0.1;transform:translateY(12px) skewX(-3deg);filter:brightness(0.15)}32%{opacity:0.8;transform:translateY(-12px) skewX(2deg);filter:brightness(1.8) blur(2px) contrast(0.6)}34%{opacity:0.3;transform:translateY(10px) skewX(-2deg);filter:brightness(0.2)}36%{opacity:0.85;transform:translateY(-8px) skewX(1.5deg);filter:brightness(1.6) blur(1.5px) contrast(0.7)}38%{opacity:0.4;transform:translateY(8px) skewX(-1.5deg);filter:brightness(0.3) blur(0.5px)}40%{opacity:0.9;transform:translateY(-6px) skewX(1deg);filter:brightness(1.4) blur(1px) contrast(0.8)}42%{opacity:0.5;transform:translateY(6px);filter:brightness(0.4)}44%{opacity:1;transform:translateY(-4px) skewX(0.5deg);filter:brightness(1.3) blur(0.8px) contrast(0.85)}48%{opacity:0.7;transform:translateY(4px);filter:brightness(0.5) blur(0.3px)}52%{opacity:1;transform:translateY(-2px);filter:brightness(1.2) blur(0.5px) contrast(0.9)}56%{opacity:0.8;transform:translateY(2px);filter:brightness(0.7)}60%{opacity:1;transform:translateY(-1px);filter:brightness(1.15) blur(0.3px) contrast(0.95)}66%{opacity:0.9;filter:brightness(1.3)}72%{opacity:1;filter:brightness(1.1) contrast(1);transform:none}78%{filter:brightness(1.2)}84%{filter:brightness(0.95)}90%{filter:brightness(1.05)}96%{filter:brightness(0.98)}100%{opacity:1;filter:none;transform:none}}
        @keyframes shake{0%,100%{transform:translateX(0) rotate(0deg)}5%{transform:translateX(-20px) rotate(-3.5deg)}12%{transform:translateX(22px) rotate(4deg)}20%{transform:translateX(-24px) rotate(-3.5deg)}28%{transform:translateX(24px) rotate(3.5deg)}36%{transform:translateX(-20px) rotate(-3deg)}44%{transform:translateX(20px) rotate(3deg)}52%{transform:translateX(-14px) rotate(-2deg)}60%{transform:translateX(14px) rotate(2deg)}68%{transform:translateX(-8px) rotate(-1.2deg)}76%{transform:translateX(8px) rotate(1.2deg)}84%{transform:translateX(-4px) rotate(-0.5deg)}92%{transform:translateX(4px) rotate(0.5deg)}}
        @keyframes aAppear{0%{opacity:0;transform:translateY(-320px) rotate(-8deg) scaleY(0.6);filter:blur(6px) brightness(3)}40%{opacity:0.5;filter:blur(3px) brightness(2)}100%{opacity:0.9;transform:translateY(-320px) rotate(-8deg) scaleY(0.9);filter:blur(1px) brightness(1.3)}}
        @keyframes aSlam{0%{opacity:0.9;transform:translateY(-320px) rotate(-8deg) scaleY(0.9);filter:blur(1px)}100%{opacity:1;transform:translateY(0.06em) rotate(52deg) scaleY(0.75);filter:blur(3px) brightness(1.5)}}
        @keyframes aSettle{0%{transform:translateY(0.06em) rotate(52deg) scaleY(0.75);filter:blur(3px) brightness(1.5)}25%{transform:translateY(-0.01em) rotate(42deg) scaleY(1.12);filter:blur(0) brightness(1.1)}55%{transform:translateY(0.07em) rotate(47deg) scaleY(0.94);filter:none}78%{transform:translateY(0.02em) rotate(44deg) scaleY(1.03)}100%{transform:translateY(0.04em) rotate(45deg) scaleY(1);filter:none}}
        @keyframes fadeOutA{to{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .hero-sub{font-size:clamp(14px,2vw,20px);font-weight:600;color:rgba(255,255,255,.65);margin-top:28px;max-width:480px;line-height:1.45;animation:fadeUp .7s .4s ease both;position:relative;}
        .hero-micro{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.3);margin-top:8px;animation:fadeUp .7s .5s ease both;position:relative;font-style:italic;}
        .hero-ctas{display:flex;gap:12px;margin-top:32px;flex-wrap:wrap;justify-content:center;animation:fadeUp .7s .6s ease both;position:relative;}
        .hero-badges{display:flex;gap:8px;margin-top:36px;flex-wrap:wrap;justify-content:center;animation:fadeUp .7s .7s ease both;position:relative;}
        .hero-badge{font-family:'DM Mono',monospace;font-size:10px;padding:4px 12px;border:1px solid var(--border2);border-radius:100px;color:rgba(255,255,255,.3);}
        .btn-primary{background:var(--yellow);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;padding:14px 34px;border:none;border-radius:7px;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:4px 4px 0 var(--red);}
        .btn-primary:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--red);}
        .btn-secondary{background:transparent;color:var(--white);font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;padding:14px 34px;border:2px solid rgba(255,255,255,.2);border-radius:7px;cursor:pointer;text-decoration:none;display:inline-block;}
        .btn-secondary:hover{border-color:var(--white);}
        section{padding:60px 20px;max-width:640px;margin:0 auto;}
        .section-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px;display:block;}
        .section-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,6vw,60px);line-height:1;margin-bottom:24px;}
        .submission-box{background:var(--card-bg);border:1px solid var(--border2);border-radius:16px;padding:24px;position:relative;overflow:hidden;}
        .submission-box::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--yellow),var(--red),var(--orange),var(--purple));}
        .confession-area{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:16px;color:var(--white);font-family:'Syne',sans-serif;font-size:15px;resize:none;outline:none;min-height:100px;line-height:1.6;}
        .confession-area:focus{border-color:rgba(255,225,53,.5);}
        .confession-area::placeholder{color:rgba(255,255,255,.22);font-style:italic;}
        .char-count{text-align:right;font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.28);margin-top:4px;}
        .char-count.warning{color:var(--red);}
        .category-pills{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0;}
        .pill{font-family:'DM Mono',monospace;font-size:11px;padding:5px 12px;border:1px solid var(--border);border-radius:100px;cursor:pointer;background:transparent;color:rgba(255,255,255,.4);}
        .pill:hover{border-color:var(--yellow);color:var(--yellow);}
        .pill.active{background:var(--yellow);color:var(--black);border-color:var(--yellow);font-weight:600;}
        .submit-row{display:flex;align-items:center;justify-content:space-between;margin-top:16px;gap:12px;flex-wrap:wrap;}
        .posting-as{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);}
        .btn-submit{background:var(--red);color:white;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;}
        .btn-submit:hover{opacity:.9;}
        .sort-tabs{display:flex;gap:3px;margin-bottom:16px;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:3px;width:fit-content;}
        .tab{font-family:'DM Mono',monospace;font-size:11px;padding:7px 16px;border-radius:5px;cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,.38);}
        .tab.active{background:var(--yellow);color:var(--black);font-weight:600;}
        .feed{display:flex;flex-direction:column;gap:1px;border:1px solid var(--border);border-radius:16px;overflow:hidden;}
        .card{background:var(--card-bg);padding:16px;border-bottom:1px solid var(--border);transition:background .15s;}
        .card:last-child{border-bottom:none;}
        .card:hover{background:#161616;}
        .elite-card{background:rgba(255,59,59,.04);}
        .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
        .card-meta{display:flex;align-items:center;gap:6px;}
        .card-avatar{font-size:16px;}
        .card-username{font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.5);font-weight:500;}
        .card-dot{color:rgba(255,255,255,.2);font-size:10px;}
        .card-time{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.25);}
        .cat-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:4px;flex-shrink:0;}
        .card-text{font-size:15px;line-height:1.5;color:rgba(255,255,255,.88);margin-bottom:12px;font-weight:500;}
        .verdict-badge{display:inline-flex;align-items:center;gap:4px;font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:1px;padding:3px 10px;border-radius:5px;margin-bottom:10px;}
        .vote-bar{display:flex;gap:2px;margin-bottom:6px;height:4px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.06);}
        .vote-seg{height:100%;transition:width .5s ease;}
        .vote-meta{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.25);margin-bottom:10px;}
        .vote-buttons{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;}
        .vote-btn{font-family:'DM Mono',monospace;font-size:11px;padding:6px 11px;border-radius:6px;border:1px solid var(--border);background:transparent;color:rgba(255,255,255,.45);cursor:pointer;transition:all .15s;}
        .vote-btn:hover{background:rgba(255,255,255,.06);color:var(--white);}
        .card-actions{display:flex;gap:6px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border);}
        .card-action-btn{font-family:'DM Mono',monospace;font-size:11px;padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:rgba(255,255,255,.35);cursor:pointer;transition:all .15s;}
        .card-action-btn:hover{color:var(--white);border-color:var(--border2);}
        .judge-btn{border-color:rgba(199,125,255,.25);color:var(--purple);}
        .judge-btn:hover{background:rgba(199,125,255,.06);}
        .evidence-btn{border-color:rgba(255,109,0,.25);color:var(--orange);}
        .evidence-btn:hover{background:rgba(255,109,0,.06);}
        .share-btn{border-color:rgba(255,225,53,.2);color:var(--yellow);}
        .share-btn:hover{background:rgba(255,225,53,.05);}
        .judge-panel{margin-top:12px;background:rgba(199,125,255,.04);border:1px solid rgba(199,125,255,.12);border-radius:10px;padding:14px;}
        .judge-header{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
        .judge-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#c77dff,#ff3b3b);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
        .judge-name{font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;color:var(--purple);}
        .judge-subtitle{font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.25);}
        .judge-close{margin-left:auto;background:rgba(255,255,255,.05);border:none;color:rgba(255,255,255,.35);width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:11px;}
        .judge-messages{display:flex;flex-direction:column;gap:8px;margin-bottom:10px;max-height:400px;overflow-y:auto;}
        .judge-msg{font-family:'Syne',sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,.75);padding:10px 12px;background:rgba(199,125,255,.06);border-radius:8px;border-left:2px solid var(--purple);}
        .user-defense{font-family:'DM Mono',monospace;font-size:12px;line-height:1.6;color:rgba(255,255,255,.55);padding:8px 12px;background:rgba(255,255,255,.03);border-radius:8px;border-left:2px solid rgba(255,255,255,.15);}
        .judge-typing{opacity:.5;font-style:italic;}
        .judge-input-row{display:flex;gap:6px;}
        .judge-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(199,125,255,.15);border-radius:7px;padding:8px 12px;color:var(--white);font-family:'DM Mono',monospace;font-size:12px;outline:none;}
        .judge-input::placeholder{color:rgba(255,255,255,.2);}
        .judge-submit{background:var(--purple);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:8px 14px;border:none;border-radius:7px;cursor:pointer;white-space:nowrap;}
        .judge-submit:disabled{opacity:.4;cursor:not-allowed;}
        .case-closed{font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:2px;color:rgba(255,59,59,.5);text-align:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,59,59,.1);}
        .spectator-note{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.25);text-align:center;margin-top:8px;font-style:italic;}
        .evidence-panel{margin-top:12px;background:rgba(255,109,0,.04);border:1px solid rgba(255,109,0,.12);border-radius:10px;padding:14px;}
        .evidence-progress{margin-bottom:12px;}
        .evidence-bar{height:4px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-bottom:6px;}
        .evidence-fill{height:100%;background:linear-gradient(90deg,var(--orange),var(--red));border-radius:4px;transition:width .5s ease;}
        .evidence-label{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.35);}
        .evidence-list{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;}
        .evidence-item{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;}
        .evidence-exhibit{font-family:'Bebas Neue',sans-serif;font-size:11px;color:var(--orange);letter-spacing:1px;flex-shrink:0;}
        .evidence-text{font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.7);}
        .evidence-user{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);}
        .evidence-empty{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.25);text-align:center;padding:8px 0;font-style:italic;}
        .evidence-submit-row{display:flex;flex-direction:column;gap:4px;}
        .evidence-input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,109,0,.15);border-radius:7px;padding:8px 12px;color:var(--white);font-family:'DM Mono',monospace;font-size:12px;outline:none;}
        .evidence-input::placeholder{color:rgba(255,255,255,.2);}
        .evidence-input-meta{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.25);text-align:right;}
        .evidence-submit-btn{background:var(--orange);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:8px 16px;border:none;border-radius:7px;cursor:pointer;align-self:flex-end;}
        .evidence-submit-btn:disabled{opacity:.4;cursor:not-allowed;}
        .evidence-submitted{font-family:'DM Mono',monospace;font-size:11px;color:var(--green);text-align:center;padding:6px 0;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);}
        .verdict-card-modal{background:#161616;border:1px solid var(--border2);border-radius:20px;padding:28px;max-width:440px;width:100%;position:relative;}
        .modal-close{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.08);border:none;color:var(--white);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;}
        .verdict-card-preview{background:var(--black);border:2px solid var(--border2);border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;}
        .vc-site{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.2em;color:rgba(255,255,255,.25);text-transform:uppercase;margin-bottom:12px;}
        .vc-confession{font-size:13px;font-weight:600;color:rgba(255,255,255,.8);line-height:1.5;margin-bottom:12px;font-style:italic;}
        .vc-verdict-label{font-family:'Bebas Neue',sans-serif;font-size:38px;line-height:1;margin-bottom:4px;}
        .vc-score{font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.4);margin-bottom:12px;}
        .vc-badge{display:inline-flex;align-items:center;gap:6px;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1.5px;padding:6px 16px;border-radius:7px;border:2px solid;}
        .vc-footer{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;color:rgba(255,255,255,.2);margin-top:12px;text-transform:uppercase;}
        .modal-copy-btn{width:100%;background:var(--yellow);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;padding:12px;border:none;border-radius:9px;cursor:pointer;box-shadow:3px 3px 0 var(--red);}
        .cat-dating{background:rgba(255,99,132,.12);color:#ff6384;}.cat-money{background:rgba(255,206,86,.12);color:#ffce56;}.cat-work{background:rgba(54,162,235,.12);color:#36a2eb;}.cat-friends{background:rgba(153,102,255,.12);color:#9966ff;}.cat-family{background:rgba(255,159,64,.12);color:#ff9f40;}.cat-tech{background:rgba(75,192,192,.12);color:#4bc0c0;}.cat-travel{background:rgba(255,99,255,.12);color:#ff63ff;}.cat-general{background:rgba(255,255,255,.07);color:rgba(255,255,255,.38);}
        .verdict-innocent{background:rgba(0,230,118,.1);color:#00e676;}.verdict-question{background:rgba(79,195,247,.1);color:#4fc3f7;}.verdict-mild{background:rgba(255,109,0,.1);color:#ff6d00;}.verdict-clown{background:rgba(255,225,53,.1);color:#ffe135;}.verdict-elite{background:rgba(255,59,59,.1);color:#ff3b3b;}
        .rules-strip{background:rgba(255,255,255,.02);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:16px 20px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap;}
        .rule-item{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.22);display:flex;align-items:center;gap:6px;}
        .rule-item::before{content:'—';color:rgba(255,255,255,.1);}
        footer{padding:28px;text-align:center;border-top:1px solid var(--border);}
        .footer-logo{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:var(--yellow);margin-bottom:4px;}
        .footer-tagline{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.15);font-style:italic;}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--yellow);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1.5px;padding:11px 22px;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.6);z-index:9999;transition:transform .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none;}
        .toast.show{transform:translateX(-50%) translateY(0);}
        .loading{text-align:center;font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.3);padding:40px;}
        @media(max-width:640px){nav{padding:12px 16px;}section{padding:40px 16px;}.hero{padding:40px 16px;}.rules-strip{padding:14px 16px;gap:12px;}.vote-btn{font-size:10px;padding:5px 9px;}}
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet"/>

      <div className="film-flash"></div>
      <div className="impact-flash"></div>
      <div className="grain"></div>
      <div className="scanline"></div>

      {showAuthModal&&<AuthModal onClose={()=>setShowAuthModal(false)} onAnon={handleAnon} onAuthed={(u)=>{setUser(u);setShowAuthModal(false);setShowSubmit(true)}}/>}

      <div className="ticker-wrap">
        <div className="ticker-inner">
          <span>🔴 LIVE: {liveCount.toLocaleString()} people being judged right now</span>
          <span>⚖️ Judge Loser has issued 1,204 verdicts today</span>
          <span>👑 Today's Top Clown: BrokeAndProud_88 — 98% Elite Loser</span>
          <span>😬 Someone just submitted "I said love you to Tricia from support" again</span>
          <span>📊 68% of users are certified losers. You might be next.</span>
          <span>🔴 LIVE: {liveCount.toLocaleString()} people being judged right now</span>
          <span>⚖️ Judge Loser has issued 1,204 verdicts today</span>
          <span>👑 Today's Top Clown: BrokeAndProud_88 — 98% Elite Loser</span>
          <span>😬 Someone just submitted "I said love you to Tricia from support" again</span>
          <span>📊 68% of users are certified losers. You might be next.</span>
        </div>
      </div>

      <nav>
        <div className="nav-logo">AM I A <span>LOSER</span>?</div>
        <div className="nav-right">
          <div className="nav-counter"><div className="live-dot"></div><span>{liveCount.toLocaleString()} live</span></div>
          {currentUser?(
            <div className="nav-user"><span>{currentUser.avatar} {currentUser.username}</span><button className="nav-signout" onClick={handleSignOut}>sign out</button></div>
          ):(
            <button className="btn-nav-login" onClick={()=>setShowAuthModal(true)}>Login</button>
          )}
        </div>
      </nav>

      <div className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-eyebrow">⚖️ The Court of Public Humiliation — Est. Yesterday</div>
        <div className="hero-title-wrap">
          <span className="title-line1">AM I <span className="original-a">A</span></span>
          <span className="title-line2">LOSER<span style={{color:'var(--yellow)'}}>?</span><span className="falling-a">A</span></span>
        </div>
        <p className="hero-sub">Post your dumb move. Let the internet decide. Get judged by an AI.</p>
        <p className="hero-micro">Brave. Embarrassing. Necessary.</p>
        <div className="hero-ctas">
          <button className="btn-primary" onClick={handlePostClick}>🪣 Post My L</button>
          <a href="#feed" className="btn-secondary">See Today's Losers</a>
        </div>
        <div className="hero-badges">
          <span className="hero-badge">Self-submissions only</span>
          <span className="hero-badge">Anonymous friendly</span>
          <span className="hero-badge">Judge Loser AI presiding</span>
          <span className="hero-badge">Judgment-as-a-service™</span>
        </div>
      </div>

      {(showSubmit||currentUser)&&(
        <section id="submit">
          <span className="section-label">// confess your sins</span>
          <h2 className="section-title">Post Your L</h2>
          <div className="submission-box">
            <textarea className="confession-area" value={text} onChange={e=>setText(e.target.value)} maxLength={280} placeholder="I said 'you too' when the movie theater employee said 'enjoy the film.' We locked eyes for 4 seconds. I am not okay."/>
            <div className={`char-count ${text.length>240?'warning':''}`}>{text.length} / 280</div>
            <div className="category-pills">
              {categories.map(cat=>(
                <button key={cat} className={`pill ${category===cat?'active':''}`} onClick={()=>setCategory(cat)}>
                  {cat==='Dating'?'💔':cat==='Money'?'💸':cat==='Work'?'💼':cat==='Friends'?'🫂':cat==='Family'?'🏠':cat==='Tech'?'🖥️':cat==='Travel'?'✈️':'💀'} {cat}
                </button>
              ))}
            </div>
            <div className="submit-row">
              <div className="posting-as">{currentUser?.avatar} {currentUser?.username}</div>
              <button className="btn-submit" onClick={submitPost}>Let People Judge Me →</button>
            </div>
          </div>
        </section>
      )}

      <section id="feed">
        <span className="section-label">// fresh humiliations</span>
        <h2 className="section-title">The Feed</h2>
        <div className="sort-tabs">
          {['new','hot','loser'].map(s=>(
            <button key={s} className={`tab ${sort===s?'active':''}`} onClick={()=>setSort(s)}>
              {s==='new'?'🆕 New':s==='hot'?'🔥 Hot':'👑 Loser'}
            </button>
          ))}
        </div>
        <div className="feed">
          {loading?(<div className="loading">⚖️ Loading confessions...</div>
          ):posts.length===0?(<div className="loading">No confessions yet. Be the first loser. 🪣</div>
          ):posts.map(post=>(<Card key={post.id} post={post} onVoted={fetchPosts} currentUser={currentUser}/>))}
        </div>
      </section>

      <div className="rules-strip">
        <span className="rule-item">Self-submissions only</span>
        <span className="rule-item">No doxxing or targeting others</span>
        <span className="rule-item">Keep it funny, not cruel</span>
      </div>

      <footer>
        <div className="footer-logo">AM I A LOSER?</div>
        <div className="footer-tagline">"Some mistakes deserve growth. Some deserve voting." — Judge Loser</div>
      </footer>

      <div className={`toast ${toastVisible?'show':''}`}>{toast}</div>
    </>
  )
}
