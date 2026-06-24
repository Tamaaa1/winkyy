// ═══════════════════════════════════════════════════════
// BACKGROUND MUSIC
// ═══════════════════════════════════════════════════════
const bgMusic = new Audio('music/Mikroskosmos.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;
let musicStarted = false; // track apakah user sudah pernah play

function startMusic() {
  if (musicStarted) return;
  musicStarted = true;
  bgMusic.load();
  bgMusic.play().catch(() => {});
}

// Fix: bfcache — saat halaman di-restore (back/forward di mobile),
// browser suspend audio. Cek musicStarted bukan bgMusic.paused
// karena browser SUDAH meng-pause duluan saat restore bfcache.
window.addEventListener('pageshow', (e) => {
  if (e.persisted && musicStarted) {
    bgMusic.play().catch(() => {});
  }
});

// Fix: tab di-background lalu dibuka lagi
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && musicStarted) {
    bgMusic.play().catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════
// CUSTOMIZE THESE VALUES
// ═══════════════════════════════════════════════════════
const CONFIG = {
  bestieName: "Winky",         // ← Nama bestie-mu
  makerName:  "Wirawrr",           // ← Namamu
  messages: [
    "Happy birthday, Winky! Nambah umur nih, semoga makin dewasa dan kurang-kurangin hopeless romanticnya wkwkwkwwk.",
    "Makasih ya udah jadi temen yang asik buat diajak ngobrol dan selalu nyambung.",
    "Semoga tahun ini lu makin sukses, kuliahnya lancar, dan semua yang lu targetin bisa kecapai aamiin.",
    "Kalo ada apa-apa soal lelaki lelaki itu, tau kan gue bakal selalu ada... buat ngetawain lu duluan, wkwkwkwk.",
    "Enjoy your special day!"
  ],
  wishes: [
    "Stay healthy dan hepi terus! ✿",
    "Semoga semua mimpi-mimpi lu tercapai ya!",
    "Semoga rezekinya lancar terus!",
    "Tetap jadi diri lu yang keren!",
    "Semoga hidup ga hopeless romatic lg wkwkwkwk",
    "Panjang umur dan sehat selalu!",
    "Semoga yang baik datang untuk lu!",
    "Sukses selalu, Winky! ★"
  ]
};
// ═══════════════════════════════════════════════════════

document.getElementById('credits-bestie-name').textContent = CONFIG.bestieName;
document.getElementById('credits-maker-name').textContent = CONFIG.makerName;

// ─── AUDIO ───
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let soundEnabled = localStorage.getItem('gbSoundEnabled') !== 'false';

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new AudioCtx(); } catch(e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freqs, type='square', dur=0.08, vol=0.15) {
  if (!soundEnabled || !audioCtx) return;
  const arr = Array.isArray(freqs) ? freqs : [freqs];
  arr.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * dur * 0.8;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}

const SFX = {
  select:  () => playTone(440, 'square', 0.08),
  confirm: () => playTone([523, 659, 784], 'square', 0.1),
  back:    () => playTone(330, 'square', 0.1),
  bloom:   () => playTone([440, 523, 659], 'sine', 0.25),
  photo:   () => playTone([880, 440], 'square', 0.15),
  blow:    () => playTone([300, 200], 'sawtooth', 0.1),
  fanfare: () => playTone([523, 659, 784, 1047], 'square', 0.15),
  boot:    () => playTone([262, 330, 392, 523], 'square', 0.12)
};

// ─── SCREEN MANAGER ───
let currentScreen = 'boot';
let previousScreen = 'menu';

function showScreen(id, skipTransition = false) {
  const allScreens = document.querySelectorAll('.screen-content');
  const screenEl = document.getElementById('screen');

  if (!skipTransition) {
    screenEl.classList.add('wiping');
    setTimeout(() => screenEl.classList.remove('wiping'), 350);
  }

  setTimeout(() => {
    allScreens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) {
      target.classList.add('active');
      currentScreen = id;
    }
    pauseOverlay.classList.remove('active');
    onScreenEnter(id);
  }, skipTransition ? 0 : 160);
}

