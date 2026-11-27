const startup = document.querySelector('#startup');
const backgroundVideo = document.querySelector('#background-video');

const firstVisit = !localStorage.getItem('slushree-jingle-played');
const introSound = new Audio(
  firstVisit ? 'assets/transfer-complete.mp3' : 'assets/startup.mp3'
);
const mainMusic = new Audio('assets/main-music.mp3');
const friendsMusic = new Audio('superhiddenlink/assets/BGM_FRD.mp3');
friendsMusic.loop = true;
friendsMusic.volume = .65;
let friendsFrame = null;
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
  if (document.hidden && audio !== backgroundVideo) return;
  audio.play().catch(() => {});
}

function startMainMusic() {
  if (introFinished && !friendsFrame) playAudio(mainMusic);
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

const returningFromFriends = location.pathname.includes('/superhiddenlink/') &&
  new URLSearchParams(location.search).get('from') === 'friends';
if (returningFromFriends) {
  const cleanUrl = new URL(location.href);
  cleanUrl.searchParams.delete('from');
  history.replaceState(history.state, '', cleanUrl);
  startupFinished = introFinished = true;
  startup.remove();
  startMainMusic();
} else {
  playAudio(introSound);
  setTimeout(finishStartup, 5000);
}

document.addEventListener('pointerdown', () => {
  if (friendsFrame) return;
  if (!startupFinished && introSound.paused) {
    playAudio(introSound);
  }

  if (startupFinished && introFinished && mainMusic.paused) {
    playAudio(mainMusic);
  }
}, { once: false });

function pauseSound() {
  [introSound, mainMusic, clickSound, hoverSound, friendsMusic].forEach(audio => audio.pause());
}

function resumeMusic() {
  playAudio(friendsFrame ? friendsMusic : introFinished ? mainMusic : introSound);
}

const friendsLink = document.querySelector('.friends-launch');
friendsLink.addEventListener('click', event => {
  if (location.protocol === 'file:' || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (friendsFrame) return;
  pauseSound();
  playAudio(friendsMusic);
  const url = new URL(friendsLink.href);
  url.searchParams.set('embedded', '1');
  friendsFrame = document.createElement('iframe');
  friendsFrame.title = 'Friends List';
  friendsFrame.className = 'friends-frame';
  friendsFrame.src = url.href;
  document.body.append(friendsFrame);
  document.querySelector('.page-shell').inert = true;
  friendsFrame.focus();
});

window.addEventListener('message', event => {
  if (!friendsFrame || event.source !== friendsFrame.contentWindow ||
      event.origin !== location.origin || event.data !== 'friends:back') return;
  friendsFrame.remove();
  friendsFrame = null;
  friendsMusic.pause();
  document.querySelector('.page-shell').inert = false;
  friendsLink.focus({ preventScroll: true });
  resumeMusic();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseSound();
  else resumeMusic();
});
window.addEventListener('pagehide', pauseSound);
window.addEventListener('pageshow', event => {
  if (event.persisted) resumeMusic();
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
