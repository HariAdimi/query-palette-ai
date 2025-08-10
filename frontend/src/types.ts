export type SkillLevel = 'Entry' | 'Intermediate' | 'Advanced'
export type Domain = 'Software Engineering' | 'Marketing' | 'Finance'

export interface InterviewSetupInput {
  domain: Domain
  skillLevel: SkillLevel
  durationMin: number
}

export interface InterviewSession extends InterviewSetupInput {
  interviewId: string
  startedAt: number
  mode: 'demo' | 'api'
}

export interface Question {
  id: string
  text: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
}

export interface LiveMetrics {
  ts: number
  eyeContact: number
  lookAwayRatio: number
  faceCount: number
  postureScore: number
  speakingRateWpm: number
  pitchMean: number
  flags: string[]
}

export interface ScoreSummary {
  overall: number
  communication: number
  vocalTone: number
  domainKnowledge: number
  authenticity: number
  hireRange: [number, number]
}