import { useEffect, useMemo, useRef, useState } from 'react'
import { useInterview } from '../context/InterviewContext'

export default function QuestionPanel({ onNext }: { onNext: () => void }) {
  const { currentQuestion, transcript, setTranscript } = useInterview()
  const [mode, setMode] = useState<'speak' | 'type'>('speak')
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [note, setNote] = useState<string>('')

  useEffect(() => { setNote('') }, [currentQuestion?.id])

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      // In demo mode we do not transcribe; we attach a note for the user.
      setNote(`Recorded ${(blob.size / 1024).toFixed(0)} KB of audio (demo, no STT).`)
      stream.getTracks().forEach(t => t.stop())
    }
    mr.start()
    mediaRecorderRef.current = mr
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const canSubmit = useMemo(() => mode === 'type' ? transcript.trim().length > 10 : !recording, [mode, transcript, recording])

  return (
    <div className="card">
      <div className="section-title">Question</div>
      <div style={{ fontSize: '1.05rem', marginBottom: 8 }}>{currentQuestion?.text}</div>
      <div className="subtitle">Difficulty: {currentQuestion?.difficulty}</div>
      <div style={{ marginTop: 12 }}>
        <label>Answer Mode</label>
        <select value={mode} onChange={e => setMode(e.target.value as 'speak' | 'type')}>
          <option value="speak">Speak</option>
          <option value="type">Type</option>
        </select>
      </div>
      {mode === 'type' ? (
        <div style={{ marginTop: 12 }}>
          <label>Your Answer</label>
          <textarea rows={6} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Type your answer here…" />
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {!recording ? <button className="primary" onClick={startRecording}>Start Speaking</button> : <button onClick={stopRecording}>Stop</button>}
          </div>
          {note && <div className="subtitle" style={{ marginTop: 8 }}>{note}</div>}
          <div className="subtitle" style={{ marginTop: 8 }}>Tip: In production this is transcribed in real-time (Whisper streaming).</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button disabled={!canSubmit} onClick={onNext}>Submit & Next</button>
      </div>
    </div>
  )
}