function onScreenEnter(id) {
  if (id === 'menu') {
    menuCursor = 0;
    renderMenu();
  }
  if (id === 'pesan') {
    dialogPage = 0;
    dialogCharIdx = 0;
    dialogTyping = true;
    dialogText.textContent = '';
    dialogIndicator.style.display = 'none';
    typewriterTick();
  }
  if (id === 'galeri') {
    galeriCursor = 0;
    renderGaleri();
  }
  if (id === 'photo') {
    initCamera();
  }
  if (id === 'lilin') {
    lilinBlown = 0;
    lilinFinished = false;
    document.getElementById('lilin-blown').textContent = '0';
    document.getElementById('lilin-bar').style.width = '0%';
    document.getElementById('lilin-hint').textContent = 'tekan A cepat-cepat!\nB: kembali';
    drawLilin();
  }
  if (id === 'bunga') {
    bungaWishBox.classList.remove('visible');
    bungaWishBox.textContent = '';
    drawBunga();
  }
  if (id === 'credits') {
    SFX.fanfare();
  }
}

// ─── PIXEL AVATAR (procedural, no image needed) ───
function drawPixelAvatar(canvas, seed) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  // simple procedural face
  const colors = ['#e87890','#d4a820','#4a6a3a','#3060c8','#d43050'];
  const skinColors = ['#f4c88a','#e8a870','#c47840','#a05820'];
  const c = colors[seed % colors.length];
  const skin = skinColors[seed % skinColors.length];

  const px = (x, y, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  };

  // body / hair
  for (let x = 2; x <= w-3; x++) {
    for (let y = 0; y <= 3; y++) px(x, y, c);
  }
  // face
  for (let x = 2; x <= w-3; x++) {
    for (let y = 4; y <= h-4; y++) px(x, y, skin);
  }
  // eyes
  px(4, 7, '#1a2a1a'); px(w-5, 7, '#1a2a1a');
  // smile
  px(4, h-5, '#1a2a1a'); px(5, h-4, '#1a2a1a');
  px(w-5, h-5, '#1a2a1a'); px(w-6, h-4, '#1a2a1a');
  // blush
  ctx.fillStyle = 'rgba(232,120,144,0.5)';
  ctx.fillRect(3, h-6, 2, 2);
  ctx.fillRect(w-5, h-6, 2, 2);
}

drawPixelAvatar(document.getElementById('avatar-menu'), 3);
drawPixelAvatar(document.getElementById('avatar-pesan'), 3);

// ─── GALERI IMAGES (loaded from foto/ folder) ───
// Images are loaded via <img> tags in HTML — no canvas drawing needed.


// ─── BOOT SCREEN ───
let bootReady = false;
const bootBar = document.getElementById('boot-bar');
const bootPct = document.getElementById('boot-pct');
const bootPress = document.getElementById('boot-press');

let pct = 0;
const bootInterval = setInterval(() => {
  pct += Math.random() * 12 + 3;
  if (pct >= 100) {
    pct = 100;
    clearInterval(bootInterval);
    bootReady = true;
    bootPress.style.opacity = '1';
    bootPress.style.animation = 'blink2 1s infinite';
    SFX.boot();
  }
  bootBar.style.width = Math.min(pct,100) + '%';
  bootPct.textContent = 'Loading... ' + Math.min(Math.floor(pct),100) + '%';
}, 100);

// ─── MENU ───
const menuItems = document.querySelectorAll('.menu-item');
const menuScreens = ['pesan','galeri','photo','lilin','bunga'];
let menuCursor = 0;

function renderMenu() {
  menuItems.forEach((item, i) => {
    const cursor = item.querySelector('.menu-cursor');
    if (i === menuCursor) {
      item.classList.add('selected');
      cursor.textContent = '►';
    } else {
      item.classList.remove('selected');
      cursor.textContent = ' ';
    }
  });
}

// ─── DIALOG / PESAN ───
const dialogBox = document.getElementById('dialog-box');
const dialogTextEl = document.getElementById('dialog-text');
const dialogCursor = document.getElementById('dialog-cursor');
const dialogIndicator = document.getElementById('dialog-indicator');
const dialogPageInfo = document.getElementById('dialog-page-info');

let dialogPage = 0;
let dialogCharIdx = 0;
let dialogTyping = false;
let dialogTimer = null;

function typewriterTick() {
  const msg = CONFIG.messages[dialogPage] || '';
  if (dialogCharIdx < msg.length) {
    dialogTextEl.textContent = msg.substring(0, dialogCharIdx + 1);
    dialogCharIdx++;
    dialogTimer = setTimeout(typewriterTick, 35);
    dialogCursor.style.display = 'inline';
    dialogIndicator.style.display = 'none';
  } else {
    dialogTyping = false;
    dialogCursor.style.display = 'none';
    if (dialogPage < CONFIG.messages.length - 1) {
      dialogIndicator.style.display = 'block';
    }
    dialogPageInfo.textContent = (dialogPage+1) + '/' + CONFIG.messages.length;
  }
}

