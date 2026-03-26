'use client'
import { useState, useEffect } from 'react'

const avatarEmojis = ['🐸','🦆','🐢','🦎','🐧','🦉','🦝','🐨','🐻','🐼','🦊','🐺','🦁','🦄','🦋','🐙','🦑','🦀','🐡','🦩']
const anonNames = ['Anonymous Goblin','Brave Disaster','User_4821','CertifiedMess_99','RegrettableHuman','ChaoticNeutral_42','EmotionalSupport404','BrokeAndProud_88','SoftClownEnergy','UnhingedOptimist']
const voteLabels = ['Not a loser','A little 🤏','Yes 😬','Certified Loser 👑']
const voteColors = ['#00e676','#4fc3f7','#ff6d00','#ff3b3b']
const catMap = {Dating:'cat-dating',Money:'cat-money',Work:'cat-work',Friends:'cat-friends',Family:'cat-family',Tech:'cat-tech',Travel:'cat-travel',General:'cat-general'}
const verdicts = [
  {label:'Innocent ✨',cls:'verdict-innocent',threshold:0,color:'#00e676'},
  {label:'Questionable 🤨',cls:'verdict-question',threshold:20,color:'#4fc3f7'},
  {label:'Mild Loser 😬',cls:'verdict-mild',threshold:40,color:'#ff6d00'},
  {label:'Full Clown 🤡',cls:'verdict-clown',threshold:60,color:'#ffe135'},
  {label:'Elite Loser 👑',cls:'verdict-elite',threshold:80,color:'#ff3b3b'},
]

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function getVerdict(votes) {
  const total = votes.reduce((a, b) => a + b, 0)
  if (!total) return verdicts[0]
  const score = ((votes[1]*20 + votes[2]*60 + votes[3]*100) / total)
  for (let i = verdicts.length-1; i >= 0; i--) {
    if (score >= verdicts[i].threshold) return verdicts[i]
  }
  return verdicts[0]
}

function getSessionToken() {
  if (typeof window === 'undefined') return ''
  let token = localStorage.getItem('ail_session')
  if (!token) {
    token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('ail_session', token)
  }
  return token
}

function JudgePanel({ post }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [closed, setClosed] = useState(false)
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)

  async function sendMessage(content) {
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    setInput('')
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, confession: post.text, messages: newMessages })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      if (data.closed) setClosed(true)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'The court is temporarily unavailable.' }])
    }
    setLoading(false)
  }

  async function startJudge() {
    setOpen(!open)
    if (started) return
    setStarted(true)
    await sendMessage(`The defendant confesses: "${post.text}"`)
  }

  const round = messages.filter(m => m.role === 'user').length

  return (
    <div>
      <button className="action-btn judge-btn" onClick={startJudge}>⚖️ Ask Judge Loser</button>
      {open && (
        <div className="judge-panel">
          <div className="judge-header">
            <div className="judge-avatar">⚖️</div>
            <div>
              <div className="judge-name">Judge Loser</div>
              <div className="judge-title">Presiding — Court of Public Humiliation</div>
            </div>
            <button className="judge-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="judge-messages">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'assistant' ? 'judge-msg' : 'user-msg'}>
                {m.role === 'user' && '↳ '}{m.content}
              </div>
            ))}
            {loading && <div className="judge-msg judge-typing">⚖️ The court is deliberating...</div>}
          </div>
          {!closed && !loading && round < 3 && round > 0 && (
            <div className="judge-input-row">
              <input
                className="judge-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && input.trim() && sendMessage(input.trim())}
                placeholder={round === 1 ? 'Defend yourself... if you dare' : 'Your final plea to the court'}
              />
              <button className="judge-submit" onClick={() => input.trim() && sendMessage(input.trim())} disabled={!input.trim()}>
                ⚖️ {round === 1 ? 'Argue' : 'Final Plea'}
              </button>
            </div>
          )}
          {closed && <div className="case-closed">⚖️ NO FURTHER APPEALS WILL BE HEARD ⚖️</div>}
        </div>
      )}
    </div>
  )
}

