import { useState, useEffect } from 'react';
import ChoiceButtons from './ChoiceButtons';
import WebcamPicker from './WebcamPicker';

export default function Game({ socket, gameState, gameUrl, onBack, onRevealDone }) {
  const [copied, setCopied] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const you = gameState?.you ?? 0;
  const players = gameState?.players ?? [];
  const lastReveal = gameState?.lastReveal;

  useEffect(() => {
    if (!lastReveal) return;
    const t = setTimeout(onRevealDone, 3200);
    return () => clearTimeout(t);
  }, [lastReveal, onRevealDone]);

  const copyLink = () => {
    if (gameUrl) {
      navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isWin =
    lastReveal &&
    lastReveal.winner !== 'draw' &&
    ((lastReveal.winner === 'a' && you === 0) || (lastReveal.winner === 'b' && you === 1));
  const isDraw = lastReveal && lastReveal.winner === 'draw';

  if (!socket || !gameState) {
    return (
      <div className="game-loading">
        <div className="spinner" aria-hidden />
        <span>Connecting…</span>
      </div>
    );
  }

  return (
    <section className="game">
      <header>
        <button type="button" className="back" onClick={onBack}>
          ← Lobby
        </button>
        {gameUrl && (
          <div className="share">
            <button type="button" onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        )}
      </header>

      {gameState.roomId && (
        <p className="room-badge">Room: {gameState.roomId}</p>
      )}

      {lastReveal && (
        <div className="reveal-overlay">
          <div className="reveal-content">
            <div className="reveal-vs">
              <span className="choice">{lastReveal.choices[0]}</span>
              <span className="vs-label">vs</span>
              <span className="choice">{lastReveal.choices[1]}</span>
            </div>
            <p
              className={`result ${isWin ? 'win' : isDraw ? 'draw' : 'lose'}`}
              role="status"
            >
              {isDraw ? 'Draw!' : isWin ? 'You win!' : 'You lose!'}
            </p>
            <p className="sub">Next round in a moment…</p>
          </div>
        </div>
      )}

      <div className="players">
        {players.map((p, i) => (
          <div
            key={i}
            className={`player-card ${p.choice === 'chosen' ? 'chosen' : ''}`}
          >
            <span className="name">{p.displayName || `Player ${i + 1}`}</span>
            <span className={`status ${p.choice === 'chosen' ? 'chosen' : ''}`}>
              {p.choice === 'chosen' ? '✓ Chose' : p.choice ? '—' : 'Waiting…'}
            </span>
          </div>
        ))}
      </div>

      {players.length === 1 && (
        <p className="waiting">Share the link with a friend. Waiting for opponent…</p>
      )}

      {players.length === 2 && !lastReveal && (
        <>
          {!useWebcam ? (
            <div className="choice-mode">
              <ChoiceButtons socket={socket} />
              <button type="button" className="webcam-toggle" onClick={() => setUseWebcam(true)}>
                Use webcam instead
              </button>
            </div>
          ) : (
            <WebcamPicker key={lastReveal ? 'reveal' : 'pick'} socket={socket} onFallback={() => setUseWebcam(false)} />
          )}
        </>
      )}
    </section>
  );
}
