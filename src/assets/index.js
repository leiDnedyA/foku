import { asciiDrawMancalaBoard, BASE_BOARD_STATE, getNextBoardState } from './src/mancala/core.js';
const status = document.getElementById('status');
const lastPress = document.getElementById('last-press');
const arrows = { up: '\\u2191', down: '\\u2193', left: '\\u2190', right: '\\u2192' };

const boardElement = document.querySelector("#board");
function renderBoard(currMancalaBoard, selectedMancalaIdx) {
  boardElement.innerText = asciiDrawMancalaBoard(currMancalaBoard, selectedMancalaIdx);
}

function connect() {
  const ws = new WebSocket('ws://' + location.host + '/ws?role=host');
  ws.onopen = () => { status.textContent = 'Connected. Waiting for input...'; };
  let currMancalaBoard = BASE_BOARD_STATE;
  let selectedMancalaIdx = 1;
  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'press' && msg.direction in arrows) {
        lastPress.textContent = arrows[msg.direction] + ' ' + msg.direction;
        if (msg.direction === 'down') selectedMancalaIdx = (selectedMancalaIdx + 1) % BASE_BOARD_STATE.length;
        if (msg.direction === 'up') selectedMancalaIdx = ((selectedMancalaIdx - 1) + BASE_BOARD_STATE.length) % BASE_BOARD_STATE.length;
      }
      if (msg.type === 'press' && msg.direction === 'ok') {
        const result = (await getNextBoardState(currMancalaBoard, selectedMancalaIdx, async (state, idx) => {
          renderBoard(state, idx);
          await new Promise((res, _) => { setTimeout(() => { res() }, 500) });
        }));
        currMancalaBoard = result.nextState;
        selectedMancalaIdx = result.finalIdx;
      }

      console.log(currMancalaBoard)
      console.log(asciiDrawMancalaBoard(currMancalaBoard, selectedMancalaIdx))

      renderBoard(currMancalaBoard, selectedMancalaIdx);

    } catch (e) {
      console.error(e);
    }
  };
  ws.onclose = () => {
    status.textContent = 'Disconnected. Reconnecting...';
    setTimeout(connect, 1000);
  };
}
connect();

