# Host the game and invite friends

Two ways to get a link you can share so friends can play from their own devices.

---

## Option A: ngrok (about 2 minutes)

Best for: playing **right now** with friends (same day, no account needed for them).

### 1. Install ngrok (one-time)

- **Windows:** Download from [ngrok.com/download](https://ngrok.com/download) or `winget install ngrok`
- **Mac:** `brew install ngrok`
- Optional: sign up at [ngrok.com](https://ngrok.com) for a free account and run `ngrok config add-authtoken YOUR_TOKEN` so the URL stays stable longer.

### 2. Start the game on your machine

From the `JMP's attempt` folder:

```bash
npm install
npm start
```

Leave this running. You should see: `Server running at http://localhost:3000`.

### 3. Expose it with ngrok

Open a **second** terminal. In the same folder run:

```bash
npm run tunnel
```

Or directly:

```bash
ngrok http 3000
```

You’ll see a line like:

```text
Forwarding   https://abc123def.ngrok-free.app -> http://localhost:3000
```

That **https://…** URL is your public game link.

### 4. Invite friends

1. Open that **https** link in your own browser (e.g. `https://abc123def.ngrok-free.app`).
2. Enter your name and click **Create game & get link**.
3. Click **Copy link** and send that link to friends (e.g. over Slack, Discord, or email).  
   The link will look like: `https://abc123def.ngrok-free.app/#room=xyz123`
4. Friends open the link, enter their name, click **Join** — they’re in the same room.
5. Play: both choose Rock, Paper, or Scissors; the result appears for both.

**Note:** If you close the terminal where `npm start` or `ngrok` is running, the link will stop working. For a link that stays up 24/7, use Option B (deploy).

---

## Option B: Deploy to Render (always-on link)

Best for: a link that **stays online** so friends can play anytime without you running anything.

### 1. Push the repo to GitHub

Make sure your code (including the `JMP's attempt` folder) is in a GitHub repo and pushed.

### 2. Create a Render account and service

1. Go to [render.com](https://render.com) and sign up (free).
2. **New** → **Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Root Directory:** `JMP's attempt` (so Render uses that folder).
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** Free.

5. Click **Create Web Service**. Render will build and run the app and give you a URL like `https://rps-realtime-xxxx.onrender.com`.

### 3. Invite friends

1. Open that URL, create a game, then **Copy link**.
2. Share the copied link (e.g. `https://rps-realtime-xxxx.onrender.com/#room=abc123`) with friends.
3. They open it, join with their name, and play.

**Note:** On the free tier, the app may sleep after a few minutes of no use; the first visit after that might take 30–60 seconds to wake up.

---

## Quick comparison

|                | ngrok                         | Deploy (Render)        |
|----------------|-------------------------------|------------------------|
| Setup time     | ~2 min                        | ~5 min (one-time)      |
| Your computer  | Must stay on and running app  | Can be off             |
| Link lifetime  | Only while ngrok + server run| 24/7 until you delete   |
| Best for       | Quick games with friends now  | Share link anytime     |

Use **ngrok** to host and invite friends today; use **deploy** when you want a permanent link.
