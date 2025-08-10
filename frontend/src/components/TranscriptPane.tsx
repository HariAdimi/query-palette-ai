import { useMemo } from 'react'
import { useInterview } from '../context/InterviewContext'

export default function TranscriptPane() {
  const { transcript, metrics } = useInterview()

  const hint = useMemo(() => {
    if (!metrics) return 'Stay concise and cover the key trade-offs.'
    if (metrics.speakingRateWpm > 160) return 'Slow down slightly for clarity.'
    if (metrics.eyeContact < 0.5) return 'Try to look at the camera more often.'
    return 'Good pace and presence—keep it up.'
  }, [metrics])

  return (
    <div className="card">
      <div className="section-title">Transcript</div>
      <div style={{ minHeight: 140, fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{transcript || 'Your answer transcript will appear here (or type in the Question panel).'}</div>
      <div className="badge" style={{ marginTop: 8 }}>{hint}</div>
    </div>
  )
}