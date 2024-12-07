let audioContext, placeSound, perfectSound;

export function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadSound('assets/plomp.mp3').then(buffer => (placeSound = buffer));
  loadSound('assets/wood-place.mp3').then(buffer => (perfectSound = buffer));
}

function loadSound(url) {
  return fetch(url)
    .then(res => res.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data));
}

export function playPlaceSound() {
  playSound(placeSound, 0.1);
}

export function playPerfectSound() {
  playSound(perfectSound, 0.7, 2);
}

function playSound(buffer, gainValue, playbackRate = 1) {
  if (buffer) {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gainNode.gain.value = gainValue;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start();
  }
}