function dialogAdvance() {
  if (dialogTyping) {
    // skip to end
    clearTimeout(dialogTimer);
    const msg = CONFIG.messages[dialogPage] || '';
    dialogTextEl.textContent = msg;
    dialogCharIdx = msg.length;
    dialogTyping = false;
    dialogCursor.style.display = 'none';
    if (dialogPage < CONFIG.messages.length - 1) {
      dialogIndicator.style.display = 'block';
    }
    dialogPageInfo.textContent = (dialogPage+1) + '/' + CONFIG.messages.length;
  } else {
    if (dialogPage < CONFIG.messages.length - 1) {
      dialogGoTo(dialogPage + 1);
      SFX.select();
    } else {
      // end of messages → go to credits
      SFX.confirm();
      showScreen('credits');
    }
  }
}

function dialogGoTo(page) {
  clearTimeout(dialogTimer);
  dialogPage = page;
  dialogCharIdx = 0;
  dialogTyping = true;
  dialogTextEl.textContent = '';
  dialogIndicator.style.display = 'none';
  dialogCursor.style.display = 'inline';
  typewriterTick();
}

// ─── GALERI ───
let galeriCursor = 0;
const galeriSlots = document.querySelectorAll('.galeri-slot');

function renderGaleri() {
  galeriSlots.forEach((slot, i) => {
    if (i === galeriCursor) slot.classList.add('selected');
    else slot.classList.remove('selected');
  });
}

function galeriView(idx) {
  const srcImg = document.getElementById('galeri-img-' + idx);
  if (!srcImg) { SFX.back(); return; }
  const viewImg = document.getElementById('galeri-view-img');
  viewImg.src = srcImg.src;
  viewImg.alt = srcImg.alt;
  document.getElementById('galeri-view-caption').textContent = CONFIG.galeriCaptions[idx] || '✿';
  previousScreen = 'galeri';
  showScreen('galeri-view');
  SFX.confirm();
}

// ─── PHOTOBOX ───
let currentFilter = 'none';
let currentFrame = 'photobox';
let photoTaken = false;

function initCamera() {
  const video = document.getElementById('photo-video');
  const canvas = document.getElementById('photo-canvas');
  photoTaken = false;
  document.getElementById('photo-result').classList.remove('visible');
  video.style.display = 'none';
  canvas.style.display = 'block';
  canvas.width = 120;
  canvas.height = 90;
  drawPixelScene(canvas, 0);
}

function stopCamera() {
  // camera no longer used
}

function applyFilter(ctx, w, h, filter) {
  if (filter === 'none') return;
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  if (filter === 'gbc') {
    const pal = [[15,56,15],[48,98,48],[139,172,15],[155,188,15]];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const gray = (r*0.299 + g*0.587 + b*0.114);
      const idx = Math.min(3, Math.floor(gray / 64));
      d[i]   = pal[idx][0];
      d[i+1] = pal[idx][1];
      d[i+2] = pal[idx][2];
    }
  } else if (filter === 'dmg') {
    const pal = [[15,56,15],[48,98,48],[139,172,15],[155,188,15]];
    for (let i = 0; i < d.length; i += 4) {
      const gray = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
      const idx = Math.min(3, Math.floor(gray / 64));
      d[i]   = pal[3-idx][0];
      d[i+1] = pal[3-idx][1];
      d[i+2] = pal[3-idx][2];
    }
  } else if (filter === 'bloom') {
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = Math.min(255, d[i]   * 0.7 + 70);
      d[i+1] = Math.min(255, d[i+1] * 0.5 + 30);
      d[i+2] = Math.min(255, d[i+2] * 0.6 + 40);
    }
    // pixel grid
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i+3] = Math.floor(d[i+3] * 0.6);
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

