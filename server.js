const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ── State ──────────────────────────────────────────────────
const players = new Map();   // socketId → { name, wins, losses, streak }
const waitingQueue = [];     // socket IDs waiting for a match
const activeGames = new Map(); // gameId → game object
let gameIdCounter = 0;

// ── Helpers ────────────────────────────────────────────────
function generateGameId() {
  return `game_${++gameIdCounter}`;
}

function determineWinner(c1, c2) {
  if (c1 === c2) return 'draw';
  const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  return wins[c1] === c2 ? 'player1' : 'player2';
}

function getPlayerCount() {
  return players.size;
}

function broadcastPlayerCount() {
  io.emit('player-count', getPlayerCount());
}

function removeFromQueue(socketId) {
  const idx = waitingQueue.indexOf(socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function findGameByPlayer(socketId) {
  for (const [gameId, game] of activeGames) {
    if (game.player1 === socketId || game.player2 === socketId) {
      return { gameId, game };
    }
  }
  return null;
}

function getOpponentId(game, socketId) {
  return game.player1 === socketId ? game.player2 : game.player1;
}

function createGame(p1Id, p2Id) {
  const gameId = generateGameId();
  const game = {
    player1: p1Id,
    player2: p2Id,
    choices: {},
    round: 1,
    scores: { [p1Id]: 0, [p2Id]: 0 },
    winsNeeded: 3,
    rematchRequests: new Set(),
  };
  activeGames.set(gameId, game);

  const p1 = players.get(p1Id);
  const p2 = players.get(p2Id);

  io.to(p1Id).emit('match-found', { opponent: p2.name, gameId });
  io.to(p2Id).emit('match-found', { opponent: p1.name, gameId });
}

function resolveRound(gameId, game) {
  const p1Id = game.player1;
  const p2Id = game.player2;
  const c1 = game.choices[p1Id];
  const c2 = game.choices[p2Id];

  const result = determineWinner(c1, c2);

  if (result === 'player1') game.scores[p1Id]++;
  else if (result === 'player2') game.scores[p2Id]++;

  // Check for match winner BEFORE sending results
  const p1Wins = game.scores[p1Id] >= game.winsNeeded;
  const p2Wins = game.scores[p2Id] >= game.winsNeeded;
  const isMatchOver = p1Wins || p2Wins;

  // Send personalized results — include whether match is over
  io.to(p1Id).emit('round-result', {
    yourChoice: c1,
    opponentChoice: c2,
    result: result === 'player1' ? 'win' : result === 'player2' ? 'lose' : 'draw',
    scores: { you: game.scores[p1Id], opponent: game.scores[p2Id] },
    round: game.round,
    isMatchOver,
    matchResult: isMatchOver ? (p1Wins ? 'win' : 'lose') : null,
  });

  io.to(p2Id).emit('round-result', {
    yourChoice: c2,
    opponentChoice: c1,
    result: result === 'player2' ? 'win' : result === 'player1' ? 'lose' : 'draw',
    scores: { you: game.scores[p2Id], opponent: game.scores[p1Id] },
    round: game.round,
    isMatchOver,
    matchResult: isMatchOver ? (p2Wins ? 'win' : 'lose') : null,
  });

  if (p1Wins) {
    endGame(gameId, game, p1Id, p2Id);
  } else if (p2Wins) {
    endGame(gameId, game, p2Id, p1Id);
  } else {
    // Next round
    game.round++;
    game.choices = {};
  }
}

function endGame(gameId, game, winnerId, loserId) {
  const winner = players.get(winnerId);
  const loser = players.get(loserId);

  if (winner) { winner.wins++; winner.streak++; }
  if (loser) { loser.losses++; loser.streak = 0; }

  io.to(winnerId).emit('game-over', {
    result: 'win',
    finalScores: { you: game.scores[winnerId], opponent: game.scores[loserId] },
  });
  io.to(loserId).emit('game-over', {
    result: 'lose',
    finalScores: { you: game.scores[loserId], opponent: game.scores[winnerId] },
  });

  game.finished = true;
}

// ── Socket.IO ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('join', ({ name }) => {
    if (!name || typeof name !== 'string') return;
    name = name.trim().substring(0, 20);
    if (!name) return;

    players.set(socket.id, { name, wins: 0, losses: 0, streak: 0 });
    socket.emit('joined', { playerCount: getPlayerCount() });
    broadcastPlayerCount();
    console.log(`${name} joined (${getPlayerCount()} online)`);
  });

  socket.on('find-match', () => {
    if (!players.has(socket.id)) return;
    // Don't queue if already in a game
    if (findGameByPlayer(socket.id)) return;
    // Don't double-queue
    if (waitingQueue.includes(socket.id)) return;

    waitingQueue.push(socket.id);

    if (waitingQueue.length >= 2) {
      const p1 = waitingQueue.shift();
      const p2 = waitingQueue.shift();

      // Verify both still connected
      if (!players.has(p1)) {
        if (players.has(p2)) waitingQueue.unshift(p2);
        return;
      }
      if (!players.has(p2)) {
        if (players.has(p1)) waitingQueue.unshift(p1);
        return;
      }

      createGame(p1, p2);
    } else {
      socket.emit('waiting-for-match');
    }
  });

  socket.on('make-choice', ({ choice }) => {
    if (!['rock', 'paper', 'scissors'].includes(choice)) return;

    const found = findGameByPlayer(socket.id);
    if (!found) return;
    const { gameId, game } = found;

    if (game.finished) return;
    // Already chose this round
    if (game.choices[socket.id]) return;

    game.choices[socket.id] = choice;

    // Notify opponent that this player has chosen
    const opponentId = getOpponentId(game, socket.id);
    io.to(opponentId).emit('opponent-chose');

    // If both have chosen, resolve
    if (game.choices[game.player1] && game.choices[game.player2]) {
      resolveRound(gameId, game);
    }
  });

  socket.on('play-again', () => {
    const found = findGameByPlayer(socket.id);
    if (!found) return;
    const { gameId, game } = found;
    if (!game.finished) return;

    game.rematchRequests.add(socket.id);
    const opponentId = getOpponentId(game, socket.id);

    if (game.rematchRequests.has(game.player1) && game.rematchRequests.has(game.player2)) {
      // Both want rematch — reset game
      game.choices = {};
      game.round = 1;
      game.scores = { [game.player1]: 0, [game.player2]: 0 };
      game.finished = false;
      game.rematchRequests.clear();
      io.to(game.player1).emit('rematch-start');
      io.to(game.player2).emit('rematch-start');
    } else {
      io.to(opponentId).emit('opponent-wants-rematch');
    }
  });

  socket.on('leave-game', () => {
    const found = findGameByPlayer(socket.id);
    if (!found) return;
    const { gameId, game } = found;

    const opponentId = getOpponentId(game, socket.id);
    io.to(opponentId).emit('opponent-left');
    activeGames.delete(gameId);
  });

  socket.on('get-leaderboard', () => {
    const board = [...players.values()]
      .map(p => ({ name: p.name, wins: p.wins, losses: p.losses, streak: p.streak }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
      .slice(0, 10);
    socket.emit('leaderboard', board);
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    console.log(`Disconnected: ${player?.name || socket.id}`);

    removeFromQueue(socket.id);

    const found = findGameByPlayer(socket.id);
    if (found) {
      const { gameId, game } = found;
      const opponentId = getOpponentId(game, socket.id);
      io.to(opponentId).emit('opponent-left');
      activeGames.delete(gameId);
    }

    players.delete(socket.id);
    broadcastPlayerCount();
  });
});

// ── Start ──────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('');
  console.log('  ============================================');
  console.log('    Rock Paper Scissors Server Running!');
  console.log('');
  console.log(`    Local:    http://localhost:${PORT}`);
  console.log(`    Network:  http://${ip}:${PORT}`);
  console.log('');
  console.log('    Share the Network URL with other players!');
  console.log('');
  console.log('    Remote?   Run: npx localtunnel --port ' + PORT);
  console.log('  ============================================');
  console.log('');
});
