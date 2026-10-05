# Harness Workshop

A minimal chat playground: a React + Vite client and an Express server.

1. Clone this repo and `cd` into it.
2. Install dependencies: `npm install`
3. Copy `server/.env.example` to `server/.env` and fill in the base URL, API key and model name of an OpenAI compatible provider. The setup lesson lists the options.
4. Start both apps: `npm run dev`

The client runs on http://localhost:5173 and the server on http://localhost:3001.
The client proxies `/api` requests to the server.
