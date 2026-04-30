# Decide — Backend API

> Secure API proxy for the Decide Decision Intelligence Platform.

Handles all AI model calls server-side so the API key is never exposed to the browser. Built with Node.js + Express, deployed on Railway.

**Frontend:** https://github.com/AbhishekkumarGupta-coder/decide  
**Live demo:** https://decide-9akd07afs-abhishekkumargupta-coders-projects.vercel.app

---

## What it does

- Receives agent requests from the Decide frontend
- Calls Google AI Studio (Gemma 4 31B) with the right system prompt
- Cleans and returns structured JSON decisions
- Keeps the API key hidden from the browser at all times

---

## Tech stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express
- **AI:** Google Generative AI SDK (`@google/generative-ai`)
- **Model:** `gemma-4-31b-it`
- **Deployment:** Railway

---

## Architecture

```
Decide Frontend (Vercel)
        ↓
POST /api/decide
{ systemPrompt, userPrompt }
        ↓
Express Server (Railway)
        ↓
Google AI Studio — Gemma 4 31B
        ↓
{ success: true, text: "{ dish: ... }" }
        ↓
Frontend parses JSON and renders result card
```

---

## API

### `POST /api/decide`

Request:
```json
{
  "systemPrompt": "You are a food decision agent...",
  "userPrompt": "Mood: tired, Budget: ₹300, City: Bangalore"
}
```

Response:
```json
{
  "success": true,
  "text": "{\"dish\": \"Butter Chicken\", \"restaurant\": \"Paradise\", \"price_estimate\": \"₹280\", \"confidence\": 88}"
}
```

Error response:
```json
{
  "success": false,
  "error": "Model error message"
}
```

### `GET /`

Health check — returns `Decide API is running`

---

## Running locally

```bash
git clone https://github.com/AbhishekkumarGupta-coder/decide-backend-
cd decide-backend-
npm install
```

Create `.env`:
```
GEMINI_API_KEY=your_google_ai_studio_key_here
```

Get your key at: `aistudio.google.com/app/apikey`

```bash
npm start
```

Server runs on `http://localhost:3001`

Test it:
```bash
curl http://localhost:3001
# → Decide API is running
```

---

## Deploying to Railway

1. Push to GitHub
2. Go to `railway.app` → New Project → Deploy from GitHub
3. Select this repo
4. Add environment variable: `GEMINI_API_KEY=your_key`
5. Railway auto-deploys and gives you a public URL
6. Add that URL as `VITE_BACKEND_URL` in your Vercel frontend

---

## Environment variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key |

---

## Roadmap

- [ ] Rate limiting per IP to prevent abuse
- [ ] Request logging for analytics
- [ ] Swiggy MCP tool integration (place real orders)
- [ ] Auth layer for user sessions
- [ ] Caching frequent decisions

---

## Built for

**Swiggy Builders Club** — MCP Partnership Program  
`mcp.swiggy.com/builders`

---

## Contact

Abhishek Kumar Gupta  
abhishekkumargupta5557@gmail.com  
github.com/AbhishekkumarGupta-coder
