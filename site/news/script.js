const announcements = [
  {
    id: 'notifications-channel-introduction',
    hideScrollbar: true,
    title: 'Welcome to Notifications!',
    heading: 'Welcome to Notifications!',
    paragraphs: [
      "This is where I'll be posting all news, updates, upcoming features, and announcements about slushreeisawesome.lol!",
      "Make sure to check here every once in a while to see what's new and what's coming to my website!",
    ],
  },
  {
    id: 'friend-list-launch',
    hideScrollbar: true,
    title: 'Friend List is live!',
    paragraphs: [
      'I added a friend list to slushreeisawesome.lol! You can find it by clicking the orange smiley face icon on the About Me page.',
      "You can see which of my friends are online and what they're playing. You can also hover over my friends to see their custom status if they have one!",
      'Thanks for visiting my website!!',
    ],
  },
];

const readKey = 'news:read';
let readIds = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(readKey));
  if (Array.isArray(saved)) readIds = new Set(saved);
} catch {
  // Reading still works when browser storage is disabled.
}

const channel = document.querySelector('.channel');
const inbox = document.querySelector('.inbox');
const reader = document.querySelector('.reader');
const list = document.querySelector('#notices');
const template = document.querySelector('#notice-template');
const inboxScroll = document.querySelector('.inbox-scroll');
const readerScroll = document.querySelector('.reader-scroll');
const scrollbar = document.querySelector('.scrollbar');
const grip = document.querySelector('.scroll-grip');
const close = document.querySelector('.close');
const back = document.querySelector('.back');
const previous = document.querySelector('.previous');
const next = document.querySelector('.next');
const launch = document.querySelector('.launch-screen');
const embedded = window.parent !== window && new URLSearchParams(location.search).has('embedded');
let scroller = inboxScroll;
let selectedIndex = -1;
const noticeButtons = [];
let drag;

async function dismissLaunch() {
  await Promise.allSettled([
    document.fonts.ready,
    launch.querySelector('img').decode(),
    new Promise(resolve => setTimeout(resolve, 1050)),
  ]);
  launch.classList.add('leaving');
  await Promise.allSettled(launch.getAnimations().map(animation => animation.finished));
  launch.remove();
  channel.inert = false;
}

function updateUnreadCount() {
  document.querySelector('#unread-count').textContent =
    announcements.filter(({ id }) => !readIds.has(id)).length;
}

function openNotice(index) {
  const notice = announcements[index];
  if (!notice) return;
  selectedIndex = index;
  const button = noticeButtons[index];
  readIds.add(notice.id);
  try {
    localStorage.setItem(readKey, JSON.stringify([...readIds]));
  } catch {
    // Keep the read state for this visit.
  }
  button.removeAttribute('data-unread');
  button.setAttribute('aria-label', notice.title);
  updateUnreadCount();
  document.querySelector('#notice-title').textContent = notice.title;
  const content = notice.paragraphs.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  });
  if (notice.heading) {
    const heading = document.createElement('h3');
    heading.textContent = notice.heading;
    content.unshift(heading);
  }
  document.querySelector('#notice-body').replaceChildren(...content);
  previous.disabled = index === 0;
  next.disabled = index === announcements.length - 1;
  showReader(true);
}

function showReader(open) {
  inbox.hidden = close.hidden = open;
  reader.hidden = back.hidden = !open;
  channel.classList.toggle('reading', open);
  scroller = open ? readerScroll : inboxScroll;
  if (open) {
    readerScroll.scrollTop = 0;
    readerScroll.focus({ preventScroll: true });
  } else {
    noticeButtons[selectedIndex]?.focus();
  }
  updateGrip();
}

for (const [index, notice] of announcements.entries()) {
  const item = template.content.cloneNode(true);
  const button = item.querySelector('button');
  const unread = !readIds.has(notice.id);
  item.querySelector('.notice-title').textContent = notice.title;
  button.toggleAttribute('data-unread', unread);
  button.setAttribute('aria-label', unread ? notice.title + ' (unread)' : notice.title);
  button.addEventListener('click', () => openNotice(index));
  noticeButtons.push(button);
  list.append(item);
}
updateUnreadCount();

