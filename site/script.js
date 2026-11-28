const startup = document.querySelector('#startup');
const backgroundVideo = document.querySelector('#background-video');

const introSound = new Audio('assets/startup.mp3');
const mainMusic = new Audio('assets/main-music.mp3');
const friendsMusic = new Audio('site/assets/wii-u-friend-list-loop.wav');
friendsMusic.loop = true;
friendsMusic.volume = .65;
const newsMusic = new Audio('site/news/wii-u-notifications-loop.wav');
newsMusic.loop = true;
newsMusic.volume = .65;
let openChannel = null;
const hoverSound = new Audio('assets/hover-sound.wav');
const clickSound = new Audio('assets/click-sound.wav');

let startupFinished = false;
let introFinished = false;

introSound.preload = 'auto';
mainMusic.loop = true;
mainMusic.preload = 'auto';
hoverSound.preload = 'auto';
clickSound.preload = 'auto';

function playAudio(audio) {
  if (document.hidden && audio !== backgroundVideo) return;
  audio.play().catch(() => {});
}

function startMainMusic() {
  if (introFinished && !openChannel) playAudio(mainMusic);
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
});

function finishStartup() {
  if (startupFinished) return;

  startupFinished = true;

  introSound.pause();
  introSound.currentTime = 0;
  introFinished = true;
  startMainMusic();

  startup.classList.add('startup-leaving');
  setTimeout(() => startup.remove(), 500);
}

const returningFromFriends = new URLSearchParams(location.search).get('from') === 'friends';
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
  if (openChannel) return;
  if (!startupFinished && introSound.paused) {
    playAudio(introSound);
  }

  if (startupFinished && introFinished && mainMusic.paused) {
    playAudio(mainMusic);
  }
}, { once: false });

function pauseSound() {
  [introSound, mainMusic, clickSound, hoverSound, friendsMusic, newsMusic].forEach(audio => audio.pause());
}

function resumeMusic() {
  playAudio(openChannel?.music ?? (introFinished ? mainMusic : introSound));
}

const pageShell = document.querySelector('.page-shell');
function registerChannel(selector, title, music, closeMessage) {
  const link = document.querySelector(selector);
  link.addEventListener('click', event => {
    if (location.protocol === 'file:' || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (openChannel) return;
    pauseSound();
    playAudio(music);
    const url = new URL(link.href);
    url.searchParams.set('embedded', '1');
    const frame = document.createElement('iframe');
    frame.title = title;
    frame.className = 'friends-frame';
    frame.src = url.href;
    openChannel = { frame, link, music, closeMessage };
    pageShell.inert = true;
    document.body.append(frame);
    frame.focus();
  });
}
registerChannel('.friends-launch', 'Friends List', friendsMusic, 'friends:back');
registerChannel('.news-launch', 'News', newsMusic, 'news:back');

window.addEventListener('message', event => {
  if (!openChannel || event.source !== openChannel.frame.contentWindow ||
      event.origin !== location.origin || event.data !== openChannel.closeMessage) return;
  const { frame, music, link } = openChannel;
  openChannel = null;
  frame.remove();
  music.pause();
  pageShell.inert = false;
  link.focus({ preventScroll: true });
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
