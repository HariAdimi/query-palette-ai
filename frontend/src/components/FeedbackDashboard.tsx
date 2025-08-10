import { useEffect } from 'react'
import { useInterview } from '../context/InterviewContext'
import { ScoreSummary } from '../types'

export default function FeedbackDashboard({ onRestart }: { onRestart: () => void }) {
  const { transcript, metrics, scores, setScores } = useInterview()

  useEffect(() => {
    if (!scores) {
      const communication = clamp(0.65 + (Math.random() - 0.5) * 0.15, 0, 1)
      const vocalTone = clamp(0.65 + (Math.random() - 0.5) * 0.15, 0, 1)
      const domainKnowledge = clamp((transcript.length / 400) + 0.4 + (Math.random() - 0.5) * 0.1, 0, 1)
      const authenticity = clamp(0.8 + (Math.random() - 0.5) * 0.1, 0, 1)
      const overall = clamp((communication * 0.35 + vocalTone * 0.2 + domainKnowledge * 0.4) * (0.95 + (authenticity - 0.5) * 0.1), 0, 1)
      const hireLow = Math.round(overall * 100 * 0.8)
      const hireHigh = Math.round(overall * 100 * 0.9)
      const s: ScoreSummary = {
        overall: Math.round(overall * 100),
        communication: Math.round(communication * 100),
        vocalTone: Math.round(vocalTone * 100),
        domainKnowledge: Math.round(domainKnowledge * 100),
        authenticity: Math.round(authenticity * 100),
        hireRange: [hireLow, hireHigh]
      }
      setScores(s)
    }
  }, [scores, setScores, transcript])

  if (!scores) return null

  return (
    <div className="card">
      <div className="section-title">Your Results</div>
      <div className="row">
        <div className="col">
          <h3 style={{ marginTop: 0 }}>Overall Score: {scores.overall}/100</h3>
          <ul className="list">
            <li>Communication: {scores.communication}/100</li>
            <li>Vocal Tone: {scores.vocalTone}/100</li>
            <li>Domain Knowledge: {scores.domainKnowledge}/100</li>
            <li>Authenticity: {scores.authenticity}/100</li>
          </ul>
          <div className="badge ok">Chance of Getting Hired: {scores.hireRange[0]}–{scores.hireRange[1]}%</div>
        </div>
        <div className="col">
          <div className="section-title">Highlights</div>
          <ul className="list">
            <li>Strengths: clear structure and relevant examples</li>
            <li>Growth: slow slightly during complex explanations</li>
            <li>Next: summarize trade-offs and close with impact metrics</li>
          </ul>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={onRestart}>Start Over</button>
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }