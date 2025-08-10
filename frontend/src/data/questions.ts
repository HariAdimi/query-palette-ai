import { Domain, Question, SkillLevel } from '../types'

const bank: Record<Domain, Record<SkillLevel, Question[]>> = {
  'Software Engineering': {
    Entry: [
      { id: 'se-e-1', text: 'Explain the difference between processes and threads.', difficulty: 'Easy', tags: ['os', 'fundamentals'] },
      { id: 'se-e-2', text: 'What is a REST API and how is it used?', difficulty: 'Easy', tags: ['web', 'api'] }
    ],
    Intermediate: [
      { id: 'se-i-1', text: 'Tell me about a time you optimized a backend service. Which metrics improved?', difficulty: 'Medium', tags: ['perf', 'backend'] },
      { id: 'se-i-2', text: 'How does caching impact consistency and what mitigation strategies can you use?', difficulty: 'Medium', tags: ['cache', 'consistency'] }
    ],
    Advanced: [
      { id: 'se-a-1', text: 'Design a multi-tenant rate-limiter for a high-throughput API.', difficulty: 'Hard', tags: ['systems', 'design'] },
      { id: 'se-a-2', text: 'Explain trade-offs of CQRS and event sourcing in a distributed system.', difficulty: 'Hard', tags: ['architecture', 'distributed'] }
    ]
  },
  Marketing: {
    Entry: [
      { id: 'm-e-1', text: 'What is a customer persona and why is it useful?', difficulty: 'Easy', tags: ['basics'] }
    ],
    Intermediate: [
      { id: 'm-i-1', text: 'How would you design an A/B test for homepage hero messaging?', difficulty: 'Medium', tags: ['experimentation'] }
    ],
    Advanced: [
      { id: 'm-a-1', text: 'How do you build a multi-touch attribution model and validate it?', difficulty: 'Hard', tags: ['attribution'] }
    ]
  },
  Finance: {
    Entry: [
      { id: 'f-e-1', text: 'Define NPV and IRR in simple terms.', difficulty: 'Easy', tags: ['valuation'] }
    ],
    Intermediate: [
      { id: 'f-i-1', text: 'Walk through how you would stress-test a portfolio for interest rate risk.', difficulty: 'Medium', tags: ['risk'] }
    ],
    Advanced: [
      { id: 'f-a-1', text: 'Explain Basel III liquidity ratios and their practical implications.', difficulty: 'Hard', tags: ['regulatory'] }
    ]
  }
}

export function getFirstQuestion(domain: Domain, level: SkillLevel): Question {
  const list = bank[domain][level]
  return list[0]
}

export function getNextQuestion(domain: Domain, level: SkillLevel, currentId?: string): Question {
  const list = bank[domain][level]
  const idx = list.findIndex(q => q.id === currentId)
  const next = list[(idx + 1) % list.length]
  return next
}