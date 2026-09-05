import { useState } from 'react'

const initialBody = `{
  "model": "claude-sonnet-4-6",
  "max_tokens": 300,
  "messages": [{ "role": "user", "content": "Say hello in one line." }]
}`

export default function App() {
  const [body, setBody] = useState(initialBody)
  const [response, setResponse] = useState('')

  async function send() {
    setResponse('...')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const text = await res.text()
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        setResponse(`HTTP ${res.status}\n${text}`)
      }
    } catch (err) {
      setResponse(String(err))
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '2rem auto',
        padding: '0 1rem',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <h1>Chat playground</h1>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        style={{ fontFamily: 'monospace', fontSize: 14, padding: '0.5rem' }}
      />
      <button onClick={send} style={{ padding: '0.5rem', fontSize: 16 }}>
        Send
      </button>
      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          minHeight: '4rem',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {response}
      </pre>
    </main>
  )
}
