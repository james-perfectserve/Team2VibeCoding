const socket = io();

// ── DOM Elements ───────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const $playerCount = $('#player-count');
const $nameInput = $('#name-input');
const $btnJoin = $('#btn-join');
const $joinForm = $('#join-form');
const $lobby = $('#lobby');
const $playerName = $('#player-name');
const $btnFindMatch = $('#btn-find-match');
const $btnLeaderboard = $('#btn-leaderboard');
const $matchStatus = $('#match-status');
const $leaderboardPanel = $('#leaderboard-panel');
const $leaderboardBody = $('#leaderboard-body');
const $btnCloseLeaderboard = $('#btn-close-leaderboard');

const $opponentName = $('#opponent-name');
const $roundNumber = $('#round-number');
const $scoreYou = $('#score-you');
const $scoreOpponent = $('#score-opponent');
const $gameStatus = $('#game-status');
const $choiceBtns = $$('.choice-btn');

const $resultYourChoice = $('#result-your-choice');
const $resultOpponentChoice = $('#result-opponent-choice');
const $resultText = $('#result-text');
const $resultScoreYou = $('#result-score-you');
const $resultScoreOpponent = $('#result-score-opponent');
const $roundButtons = $('#round-buttons');
const $btnNextRound = $('#btn-next-round');
const $gameOverButtons = $('#game-over-buttons');
const $gameOverText = $('#game-over-text');
const $btnPlayAgain = $('#btn-play-again');
const $btnBackLobby = $('#btn-back-lobby');
const $rematchStatus = $('#rematch-status');
const $resultCard = $('.result-card');
const $countdownOverlay = $('#countdown-overlay');
const $countdownNumber = $('#countdown-number');

// ── State ──────────────────────────────────────────────────
let myName = '';
let isGameOver = false;
let roundHistory = []; // track round results for progress dots

const choiceEmojis = {
  rock: '\u{1F44A}',
  paper: '\u{1F590}',
  scissors: '\u{270C}\u{FE0F}',
};

// ── Audio (Web Audio API — tiny beeps, no files needed) ────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, duration, type = 'sine', vol = 0.12) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxClick() { playTone(600, 0.08, 'sine', 0.08); }
function sfxMatch() { playTone(880, 0.15, 'sine', 0.1); playTone(1100, 0.15, 'sine', 0.08); }
function sfxWin() { setTimeout(() => playTone(523, 0.12, 'sine', 0.1), 0); setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 120); setTimeout(() => playTone(784, 0.2, 'sine', 0.1), 240); }
function sfxLose() { playTone(300, 0.3, 'sawtooth', 0.06); }
function sfxDraw() { playTone(440, 0.15, 'triangle', 0.08); }
function sfxCountdown() { playTone(700, 0.1, 'square', 0.05); }

// ── Confetti System ────────────────────────────────────────
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiPieces = [];
let confettiAnimating = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

function launchConfetti() {
  confettiPieces = [];
  const colors = ['#34d399', '#7f5af0', '#fbbf24', '#e53170', '#60a5fa', '#f472b6'];
  for (let i = 0; i < 120; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }
  if (!confettiAnimating) {
    confettiAnimating = true;
    animateConfetti();
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;

  for (const p of confettiPieces) {
    if (p.opacity <= 0) continue;
    alive = true;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.rotation += p.rotSpeed;
    if (p.y > confettiCanvas.height * 0.7) p.opacity -= 0.02;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = Math.max(0, p.opacity);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }

  if (alive) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimating = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ── Countdown Animation ────────────────────────────────────
function showCountdown(callback) {
  let count = 3;
  $countdownOverlay.classList.remove('hidden');
  $countdownNumber.textContent = count;
  $countdownNumber.style.animation = 'none';
  void $countdownNumber.offsetWidth; // force reflow
  $countdownNumber.style.animation = '';

  sfxCountdown();

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      $countdownNumber.textContent = count;
      $countdownNumber.style.animation = 'none';
      void $countdownNumber.offsetWidth;
      $countdownNumber.style.animation = '';
      sfxCountdown();
    } else {
      clearInterval(interval);
      $countdownOverlay.classList.add('hidden');
      callback();
    }
  }, 600);
}

