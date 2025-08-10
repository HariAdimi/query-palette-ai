import { InterviewSetupInput, InterviewSession, Question } from '../types'
import { getFirstQuestion, getNextQuestion } from '../data/questions'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function startInterview(input: InterviewSetupInput, mode: 'demo' | 'api'): Promise<InterviewSession> {
  if (mode === 'demo') {
    return {
      ...input,
      interviewId: `demo-${Math.random().toString(36).slice(2)}`,
      startedAt: Date.now(),
      mode
    }
  }
  const res = await fetch(`${API_BASE}/api/v1/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: input.domain,
      skillLevel: input.skillLevel,
      duration: input.durationMin
    })
  })
  if (!res.ok) throw new Error('Failed to start interview')
  const data = await res.json()
  return {
    ...input,
    interviewId: data.interviewId,
    startedAt: Date.now(),
    mode
  }
}

export async function fetchNextQuestion(session: InterviewSession, current?: Question): Promise<Question> {
  if (session.mode === 'demo') {
    if (!current) return getFirstQuestion(session.domain, session.skillLevel)
    return getNextQuestion(session.domain, session.skillLevel, current.id)
  }
  const res = await fetch(`${API_BASE}/api/v1/questions/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interviewId: session.interviewId, previousAnswerSummary: null })
  })
  if (!res.ok) throw new Error('Failed to get question')
  return await res.json()
}