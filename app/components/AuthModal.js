'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const anonNames = [
  'Anonymous Goblin','Brave Disaster','User_4821','CertifiedMess_99','RegrettableHuman',
  'ChaoticNeutral_42','EmotionalSupport404','BrokeAndProud_88','SoftClownEnergy','UnhingedOptimist',
  'DisasterBeing_007','NobodyKnowsMe_44','GhostOfBadDecisions','AnonymousClown_99','JustAMistake_Bro',
  'ConfusedHuman_77','ProfessionalLoser','EliteDisaster_11','ChaosAgent_404','RegretfulSoul_88',
  'MildlyUnhinged','SilentlyEmbarrassed','ChronicOverThinker','AccidentalGenius_0','SerialApoligizer',
  'DigitalGremlin_33','SoftFailure_22','UnstableGenius_99','PeakMediocrity','AbsoluteUnit_404',
  'LostCause_77','ConfessionalKing','GuiltyAsCharged_11','CertifiedChaos','PublicDisgrace_88',
  'AnonymousMess_55','QuietDisaster_99','LoudlyWrong_22','SlightlyOffTrack','TotallyFine_Not',
  'WalkingRedFlag_33','EmotionalSupport404','ProfessionalMistake','AccidentalVillain_77','SorryNotSorry_11',
  'ChaoticGood_404','NeutralEvil_99','LawfulMess_22','TrueNeutral_77','ChaoticNeutral_55',
  'RegrettableChoice_88','BadDecision_404','PoorJudgment_11','LifeOfRegrets_99','SerialMistaker_22',
  'OopsIDidiItAgain_77','WhoAuthorisedThis_33','UnsupervisedAdult_55','FunctioningDisaster_88','BarelyAdult_404',
  'TechnicallyAlive_11','ExistentiallyTired_99','SpirituallyBroke_22','EmotionallyAmbiguous_77','MentallyElsewhere_33',
  'PhysicallyPresent_55','SociallyAwkward_88','ProfessionallyQuestionable_404','PersonallyEmbarrassing_11','PubliclyHumiliated_99',
  'PrivatelyDisgraced_22','SecretlyAMess_77','OpenlyConfused_33','OfficiallyDone_55','UnofficiallyGuilty_88',
  'CertifiedLoser_404','VerifiedMess_11','AuthenticDisaster_99','GenuinelyLost_22','TrulyUnhinged_77',
  'HonestlyBroke_33','LiterallyWrong_55','FigurativelyDead_88','MetaphoricallyDone_404','SymbolicallyGuilty_11',
  'IronicallyConfident_99','SarcasticallyFine_22','LiterallyFine_77','ActuallyNotFine_33','CompletelyOkay_Not',
  'TotallyNormal_55','AbsolutelyFine_88','DefinitelyNotCrying_404','ClearlyInDenial_11','ObviouslyAMess_99',
  'ApparentlyGuilty_22','EvidentlyLost_77','ManifestlyWrong_33','PatentlyAbsurd_55','FlagrantlyUnhinged_88'
]
const anonAvatars = ['🐸','🦆','🐢','🦎','🐧','🦉','🦝','🐨','🐻','🐼']

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export default function AuthModal({ onClose, onAnon, onAuthed }) {
  const [step, setStep] = useState('choose') // choose | email | sent | apple-lol
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleEmail() {
    if (!email || !email.includes('@')) { setError('Enter a valid email!'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('sent')
    setLoading(false)
  }

  function handleAnon() {
    const username = rand(anonNames)
    const avatar = rand(anonAvatars)
    const sessionId = localStorage.getItem('ail_session') || 
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('ail_session', sessionId)
    localStorage.setItem('ail_anon_username', username)
    localStorage.setItem('ail_anon_avatar', avatar)
    onAnon({ username, avatar, sessionId })
    onClose()
  }

  function handleApple() { setStep('apple-lol') }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(8px)'}} onClick={onClose}>
      <div style={{background:'#111',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'20px',padding:'36px',maxWidth:'480px',width:'100%',position:'relative'}} onClick={e=>e.stopPropagation()}>
        
        <button onClick={onClose} style={{position:'absolute',top:'16px',right:'16px',background:'rgba(255,255,255,0.08)',border:'none',color:'white',width:'32px',height:'32px',borderRadius:'50%',cursor:'pointer',fontSize:'16px'}}>✕</button>

        {step === 'choose' && <>
          <div style={{textAlign:'center',marginBottom:'28px'}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'32px',color:'#ffe135',letterSpacing:'2px'}}>BEFORE YOU CONFESS</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:'12px',color:'rgba(255,255,255,0.4)',marginTop:'8px'}}>The court needs to know who you are</div>
          </div>

          {/* ANON OPTION */}
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'14px',padding:'20px',marginBottom:'16px',cursor:'pointer',transition:'border-color 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}
            onClick={handleAnon}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
              <div style={{fontSize:'28px'}}>👻</div>
              <div>
                <div style={{fontFamily:'Bebas Neue',fontSize:'20px',letterSpacing:'1px',color:'white'}}>STAY ANONYMOUS</div>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:'10px',color:'rgba(255,255,255,0.35)'}}>We'll assign you a random name</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {['No signup, post instantly','Nobody knows it\'s you','Works on this device'].map(pro=>(
                <div key={pro} style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'#00e676',display:'flex',gap:'8px'}}>✅ {pro}</div>
              ))}
              {['Switch device = lose your posts','No shareable profile','No notifications'].map(con=>(
                <div key={con} style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'rgba(255,99,99,0.8)',display:'flex',gap:'8px'}}>❌ {con}</div>
              ))}
            </div>
          </div>

          {/* ACCOUNT OPTION */}
          <div style={{background:'rgba(255,225,53,0.04)',border:'1px solid rgba(255,225,53,0.2)',borderRadius:'14px',padding:'20px',marginBottom:'8px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
              <div style={{fontSize:'28px'}}>👑</div>
              <div>
                <div style={{fontFamily:'Bebas Neue',fontSize:'20px',letterSpacing:'1px',color:'#ffe135'}}>CREATE ACCOUNT</div>
                <div style={{fontFamily:'DM Mono, monospace',fontSize:'10px',color:'rgba(255,255,255,0.35)'}}>Own your Ls forever</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'16px'}}>
              {['Posts on any device forever','Shareable loser profile','Lifetime loser score','Notifications when judged'].map(pro=>(
                <div key={pro} style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'#00e676',display:'flex',gap:'8px'}}>✅ {pro}</div>
              ))}
              {['Google/Email knows you\'re a loser 😂'].map(con=>(
                <div key={con} style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'rgba(255,99,99,0.8)',display:'flex',gap:'8px'}}>❌ {con}</div>
              ))}
            </div>

            {/* AUTH BUTTONS */}
            <button onClick={handleGoogle} disabled={loading} style={{width:'100%',background:'white',color:'#111',fontFamily:'Syne, sans-serif',fontWeight:'700',fontSize:'14px',padding:'12px',borderRadius:'8px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'10px',transition:'opacity 0.15s'}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <button onClick={()=>setStep('email')} style={{width:'100%',background:'transparent',color:'white',fontFamily:'Syne, sans-serif',fontWeight:'600',fontSize:'14px',padding:'12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',marginBottom:'10px',transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'}>
              📧 Continue with Email
            </button>

            <button onClick={handleApple} style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.3)',fontFamily:'Syne, sans-serif',fontWeight:'600',fontSize:'14px',padding:'12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',transition:'all 0.15s'}}>
              🍎 Continue with Apple
            </button>
          </div>

          {error && <div style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'#ff3b3b',textAlign:'center',marginTop:'8px'}}>{error}</div>}
        </>}

        {step === 'email' && <>
          <button onClick={()=>setStep('choose')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'DM Mono, monospace',fontSize:'12px',marginBottom:'20px',padding:0}}>← Back</button>
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:'28px',color:'#ffe135',letterSpacing:'2px'}}>ENTER YOUR EMAIL</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'6px'}}>We'll send you a magic link. No password needed.</div>
          </div>
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleEmail()}
            placeholder="your@email.com"
            style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'8px',padding:'14px 16px',color:'white',fontFamily:'DM Mono, monospace',fontSize:'14px',outline:'none',marginBottom:'12px'}}
          />
          {error && <div style={{fontFamily:'DM Mono, monospace',fontSize:'11px',color:'#ff3b3b',marginBottom:'10px'}}>{error}</div>}
          <button onClick={handleEmail} disabled={loading} style={{width:'100%',background:'#ffe135',color:'#111',fontFamily:'Bebas Neue',fontSize:'20px',letterSpacing:'2px',padding:'14px',borderRadius:'8px',border:'none',cursor:'pointer',boxShadow:'3px 3px 0 #ff3b3b'}}>
            {loading ? 'SENDING...' : 'SEND MAGIC LINK →'}
          </button>
        </>}

        {step === 'sent' && <>
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>📬</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'28px',color:'#ffe135',letterSpacing:'2px',marginBottom:'8px'}}>CHECK YOUR EMAIL</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:'12px',color:'rgba(255,255,255,0.4)',lineHeight:'1.6'}}>
              We sent a magic link to<br/>
              <span style={{color:'white'}}>{email}</span><br/><br/>
              Click it to confirm and you're in.<br/>
              No password. Ever.
            </div>
          </div>
        </>}

        {step === 'apple-lol' && <>
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>🍎💀</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'28px',color:'#ff3b3b',letterSpacing:'2px',marginBottom:'12px'}}>WE ARE TOO LOSER</div>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:'12px',color:'rgba(255,255,255,0.5)',lineHeight:'1.8',marginBottom:'24px'}}>
              We couldn't make Apple login work.<br/>
              Classic us.<br/><br/>
              We've assigned you the username:<br/>
              <span style={{color:'#ffe135',fontSize:'16px',fontWeight:'bold'}}>{rand(anonNames)}</span><br/><br/>
              You're welcome.
            </div>
            <button onClick={handleAnon} style={{background:'#ffe135',color:'#111',fontFamily:'Bebas Neue',fontSize:'18px',letterSpacing:'2px',padding:'12px 28px',borderRadius:'8px',border:'none',cursor:'pointer',boxShadow:'3px 3px 0 #ff3b3b'}}>
              ACCEPT MY FATE →
            </button>
          </div>
        </>}

      </div>
    </div>
  )
}"" 
