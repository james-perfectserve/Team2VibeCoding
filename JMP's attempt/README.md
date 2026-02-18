# Rock Paper Scissors — Real-time Multiplayer

**JMP's attempt** at the vibe coding challenge: multiplayer, real-time RPS with a simple lobby and in-browser play.

## Quick start

**Prerequisites:** Node.js 18+ (LTS).

```bash
cd "JMP's attempt"
npm install
npm start
```

Then open **http://localhost:3000**. One player creates a game and copies the link; the other joins with the room ID (from the link).

---

## Host the game and invite friends

**→ See [HOSTING.md](HOSTING.md) for step-by-step instructions.**

- **ngrok** — Run the app + ngrok on your PC, get a shareable link in ~2 minutes. Friends open the link and join. Your computer must stay on while playing.
- **Deploy (Render)** — Deploy once to Render; you get a permanent URL. Share it anytime; no need to run the app locally.

| Goal | Do this |
|------|--------|
| Play with friends **today** | Use ngrok: `npm start` → second terminal: `npm run tunnel` → open the https URL, create game, **Copy link**, send to friends. |
| Link that works **anytime** | Deploy to Render; set root to `JMP's attempt`, build `npm install && npm run build`, start `node server/index.js`. Share the Render URL. |

---

## Scripts

- **`npm start`** — Builds the client and runs the server. App at **http://localhost:3000**.
- **`npm run dev`** — Server + Vite dev server: open **http://localhost:5173**.
- **`npm run build`** — Builds the client into `dist/`.
- **`npm run tunnel`** — Runs `ngrok http 3000` (requires [ngrok](https://ngrok.com/) installed). Use this to get a shareable URL.

## Flow

1. **Lobby** — Create a game (get a link) or join with a room ID.
2. **Game** — When two players are in, both choose rock, paper, or scissors. Choices are revealed together; winner is shown.
3. **Next round** — Same room; play again.

## Tech

- **Backend:** Node, Express, Socket.io (game rooms and real-time events).
- **Frontend:** Vite, React (lobby, game view, choice buttons).
- **Run:** Single `npm start` builds and serves the app.