// ── Screen Management ──────────────────────────────────────
function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${name}`);
  screen.classList.remove('active');
  void screen.offsetWidth; // force reflow for re-triggering animation
  screen.classList.add('active');
}

// ── Progress Dots ──────────────────────────────────────────
function updateProgressDots() {
  const dots = $$('.progress-dot');
  dots.forEach((dot, i) => {
    dot.className = 'progress-dot';
    if (i < roundHistory.length) {
      dot.classList.add(roundHistory[i]); // 'won', 'lost', or 'drawn'
    } else if (i === roundHistory.length) {
      dot.classList.add('current');
    }
  });
}

// ── Join / Lobby ───────────────────────────────────────────
$btnJoin.addEventListener('click', () => {
  const name = $nameInput.value.trim();
  if (!name) {
    $nameInput.style.borderColor = 'var(--lose)';
    $nameInput.style.animation = 'resultShake 0.4s ease';
    setTimeout(() => {
      $nameInput.style.borderColor = '';
      $nameInput.style.animation = '';
    }, 400);
    return;
  }
  initAudio();
  sfxClick();
  myName = name;
  socket.emit('join', { name });
});

$nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $btnJoin.click();
});

$btnFindMatch.addEventListener('click', () => {
  sfxClick();
  socket.emit('find-match');
  $btnFindMatch.classList.add('hidden');
  $btnLeaderboard.classList.add('hidden');
  $matchStatus.classList.remove('hidden');
  $matchStatus.querySelector('span').textContent = 'Searching for opponent...';
});

$btnLeaderboard.addEventListener('click', () => {
  sfxClick();
  socket.emit('get-leaderboard');
  $leaderboardPanel.classList.remove('hidden');
});

$btnCloseLeaderboard.addEventListener('click', () => {
  $leaderboardPanel.classList.add('hidden');
});

// ── Game ───────────────────────────────────────────────────
$choiceBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sfxClick();
    const choice = btn.dataset.choice;
    socket.emit('make-choice', { choice });

    $choiceBtns.forEach(b => {
      b.classList.remove('selected');
      b.classList.add('disabled');
    });
    btn.classList.remove('disabled');
    btn.classList.add('selected');
    $gameStatus.textContent = 'Waiting for opponent...';
  });
});

// ── Result ─────────────────────────────────────────────────
$btnNextRound.addEventListener('click', () => {
  sfxClick();
  showScreen('game');
  resetGameUI();
});

$btnPlayAgain.addEventListener('click', () => {
  sfxClick();
  socket.emit('play-again');
  $btnPlayAgain.classList.add('hidden');
  $rematchStatus.classList.remove('hidden');
  $rematchStatus.querySelector('span').textContent = 'Waiting for opponent...';
});

$btnBackLobby.addEventListener('click', () => {
  sfxClick();
  socket.emit('leave-game');
  returnToLobby();
});

// ── Helpers ────────────────────────────────────────────────
function resetGameUI() {
  $choiceBtns.forEach(b => b.classList.remove('selected', 'disabled'));
  $gameStatus.textContent = 'Make your choice!';
  updateProgressDots();
}

function returnToLobby() {
  isGameOver = false;
  roundHistory = [];
  showScreen('join');
  $btnFindMatch.classList.remove('hidden');
  $btnLeaderboard.classList.remove('hidden');
  $matchStatus.classList.add('hidden');
}

// ── Socket Events ──────────────────────────────────────────
socket.on('joined', ({ playerCount }) => {
  $playerCount.textContent = playerCount;
  $joinForm.classList.add('hidden');
  $lobby.classList.remove('hidden');
  $playerName.textContent = myName;
});

socket.on('player-count', (count) => {
  $playerCount.textContent = count;
});

socket.on('waiting-for-match', () => {
  // Already showing search status from button click
});

socket.on('match-found', ({ opponent }) => {
  sfxMatch();
  isGameOver = false;
  roundHistory = [];
  $opponentName.textContent = opponent;
  $roundNumber.textContent = '1';
  $scoreYou.textContent = '0';
  $scoreOpponent.textContent = '0';
  showScreen('game');
  resetGameUI();
});

socket.on('opponent-chose', () => {
  $gameStatus.textContent = 'Opponent is locked in!';
});

socket.on('round-result', ({ yourChoice, opponentChoice, result, scores, round, isMatchOver, matchResult }) => {
  // Track history for progress dots
  if (result === 'win') roundHistory.push('won');
  else if (result === 'lose') roundHistory.push('lost');
  else roundHistory.push('drawn');

  // Show countdown then reveal
  showCountdown(() => {
    showScreen('result');

    $resultYourChoice.textContent = choiceEmojis[yourChoice];
    $resultOpponentChoice.textContent = choiceEmojis[opponentChoice];

    // Card accent
    $resultCard.className = 'card result-card';
    $resultCard.classList.add(`result-${result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'draw'}`);

    $resultText.className = 'result-text';
    if (result === 'win') {
      $resultText.textContent = 'You Win!';
      $resultText.classList.add('win');
      sfxWin();
    } else if (result === 'lose') {
      $resultText.textContent = 'You Lose!';
      $resultText.classList.add('lose');
      sfxLose();
    } else {
      $resultText.textContent = 'Draw!';
      $resultText.classList.add('draw');
      sfxDraw();
    }

    $resultScoreYou.textContent = scores.you;
    $resultScoreOpponent.textContent = scores.opponent;

    $scoreYou.textContent = scores.you;
    $scoreOpponent.textContent = scores.opponent;
    $roundNumber.textContent = round + 1;

    if (isMatchOver) {
      // This is the final round — show game-over UI
      isGameOver = true;
      $roundButtons.classList.add('hidden');
      $gameOverButtons.classList.remove('hidden');
      $btnPlayAgain.classList.remove('hidden');
      $rematchStatus.classList.add('hidden');

      $gameOverText.className = 'game-over-text';
      if (matchResult === 'win') {
        $gameOverText.textContent = 'VICTORY!';
        $gameOverText.classList.add('win');
        launchConfetti();
      } else {
        $gameOverText.textContent = 'DEFEAT';
        $gameOverText.classList.add('lose');
      }
    } else {
      // More rounds to play
      $roundButtons.classList.remove('hidden');
      $gameOverButtons.classList.add('hidden');
    }
  });
});

// Fallback — in case game-over arrives without round-result (e.g. opponent forfeit)
socket.on('game-over', ({ result, finalScores }) => {
  isGameOver = true;
  $roundButtons.classList.add('hidden');
  $gameOverButtons.classList.remove('hidden');
  $btnPlayAgain.classList.remove('hidden');
  $rematchStatus.classList.add('hidden');

  $gameOverText.className = 'game-over-text';
  if (result === 'win') {
    $gameOverText.textContent = 'VICTORY!';
    $gameOverText.classList.add('win');
    launchConfetti();
  } else {
    $gameOverText.textContent = 'DEFEAT';
    $gameOverText.classList.add('lose');
  }

  $resultScoreYou.textContent = finalScores.you;
  $resultScoreOpponent.textContent = finalScores.opponent;
});

socket.on('opponent-wants-rematch', () => {
  $rematchStatus.classList.remove('hidden');
  $rematchStatus.querySelector('span').textContent = 'Opponent wants a rematch!';
});

socket.on('rematch-start', () => {
  sfxMatch();
  isGameOver = false;
  roundHistory = [];
  $roundNumber.textContent = '1';
  $scoreYou.textContent = '0';
  $scoreOpponent.textContent = '0';
  showScreen('game');
  resetGameUI();
});

socket.on('opponent-left', () => {
  if (isGameOver) {
    $rematchStatus.classList.remove('hidden');
    $rematchStatus.querySelector('span').textContent = 'Opponent left the game.';
    $btnPlayAgain.classList.add('hidden');
  } else {
    // Show a nicer notification instead of alert
    returnToLobby();
    $matchStatus.classList.remove('hidden');
    $matchStatus.querySelector('span').textContent = 'Opponent disconnected';
    $btnFindMatch.classList.remove('hidden');
    $btnLeaderboard.classList.remove('hidden');
    setTimeout(() => {
      $matchStatus.classList.add('hidden');
    }, 3000);
  }
});

socket.on('leaderboard', (board) => {
  $leaderboardBody.innerHTML = '';
  if (board.length === 0) {
    $leaderboardBody.innerHTML = '<tr><td colspan="5" style="color:var(--text-dim);font-style:italic">No games played yet</td></tr>';
    return;
  }
  board.forEach((p, i) => {
    const row = document.createElement('tr');
    const medal = i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}`;
    const streak = p.streak > 0 ? `${p.streak} \u{1F525}` : '-';
    row.innerHTML = `
      <td>${medal}</td>
      <td style="font-weight:600">${escapeHtml(p.name)}</td>
      <td style="color:var(--win);font-weight:700">${p.wins}</td>
      <td style="color:var(--lose)">${p.losses}</td>
      <td>${streak}</td>
    `;
    $leaderboardBody.appendChild(row);
  });
});

socket.on('error', ({ message }) => {
  console.error('Server error:', message);
});

// ── Utilities ──────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
