import { useMemo, useState } from 'react'
import { InterviewProvider, useInterview } from './context/InterviewContext'
import InterviewSetup from './components/InterviewSetup'
import AvatarView from './components/AvatarView'
import LiveFeed from './components/LiveFeed'
import QuestionPanel from './components/QuestionPanel'
import TranscriptPane from './components/TranscriptPane'
import FeedbackDashboard from './components/FeedbackDashboard'

function Shell() {
  const { session, metrics, end, nextQuestion } = useInterview()
  const [stage, setStage] = useState<'setup' | 'interview' | 'feedback'>('setup')
  const speakingLevel = useMemo(() => {
    // Simulate avatar lip-sync intensity by inverting user mic activity a bit
    const base = metrics ? Math.max(0, 0.4 - Math.random() * 0.2) : 0.2
    return base
  }, [metrics])

  return (
    <div className="container">
      <div className="header">
        <h2 style={{ margin: 0 }}>AI Interview Simulator</h2>
        <div className="subtitle">Preview build</div>
      </div>

      {stage === 'setup' && (
        <div className="grid">
          <div>
            <InterviewSetup onStart={() => setStage('interview')} />
          </div>
          <div>
            <AvatarView speakingLevel={speakingLevel} />
          </div>
        </div>
      )}

      {stage === 'interview' && (
        <div className="grid">
          <div>
            <QuestionPanel onNext={() => nextQuestion()} />
            <div className="footer">Interview ID: {session?.interviewId}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setStage('feedback')}>Finish and View Feedback</button>
              <button onClick={() => { end(); setStage('setup') }}>Cancel</button>
            </div>
          </div>
          <div>
            <LiveFeed />
            <div style={{ marginTop: 16 }}>
              <TranscriptPane />
            </div>
          </div>
        </div>
      )}

      {stage === 'feedback' && (
        <div className="grid">
          <div>
            <FeedbackDashboard onRestart={() => { end(); setStage('setup') }} />
          </div>
          <div>
            <AvatarView speakingLevel={speakingLevel} />
          </div>
        </div>
      )}

      <div className="footer">Demo mode only. Hook up to FastAPI for full functionality.</div>
    </div>
  )
}

export default function App() {
  return (
    <InterviewProvider>
      <Shell />
    </InterviewProvider>
  )
}