
export function playSound(fileName) {
  const music = new Audio('host/sounds/' + fileName);
  music.loop = false;
  music.play();
}
