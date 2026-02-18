import { useState, useEffect } from 'react';

export default function Lobby({ onCreate, onJoin, onFindMatch, onCancelMatch, searching, error }) {
  const [createName, setCreateName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinName, setJoinName] = useState('');
  const [findMatchName, setFindMatchName] = useState('');

  useEffect(() => {
    const hash = window.location.hash || '';
    const m = hash.match(/#room=([a-z0-9]+)/i);
    if (m) setJoinRoomId(m[1]);
  }, []);

  return (
    <section className="lobby">
      <h1>Rock Paper Scissors</h1>
      <p className="tagline">Multiplayer · Real-time</p>
      {error && <p className="error" role="alert">{error}</p>}

      <div className="lobby-actions">
        <div className="card">
          <h2>Create game</h2>
          <input
            type="text"
            placeholder="Your name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <button onClick={() => onCreate(createName.trim())}>Create & get link</button>
        </div>
        <div className="card">
          <h2>Join game</h2>
          <input
            type="text"
            placeholder="Room ID (from link)"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.trim())}
          />
          <input
            type="text"
            placeholder="Your name"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
          />
          <button onClick={() => onJoin(joinRoomId, joinName.trim())}>Join</button>
        </div>
        <div className="card card-highlight">
          <h2>Quick play</h2>
          <input
            type="text"
            placeholder="Your name"
            value={findMatchName}
            onChange={(e) => setFindMatchName(e.target.value)}
            disabled={searching}
          />
          {!searching ? (
            <button onClick={() => onFindMatch(findMatchName.trim())}>Find match</button>
          ) : (
            <>
              <p className="searching-msg">Searching for opponent…</p>
              <button type="button" className="cancel-btn" onClick={onCancelMatch}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
