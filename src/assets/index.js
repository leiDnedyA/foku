import { asciiDrawMancalaBoard, BASE_BOARD_STATE, getNextBoardState } from './src/mancala/core.js';
const status = document.getElementById('status');
const lastPress = document.getElementById('last-press');
const arrows = { up: '\\u2191', down: '\\u2193', left: '\\u2190', right: '\\u2192' };

function connect() {
  const ws = new WebSocket('ws://' + location.host + '/ws?role=host');
  ws.onopen = () => { status.textContent = 'Connected. Waiting for input...'; };
  let currMancalaBoard = BASE_BOARD_STATE;
  ws.onmessage = (event) => {
    try {
const msg = JSON.parse(event.data);
      const boardElement = document.querySelector("#board");
      console.log(currMancalaBoard)
      boardElement.innerText = asciiDrawMancalaBoard(currMancalaBoard);
      console.log(asciiDrawMancalaBoard(currMancalaBoard))
      if (msg.type === 'press' && msg.direction in arrows) {
        lastPress.textContent = arrows[msg.direction] + ' ' + msg.direction;
        if (msg.direction === 'up') {
          currMancalaBoard = getNextBoardState(currMancalaBoard, 1).nextState;
        }
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
connect();

