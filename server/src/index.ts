import express from 'express'

try {
  process.loadEnvFile()
} catch {
  // No .env yet. The stub endpoint works without it.
}

const app = express()
const port = 3001

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.use(express.json())

app.post('/api/chat', (req, res) => {
  res.json({ stub: true, received: req.body })
})

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`)
})