function drawFrame(ctx, w, h, frame) {
  const scale = Math.max(1, Math.round(Math.min(w, h) / 200));
  const pad = 16 * scale;
  const fullW = w + pad * 2;
  const fullH = h + pad * 2;

  const photoData = ctx.getImageData(0, 0, w, h);

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = fullW;
  tmpCanvas.height = fullH;
  const tmpCtx = tmpCanvas.getContext('2d');

  tmpCtx.fillStyle = '#faf8f2';
  tmpCtx.fillRect(0, 0, fullW, fullH);

  for (let i = 0; i < 800; i++) {
    tmpCtx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    tmpCtx.fillRect(Math.random() * fullW, Math.random() * fullH, 1, 1);
  }

  tmpCtx.fillStyle = 'rgba(0,0,0,0.06)';
  tmpCtx.fillRect(pad + 3 * scale, pad + 3 * scale, w, h);

  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = w;
  photoCanvas.height = h;
  photoCanvas.getContext('2d').putImageData(photoData, 0, 0);
  tmpCtx.drawImage(photoCanvas, pad, pad, w, h);

  if (frame === 'photobox') {
    tmpCtx.strokeStyle = '#9b2335';
    tmpCtx.lineWidth = 2 * scale;
    tmpCtx.strokeRect(pad - 1, pad - 1, w + 2, h + 2);

    const cornerColor = '#e87890';
    const cs = 4 * scale;
    [[pad, pad], [pad + w - cs, pad], [pad, pad + h - cs], [pad + w - cs, pad + h - cs]].forEach(([cx, cy]) => {
      tmpCtx.fillStyle = cornerColor;
      tmpCtx.fillRect(cx, cy, cs, cs);
    });

  } else if (frame === 'polaroid') {
    const bottomH = 36 * scale;
    tmpCtx.fillStyle = '#faf8f2';
    tmpCtx.fillRect(0, pad + h, fullW, bottomH);

    tmpCtx.strokeStyle = '#d0d0d0';
    tmpCtx.lineWidth = 1;
    tmpCtx.strokeRect(0.5, 0.5, fullW - 1, fullH - 1);

  } else if (frame === 'vintage') {
    tmpCtx.strokeStyle = '#6b1420';
    tmpCtx.lineWidth = 3 * scale;
    tmpCtx.strokeRect(4 * scale, 4 * scale, fullW - 8 * scale, fullH - 8 * scale);
    tmpCtx.strokeStyle = '#9b2335';
    tmpCtx.lineWidth = 1 * scale;
    tmpCtx.strokeRect(8 * scale, 8 * scale, fullW - 16 * scale, fullH - 16 * scale);

    tmpCtx.fillStyle = '#470d16';
    const holeW = 3 * scale, holeH = 5 * scale, holeGap = 10 * scale;
    for (let y = 12 * scale; y < fullH - 12 * scale; y += holeGap) {
      tmpCtx.fillRect(1, y, holeW, holeH);
      tmpCtx.fillRect(fullW - holeW - 1, y, holeW, holeH);
    }
  }

  ctx.canvas.width = fullW;
  ctx.canvas.height = fullH;
  ctx.drawImage(tmpCanvas, 0, 0);
}

async function takePhoto() {
  const countdown = document.getElementById('photo-countdown');
  const flash = document.getElementById('photo-flash');

  countdown.style.display = 'flex';
  for (let i = 3; i >= 1; i--) {
    countdown.textContent = i;
    SFX.select();
    await new Promise(r => setTimeout(r, 700));
  }
  countdown.style.display = 'none';

  // flash
  flash.style.opacity = '1';
  SFX.photo();
  await new Promise(r => setTimeout(r, 100));
  flash.style.opacity = '0';

  // load the birthday photo
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = 'foto/wink.jpeg';
  });

  const resultCanvas = document.getElementById('photo-result-canvas');
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  resultCanvas.width = srcW;
  resultCanvas.height = srcH;
  const ctx = resultCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, srcW, srcH);
  applyFilter(ctx, srcW, srcH, currentFilter);
  drawFrame(ctx, srcW, srcH, currentFrame);

  photoTaken = true;
  document.getElementById('photo-video').style.display = 'none';
  document.getElementById('photo-result').classList.add('visible');
}

document.getElementById('photo-save-btn').addEventListener('click', () => {
  const canvas = document.getElementById('photo-result-canvas');
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'birthday-photo.png';
    a.click();
    URL.revokeObjectURL(url);
  });
  SFX.confirm();
});

document.getElementById('photo-retry-btn').addEventListener('click', () => {
  photoTaken = false;
  document.getElementById('photo-result').classList.remove('visible');
  document.getElementById('photo-canvas').style.display = 'block';
  SFX.back();
});

