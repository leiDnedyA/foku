const LOG_BOARD_STATE = false;

/* Mancala board game state map:
  ______
 /  0   \
| 1   13 |
|        |
| 2   12 |
|        |
| 3   11 |
|        |
| 4   10 |
|        |
| 5   9  |
|        |
| 6   8  |
 \  7   /
  ------
*/

export const BASE_BOARD_STATE = [
  0, // Player 1 pot
  4,
  4,
  4,
  4,
  4,
  4,
  0, // Player 2 pot
  4,
  4,
  4,
  4,
  4,
  4
];

function isInPot(index) {
  return index === 0 || index === 7;
}

/**
 * Player definitions. Each player owns one pot and the six pits
 * that sow towards it (see board map above).
 */
export const PLAYERS = [
  { pot: 0, pits: [1, 2, 3, 13, 12, 11] },
  { pot: 7, pits: [4, 5, 6, 10, 9, 8] },
];

/** @returns {number | null} the player owning the given pit index, or null for pots */
export function playerForPit(index) {
  for (let player = 0; player < PLAYERS.length; player++) {
    if (PLAYERS[player].pits.includes(index)) return player;
  }
  return null;
}

/** @returns {boolean} true when all of the given player's pits are empty */
export function sideEmpty(state, player) {
  return PLAYERS[player].pits.every(index => state[index] === 0);
}

/**
 * Moves every stone left in each player's pits into that player's pot.
 * @returns {number[]} the swept board state
 */
export function sweepRemaining(state) {
  const nextState = [...state];
  for (const { pot, pits } of PLAYERS) {
    for (const index of pits) {
      nextState[pot] += nextState[index];
      nextState[index] = 0;
    }
  }
  return nextState;
}

/**
 * @param currState
 * @param moveStartIndex
 * @param renderBoard optional async callback invoked with each intermediate state
 * @param skipIndex optional board index to skip while sowing (the opponent's pot)
 * @returns Promise<{{ canGoAgain: boolean; nextState: BoardState; finalIdx: number }}>
 * */
export async function getNextBoardState(currState, moveStartIndex, renderBoard, skipIndex = null) {
  let nextState = [...currState];
  if (isInPot(moveStartIndex)) {
    throw new Error("Tried to move starting in pot.");
  }

  let currIndex = moveStartIndex;

  // pick up all stones in starting location
  let currHandCount = nextState[currIndex];
  if (currHandCount === 0) {
    throw new Error("Tried to move starting in empty space.");
  }
  nextState[currIndex] = 0; 

  while (true) {
    if (LOG_BOARD_STATE) {
      console.log({currHandCount, currIndex})
      console.log(asciiDrawMancalaBoard(nextState))
    }
    if (renderBoard) {
      await renderBoard(nextState, currIndex);
    }
    // drop a stone
    currHandCount--;
    currIndex = (currIndex + 1) % BASE_BOARD_STATE.length;
    if (currIndex === skipIndex) {
      currIndex = (currIndex + 1) % BASE_BOARD_STATE.length;
    }
    const spaceCountAfterMove = ++nextState[currIndex];

    // if hand is empty
    if (currHandCount === 0) {
      // if in the pot, final state reached
      if (isInPot(currIndex)) {
        return { canGoAgain: true, nextState, finalIdx: currIndex }
      }

      // check if its the only stone in the space. if so, stop here
      if (spaceCountAfterMove === 1) {
        return { canGoAgain: false, nextState, finalIdx: currIndex };
      }

      // otherwise, continue
      currHandCount = spaceCountAfterMove;
      nextState[currIndex] = 0;
    }
  }

  
}

/**
 * @param {number[]} state
 * @param {number | null} selectedIndex
 * @returns {string}
 */
export function asciiDrawMancalaBoard(state, selectedIndex = null) {
  if (!Array.isArray(state) || state.length !== 14) {
    throw new Error("Board state must be an array of 14 numbers.");
  }

  if (
    selectedIndex !== null &&
    (!Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= state.length)
  ) {
    throw new Error("selectedIndex must be null or an integer from 0 to 13.");
  }

  const funkyDigits = {
    "0": "𝟘",
    "1": "𝟙",
    "2": "𝟚",
    "3": "𝟛",
    "4": "𝟜",
    "5": "𝟝",
    "6": "𝟞",
    "7": "𝟟",
    "8": "𝟠",
    "9": "𝟡",
    "-": "−",
  };

  const formatValue = (value, index) => {
    const stringValue = String(value);

    if (index !== selectedIndex) {
      return stringValue;
    }

    return [...stringValue]
      .map(character => ` ${funkyDigits[character]} ` ?? character)
      .join("");
  };

  const width = Math.max(
    2,
    ...state.map((value, index) => formatValue(value, index).length)
  );

  const cell = index =>
    formatValue(state[index], index).padStart(width, " ");

  return [
    `       ${"_".repeat(width * 2 + 6)}`,
    `      /${" ".repeat(width + 2)}${cell(0)}${" ".repeat(width + 2)}\\`,
    `     |${" ".repeat(width * 2 + 6)}|`,
    `     | ${cell(1)}  ${cell(13)} |`,
    `     | ${cell(2)}  ${cell(12)} |`,
    `     | ${cell(3)}  ${cell(11)} |`,
    `     | ${cell(4)}  ${cell(10)} |`,
    `     | ${cell(5)}  ${cell(9)} |`,
    `     | ${cell(6)}  ${cell(8)} |`,
    `     |${" ".repeat(width * 2 + 6)}|`,
    `      \\${" ".repeat(width + 2)}${cell(7)}${" ".repeat(width + 2)}/`,
    `       ${"-".repeat(width * 2 + 6)}`
  ].join("\n");
}
