---
name: Real-time RPS app
overview: "Build a real-time multiplayer rock-paper-scissors web app from an empty repo: Node + Socket.io backend, a single frontend (React or vanilla) with rich SVG/CSS graphics and animations, and a one-command run experience."
todos: []
isProject: false
---

# Real-time interactive Rock-Paper-Scissors app

## The challenge (official)

**Rock Paper Scissors — Multiplayer. Real-time.**

- **Flow:** Player joins → enters lobby → matched with opponent → game begins.
- **Bar:** "If you finish in 10 minutes... You are not done. Make it amazing."

The plan below delivers the core flow; stretch goals (listed later) are how you go beyond that.

## Goals

- **Real-time:** Two players connected at once; choices revealed in sync (no turn-by-turn delay).
- **Easy to run:** Single command after clone (e.g. `npm install` then `npm start`).
- **Lots of in-app graphics:** Illustrations, icons, and animations for rock/paper/scissors and results (no requirement to generate/export image files).

## Architecture

- **Backend:** Node.js + Express (or Fastify) serving the built frontend and mounting **Socket.io** for real-time play (rooms per game, sync picks and reveal).
- **Frontend:** Vite + React (or Vite + vanilla) for fast dev and a single build artifact the server can serve from `dist/`.
- **Run:** One process: `npm start` runs the Node server (and optionally builds the client). README: clone → `npm install` → `npm start` → open URL.

## Remote play: deployment and ngrok (coordinate with teammates)

GitHub hosts the code but **cannot run** the app. Two ways to get a shareable URL:

- **ngrok (quick testing)** — One teammate runs the app locally (`npm start`) and exposes it with **ngrok**: `ngrok http 3000` (or whatever port the server uses). Share the ngrok URL (e.g. `https://abc123.ngrok.io`) so the other player can open it and join. No deploy step; great for demos and ad-hoc remote play. Incorporate in the project: (1) document in README (install ngrok, run `npm start` in one terminal, `ngrok http 3000` in another, share URL); (2) optional npm script e.g. `"tunnel": "ngrok http 3000"` for convenience (requires ngrok installed). Ensure the app works when accessed via the ngrok host (same-origin/WebSocket and static assets).
- **Deploy (persistent URL)** — Deploy the same repo to **Render** or **Railway** for a stable URL that survives after you close your laptop. Add `render.yaml` (or equivalent); document in README how to connect the repo and share the game link.

## Data flow (real-time)

1. **Lobby:** Player A creates a game → server creates a room, returns game ID/link. Player B joins via link or ID.
2. **Pick phase:** Both players choose rock/paper/scissors; client sends choice over Socket.io; server stores and waits for both.
3. **Reveal:** When both have chosen, server broadcasts both choices and result (win/lose/draw) to the room.
4. **Next round:** Same room; repeat from pick phase until someone leaves or game ends.

## Webcam as judge (gesture + reaction time)

Use **webcam** to (1) detect hand gesture (rock/paper/scissors) via MediaPipe Hands or TensorFlow.js and (2) measure **who reacted quickest** after a server "Go!" — reaction time breaks draws. Keep **button mode** as fallback.

**How the camera analyzes rock/paper/scissors**

1. **Video in** — Browser gets the webcam stream with `getUserMedia`; we feed frames (e.g. from a `<video>` or `<canvas>`) into a hand-tracking model.
2. **Hand landmarks** — A model like **MediaPipe Hands** (or a TensorFlow.js hand-pose model) does not output "rock/paper/scissors" directly. It outputs **hand landmarks**: positions of wrist, palm, and each finger joint (e.g. 21 points per hand). So we get "where the fingertips are," "are fingers extended or curled," etc., every frame.
3. **Map landmarks → gesture** — We add a small **gesture classifier** that turns those landmarks into one of three labels:
  - **Rock** — Fist: fingertips close to the palm, fingers curled (most “extended” flags off).
  - **Paper** — Open palm: fingers extended and spread, fingertips far from palm.
  - **Scissors** — Index and middle finger extended and separated; other fingers curled.
   Rules can be simple (e.g. “if only 2 fingers extended and apart → scissors”) or a tiny classifier on top of the landmark coordinates.
4. **Stable detection and reaction time** — After the server sends "Go!", we start a timer. We run the model every frame; when the **same** gesture is seen for a few frames in a row (e.g. 3–5), we treat it as **stable**, lock that choice, and set reaction time = time from "Go!" to that moment. Sending `{ gesture, reactionTimeMs }` to the server lets it decide the RPS winner and use reaction time to break ties. Requiring “stable” avoids false triggers from a single noisy frame.

## Leaderboard

Persistent **stats and rankings**: display name, wins/losses/draws, current streak. Store in JSON file or SQLite; GET leaderboard API and server-side update after each game; leaderboard UI (top N + "Your stats"). No login required.

## "Lots of graphic images" (rich UI)

Custom **SVG** illustrations for rock/paper/scissors; lobby, pick phase, result screen, scoreboard with animations (hover, reveal, win/lose/draw).

## Suggested repo layout

- `package.json` – scripts: `dev`, `build`, `start` (build + run server).
- `server/` – Express, static `dist/`, Socket.io, game room logic.
- `client/` – Vite + React: lobby, game room, pick UI, result view, scoreboard, leaderboard.
- `README.md` – Prerequisites, `npm install`, `npm start`, remote play (ngrok for quick testing + deploy for persistent URL), leaderboard.

## Tech choices


| Layer       | Choice                                  |
| ----------- | --------------------------------------- |
| Runtime     | Node.js LTS                             |
| Backend     | Express + Socket.io                     |
| Frontend    | Vite + React                            |
| Styling     | CSS (or Tailwind)                       |
| Graphics    | Inline or imported SVG                  |
| Webcam      | MediaPipe Hands or TF.js + getUserMedia |
| Leaderboard | JSON or SQLite, REST or Socket.io       |


## Implementation order

1. **Scaffold** – `package.json`, Express + Socket.io, Vite + React; `npm start` builds client and runs server.
2. **Backend game logic** – Rooms, join/create, picks, result, broadcast.
3. **Frontend shell** – Lobby → game view (pick, wait, result) → scoreboard; Socket.io client.
4. **Graphics and UI** – SVG rock/paper/scissors, lobby, pick buttons, result/scoreboard.
5. **Animation and polish** – Hover, reveal, result states, README.
6. **Remote play** – **ngrok:** README section for quick testing (run app + `ngrok http <port>`, share URL); optional `npm run tunnel` script. **Deploy:** `render.yaml`, README deploy + game link for persistent URL.
7. **Webcam-as-judge mode** – getUserMedia, gesture model, "Go!" and reactionTimeMs, draw = fastest wins; button fallback.
8. **Leaderboard** – Persist stats per display name; GET leaderboard + update after game; leaderboard UI.

## Stretch goals (from the challenge)

- **WebGL** — 3D hands, particle effects, shaders.
- **Terminal UI** — ncurses, ASCII art, retro vibes.
- **SSH game server** — `ssh play@yourserver.com`.
- **AI opponent** — Pattern recognition, adaptive difficulty.
- **Tournament mode** — Brackets, spectators, replays.

## Out of scope (for this plan)

- User accounts or auth (anonymous display name for leaderboard is enough).
- Generating or exporting image files (requirement was rich in-app graphics only).
- Mobile-specific builds (responsive layout is in scope; native app is not).

