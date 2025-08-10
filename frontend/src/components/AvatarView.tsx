import { useEffect, useRef } from 'react'

export default function AvatarView({ speakingLevel = 0 }: { speakingLevel?: number }) {
  const mouthRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!mouthRef.current) return
    const clamped = Math.max(0, Math.min(1, speakingLevel))
    const height = 6 + clamped * 18
    mouthRef.current.style.height = `${height}px`
  }, [speakingLevel])

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#0b1220', border: '1px solid #1f2937', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 36, left: 30, width: 18, height: 8, background: '#e5e7eb', borderRadius: 8 }} />
        <div style={{ position: 'absolute', top: 36, right: 30, width: 18, height: 8, background: '#e5e7eb', borderRadius: 8 }} />
        <div ref={mouthRef} style={{ position: 'absolute', bottom: 28, left: 40, right: 40, height: 10, background: '#e5e7eb', borderRadius: 8 }} />
      </div>
      <div>
        <div className="section-title">Interviewer Avatar</div>
        <div className="subtitle">Asks questions, gives subtle cues, and listens to your answers.</div>
      </div>
    </div>
  )
}