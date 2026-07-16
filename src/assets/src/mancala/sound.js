
export function playSound(fileName) {
  const audio = new Audio('host/sounds/' + fileName);
  audio.loop = false;
  audio.play();
  return audio;
}

export function stopSound(audio) {
  audio?.pause();
}
