const startup = document.querySelector('#startup');
const backgroundVideo = document.querySelector('#background-video');

const firstVisit = !localStorage.getItem('slushree-jingle-played');
const introSound = new Audio(
  firstVisit ? 'assets/transfer-complete.mp3' : 'assets/startup.mp3'
);
const mainMusic = new Audio('assets/main-music.mp3');
const hoverSound = new Audio('assets/hover-sound.wav');
const clickSound = new Audio('assets/click-sound.wav');

let startupFinished = false;
let introFinished = false;

introSound.preload = 'auto';
mainMusic.loop = true;
mainMusic.preload = 'auto';
hoverSound.preload = 'auto';
clickSound.preload = 'auto';

if (firstVisit) {
  localStorage.setItem('slushree-jingle-played', 'true');
}

function playAudio(audio) {
  audio.play().catch(() => {});
}

function startMainMusic() {
  if (introFinished) playAudio(mainMusic);
}

backgroundVideo.addEventListener('loadedmetadata', () => {
  backgroundVideo.currentTime = 2;
  playAudio(backgroundVideo);
});

backgroundVideo.addEventListener('timeupdate', () => {
  if (backgroundVideo.currentTime >= 598) {
    backgroundVideo.currentTime = 2;
  }
});

introSound.addEventListener('ended', () => {
  introFinished = true;
  if (firstVisit) startMainMusic();
});

function finishStartup() {
  if (startupFinished) return;

  startupFinished = true;

  if (!firstVisit) {
    introSound.pause();
    introSound.currentTime = 0;
    introFinished = true;
    startMainMusic();
  }

  startup.classList.add('startup-leaving');
  setTimeout(() => startup.remove(), 500);
}

playAudio(introSound);
setTimeout(finishStartup, 5000);

document.addEventListener('pointerdown', () => {
  if (!startupFinished && introSound.paused) {
    playAudio(introSound);
  }

  if (startupFinished && introFinished && mainMusic.paused) {
    playAudio(mainMusic);
  }
}, { once: false });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    mainMusic.pause();
  } else if (startupFinished && introFinished) {
    playAudio(mainMusic);
  }
});

document.querySelectorAll('a[href]:not([href="#"])').forEach((link) => {
  link.addEventListener('click', () => {
    clickSound.currentTime = 0;
    playAudio(clickSound);
  });
});

document.querySelectorAll('.social-links a').forEach((link) => {
  link.addEventListener('pointerenter', () => {
    hoverSound.currentTime = 0;
    playAudio(hoverSound);
  });

  link.addEventListener('pointerleave', () => {
    hoverSound.pause();
    hoverSound.currentTime = 0;
  });
});
