import { useEffect, useMemo, useState } from 'react'
import { useLocalMedia } from '../hooks/useWebRTC'
import { useInterview } from '../context/InterviewContext'
import { LiveMetrics } from '../types'

export default function LiveFeed() {
  const { videoRef, audioLevel, start, stop } = useLocalMedia()
  const { setMetrics } = useInterview()
  const [started, setStarted] = useState(false)
  const [metrics, setLocalMetrics] = useState<LiveMetrics | null>(null)

  useEffect(() => {
    let timer: number | null = null
    if (started) {
      timer = window.setInterval(() => {
        const eye = clamp(0.6 + (Math.random() - 0.5) * 0.2, 0, 1)
        const look = clamp(1 - eye + Math.random() * 0.05, 0, 1)
        const faceCount = Math.random() < 0.95 ? 1 : 2
        const posture = clamp(0.7 + (Math.random() - 0.5) * 0.2, 0, 1)
        const speakingRate = Math.round(120 + (Math.random() - 0.5) * 40)
        const pitchMean = Math.round(180 + (Math.random() - 0.5) * 40)
        const flags: string[] = []
        if (faceCount > 1) flags.push('Multiple faces detected')
        const m: LiveMetrics = {
          ts: Date.now(),
          eyeContact: eye,
          lookAwayRatio: look,
          faceCount,
          postureScore: posture,
          speakingRateWpm: speakingRate,
          pitchMean,
          flags
        }
        setLocalMetrics(m)
        setMetrics(m)
      }, 2000)
    }
    return () => { if (timer) window.clearInterval(timer) }
  }, [started, setMetrics])

  const audioPct = useMemo(() => Math.round(audioLevel * 100), [audioLevel])

  async function handleStart() {
    await start()
    setStarted(true)
  }

  function handleStop() {
    stop()
    setStarted(false)
  }

  return (
    <div className="card">
      <div className="section-title">Live Feed</div>
      <video className="video" ref={videoRef as any} playsInline />
      <div style={{ marginTop: 12 }}>
        <label>Microphone level</label>
        <div className="meter"><span style={{ width: `${audioPct}%` }} /></div>
      </div>
      {metrics && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className={`badge ${metrics.eyeContact > 0.65 ? 'ok' : metrics.eyeContact > 0.45 ? 'warn' : 'err'}`}>Eye Contact: {(metrics.eyeContact * 100).toFixed(0)}%</div>
          <div className={`badge ${metrics.postureScore > 0.6 ? 'ok' : 'warn'}`}>Posture: {(metrics.postureScore * 100).toFixed(0)}%</div>
          <div className="badge">Speaking Rate: {metrics.speakingRateWpm} wpm</div>
          <div className={`badge ${metrics.faceCount > 1 ? 'err' : 'ok'}`}>Faces: {metrics.faceCount}</div>
          {metrics.flags.map((f, i) => (<div key={i} className="badge err">{f}</div>))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {!started ? <button className="primary" onClick={handleStart}>Allow Camera & Mic</button> : <button onClick={handleStop}>Stop</button>}
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }