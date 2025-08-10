# AI Interview Simulator - Frontend (Demo)

This is a React + Vite TypeScript frontend offering a complete demo flow for the AI interview experience (setup → interview → feedback). It runs standalone in demo mode with a local question bank and simulated live metrics. You can later switch to API mode and connect to a FastAPI backend.

## Quickstart

- Requirements: Node 18+

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Modes

- Demo (default): Local questions and simulated metrics; voice capture is recorded but not transcribed.
- API: Set `VITE_API_BASE` in `.env` to point to your backend and choose "API" mode in the setup screen.

## Project Structure

- `src/components` – UI components for setup, live interview, transcript, and feedback
- `src/context` – React context for interview state
- `src/api` – API client with demo fallbacks
- `src/data` – Simple question bank for demo
- `src/hooks` – Local media/WebRTC helpers (local preview + audio level)

## Notes

- This preview focuses on UX and integration points. Real-time STT, TTS, avatar lip-sync, and analytics should be wired to the backend in API mode.
- The UI uses minimal CSS (no Tailwind) for portability.