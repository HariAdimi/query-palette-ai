import { useState } from 'react'
import { Domain, InterviewSetupInput, SkillLevel } from '../types'
import { useInterview } from '../context/InterviewContext'

const domains: Domain[] = ['Software Engineering', 'Marketing', 'Finance']
const levels: SkillLevel[] = ['Entry', 'Intermediate', 'Advanced']

export default function InterviewSetup({ onStart }: { onStart: () => void }) {
  const { start } = useInterview()
  const [domain, setDomain] = useState<Domain>('Software Engineering')
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate')
  const [durationMin, setDurationMin] = useState<number>(30)
  const [mode, setMode] = useState<'demo' | 'api'>('demo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const input: InterviewSetupInput = { domain, skillLevel, durationMin }
      await start(input, mode)
      onStart()
    } catch (e: any) {
      setError(e?.message || 'Failed to start')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="section-title">Interview Setup</div>
      <div className="row">
        <div className="col">
          <label>Domain</label>
          <select value={domain} onChange={e => setDomain(e.target.value as Domain)}>
            {domains.map(d => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="col">
          <label>Skill Level</label>
          <select value={skillLevel} onChange={e => setSkillLevel(e.target.value as SkillLevel)}>
            {levels.map(l => (<option key={l} value={l}>{l}</option>))}
          </select>
        </div>
        <div className="col">
          <label>Duration (minutes)</label>
          <input type="number" min={15} max={60} step={15} value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <div className="col">
          <label>Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value as 'demo' | 'api')}>
            <option value="demo">Demo (no backend)</option>
            <option value="api">API (connect to backend)</option>
          </select>
          <div className="subtitle" style={{ marginTop: 8 }}>
            Demo uses a local question bank and simulated metrics so you can preview instantly.
          </div>
        </div>
      </div>
      {error && <div className="badge err" style={{ marginTop: 12 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="primary" disabled={loading} onClick={handleStart}>{loading ? 'Starting…' : 'Start Interview'}</button>
      </div>
    </div>
  )
}