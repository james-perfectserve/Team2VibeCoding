import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { gameHandler } from './game.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);

// Serve built client
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

gameHandler(io);

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
