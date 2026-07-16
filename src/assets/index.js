import { moveCursorInDirection } from './src/mancala/controllerUtils.js';
import {
  BASE_BOARD_STATE,
  getNextBoardState,
  PLAYERS,
  sideEmpty,
  sweepRemaining
} from './src/mancala/core.js';
import { createRenderer3D } from './src/mancala/render3d.js';
import { playSound } from './src/mancala/sound.js';

const status = document.getElementById('status');
const turnDisplay = document.getElementById('turn');
const messageDisplay = document.getElementById('message');
const qrCode = document.getElementById('qr-code');

const PLAYER_NAMES = ['Player 1', 'Player 2'];
const PLAYER_COLORS = ['#ff0000', '#0000ff'];
const SOW_STEP_MS = 450;

const renderer3d = createRenderer3D(document.getElementById('scene'));

// --- Game state ---
let board = [...BASE_BOARD_STATE];
let turn = 0;
let selected = null;
let sowing = false;
let gameOver = false;

// controllerId -> player (0 or 1)
const assignments = new Map();

function assignedPlayerCount() {
  return new Set(assignments.values()).size;
}

function firstNonEmptyPit(player) {
  return PLAYERS[player].pits.find(index => board[index] > 0) ?? null;
}

function updateSelection(direction) {
  const pits = PLAYERS[turn].pits;
  const availablePits = pits.filter(pit => board[pit] !== 0);
  if (selected === null) selected = pits[0];
  const prevSelected = selected;
  do {
    selected = moveCursorInDirection(turn, selected, direction);
  } while (!availablePits.includes(selected));
  if (prevSelected !== selected) playSound('pop.mp3')
}

function updateHud() {
  if (gameOver) {
    turnDisplay.textContent = '';
    return;
  }
}

function draw() {
  renderer3d.render(board, sowing || gameOver ? null : selected, turn, PLAYER_COLORS[turn] ?? null);
  updateHud();
}

function resetGame() {
  board = [...BASE_BOARD_STATE];
  turn = 0;
  gameOver = false;
  sowing = false;
  selected = firstNonEmptyPit(turn);
  messageDisplay.textContent = '';
  draw();
}

function endGame() {
  board = sweepRemaining(board);
  gameOver = true;
  const [p1, p2] = [board[PLAYERS[0].pot], board[PLAYERS[1].pot]];
  const verdict =
    p1 === p2
      ? "It's a tie!"
      : `${PLAYER_NAMES[p1 > p2 ? 0 : 1]} wins ${Math.max(p1, p2)}–${Math.min(p1, p2)}!`;
  messageDisplay.textContent = `${verdict} Press OK to play again.`;
  draw();
}

async function playMove() {
  if (selected === null || board[selected] === 0) return;
  sowing = true;
  messageDisplay.textContent = '';
  draw();

  const opponentPot = PLAYERS[1 - turn].pot;
  const result = await getNextBoardState(
    board,
    selected,
    async (state, index, handCount) => {
      renderer3d.render(state, index, turn, PLAYER_COLORS[turn] ?? null);

      // messageDisplay.textContent = `${handCount} in hand.`;
      await new Promise(resolve => setTimeout(resolve, SOW_STEP_MS));
    },
    opponentPot
  );

  board = result.nextState;
  sowing = false;

  if (sideEmpty(board, 0) || sideEmpty(board, 1)) {
    endGame();
    return;
  }

  if (result.canGoAgain) {
    messageDisplay.textContent = `${PLAYER_NAMES[turn]} goes again!`;
  } else {
    turn = 1 - turn;
  }
  selected = firstNonEmptyPit(turn);
  draw();
}

function controllerForPlayer(player) {
  for (const [controllerId, assigned] of assignments) {
    if (assigned === player) return controllerId;
  }
  return null;
}

function handlePress(controllerId, direction) {
  // Assign unknown controllers to the first free player slot.
  if (!assignments.has(controllerId)) {
    const free = [0, 1].find(player => controllerForPlayer(player) === null);
    if (free === undefined) return; // spectators can't play
    assignments.set(controllerId, free);
    updateStatus();
  }

  if (sowing) return;

  if (gameOver) {
    if (direction === 'ok') resetGame();
    return;
  }

  // Enforce turns once both players have a controller. With a single
  // controller connected it drives both players (pass-and-play).
  if (assignedPlayerCount() >= 2 && assignments.get(controllerId) !== turn) {
    messageDisplay.textContent = `Not your turn — waiting on ${PLAYER_NAMES[turn]}.`;
    return;
  }

  if (direction === 'ok') {
    playMove();
    return;
  } else {
    updateSelection(direction);
  }
  draw();
}

let currStatusTimeout = null;
const STATUS_TEXT_DURATION_MS = 5_000;
function updateStatus() {
  const players = assignedPlayerCount();
  if (currStatusTimeout !== null) {
    clearTimeout(currStatusTimeout);
  }
  if (players === 0) {
    status.textContent = 'Scan the QR code to join.';
    qrCode.style.setProperty('visibility', '')
  } else if (players === 1) {
    status.textContent = '1 controller connected (driving both players). Scan to join as Player 2.';
  } else if (players === 2) {
    status.textContent = 'Both players connected.'; 
  }

  qrCode.style.setProperty(
    'visibility', players >= 2 ? 'hidden' : 'visible' );

  currStatusTimeout = setTimeout(() => {
    status.textContent = '';
  }, STATUS_TEXT_DURATION_MS);
}

function connect() {
  const ws = new WebSocket('ws://' + location.host + '/ws?role=host');
  ws.onopen = () => updateStatus();
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'press' && msg.controllerId) {
        handlePress(msg.controllerId, msg.direction);
      }
      if (msg.type === 'controller-left' && assignments.has(msg.controllerId)) {
        assignments.delete(msg.controllerId);
        updateStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };
  ws.onclose = () => {
    status.textContent = 'Disconnected. Reconnecting...';
    setTimeout(connect, 1000);
  };
}

resetGame();
connect();
