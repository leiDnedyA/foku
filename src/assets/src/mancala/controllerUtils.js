
const positionsFromPlayerOnePerspective = [
  [13, 1],
  [12, 2],
  [11, 3],
];

const positionsFromPlayerTwoPerspective = [
  [6, 8],
  [5, 9],
  [4, 10],
];

/**
 * @param turn {0 | 1} - The currently active player's ID
 * @param position {number} - The current position of the cursor
 * @param direction {'up' | 'down' | 'left' | 'right'} - The direction to move
 * @returns {number} - New position index
 * */
export function moveCursorInDirection(turn, position, direction) {
  const spacesFromPerspective = turn === 0 ?
    positionsFromPlayerOnePerspective :
    positionsFromPlayerTwoPerspective;

  const y = spacesFromPerspective.findIndex(row => row.includes(position));
  if (y === -1) throw new Error("Y position not in player's available space map.");
  const x = spacesFromPerspective[y].findIndex(pos => pos === position);
  if (x === -1) throw new Error("X position not in player's available space map.");

  switch (direction) {
    case "down": {
      const wrappedY = y - 1 < 0 ? spacesFromPerspective.length - 1 : y - 1
      return spacesFromPerspective[wrappedY][x];
    }
    case "up": {
      const wrappedY = (y + 1) % spacesFromPerspective.length;
      return spacesFromPerspective[wrappedY][x];
    }
    case "left": {
      if (x === 0) return spacesFromPerspective[y].at(-1);
      return spacesFromPerspective[y][x - 1];
    }
    case "right": {
      return spacesFromPerspective[y][(x + 1) % spacesFromPerspective[y].length];
    }
  }
}