document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    SFX.select();
  });
});

document.querySelectorAll('.frame-btn[data-frame]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.frame-btn[data-frame]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFrame = btn.dataset.frame;
    SFX.select();
  });
});

// ─── TIUP LILIN ───
let lilinBlown = 0;
let lilinFinished = false;
const LILIN_TOTAL = 10;

function drawLilin() {
  const canvas = document.getElementById('lilin-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);

  // cake base
  ctx.fillStyle = '#9b2335';   /* maroon cake */
  ctx.fillRect(w*0.1, h*0.55, w*0.8, h*0.35);
  ctx.fillStyle = '#6b1420';   /* dark maroon stripe */
  ctx.fillRect(w*0.1, h*0.65, w*0.8, h*0.05);

  // plate
  ctx.fillStyle = '#470d16';   /* darkest maroon plate */
  ctx.fillRect(w*0.05, h*0.88, w*0.9, h*0.08);

  // candles
  const cw = 6, ch = 20;
  const startX = w * 0.15;
  const spacing = (w * 0.7) / (LILIN_TOTAL - 1);

  for (let i = 0; i < LILIN_TOTAL; i++) {
    const x = startX + i * spacing - cw/2;
    const y = h * 0.55 - ch;
    const blown = i < lilinBlown;

    // candle body
    ctx.fillStyle = blown ? '#6b1420' : '#e87890'; /* blown=dark maroon, unblown=pink */
    ctx.fillRect(x, y, cw, ch);

    if (!blown) {
      // flame
      ctx.fillStyle = '#d4a820';
      ctx.fillRect(x+1, y-5, 4, 5);
      ctx.fillStyle = '#e87890';
      ctx.fillRect(x+2, y-7, 2, 2);
    } else {
      // smoke
      ctx.fillStyle = '#9b2335';
      ctx.fillRect(x+2, y-3, 2, 2);
    }
  }

  // "happy birthday" text
  ctx.fillStyle = '#1a2a1a';
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HAPPY BDAY!', w/2, h*0.75);
}

function blowCandle() {
  if (lilinFinished) return;
  if (lilinBlown < LILIN_TOTAL) {
    lilinBlown++;
    document.getElementById('lilin-blown').textContent = lilinBlown;
    document.getElementById('lilin-bar').style.width = (lilinBlown / LILIN_TOTAL * 100) + '%';
    SFX.blow();
    drawLilin();

    if (lilinBlown >= LILIN_TOTAL) {
      lilinFinished = true;
      document.getElementById('lilin-hint').textContent = 'START: continue\nB: kembali';
      document.getElementById('lilin-birthday-msg').classList.add('show');
      SFX.fanfare();
    }
  }
}

// ─── BUNGA ───
const FLOWER_COUNT = 8;
const WISHES = CONFIG.wishes;
let flowerStates = new Array(FLOWER_COUNT).fill(0); // 0-3 growth
let flowerWishIdx = 0;
let selectedFlower = 0;
const bungaWishBox = document.getElementById('bunga-wish');
const bungaCanvas = document.getElementById('bunga-canvas');
let bungaSwayAngle = 0;

function drawBunga() {
  const ctx = bungaCanvas.getContext('2d');
  const w = bungaCanvas.width;
  const h = bungaCanvas.height;
  ctx.clearRect(0,0,w,h);

  // sky
  ctx.fillStyle = '#c4d4a0';
  ctx.fillRect(0,0,w,h*0.7);

  // ground
  ctx.fillStyle = '#4a6a3a';
  ctx.fillRect(0,h*0.7,w,h*0.3);
  ctx.fillStyle = '#1a2a1a';
  ctx.fillRect(0,h*0.72,w,2);

  const slotW = w / FLOWER_COUNT;

  for (let i = 0; i < FLOWER_COUNT; i++) {
    const cx = slotW * i + slotW/2;
    const stage = flowerStates[i];
    const baseY = h * 0.72;
    const isSelected = i === selectedFlower;

    const sway = (isSelected && stage < 3) ? 0 : Math.sin(bungaSwayAngle + i) * 2;

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.rotate(sway * Math.PI / 180);

    if (stage === 0) {
      ctx.fillStyle = '#4a6a3a';
      ctx.fillRect(-1, -2, 2, 2);
    } else if (stage === 1) {
      ctx.fillStyle = '#4a6a3a';
      ctx.fillRect(-1, -16, 2, 16);
    } else if (stage === 2) {
      ctx.fillStyle = '#4a6a3a';
      ctx.fillRect(-1, -22, 2, 22);
      ctx.fillRect(-3, -18, 3, 4);
      ctx.fillStyle = '#e87890';
      ctx.fillRect(-3, -28, 6, 6);
    } else if (stage === 3) {
      ctx.fillStyle = '#4a6a3a';
      ctx.fillRect(-1, -28, 2, 28);
      ctx.fillRect(-4, -20, 4, 4);
      ctx.fillRect(1, -16, 4, 4);
      ctx.fillStyle = '#e87890';
      [[-4,-4],[4,-4],[0,-8],[0,0],[-4,0],[4,0]].forEach(([dx,dy]) => {
        ctx.fillRect(dx-2, -32+dy, 4, 4);
      });
      ctx.fillStyle = '#d4a820';
      ctx.fillRect(-2, -34, 4, 4);
    }

    if (isSelected && stage < 3) {
      ctx.fillStyle = '#d4a820';
      ctx.fillRect(-1, -h*0.7+4, 2, 4);
    }

    ctx.restore();
  }
}

let bungaAnimFrame = null;
function startBungaAnim() {
  function tick() {
    bungaSwayAngle += 0.03;
    if (currentScreen === 'bunga') {
      drawBunga();
      bungaAnimFrame = requestAnimationFrame(tick);
    }
  }
  if (bungaAnimFrame) cancelAnimationFrame(bungaAnimFrame);
  bungaAnimFrame = requestAnimationFrame(tick);
}

function growFlower() {
  if (currentScreen !== 'bunga') return;
  const f = selectedFlower;
  if (flowerStates[f] < 3) {
    flowerStates[f]++;
    SFX.bloom();
    drawBunga();
    if (flowerStates[f] === 3) {
      const wish = WISHES[flowerWishIdx % WISHES.length];
      flowerWishIdx++;
      bungaWishBox.textContent = '✿ ' + wish;
      bungaWishBox.classList.add('visible');
      // move to next unblown flower
      for (let i = 1; i <= FLOWER_COUNT; i++) {
        const next = (f + i) % FLOWER_COUNT;
        if (flowerStates[next] < 3) {
          selectedFlower = next;
          break;
        }
      }
      // check if all flowers bloomed
      if (flowerStates.every(s => s === 3)) {
        setTimeout(() => {
          bungaWishBox.textContent = '✿ Semua bunga mekar! ✿';
          bungaWishBox.classList.add('visible');
          SFX.fanfare();
        }, 600);
      }
    }
  } else {
    // bunga sudah penuh — kalau SEMUA sudah mekar, tekan A → tampilkan TAMAT
    if (flowerStates.every(s => s === 3)) {
      document.getElementById('bunga-tamat').classList.add('show');
      SFX.fanfare();
    } else {
      // belum semua mekar, pindah ke bunga berikutnya
      const wish = WISHES[flowerWishIdx % WISHES.length];
      bungaWishBox.textContent = '✿ ' + wish;
      bungaWishBox.classList.add('visible');
      SFX.select();
    }
  }
}

bungaCanvas.addEventListener('click', (e) => {
  if (currentScreen !== 'bunga') return;
  const rect = bungaCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width * bungaCanvas.width;
  const slotW = bungaCanvas.width / FLOWER_COUNT;
  const idx = Math.floor(x / slotW);
  if (idx >= 0 && idx < FLOWER_COUNT) {
    selectedFlower = idx;
    growFlower();
  }
});

// ─── PAUSE MENU ───
const pauseOverlay = document.getElementById('pause-overlay');
const pauseItems = document.querySelectorAll('.pause-item[data-pauseaction]');
let pauseCursor = 0;
let paused = false;

function togglePause() {
  paused = !paused;
  if (paused) {
    pauseCursor = 0;
    renderPause();
    pauseOverlay.classList.add('active');
  } else {
    pauseOverlay.classList.remove('active');
  }
  SFX.select();
}

function renderPause() {
  pauseItems.forEach((item, i) => {
    item.classList.toggle('selected', i === pauseCursor);
    item.textContent = (i === pauseCursor ? '► ' : '  ') + ['LANJUT','MENU UTAMA','CREDITS'][i];
  });
}

function pauseConfirm() {
  const action = ['resume','menu','credits'][pauseCursor];
  paused = false;
  pauseOverlay.classList.remove('active');
  SFX.confirm();
  if (action === 'resume') return;
  if (action === 'menu') showScreen('menu');
  if (action === 'credits') showScreen('credits');
}

// ─── INPUT HANDLER ───
function handleInput(action) {
  initAudio();

  if (paused) {
    if (action === 'up')    { pauseCursor = Math.max(0, pauseCursor-1); renderPause(); SFX.select(); }
    if (action === 'down')  { pauseCursor = Math.min(2, pauseCursor+1); renderPause(); SFX.select(); }
    if (action === 'a' || action === 'start') pauseConfirm();
    if (action === 'b')     { paused = false; pauseOverlay.classList.remove('active'); SFX.back(); }
    return;
  }

  if (currentScreen === 'boot') {
    if ((action === 'start' || action === 'a') && bootReady) {
      startMusic();
      SFX.confirm();
      showScreen('menu');
    }
    return;
  }

  if (action === 'start') { togglePause(); return; }
  if (action === 'select') {
    soundEnabled = !soundEnabled;
    localStorage.setItem('gbSoundEnabled', soundEnabled);
    return;
  }

  if (currentScreen === 'menu') {
    if (action === 'up')   { menuCursor = Math.max(0, menuCursor-1); renderMenu(); SFX.select(); }
    if (action === 'down') { menuCursor = Math.min(menuScreens.length-1, menuCursor+1); renderMenu(); SFX.select(); }
    if (action === 'a' || action === 'right') {
      SFX.confirm();
      previousScreen = 'menu';
      showScreen(menuScreens[menuCursor]);
    }
    if (action === 'b') SFX.back();
  }

  else if (currentScreen === 'pesan') {
    if (action === 'a') dialogAdvance();
    if (action === 'left' && dialogPage > 0) { dialogGoTo(dialogPage - 1); SFX.select(); }
    if (action === 'right' && dialogPage < CONFIG.messages.length - 1) { dialogGoTo(dialogPage + 1); SFX.select(); }
    if (action === 'b') { SFX.back(); showScreen('menu'); }
  }

  else if (currentScreen === 'galeri') {
    if (action === 'right') { galeriCursor = Math.min(3, galeriCursor+1); renderGaleri(); SFX.select(); }
    if (action === 'left')  { galeriCursor = Math.max(0, galeriCursor-1); renderGaleri(); SFX.select(); }
    if (action === 'down')  { galeriCursor = Math.min(3, galeriCursor+2); renderGaleri(); SFX.select(); }
    if (action === 'up')    { galeriCursor = Math.max(0, galeriCursor-2); renderGaleri(); SFX.select(); }
    if (action === 'a')     galeriView(galeriCursor);
    if (action === 'b')     { SFX.back(); showScreen('menu'); }
  }

  else if (currentScreen === 'galeri-view') {
    if (action === 'b') { SFX.back(); showScreen('galeri'); }
  }

  else if (currentScreen === 'photo') {
    if (action === 'b') {
      stopCamera();
      SFX.back();
      showScreen('menu');
    }
    if (action === 'a' && !photoTaken) { takePhoto(); }
    if (action === 'a' && photoTaken) {
      document.getElementById('photo-save-btn').click();
    }
    if (action === 'right') {
      const filters = ['none','gbc','dmg','bloom'];
      const btns = document.querySelectorAll('.filter-btn[data-filter]');
      const cur = [...btns].findIndex(b => b.classList.contains('active'));
      btns[cur].classList.remove('active');
      btns[(cur+1)%4].classList.add('active');
      currentFilter = filters[(cur+1)%4];
      SFX.select();
    }
    if (action === 'left') {
      const filters = ['none','gbc','dmg','bloom'];
      const btns = document.querySelectorAll('.filter-btn[data-filter]');
      const cur = [...btns].findIndex(b => b.classList.contains('active'));
      btns[cur].classList.remove('active');
      btns[(cur+3)%4].classList.add('active');
      currentFilter = filters[(cur+3)%4];
      SFX.select();
    }
    if (action === 'up') {
      const frames = ['photobox','polaroid','vintage'];
      const btns = document.querySelectorAll('.frame-btn[data-frame]');
      const cur = [...btns].findIndex(b => b.classList.contains('active'));
      btns[cur].classList.remove('active');
      btns[(cur+1)%3].classList.add('active');
      currentFrame = frames[(cur+1)%3];
      SFX.select();
    }
    if (action === 'down') {
      const frames = ['photobox','polaroid','vintage'];
      const btns = document.querySelectorAll('.frame-btn[data-frame]');
      const cur = [...btns].findIndex(b => b.classList.contains('active'));
      btns[cur].classList.remove('active');
      btns[(cur+2)%3].classList.add('active');
      currentFrame = frames[(cur+2)%3];
      SFX.select();
    }
  }

  else if (currentScreen === 'lilin') {
    if (action === 'a') blowCandle();
    if (action === 'b') { SFX.back(); showScreen('menu'); }
  }

  else if (currentScreen === 'bunga') {
    if (action === 'a') growFlower();
    if (action === 'left')  { selectedFlower = Math.max(0, selectedFlower-1); SFX.select(); drawBunga(); }
    if (action === 'right') { selectedFlower = Math.min(FLOWER_COUNT-1, selectedFlower+1); SFX.select(); drawBunga(); }
    if (action === 'b') {
      document.getElementById('bunga-tamat').classList.remove('show');
      SFX.back();
      showScreen('menu');
    }
  }

  else if (currentScreen === 'credits') {
    if (action === 'start' || action === 'a') {
      flowerStates = new Array(FLOWER_COUNT).fill(0);
      flowerWishIdx = 0;
      selectedFlower = 0;
      lilinBlown = 0;
      lilinFinished = false;
      SFX.confirm();
      showScreen('menu');
    }
  }
}

// ─── BUTTON CLICK HANDLERS ───
function attachBtn(el, action) {
  el.addEventListener('pointerdown', e => { e.preventDefault(); handleInput(action); el.classList.add('pressed'); });
  el.addEventListener('pointerup', () => el.classList.remove('pressed'));
  el.addEventListener('pointerleave', () => el.classList.remove('pressed'));
}

attachBtn(document.getElementById('btn-a'), 'a');
attachBtn(document.getElementById('btn-b'), 'b');
attachBtn(document.getElementById('btn-start'), 'start');
attachBtn(document.getElementById('btn-select'), 'select');
attachBtn(document.getElementById('dpad-up'), 'up');
attachBtn(document.getElementById('dpad-down'), 'down');
attachBtn(document.getElementById('dpad-left'), 'left');
attachBtn(document.getElementById('dpad-right'), 'right');

// ─── KEYBOARD ───
const keyMap = {
  'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
  'z':'a','Z':'a','Enter':'a',
  'x':'b','X':'b','Escape':'b',
  'Shift':'select'
};
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !paused && currentScreen !== 'boot') {
    if (e.target.tagName !== 'BUTTON') {
      handleInput('start');
      return;
    }
  }
  const action = keyMap[e.key];
  if (action) { e.preventDefault(); handleInput(action); }
});

