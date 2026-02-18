const CHOICES = ['rock', 'paper', 'scissors'];

function rpsResult(a, b) {
  if (a === b) return 'draw';
  if (a === 'rock' && b === 'scissors') return 'a';
  if (a === 'paper' && b === 'rock') return 'a';
  if (a === 'scissors' && b === 'paper') return 'a';
  return 'b';
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const rooms = new Map(); // roomId -> { players: [...] }
const matchQueue = []; // { socketId, displayName }

export function gameHandler(io) {
  io.on('connection', (socket) => {
    socket.on('find-match', (displayName, cb) => {
      const name = displayName?.trim() || 'Player';
      matchQueue.push({ socketId: socket.id, displayName: name });
      cb({ status: 'searching' });
      if (matchQueue.length >= 2) {
        const [a, b] = matchQueue.splice(0, 2);
        const roomId = makeId();
        const room = {
          players: [
            { id: a.socketId, socketId: a.socketId, displayName: a.displayName, choice: null },
            { id: b.socketId, socketId: b.socketId, displayName: b.displayName, choice: null },
          ],
          status: 'playing',
        };
        rooms.set(roomId, room);
        const socketA = io.sockets.sockets.get(a.socketId);
        const socketB = io.sockets.sockets.get(b.socketId);
        if (socketA) {
          socketA.join(roomId);
          socketA.roomId = roomId;
          socketA.playerId = a.socketId;
          socketA.emit('matched', {
            roomId,
            players: room.players.map((p) => ({ displayName: p.displayName, choice: null })),
            status: room.status,
            you: 0,
          });
        }
        if (socketB) {
          socketB.join(roomId);
          socketB.roomId = roomId;
          socketB.playerId = b.socketId;
          socketB.emit('matched', {
            roomId,
            players: room.players.map((p) => ({ displayName: p.displayName, choice: null })),
            status: room.status,
            you: 1,
          });
        }
      }
    });

    socket.on('cancel-match', () => {
      const i = matchQueue.findIndex((e) => e.socketId === socket.id);
      if (i !== -1) matchQueue.splice(i, 1);
    });

    socket.on('create-game', (displayName, cb) => {
      const roomId = makeId();
      const room = {
        players: [{ id: socket.id, socketId: socket.id, displayName: displayName || 'Player 1', choice: null }],
        status: 'waiting',
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.playerId = socket.id;
      cb({ roomId, url: `/game/${roomId}` });
      socket.emit('game-state', {
        roomId,
        players: room.players.map((p) => ({ displayName: p.displayName, choice: null })),
        status: room.status,
        you: 0,
      });
    });

    socket.on('join-game', (roomId, displayName, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb({ error: 'Room not found' });
      if (room.players.length >= 2) return cb({ error: 'Room full' });
      room.players.push({
        id: socket.id,
        socketId: socket.id,
        displayName: displayName || 'Player 2',
        choice: null,
      });
      room.status = 'playing';
      socket.join(roomId);
      socket.roomId = roomId;
      socket.playerId = socket.id;
      cb({ roomId });
      io.to(roomId).emit('game-state', {
        roomId,
        players: room.players.map((p) => ({ displayName: p.displayName, choice: null })),
        status: room.status,
        you: room.players.findIndex((p) => p.socketId === socket.id),
      });
    });

    socket.on('choice', (choice) => {
      if (!CHOICES.includes(choice)) return;
      const room = rooms.get(socket.roomId);
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player || player.choice) return;
      player.choice = choice;
      const bothChose = room.players.every((p) => p.choice);
      if (bothChose) {
        const [a, b] = room.players;
        const winner = rpsResult(a.choice, b.choice);
        room.status = 'reveal';
        room.reveal = { choices: [a.choice, b.choice], winner };
        io.to(socket.roomId).emit('reveal', room.reveal);
        // Reset for next round
        room.players.forEach((p) => (p.choice = null));
        room.status = 'playing';
        room.reveal = null;
      } else {
        io.to(socket.roomId).emit('game-state', {
          roomId: socket.roomId,
          players: room.players.map((p) => ({ displayName: p.displayName, choice: p.choice ? 'chosen' : null })),
          status: room.status,
        });
      }
    });

    socket.on('disconnect', () => {
      const qi = matchQueue.findIndex((e) => e.socketId === socket.id);
      if (qi !== -1) matchQueue.splice(qi, 1);
      const roomId = socket.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      room.players = room.players.filter((p) => p.socketId !== socket.id);
      if (room.players.length === 0) rooms.delete(roomId);
      else
        io.to(roomId).emit('game-state', {
          roomId,
          players: room.players.map((p) => ({ displayName: p.displayName, choice: p.choice ? 'chosen' : null })),
          status: room.status,
        });
    });
  });
}
