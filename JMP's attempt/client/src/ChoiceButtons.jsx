const CHOICES = [
  {
    id: 'rock',
    label: 'Rock',
    svg: (
      <svg viewBox="0 0 64 64" className="choice-icon" aria-hidden>
        <ellipse cx="32" cy="40" rx="20" ry="14" fill="currentColor" opacity="0.9" />
        <path d="M18 36 Q24 28 28 32 Q32 24 36 32 Q40 28 46 36 Q42 44 32 48 Q22 44 18 36Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'paper',
    label: 'Paper',
    svg: (
      <svg viewBox="0 0 64 64" className="choice-icon" aria-hidden>
        <path d="M20 12 L44 12 L52 24 L52 52 L12 52 L12 24 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M44 12 L44 24 L52 24" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'scissors',
    label: 'Scissors',
    svg: (
      <svg viewBox="0 0 64 64" className="choice-icon" aria-hidden>
        <ellipse cx="20" cy="32" rx="8" ry="12" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(-30 20 32)" />
        <ellipse cx="44" cy="32" rx="8" ry="12" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(30 44 32)" />
        <circle cx="32" cy="50" r="6" fill="currentColor" />
      </svg>
    ),
  },
];

export default function ChoiceButtons({ socket }) {
  const send = (choice) => {
    socket.emit('choice', choice);
  };

  return (
    <div className="choice-buttons">
      <p className="prompt">Choose:</p>
      {CHOICES.map(({ id, label, svg }) => (
        <button key={id} type="button" className="choice" onClick={() => send(id)} title={label}>
          {svg}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