function VerdictModal({ post, onClose }) {
  const verdict = getVerdict(post.voteCounts || [0,0,0,0])
  const loserPct = post.loserPct || 0
  const text = `"${post.text}"\n\n${loserPct}% of the internet says I'm a loser.\nVerdict: ${verdict.label}\n\nAm I a loser? → amiloser.com`
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="verdict-card-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="verdict-card-preview">
          <div className="vc-site">AMILOSER.COM</div>
          <div className="vc-confession">"{post.text.slice(0,80)}{post.text.length>80?'...':''}"</div>
          <div className="vc-verdict-label" style={{color:verdict.color}}>{verdict.label}</div>
          <div className="vc-score">{loserPct}% of the internet voted YES</div>
          <div className="vc-badge" style={{color:verdict.color,borderColor:verdict.color,background:verdict.color+'22'}}>⚖️ Certified by Judge Loser</div>
          <div className="vc-footer">The Court of Public Humiliation · amiloser.com</div>
        </div>
        <button className="modal-copy-btn" onClick={() => { navigator.clipboard.writeText(text); alert('Copied! Go post your shame 🌍') }}>📋 Copy & Share Your Verdict</button>
        <div className="modal-sub">Screenshot this and post your shame to the world 🌍</div>
      </div>
    </div>
  )
}