// ─── RESIZE SCREEN CANVAS ───
function resizeCanvases() {
  const screen = document.getElementById('screen');
  const w = screen.clientWidth;
  const lilinC = document.getElementById('lilin-canvas');
  lilinC.width = lilinC.clientWidth || w - 20;
  const bungaC = document.getElementById('bunga-canvas');
  bungaC.width = bungaC.clientWidth || w - 20;
  if (currentScreen === 'lilin') drawLilin();
  if (currentScreen === 'bunga') drawBunga();
}
window.addEventListener('resize', resizeCanvases);
setTimeout(resizeCanvases, 200);

// ─── BUNGA ANIMATION LOOP ───
setInterval(() => {
  if (currentScreen === 'bunga') {
    bungaSwayAngle += 0.03;
    drawBunga();
  }
}, 50);

// ─── MENU ITEMS CLICK ───
document.querySelectorAll('.menu-item').forEach((item, i) => {
  item.addEventListener('click', () => {
    menuCursor = i;
    renderMenu();
    handleInput('a');
  });
});

// ─── GALERI SLOT CLICK ───
document.querySelectorAll('.galeri-slot').forEach(slot => {
  slot.addEventListener('click', () => {
    galeriCursor = parseInt(slot.dataset.idx);
    renderGaleri();
    galeriView(galeriCursor);
  });
});

// ─── BOOT AUTO PROGRESS ───
// already handled above

console.log('%c🎮 Birthday Game Boy loaded! Customize CONFIG at the top of the script.', 'color:#e87890;font-size:14px;font-weight:bold');
