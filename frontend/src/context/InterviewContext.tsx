import React, { createContext, useContext, useMemo, useState } from 'react'
import { InterviewSession, Question, LiveMetrics, ScoreSummary, InterviewSetupInput } from '../types'
import { startInterview as apiStart, fetchNextQuestion } from '../api/client'

interface InterviewState {
  session: InterviewSession | null
  currentQuestion: Question | null
  transcript: string
  metrics: LiveMetrics | null
  scores: ScoreSummary | null
  start: (input: InterviewSetupInput, mode: 'demo' | 'api') => Promise<void>
  nextQuestion: () => Promise<void>
  setTranscript: (t: string) => void
  setMetrics: (m: LiveMetrics) => void
  setScores: (s: ScoreSummary) => void
  end: () => void
}

const Ctx = createContext<InterviewState | undefined>(undefined)

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [scores, setScores] = useState<ScoreSummary | null>(null)

  async function start(input: InterviewSetupInput, mode: 'demo' | 'api') {
    const s = await apiStart(input, mode)
    setSession(s)
    const q = await fetchNextQuestion(s)
    setCurrentQuestion(q)
  }

  async function nextQuestion() {
    if (!session || !currentQuestion) return
    const q = await fetchNextQuestion(session, currentQuestion)
    setCurrentQuestion(q)
    setTranscript('')
  }

  function end() {
    setSession(null)
    setCurrentQuestion(null)
    setTranscript('')
    setMetrics(null)
    setScores(null)
  }

  const value = useMemo(() => ({
    session,
    currentQuestion,
    transcript,
    metrics,
    scores,
    start,
    nextQuestion,
    setTranscript,
    setMetrics,
    setScores,
    end
  }), [session, currentQuestion, transcript, metrics, scores])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useInterview() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider')
  return ctx
}