function Card({ post, onVoted }) {
  const [sharePost, setSharePost] = useState(null)
  const verdict = getVerdict(post.voteCounts || [0,0,0,0])
  const total = post.total || 0
  const catCls = catMap[post.category] || 'cat-general'

  async function vote(choice) {
    const session_token = getSessionToken()
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, choice, session_token })
    })
    if (res.ok) onVoted()
  }

  return (
    <div className={`card ${verdict.cls === 'verdict-elite' ? 'elite-loser-card' : ''}`}>
      {sharePost && <VerdictModal post={sharePost} onClose={() => setSharePost(null)} />}
      <div className="card-header">
        <div className="card-meta">
          <div className="user-avatar">{post.avatar}</div>
          <div>
            <div className="username">{post.username}</div>
            <div className="timestamp">just now</div>
          </div>
        </div>
        <span className={`cat-tag ${catCls}`}>{post.category}</span>
      </div>
      <div className="card-text">{post.text}</div>
      <div className={`verdict-badge ${verdict.cls}`}>{verdict.label}</div>
      <div className="vote-bar">
        {(post.voteCounts || [0,0,0,0]).map((v, i) => (
          <div key={i} className="vote-bar-seg" style={{width: total ? `${Math.round((v/total)*100)}%` : '0%', background: voteColors[i]}} />
        ))}
      </div>
      <div className="vote-question">Am I a loser? · {total.toLocaleString()} votes · {post.loserPct || 0}% say yes</div>
      <div className="vote-buttons">
        {voteLabels.map((label, i) => (
          <button key={i} className="vote-btn" onClick={() => vote(i)}>{label}</button>
        ))}
      </div>
      <div className="card-actions">
        <JudgePanel post={post} />
        <button className="action-btn share-btn" onClick={() => setSharePost(post)}>🃏 Share Verdict</button>
      </div>
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('new')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [anonMode, setAnonMode] = useState(true)
  const [certifiedCount, setCertifiedCount] = useState(18304)
  const [liveCount, setLiveCount] = useState(4821)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const categories = ['Dating','Money','Work','Friends','Family','Tech','Travel','General']

  useEffect(() => {
    fetchPosts()
    const interval = setInterval(() => {
      setLiveCount(n => n + Math.floor(Math.random()*6)-3)
      if (Math.random() < 0.3) setCertifiedCount(n => n + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [sort])

  async function fetchPosts() {
    setLoading(true)
    const res = await fetch(`/api/posts?sort=${sort}`)
    const data = await res.json()
    setPosts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }

  async function submitPost() {
    if (!text || text.length < 10) { showToast('⚠️ Write something longer!'); return }
    const username = anonMode ? rand(anonNames) : 'You (brave soul)'
    const avatar = rand(avatarEmojis)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, category, username, avatar })
    })
    if (res.ok) {
      setText('')
      fetchPosts()
      showToast('🎉 Posted! The internet is now judging you.')
      document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <style>{`
        :root{--black:#080808;--white:#f2ede3;--yellow:#ffe135;--red:#ff3b3b;--green:#00e676;--blue:#4fc3f7;--orange:#ff6d00;--purple:#c77dff;--card-bg:#111111;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);}
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{background:var(--black);color:var(--white);font-family:'Syne',sans-serif;overflow-x:hidden;}
        body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");pointer-events:none;z-index:9998;opacity:.5;}

        /* TICKER */
        .ticker-wrap{background:var(--yellow);color:var(--black);padding:9px 0;overflow:hidden;white-space:nowrap;font-family:'DM Mono',monospace;font-size:11.5px;font-weight:500;letter-spacing:.06em;}
        .ticker-inner{display:inline-block;animation:ticker 35s linear infinite;}
        .ticker-inner span{margin:0 48px;}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}

        /* NAV */
        nav{display:flex;justify-content:space-between;align-items:center;padding:18px 40px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(8,8,8,0.94);backdrop-filter:blur(16px);z-index:100;}
        .nav-logo{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:2px;color:var(--yellow);}
        .nav-logo span{color:var(--red);}
        .nav-right{display:flex;align-items:center;gap:28px;}
        .nav-counter{font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.35);display:flex;align-items:center;gap:8px;}
        .live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:blink 1.2s ease-in-out infinite;flex-shrink:0;}
        @keyframes blink{50%{opacity:.2;}}
        .nav-certified{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.25);}
        .nav-certified strong{color:var(--red);font-size:13px;}

        /* HERO */
        .hero{min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;position:relative;overflow:hidden;}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;}
        .hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(255,59,59,.12) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
        .hero-eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--yellow);margin-bottom:20px;animation:fadeUp .6s ease both;position:relative;}

        /* FILM GRAIN */
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9997;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        @keyframes grainShift{0%{transform:translate(0,0)}25%{transform:translate(-3px,2px)}50%{transform:translate(2px,-3px)}75%{transform:translate(3px,2px)}}

        /* SCAN LINES */
        .scanline{position:fixed;inset:0;pointer-events:none;z-index:9996;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px);animation:scanFade 5s linear forwards;}
        @keyframes scanFade{0%,100%{opacity:0}5%{opacity:1}85%{opacity:0.5}}

        /* RED FILM FLASHES */
        .film-flash{position:fixed;inset:0;pointer-events:none;z-index:9995;background:#ff3b3b;opacity:0;animation:filmFlash 4.5s steps(1) forwards;}
        @keyframes filmFlash{0%{opacity:0}3%{opacity:0.6}3.5%{opacity:0}8%{opacity:0.4}8.3%{opacity:0}14%{opacity:0.3}14.2%{opacity:0}20%{opacity:0.2}20.2%{opacity:0}100%{opacity:0}}

        /* IMPACT FLASH */
        .impact-flash{position:fixed;inset:0;pointer-events:none;z-index:9994;background:white;opacity:0;animation:impactFlash 0.5s 6.5s ease-out forwards;}
        @keyframes impactFlash{0%{opacity:0}5%{opacity:0.9}15%{opacity:0}25%{opacity:0.3}40%{opacity:0}55%{opacity:0.1}100%{opacity:0}}

        /* THE TITLE WRAPPER */
        .hero-title-wrap{position:relative;display:inline-block;animation:projector 4.5s steps(1) forwards, shake 1.4s 5.2s ease-in-out;}
        .title-line1{font-family:'Bebas Neue',sans-serif;font-size:clamp(76px,17vw,196px);line-height:.9;letter-spacing:-2px;display:block;color:var(--white);}
        .title-line2{font-family:'Bebas Neue',sans-serif;font-size:clamp(76px,17vw,196px);line-height:.9;letter-spacing:-2px;display:block;-webkit-text-stroke:3px var(--red);color:transparent;position:relative;}
        .original-a{display:inline-block;animation:fadeOutA 0.05s 6.48s forwards;}

        /* FALLING A */
        .falling-a{color:var(--white);-webkit-text-stroke:0;position:absolute;right:-0.05em;top:0;opacity:0;animation:aAppear 0.4s 6.0s ease-out forwards,aSlam 0.25s 6.5s cubic-bezier(1,0,1,0) forwards,aSettle 0.45s 6.75s cubic-bezier(.34,1.5,.64,1) forwards;}

        @keyframes projector{
          0%{opacity:0;transform:translateY(-40px) skewX(12deg) scaleY(0.3);filter:brightness(6) blur(8px) contrast(0.1) hue-rotate(90deg)}
          2%{opacity:0;transform:translateY(50px) skewX(-10deg) scaleY(1.4);filter:brightness(0.1) blur(4px)}
          4%{opacity:0.4;transform:translateY(-30px) skewX(8deg) scaleX(1.1);filter:brightness(5) blur(6px) contrast(0.2)}
          6%{opacity:0;transform:translateY(40px) skewX(-12deg);filter:brightness(0.05)}
          8%{opacity:0.3;transform:translateY(-50px) skewX(6deg) scaleY(0.6);filter:brightness(4) blur(10px) contrast(0.15)}
          10%{opacity:0;transform:translateY(30px) skewX(-8deg) scaleY(1.3);filter:brightness(0.1) blur(2px)}
          12%{opacity:0.5;transform:translateY(-20px) skewX(10deg);filter:brightness(3) blur(7px) contrast(0.2) hue-rotate(-45deg)}
          14%{opacity:0;transform:translateY(20px) skewX(-6deg);filter:brightness(0.05)}
          16%{opacity:0.4;transform:translateY(-35px) skewX(5deg) scaleY(0.7);filter:brightness(4) blur(5px) contrast(0.25)}
          18%{opacity:0;transform:translateY(25px) skewX(-7deg) scaleY(1.2);filter:brightness(0.1)}
          20%{opacity:0.6;transform:translateY(-15px) skewX(4deg);filter:brightness(3) blur(6px) contrast(0.3)}
          22%{opacity:0;transform:translateY(18px) skewX(-5deg);filter:brightness(0.05)}
          24%{opacity:0.5;transform:translateY(-25px) skewX(6deg) scaleY(0.8);filter:brightness(2.5) blur(4px) contrast(0.4)}
          26%{opacity:0.2;transform:translateY(15px) skewX(-4deg) scaleY(1.1);filter:brightness(0.2) blur(1px)}
          28%{opacity:0.7;transform:translateY(-18px) skewX(3deg);filter:brightness(2) blur(3px) contrast(0.5)}
          30%{opacity:0.1;transform:translateY(12px) skewX(-3deg);filter:brightness(0.15)}
          32%{opacity:0.8;transform:translateY(-12px) skewX(2deg);filter:brightness(1.8) blur(2px) contrast(0.6)}
          34%{opacity:0.3;transform:translateY(10px) skewX(-2deg);filter:brightness(0.2)}
          36%{opacity:0.85;transform:translateY(-8px) skewX(1.5deg);filter:brightness(1.6) blur(1.5px) contrast(0.7)}
          38%{opacity:0.4;transform:translateY(8px) skewX(-1.5deg);filter:brightness(0.3) blur(0.5px)}
          40%{opacity:0.9;transform:translateY(-6px) skewX(1deg);filter:brightness(1.4) blur(1px) contrast(0.8)}
          42%{opacity:0.5;transform:translateY(6px);filter:brightness(0.4)}
          44%{opacity:1;transform:translateY(-4px) skewX(0.5deg);filter:brightness(1.3) blur(0.8px) contrast(0.85)}
          48%{opacity:0.7;transform:translateY(4px);filter:brightness(0.5) blur(0.3px)}
          52%{opacity:1;transform:translateY(-2px);filter:brightness(1.2) blur(0.5px) contrast(0.9)}
          56%{opacity:0.8;transform:translateY(2px);filter:brightness(0.7)}
          60%{opacity:1;transform:translateY(-1px);filter:brightness(1.15) blur(0.3px) contrast(0.95)}
          66%{opacity:0.9;filter:brightness(1.3)}
          72%{opacity:1;filter:brightness(1.1) contrast(1);transform:none}
          78%{filter:brightness(1.2)}
          84%{filter:brightness(0.95)}
          90%{filter:brightness(1.05)}
          96%{filter:brightness(0.98)}
          100%{opacity:1;filter:none;transform:none}
        }

        @keyframes shake{
          0%,100%{transform:translateX(0) rotate(0deg)}
          5%{transform:translateX(-20px) rotate(-3.5deg)}
          12%{transform:translateX(22px) rotate(4deg)}
          20%{transform:translateX(-24px) rotate(-3.5deg)}
          28%{transform:translateX(24px) rotate(3.5deg)}
          36%{transform:translateX(-20px) rotate(-3deg)}
          44%{transform:translateX(20px) rotate(3deg)}
          52%{transform:translateX(-14px) rotate(-2deg)}
          60%{transform:translateX(14px) rotate(2deg)}
          68%{transform:translateX(-8px) rotate(-1.2deg)}
          76%{transform:translateX(8px) rotate(1.2deg)}
          84%{transform:translateX(-4px) rotate(-0.5deg)}
          92%{transform:translateX(4px) rotate(0.5deg)}
        }

        @keyframes aAppear{
          0%{opacity:0;transform:translateY(-320px) rotate(-8deg) scaleY(0.6);filter:blur(6px) brightness(3)}
          40%{opacity:0.5;filter:blur(3px) brightness(2)}
          100%{opacity:0.9;transform:translateY(-320px) rotate(-8deg) scaleY(0.9);filter:blur(1px) brightness(1.3)}
        }
        @keyframes aSlam{
          0%{opacity:0.9;transform:translateY(-320px) rotate(-8deg) scaleY(0.9);filter:blur(1px)}
          100%{opacity:1;transform:translateY(0.06em) rotate(52deg) scaleY(0.75);filter:blur(3px) brightness(1.5)}
        }
        @keyframes aSettle{
          0%{transform:translateY(0.06em) rotate(52deg) scaleY(0.75);filter:blur(3px) brightness(1.5)}
          25%{transform:translateY(-0.01em) rotate(42deg) scaleY(1.12);filter:blur(0) brightness(1.1)}
          55%{transform:translateY(0.07em) rotate(47deg) scaleY(0.94);filter:none}
          78%{transform:translateY(0.02em) rotate(44deg) scaleY(1.03)}
          100%{transform:translateY(0.04em) rotate(45deg) scaleY(1);filter:none}
        }
        @keyframes fadeOutA{to{opacity:0}}

        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

        .hero-sub{font-size:clamp(15px,2.2vw,22px);font-weight:600;color:rgba(255,255,255,.65);margin-top:32px;max-width:500px;line-height:1.45;animation:fadeUp .7s .4s ease both;position:relative;}
        .hero-micro{font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.3);margin-top:10px;animation:fadeUp .7s .5s ease both;position:relative;font-style:italic;}
        .hero-ctas{display:flex;gap:14px;margin-top:36px;flex-wrap:wrap;justify-content:center;animation:fadeUp .7s .6s ease both;position:relative;}
        .hero-badges{display:flex;gap:10px;margin-top:44px;flex-wrap:wrap;justify-content:center;animation:fadeUp .7s .7s ease both;position:relative;}
        .hero-badge{font-family:'DM Mono',monospace;font-size:10.5px;padding:5px 14px;border:1px solid var(--border2);border-radius:100px;color:rgba(255,255,255,.35);}

        /* BUTTONS */
        .btn-primary{background:var(--yellow);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:2px;padding:15px 38px;border:none;border-radius:7px;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:4px 4px 0 var(--red);text-decoration:none;display:inline-block;}
        .btn-primary:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--red);}
        .btn-secondary{background:transparent;color:var(--white);font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:2px;padding:15px 38px;border:2px solid rgba(255,255,255,.2);border-radius:7px;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-block;}
        .btn-secondary:hover{border-color:var(--white);}

        /* SECTIONS */
        section{padding:72px 24px;max-width:900px;margin:0 auto;}
        .section-label{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--yellow);margin-bottom:10px;display:block;}
        .section-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(38px,7vw,68px);line-height:1;margin-bottom:28px;}

        /* SUBMISSION */
        .submission-box{background:var(--card-bg);border:1px solid var(--border2);border-radius:18px;padding:32px;position:relative;overflow:hidden;}
        .submission-box::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--yellow),var(--red),var(--orange),var(--purple));}
        .confession-area{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:20px;color:var(--white);font-family:'Syne',sans-serif;font-size:16px;resize:none;outline:none;transition:border-color .2s;min-height:120px;line-height:1.6;}
        .confession-area:focus{border-color:rgba(255,225,53,.5);}
        .confession-area::placeholder{color:rgba(255,255,255,.22);font-style:italic;}
        .char-count{text-align:right;font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.28);margin-top:6px;}
        .char-count.warning{color:var(--red);}
        .category-pills{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0;}
        .pill{font-family:'DM Mono',monospace;font-size:11.5px;padding:7px 16px;border:1px solid var(--border);border-radius:100px;cursor:pointer;transition:all .15s;background:transparent;color:rgba(255,255,255,.45);}
        .pill:hover{border-color:var(--yellow);color:var(--yellow);}
        .pill.active{background:var(--yellow);color:var(--black);border-color:var(--yellow);font-weight:600;}
        .submit-row{display:flex;align-items:center;justify-content:space-between;margin-top:20px;gap:16px;flex-wrap:wrap;}
        .anon-toggle{display:flex;align-items:center;gap:10px;font-size:12.5px;color:rgba(255,255,255,.45);cursor:pointer;font-family:'DM Mono',monospace;}
        .toggle-switch{width:36px;height:20px;background:rgba(255,255,255,.12);border-radius:100px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;}
        .toggle-switch.on{background:var(--green);}
        .toggle-switch::after{content:'';position:absolute;width:14px;height:14px;background:white;border-radius:50%;top:3px;left:3px;transition:left .2s;}
        .toggle-switch.on::after{left:19px;}
        .btn-submit{background:var(--red);color:white;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;padding:14px 30px;border:none;border-radius:8px;cursor:pointer;transition:transform .15s,opacity .15s;}
        .btn-submit:hover{transform:translateY(-1px);opacity:.9;}

        /* TABS */
        .sort-tabs{display:flex;gap:4px;margin-bottom:22px;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:4px;width:fit-content;}
        .tab{font-family:'DM Mono',monospace;font-size:11.5px;padding:8px 20px;border-radius:6px;cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,.38);transition:all .15s;}
        .tab.active{background:var(--yellow);color:var(--black);font-weight:600;}
        .tab:hover:not(.active){color:var(--white);}

        /* FEED & CARDS */
        .feed{display:flex;flex-direction:column;gap:14px;}
        .card{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;padding:26px;transition:border-color .2s,transform .2s;position:relative;overflow:hidden;animation:slideIn .4s ease both;}
        @keyframes slideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .card:hover{border-color:var(--border2);transform:translateY(-2px);}
        .elite-loser-card{border-color:rgba(255,59,59,.3);}
        .card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:12px;}
        .card-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .user-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;background:rgba(255,255,255,.06);}
        .username{font-family:'DM Mono',monospace;font-size:11.5px;color:rgba(255,255,255,.45);}
        .timestamp{font-family:'DM Mono',monospace;font-size:10.5px;color:rgba(255,255,255,.22);}
        .cat-tag{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:4px;flex-shrink:0;}
        .card-text{font-size:16.5px;line-height:1.56;color:rgba(255,255,255,.86);margin-bottom:18px;font-weight:500;}
        .verdict-badge{display:inline-flex;align-items:center;gap:6px;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:4px 12px;border-radius:6px;margin-bottom:14px;}
        .vote-bar{display:flex;gap:3px;margin-bottom:10px;height:5px;border-radius:6px;overflow:hidden;}
        .vote-bar-seg{height:100%;border-radius:6px;transition:width .5s ease;}
        .vote-question{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.3);margin-bottom:10px;letter-spacing:.04em;}
        .vote-buttons{display:flex;gap:7px;flex-wrap:wrap;}
        .vote-btn{font-family:'DM Mono',monospace;font-size:11.5px;padding:8px 14px;border-radius:8px;border:1px solid var(--border);background:transparent;color:rgba(255,255,255,.5);cursor:pointer;transition:all .15s;}
        .vote-btn:hover{background:rgba(255,255,255,.06);color:var(--white);transform:translateY(-1px);}
        .card-actions{display:flex;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;}
        .action-btn{font-family:'DM Mono',monospace;font-size:11px;padding:7px 14px;border-radius:7px;border:1px solid var(--border);background:transparent;color:rgba(255,255,255,.38);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;}
        .action-btn:hover{border-color:var(--border2);color:var(--white);}
        .judge-btn{border-color:rgba(199,125,255,.3);color:var(--purple);}
        .judge-btn:hover{background:rgba(199,125,255,.08);}
        .share-btn{border-color:rgba(255,225,53,.25);color:var(--yellow);}
        .share-btn:hover{background:rgba(255,225,53,.06);}

        /* JUDGE PANEL */
        .judge-panel{margin-top:16px;background:rgba(199,125,255,.05);border:1px solid rgba(199,125,255,.15);border-radius:12px;padding:20px;}
        .judge-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .judge-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#c77dff,#ff3b3b);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .judge-name{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:var(--purple);}
        .judge-title{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.08em;}
        .judge-close{margin-left:auto;background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.4);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:13px;}
        .judge-messages{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;}
        .judge-msg{font-family:'DM Mono',monospace;font-size:12.5px;line-height:1.6;color:rgba(255,255,255,.75);padding:12px 14px;background:rgba(199,125,255,.07);border-radius:8px;border-left:2px solid var(--purple);}
        .user-msg{font-family:'DM Mono',monospace;font-size:12.5px;line-height:1.6;color:rgba(255,255,255,.6);padding:12px 14px;background:rgba(255,255,255,.04);border-radius:8px;border-left:2px solid rgba(255,255,255,.2);}
        .judge-typing{opacity:.6;font-style:italic;}
        .judge-input-row{display:flex;gap:8px;}
        .judge-input{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(199,125,255,.2);border-radius:8px;padding:10px 14px;color:var(--white);font-family:'DM Mono',monospace;font-size:12px;outline:none;}
        .judge-input:focus{border-color:rgba(199,125,255,.5);}
        .judge-input::placeholder{color:rgba(255,255,255,.2);}
        .judge-submit{background:var(--purple);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:10px 18px;border:none;border-radius:8px;cursor:pointer;white-space:nowrap;}
        .judge-submit:disabled{opacity:.4;cursor:not-allowed;}
        .case-closed{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:2px;color:rgba(255,59,59,.6);text-align:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,59,59,.15);}

        /* MODAL */
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);}
        .verdict-card-modal{background:#161616;border:1px solid var(--border2);border-radius:20px;padding:32px;max-width:480px;width:100%;position:relative;}
        .modal-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,.08);border:none;color:var(--white);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;}
        .verdict-card-preview{background:var(--black);border:2px solid var(--border2);border-radius:14px;padding:28px;margin-bottom:20px;text-align:center;}
        .vc-site{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;color:rgba(255,255,255,.25);text-transform:uppercase;margin-bottom:16px;}
        .vc-confession{font-size:14px;font-weight:600;color:rgba(255,255,255,.8);line-height:1.5;margin-bottom:16px;font-style:italic;}
        .vc-verdict-label{font-family:'Bebas Neue',sans-serif;font-size:42px;line-height:1;margin-bottom:4px;}
        .vc-score{font-family:'DM Mono',monospace;font-size:13px;color:rgba(255,255,255,.4);margin-bottom:14px;}
        .vc-badge{display:inline-flex;align-items:center;gap:8px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1.5px;padding:8px 20px;border-radius:8px;border:2px solid;}
        .vc-footer{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.15em;color:rgba(255,255,255,.2);margin-top:14px;text-transform:uppercase;}
        .modal-copy-btn{width:100%;background:var(--yellow);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;padding:14px;border:none;border-radius:10px;cursor:pointer;box-shadow:3px 3px 0 var(--red);}
        .modal-sub{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.25);text-align:center;margin-top:10px;font-style:italic;}

        /* CATEGORY & VERDICT COLORS */
        .cat-dating{background:rgba(255,99,132,.12);color:#ff6384;}
        .cat-money{background:rgba(255,206,86,.12);color:#ffce56;}
        .cat-work{background:rgba(54,162,235,.12);color:#36a2eb;}
        .cat-friends{background:rgba(153,102,255,.12);color:#9966ff;}
        .cat-family{background:rgba(255,159,64,.12);color:#ff9f40;}
        .cat-tech{background:rgba(75,192,192,.12);color:#4bc0c0;}
        .cat-travel{background:rgba(255,99,255,.12);color:#ff63ff;}
        .cat-general{background:rgba(255,255,255,.07);color:rgba(255,255,255,.38);}
        .verdict-innocent{background:rgba(0,230,118,.1);color:#00e676;}
        .verdict-question{background:rgba(79,195,247,.1);color:#4fc3f7;}
        .verdict-mild{background:rgba(255,109,0,.1);color:#ff6d00;}
        .verdict-clown{background:rgba(255,225,53,.1);color:#ffe135;}
        .verdict-elite{background:rgba(255,59,59,.1);color:#ff3b3b;}

        /* FOOTER */
        .rules-strip{background:rgba(255,255,255,.02);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:18px 40px;display:flex;justify-content:center;gap:28px;flex-wrap:wrap;}
        .rule-item{font-family:'DM Mono',monospace;font-size:10.5px;color:rgba(255,255,255,.25);display:flex;align-items:center;gap:8px;letter-spacing:.04em;}
        .rule-item::before{content:'—';color:rgba(255,255,255,.12);}
        footer{padding:36px;text-align:center;border-top:1px solid var(--border);}
        .footer-logo{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;color:var(--yellow);margin-bottom:6px;}
        .footer-tagline{font-family:'DM Mono',monospace;font-size:11.5px;color:rgba(255,255,255,.18);font-style:italic;}

        /* TOAST */
        .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--yellow);color:var(--black);font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:1.5px;padding:13px 26px;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.6);z-index:9999;transition:transform .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none;}
        .toast.show{transform:translateX(-50%) translateY(0);}
        .loading{text-align:center;font-family:'DM Mono',monospace;font-size:13px;color:rgba(255,255,255,.3);padding:40px;}
        @media(max-width:640px){nav{padding:14px 18px;}.nav-certified{display:none;}section{padding:56px 18px;}.submission-box{padding:20px;}.rules-strip{padding:18px;gap:14px;}.vote-btn{font-size:11px;padding:7px 11px;}}
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />

      {/* CINEMATIC OVERLAYS */}
      <div className="film-flash"></div>
      <div className="impact-flash"></div>
      <div className="grain"></div>
      <div className="scanline"></div>

      {/* TICKER */}
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

      {/* NAV */}
      <nav>
        <div className="nav-logo">AM I A <span>LOSER</span>?</div>
        <div className="nav-right">
          <div className="nav-counter">
            <div className="live-dot"></div>
            <span>{liveCount.toLocaleString()} judging now</span>
          </div>
          <div className="nav-certified">Certified: <strong>{certifiedCount.toLocaleString()}</strong></div>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-eyebrow">⚖️ The Court of Public Humiliation — Est. Yesterday</div>

        {/* TITLE */}
        <div className="hero-title-wrap">
          <span className="title-line1">AM I <span className="original-a">A</span></span>
          <span className="title-line2">LOSER<span style={{color:'var(--yellow)'}}>?</span><span className="falling-a">A</span></span>
        </div>

        <p className="hero-sub">Post your dumb move. Let the internet decide. Get judged by an AI.</p>
        <p className="hero-micro">Brave. Embarrassing. Necessary.</p>
        <div className="hero-ctas">
          <a href="#submit" className="btn-primary">🪣 Post My L</a>
          <a href="#feed" className="btn-secondary">See Today's Biggest Losers</a>
        </div>
        <div className="hero-badges">
          <span className="hero-badge">Self-submissions only</span>
          <span className="hero-badge">Anonymous friendly</span>
          <span className="hero-badge">Judge Loser AI presiding</span>
          <span className="hero-badge">Judgment-as-a-service™</span>
        </div>
      </div>

      {/* SUBMISSION */}
      <section id="submit">
        <span className="section-label">// confess your sins</span>
        <h2 className="section-title">Post Your L</h2>
        <div className="submission-box">
          <textarea className="confession-area" value={text} onChange={e => setText(e.target.value)} maxLength={280} placeholder="I said 'you too' when the movie theater employee said 'enjoy the film.' We locked eyes for 4 seconds. I am not okay." />
          <div className={`char-count ${text.length > 240 ? 'warning' : ''}`}>{text.length} / 280</div>
          <div className="category-pills">
            {categories.map(cat => (
              <button key={cat} className={`pill ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
                {cat === 'Dating' ? '💔' : cat === 'Money' ? '💸' : cat === 'Work' ? '💼' : cat === 'Friends' ? '🫂' : cat === 'Family' ? '🏠' : cat === 'Tech' ? '🖥️' : cat === 'Travel' ? '✈️' : '💀'} {cat}
              </button>
            ))}
          </div>
          <div className="submit-row">
            <label className="anon-toggle" onClick={() => setAnonMode(!anonMode)}>
              <div className={`toggle-switch ${anonMode ? 'on' : ''}`}></div>
              <span>Anonymous ({anonMode ? 'on' : 'off'})</span>
            </label>
            <button className="btn-submit" onClick={submitPost}>Let People Judge Me →</button>
          </div>
        </div>
      </section>

      {/* FEED */}
      <section id="feed">
        <span className="section-label">// fresh humiliations</span>
        <h2 className="section-title">The Feed</h2>
        <div className="sort-tabs">
          {['new','hot','loser'].map(s => (
            <button key={s} className={`tab ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
              {s === 'new' ? '🆕 New' : s === 'hot' ? '🔥 Hottest' : '👑 Most Loser'}
            </button>
          ))}
        </div>
        <div className="feed">
          {loading ? (
            <div className="loading">⚖️ Loading confessions...</div>
          ) : posts.length === 0 ? (
            <div className="loading">No confessions yet. Be the first loser. 🪣</div>
          ) : (
            posts.map((post, idx) => (
              <div key={post.id} style={{animationDelay:`${idx*0.07}s`}}>
                <Card post={post} onVoted={fetchPosts} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* RULES */}
      <div className="rules-strip">
        <span className="rule-item">Self-submissions only</span>
        <span className="rule-item">No doxxing or targeting others</span>
        <span className="rule-item">Keep it funny, not cruel</span>
        <span className="rule-item">Post responsibly. Self-owns only.</span>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">AM I A LOSER?</div>
        <div className="footer-tagline">"Some mistakes deserve growth. Some deserve voting." — Judge Loser, probably</div>
      </footer>

      {/* TOAST */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