back.addEventListener('click', () => showReader(false));
channel.addEventListener('pointermove', () => channel.classList.remove('keyboard'));
previous.addEventListener('click', () => openNotice(selectedIndex - 1));
next.addEventListener('click', () => openNotice(selectedIndex + 1));
close.addEventListener('click', event => {
  if (!embedded) return;
  event.preventDefault();
  window.parent.postMessage('news:back', location.origin);
});
document.addEventListener('keydown', event => {
  if (channel.inert || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'Escape' || event.key.toLowerCase() === 'b') {
    event.preventDefault();
    if (reader.hidden) close.click();
    else showReader(false);
  } else if (reader.hidden && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
    channel.classList.add('keyboard');
    const current = noticeButtons.indexOf(document.activeElement);
    const target = current < 0 ? 0 : current + (event.key === 'ArrowUp' ? -1 : 1);
    event.preventDefault();
    noticeButtons[Math.max(0, Math.min(noticeButtons.length - 1, target))]?.focus();
  } else if (!reader.hidden && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const controls = [back, previous, next].filter(button => !button.disabled);
    const current = controls.indexOf(document.activeElement);
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    const target = current < 0 ? 0 : (current + step + controls.length) % controls.length;
    controls[target].focus({ preventScroll: true });
  }
});

function scrollRange() {
  return Math.max(0, scroller.scrollHeight - scroller.clientHeight);
}

function gripRange() {
  return Math.max(0, scrollbar.clientHeight - grip.offsetHeight);
}

function updateGrip() {
  const range = scrollRange();
  scrollbar.hidden = range <= 1 ||
    (scroller === readerScroll && announcements[selectedIndex]?.hideScrollbar === true);
  if (!scrollbar.hidden) scrollbar.hidden = gripRange() === 0;
  readerScroll.classList.toggle('scroll-locked', scroller === readerScroll && scrollbar.hidden);
  if (scrollbar.hidden) return;
  const travel = gripRange();
  const progress = Math.max(0, Math.min(1, scroller.scrollTop / range));
  grip.style.transform = `translateY(${progress * travel}px)`;
}

function dragGrip(event) {
  const travel = gripRange();
  if (!travel) return;
  const top = scrollbar.getBoundingClientRect().top;
  scroller.scrollTop = (event.clientY - top - drag.offset) / travel * scrollRange();
  updateGrip();
}

scrollbar.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !event.isPrimary || !gripRange()) return;
  const offset = event.target === grip
    ? event.clientY - grip.getBoundingClientRect().top
    : grip.offsetHeight / 2;
  drag = { id: event.pointerId, offset };
  scrollbar.setPointerCapture(event.pointerId);
  document.documentElement.classList.add('dragging');
  dragGrip(event);
});
scrollbar.addEventListener('pointermove', event => {
  if (event.pointerId === drag?.id) dragGrip(event);
});
scrollbar.addEventListener('lostpointercapture', () => {
  drag = null;
  document.documentElement.classList.remove('dragging');
});
scrollbar.addEventListener('wheel', event => {
  if (event.ctrlKey || scrollbar.hidden) return;
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
  scroller.scrollTop += event.deltaY * unit;
  updateGrip();
}, { passive: false });
for (const panel of [inboxScroll, readerScroll]) {
  panel.addEventListener('scroll', updateGrip, { passive: true });
}
const observer = new ResizeObserver(updateGrip);
for (const element of [channel, list, document.querySelector('.reader article')]) observer.observe(element);
updateGrip();
dismissLaunch();

if (!embedded) {
  const music = new Audio('wii-u-notifications-loop.wav');
  music.loop = true;
  music.volume = .65;
  function syncMusic() {
    if (document.hidden) music.pause();
    else music.play().catch(() => {});
  }
  document.addEventListener('pointerdown', syncMusic);
  document.addEventListener('keydown', syncMusic);
  document.addEventListener('visibilitychange', syncMusic);
  window.addEventListener('pagehide', () => music.pause());
  window.addEventListener('pageshow', syncMusic);
}
