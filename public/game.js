const socket = io();

// ── DOM Elements ───────────────────────────────────────────
const $playerCount = document.getElementById('player-count');
const $nameInput = document.getElementById('name-input');
const $btnJoin = document.getElementById('btn-join');
const $joinForm = document.getElementById('join-form');
const $lobby = document.getElementById('lobby');
const $playerName = document.getElementById('player-name');
const $btnFindMatch = document.getElementById('btn-find-match');
const $btnLeaderboard = document.getElementById('btn-leaderboard');
const $matchStatus = document.getElementById('match-status');
const $leaderboardPanel = document.getElementById('leaderboard-panel');
const $leaderboardBody = document.getElementById('leaderboard-body');
const $btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');

const $opponentName = document.getElementById('opponent-name');
const $roundNumber = document.getElementById('round-number');
const $scoreYou = document.getElementById('score-you');
const $scoreOpponent = document.getElementById('score-opponent');
const $gameStatus = document.getElementById('game-status');
const $choiceBtns = document.querySelectorAll('.choice-btn');

const $resultYourChoice = document.getElementById('result-your-choice');
const $resultOpponentChoice = document.getElementById('result-opponent-choice');
const $resultText = document.getElementById('result-text');
const $resultScoreYou = document.getElementById('result-score-you');
const $resultScoreOpponent = document.getElementById('result-score-opponent');
const $roundButtons = document.getElementById('round-buttons');
const $btnNextRound = document.getElementById('btn-next-round');
const $gameOverButtons = document.getElementById('game-over-buttons');
const $gameOverText = document.getElementById('game-over-text');
const $btnPlayAgain = document.getElementById('btn-play-again');
const $btnBackLobby = document.getElementById('btn-back-lobby');
const $rematchStatus = document.getElementById('rematch-status');

// ── State ──────────────────────────────────────────────────
let myName = '';
let isGameOver = false;

const choiceEmojis = {
  rock: '\u{1F44A}',
  paper: '\u{1F590}',
  scissors: '\u{270C}\u{FE0F}',
};

// ── Screen Management ──────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

// ── Join / Lobby ───────────────────────────────────────────
$btnJoin.addEventListener('click', () => {
  const name = $nameInput.value.trim();
  if (!name) return;
  myName = name;
  socket.emit('join', { name });
});

$nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $btnJoin.click();
});

$btnFindMatch.addEventListener('click', () => {
  socket.emit('find-match');
  $btnFindMatch.classList.add('hidden');
  $btnLeaderboard.classList.add('hidden');
  $matchStatus.classList.remove('hidden');
  $matchStatus.textContent = 'Searching for opponent...';
});

$btnLeaderboard.addEventListener('click', () => {
  socket.emit('get-leaderboard');
  $leaderboardPanel.classList.remove('hidden');
});

$btnCloseLeaderboard.addEventListener('click', () => {
  $leaderboardPanel.classList.add('hidden');
});

// ── Game ───────────────────────────────────────────────────
$choiceBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const choice = btn.dataset.choice;
    socket.emit('make-choice', { choice });

    // Visual feedback
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
  showScreen('game');
  resetGameUI();
});

$btnPlayAgain.addEventListener('click', () => {
  socket.emit('play-again');
  $btnPlayAgain.classList.add('hidden');
  $rematchStatus.classList.remove('hidden');
  $rematchStatus.textContent = 'Waiting for opponent to accept...';
});

$btnBackLobby.addEventListener('click', () => {
  socket.emit('leave-game');
  returnToLobby();
});

// ── Helpers ────────────────────────────────────────────────
function resetGameUI() {
  $choiceBtns.forEach(b => {
    b.classList.remove('selected', 'disabled');
  });
  $gameStatus.textContent = 'Make your choice!';
}

function returnToLobby() {
  isGameOver = false;
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
  isGameOver = false;
  $opponentName.textContent = opponent;
  $roundNumber.textContent = '1';
  $scoreYou.textContent = '0';
  $scoreOpponent.textContent = '0';
  showScreen('game');
  resetGameUI();
});

socket.on('opponent-chose', () => {
  $gameStatus.textContent = 'Opponent has chosen!';
});

socket.on('round-result', ({ yourChoice, opponentChoice, result, scores, round }) => {
  // Show result screen
  showScreen('result');

  $resultYourChoice.textContent = choiceEmojis[yourChoice];
  $resultOpponentChoice.textContent = choiceEmojis[opponentChoice];

  $resultText.className = 'result-text';
  if (result === 'win') {
    $resultText.textContent = 'You Win!';
    $resultText.classList.add('win');
  } else if (result === 'lose') {
    $resultText.textContent = 'You Lose!';
    $resultText.classList.add('lose');
  } else {
    $resultText.textContent = 'Draw!';
    $resultText.classList.add('draw');
  }

  $resultScoreYou.textContent = scores.you;
  $resultScoreOpponent.textContent = scores.opponent;

  // Update game screen scores for next round
  $scoreYou.textContent = scores.you;
  $scoreOpponent.textContent = scores.opponent;
  $roundNumber.textContent = round + 1;

  // Show next-round button (game-over event will override if match is done)
  $roundButtons.classList.remove('hidden');
  $gameOverButtons.classList.add('hidden');
});

socket.on('game-over', ({ result, finalScores }) => {
  isGameOver = true;

  // Hide round buttons, show game-over buttons
  $roundButtons.classList.add('hidden');
  $gameOverButtons.classList.remove('hidden');
  $btnPlayAgain.classList.remove('hidden');
  $rematchStatus.classList.add('hidden');

  $gameOverText.className = 'game-over-text';
  if (result === 'win') {
    $gameOverText.textContent = 'VICTORY!';
    $gameOverText.classList.add('win');
  } else {
    $gameOverText.textContent = 'DEFEAT';
    $gameOverText.classList.add('lose');
  }

  $resultScoreYou.textContent = finalScores.you;
  $resultScoreOpponent.textContent = finalScores.opponent;
});

socket.on('opponent-wants-rematch', () => {
  $rematchStatus.classList.remove('hidden');
  $rematchStatus.textContent = 'Opponent wants a rematch!';
});

socket.on('rematch-start', () => {
  isGameOver = false;
  $roundNumber.textContent = '1';
  $scoreYou.textContent = '0';
  $scoreOpponent.textContent = '0';
  showScreen('game');
  resetGameUI();
});

socket.on('opponent-left', () => {
  if (isGameOver) {
    $rematchStatus.classList.remove('hidden');
    $rematchStatus.textContent = 'Opponent left the game.';
    $btnPlayAgain.classList.add('hidden');
  } else {
    alert('Opponent disconnected!');
    returnToLobby();
  }
});

socket.on('leaderboard', (board) => {
  $leaderboardBody.innerHTML = '';
  if (board.length === 0) {
    $leaderboardBody.innerHTML = '<tr><td colspan="5" style="color:var(--text-dim)">No games played yet</td></tr>';
    return;
  }
  board.forEach((p, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${i + 1}</td><td>${p.name}</td><td style="color:var(--win)">${p.wins}</td><td style="color:var(--lose)">${p.losses}</td><td>${p.streak > 0 ? p.streak + ' \u{1F525}' : '-'}</td>`;
    $leaderboardBody.appendChild(row);
  });
});

socket.on('error', ({ message }) => {
  alert(message);
});
