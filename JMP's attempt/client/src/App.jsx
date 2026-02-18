import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './Lobby';
import Game from './Game';

const socketUrl = import.meta.env.DEV
  ? (window.location.port === '5173' ? 'http://localhost:3000' : window.location.origin)
  : window.location.origin;

export default function App() {
  const [screen, setScreen] = useState('lobby');
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gameUrl, setGameUrl] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const s = io(socketUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const findMatch = (displayName) => {
    if (!socket || searching) return;
    setError('');
    setSearching(true);
    socket.emit('find-match', displayName?.trim() || 'Player', () => {});
  };

  const cancelMatch = () => {
    if (socket) socket.emit('cancel-match');
    setSearching(false);
  };

  const createGame = (displayName) => {
    if (!socket) return;
    setError('');
    socket.emit('create-game', displayName || 'Player 1', (res) => {
      if (res.error) setError(res.error);
      else {
        setGameUrl(`${window.location.origin}${window.location.pathname}#room=${res.roomId}`);
        setScreen('game');
      }
    });
  };

  const joinGame = (roomId, displayName) => {
    if (!socket) return;
    setError('');
    socket.emit('join-game', roomId, displayName || 'Player 2', (res) => {
      if (res.error) setError(res.error);
      else setScreen('game');
    });
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('game-state', setGameState);
    socket.on('reveal', (reveal) => setGameState((prev) => (prev ? { ...prev, lastReveal: reveal } : prev)));
    socket.on('matched', (payload) => {
      setGameState(payload);
      setSearching(false);
      setScreen('game');
    });
    return () => {
      socket.off('game-state');
      socket.off('reveal');
      socket.off('matched');
    };
  }, [socket]);

  const backToLobby = () => {
    setScreen('lobby');
    setGameState(null);
    setGameUrl('');
    setError('');
    setSearching(false);
    if (socket) socket.emit('cancel-match');
  };

  return (
    <div className="app">
      {screen === 'lobby' && (
        <Lobby
          onCreate={createGame}
          onJoin={joinGame}
          onFindMatch={findMatch}
          onCancelMatch={cancelMatch}
          searching={searching}
          error={error}
        />
      )}
      {screen === 'game' && socket && gameState && (
        <Game
          socket={socket}
          gameState={gameState}
          gameUrl={gameUrl}
          onBack={backToLobby}
          onRevealDone={() => setGameState((p) => (p ? { ...p, lastReveal: null } : p))}
        />
      )}
    </div>
  );
}
