import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBw2I-YLuHzSE4EFSy11kYBwxiCVkRorIY",
  authDomain: "gabriele-lucky-spin.firebaseapp.com",
  projectId: "gabriele-lucky-spin",
  storageBucket: "gabriele-lucky-spin.firebasestorage.app",
  messagingSenderId: "246250100709",
  appId: "1:246250100709:web:d91f9c025ed86fd751010c",
  measurementId: "G-C4QXKMNZ90"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loginScreen = document.getElementById("loginScreen");
const gameScreen = document.getElementById("gameScreen");

const playerNameInput = document.getElementById("playerNameInput");
const enterBtn = document.getElementById("enterBtn");
const loginError = document.getElementById("loginError");

const playerNameLabel = document.getElementById("playerNameLabel");
const creditsLabel = document.getElementById("creditsLabel");
const betLabel = document.getElementById("betLabel");
const freeSpinsLabel = document.getElementById("freeSpinsLabel");
const messageLabel = document.getElementById("messageLabel");
const jackpotBanner = document.getElementById("jackpotBanner");
const paylineOverlay = document.getElementById("paylineOverlay");
const slotGrid = document.getElementById("slotGrid");

const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const spinBtn = document.getElementById("spinBtn");

const playersList = document.getElementById("playersList");
const winnersList = document.getElementById("winnersList");
const topWinsList = document.getElementById("topWinsList");

const leverZone = document.getElementById("leverZone");

const rulesBtn = document.getElementById("rulesBtn");
const rulesModal = document.getElementById("rulesModal");
const rulesBackdrop = document.getElementById("rulesBackdrop");
const closeRulesBtn = document.getElementById("closeRulesBtn");

const fxCanvas = document.getElementById("fxCanvas");
const ctx = fxCanvas.getContext("2d");

const STARTING_CREDITS = 5000;
const MAX_WIN_PER_SPIN = 100000;
const TOTAL_PAYLINES = 20;
const MIN_BET = 50;
const MAX_BET = 5000;

const LINE_COLORS = [
  "#ffd700", "#00e5ff", "#ff4df0", "#7cff4d", "#ff9f1c",
  "#b388ff", "#00ffa3", "#ff4d6d", "#54a0ff", "#feca57",
  "#1dd1a1", "#ff6b6b", "#48dbfb", "#c8d6e5", "#f368e0",
  "#ee5253", "#0abde3", "#10ac84", "#ff9ff3", "#f6b93b"
];

const SYMBOLS = [
  { id: "cherries", type: "normal", weight: 26 },
  { id: "lemon", type: "normal", weight: 24 },
  { id: "plum", type: "normal", weight: 22 },
  { id: "bells", type: "normal", weight: 18 },
  { id: "bar3", type: "normal", weight: 14 },
  { id: "seven", type: "premium", weight: 9 },
  { id: "wild", type: "wild", weight: 5 },
  { id: "x4wild", type: "wild", weight: 2 },
  { id: "scatter", type: "scatter", weight: 4 },
  { id: "jackpot", type: "jackpot", weight: 3 }
];

const PAYTABLE = {
  cherries: { 2: 1, 3: 4, 4: 12, 5: 30 },
  lemon: { 2: 1, 3: 5, 4: 15, 5: 35 },
  plum: { 2: 2, 3: 6, 4: 18, 5: 45 },
  bells: { 2: 2, 3: 8, 4: 25, 5: 70 },
  bar3: { 2: 3, 3: 10, 4: 35, 5: 100 },
  seven: { 2: 5, 3: 20, 4: 75, 5: 300 },
  wild: { 2: 8, 3: 30, 4: 120, 5: 500 }
};

const SCATTER_TABLE = {
  3: { mult: 2, freeSpins: 8 },
  4: { mult: 10, freeSpins: 12 },
  5: { mult: 50, freeSpins: 20 }
};

const JACKPOT_TABLE = {
  3: 3,
  4: 10,
  5: 25,
  6: 60,
  7: 150,
  8: 400,
  9: 1000,
  10: 2500
};

const PAYLINES = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 2, 2, 2],
  [2, 1, 0, 0, 0],
  [0, 0, 0, 1, 2],
  [2, 2, 2, 1, 0],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [1, 1, 0, 1, 1]
];

const INITIAL_REELS = [
  ["wild", "jackpot", "lemon"],
  ["wild", "jackpot", "bells"],
  ["plum", "x4wild", "cherries"],
  ["seven", "jackpot", "scatter"],
  ["seven", "jackpot", "bar3"]
];

let playerName = "";
let credits = STARTING_CREDITS;
let bet = 50;
let spinning = false;
let freeSpinsRemaining = 0;

let participantsCache = [];
let winsCache = [];
let particles = [];
let currentWinningPositions = [];

let visibleGrid = JSON.parse(JSON.stringify(INITIAL_REELS));

const reelCells = [
  [document.getElementById("r0c0"), document.getElementById("r0c1"), document.getElementById("r0c2")],
  [document.getElementById("r1c0"), document.getElementById("r1c1"), document.getElementById("r1c2")],
  [document.getElementById("r2c0"), document.getElementById("r2c1"), document.getElementById("r2c2")],
  [document.getElementById("r3c0"), document.getElementById("r3c1"), document.getElementById("r3c2")],
  [document.getElementById("r4c0"), document.getElementById("r4c1"), document.getElementById("r4c2")]
];

const reelColumns = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2"),
  document.getElementById("reel3"),
  document.getElementById("reel4")
];

/* =========================
   AUDIO
========================= */

const AUDIO_BASE_DIRS = ["audio/", "assets/audio/"];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildAudioCandidates(fileNames) {
  return AUDIO_BASE_DIRS.flatMap(baseDir =>
    fileNames.map(fileName => `${baseDir}${fileName}`)
  );
}

function createSmartAudio(fileNames, { volume = 1, loop = false } = {}) {
  const audio = new Audio();
  audio.preload = "auto";
  audio.volume = volume;
  audio.loop = loop;
  audio.playsInline = true;
  audio._candidateUrls = buildAudioCandidates(fileNames);
  audio._resolvedSource = "";
  audio._resolvePromise = null;
  return audio;
}

function probeAudioUrl(url) {
  return new Promise((resolve) => {
    const testAudio = new Audio();
    let done = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      testAudio.removeEventListener("loadedmetadata", onLoadedMetadata);
      testAudio.removeEventListener("canplaythrough", onCanPlayThrough);
      testAudio.removeEventListener("error", onError);
      try {
        testAudio.pause();
        testAudio.removeAttribute("src");
        testAudio.load();
      } catch (error) {
        console.warn("Pulizia test audio fallita:", error);
      }
    };

    const finish = (result) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(result);
    };

    const onLoadedMetadata = () => finish(true);
    const onCanPlayThrough = () => finish(true);
    const onError = () => finish(false);

    const timeoutId = setTimeout(() => finish(false), 1800);

    testAudio.preload = "metadata";
    testAudio.playsInline = true;
    testAudio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    testAudio.addEventListener("canplaythrough", onCanPlayThrough, { once: true });
    testAudio.addEventListener("error", onError, { once: true });
    testAudio.src = url;
    testAudio.load();
  });
}

async function resolveAudioSource(audio) {
  if (!audio) return false;

  if (audio._resolvedSource) {
    if (audio.src !== audio._resolvedSource) {
      audio.src = audio._resolvedSource;
    }
    return true;
  }

  if (audio._resolvePromise) {
    return audio._resolvePromise;
  }

  const candidates = Array.isArray(audio._candidateUrls) ? audio._candidateUrls : [];

  audio._resolvePromise = (async () => {
    for (const url of candidates) {
      const ok = await probeAudioUrl(url);
      if (ok) {
        audio.src = url;
        audio._resolvedSource = url;
        try {
          audio.load();
        } catch (error) {
          console.warn("Load audio fallito:", error);
        }
        return true;
      }
    }

    console.warn("Audio non trovato. Controlla nomi e cartelle:", candidates);
    return false;
  })();

  const result = await audio._resolvePromise;
  audio._resolvePromise = null;
  return result;
}

const audioFiles = {
  enter: createSmartAudio(
    [
      "audio_entrata_nel_gioco.mp3",
      "audio entrata nel gioco.mp3",
      "entrata_nel_gioco.mp3",
      "entrata nel gioco.mp3"
    ],
    { volume: 1 }
  ),

  button: createSmartAudio(["bottone.mp3"], { volume: 1 }),

  reels: createSmartAudio(
    [
      "slot_che_gira.mp3",
      "slot che gira.mp3"
    ],
    { volume: 1, loop: true }
  ),

  coins: createSmartAudio(["soldi.mp3"], { volume: 1 }),

  gameOver: createSmartAudio(
    [
      "game_over.mp3",
      "game over.mp3"
    ],
    { volume: 1 }
  ),

  wins: [
    createSmartAudio(["1vincita.mp3", "1vincita.wav", "1 vincita.wav"], { volume: 1 }),
    createSmartAudio(["2vincita.mp3", "2vincita.wav", "2 vincita.wav"], { volume: 1 }),
    createSmartAudio(["3vincita.mp3", "3vincita.wav", "3 vincita.wav"], { volume: 1 }),
    createSmartAudio(["4vincita.mp3", "4vincita.wav", "4 vincita.wav", "4 vicnita.wav"], { volume: 1 }),
    createSmartAudio(["5vincita.mp3", "5vincita.wav", "5 vincita.wav"], { volume: 1 }),
    createSmartAudio(["6vincita.mp3", "6vincita.wav", "6 vincita.wav"], { volume: 1 }),
    createSmartAudio(["vincita7.mp3", "vincita7.wav", "vincita 7.wav", "7vincita.wav", "7 vincita.wav"], { volume: 1 }),
    createSmartAudio(["8vincita.mp3", "8vincita.wav", "8 vincita.wav"], { volume: 1 }),
    createSmartAudio(["vincita9.mp3", "vincita9.wav", "vincita 9.wav", "9vincita.wav", "9 vincita.wav"], { volume: 1 }),
    createSmartAudio(["vincita10.mp3", "vincita 10.mp3", "10vincita.mp3", "10 vincita.mp3"], { volume: 1 }),
    createSmartAudio(["vincita11.mp3", "vincita 11.mp3", "11vincita.mp3", "11 vincita.mp3"], { volume: 1 }),
    createSmartAudio(["vincita12.mp3", "vincita 12.mp3", "12vincita.mp3", "12 vincita.mp3"], { volume: 1 })
  ]
};

const ALL_AUDIO = [
  audioFiles.enter,
  audioFiles.button,
  audioFiles.reels,
  audioFiles.coins,
  audioFiles.gameOver,
  ...audioFiles.wins
];

let audioSequenceId = 0;
let audioUnlocked = false;
let audioUnlockPromise = null;

async function unlockAllAudio(force = false) {
  if (audioUnlocked && !force) return true;
  if (audioUnlockPromise && !force) return audioUnlockPromise;

  audioUnlockPromise = (async () => {
    for (const audio of ALL_AUDIO) {
      const ready = await resolveAudioSource(audio);
      if (!ready) continue;

      const oldMuted = audio.muted;
      const oldLoop = audio.loop;

      try {
        audio.muted = true;
        audio.loop = false;
        audio.currentTime = 0;
        await audio.play();
        await wait(20);
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.warn("Sblocco audio non riuscito:", error);
      } finally {
        audio.muted = oldMuted;
        audio.loop = oldLoop;
      }
    }

    audioUnlocked = true;
    audioUnlockPromise = null;
    return true;
  })();

  return audioUnlockPromise;
}

function registerGlobalAudioUnlock() {
  const unlockOnce = async () => {
    try {
      await unlockAllAudio();
    } catch (error) {
      console.warn("Unlock globale fallito:", error);
    }
  };

  const opts = { passive: true, once: true };

  document.addEventListener("pointerdown", unlockOnce, opts);
  document.addEventListener("touchstart", unlockOnce, opts);
  document.addEventListener("click", unlockOnce, opts);
  document.addEventListener("keydown", unlockOnce, { once: true });
}

function stopAudio(audio) {
  if (!audio) return;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch (error) {
    console.warn("Impossibile resettare audio:", error);
  }
}

function stopAllAudio() {
  ALL_AUDIO.forEach(stopAudio);
}

function breakCurrentAudioSequence() {
  audioSequenceId += 1;
  stopAllAudio();
  return audioSequenceId;
}

function isSequenceActive(sequenceId) {
  return sequenceId === audioSequenceId;
}

async function startAudio(audio, { restart = true } = {}) {
  if (!audio) return;

  const ready = await resolveAudioSource(audio);
  if (!ready) return;

  try {
    if (restart) audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    console.warn("Riproduzione audio bloccata:", error);
    try {
      await unlockAllAudio(true);
      if (restart) audio.currentTime = 0;
      await audio.play();
    } catch (retryError) {
      console.warn("Riproduzione audio fallita anche dopo unlock:", retryError);
    }
  }
}

function playButtonAudioNoAwait() {
  breakCurrentAudioSequence();
  startAudio(audioFiles.button);
}

function stopReelsAudio() {
  stopAudio(audioFiles.reels);
}

async function waitForAudioToEnd(audio, sequenceId) {
  if (!audio || !isSequenceActive(sequenceId)) return;

  const fallbackMs =
    Number.isFinite(audio.duration) && audio.duration > 0
      ? Math.ceil(audio.duration * 1000) + 150
      : 2500;

  await new Promise(resolve => {
    let resolved = false;

    const cleanup = () => {
      clearInterval(checker);
      clearTimeout(fallback);
      audio.removeEventListener("ended", onEnded);
    };

    const finish = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve();
    };

    const onEnded = () => finish();

    const checker = setInterval(() => {
      if (!isSequenceActive(sequenceId)) finish();
      if (audio.paused && audio.currentTime === 0) finish();
    }, 60);

    const fallback = setTimeout(() => finish(), fallbackMs);

    audio.addEventListener("ended", onEnded, { once: true });
  });
}

async function playSequenceAudio(audio, sequenceId) {
  if (!audio || !isSequenceActive(sequenceId)) return;
  stopAllAudio();
  await startAudio(audio);
  await waitForAudioToEnd(audio, sequenceId);
}

function getWinAudioForAmount(amount) {
  const limits = [50, 100, 200, 400, 800, 1500, 3000, 6000, 12000, 25000, 50000];
  let index = limits.findIndex(limit => amount <= limit);
  if (index === -1) index = 11;
  return audioFiles.wins[index];
}

/* ========================= */

function resizeCanvas() {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopReelsAudio();
  }
});

window.addEventListener("pageshow", () => {
  stopReelsAudio();
});

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function showLoginError(text) {
  if (loginError) loginError.textContent = text;
}

function clearLoginError() {
  if (loginError) loginError.textContent = "";
}

function updateLabels() {
  if (playerNameLabel) playerNameLabel.textContent = playerName || "-";
  if (creditsLabel) creditsLabel.textContent = credits;
  if (betLabel) betLabel.textContent = bet;
  if (freeSpinsLabel) freeSpinsLabel.textContent = freeSpinsRemaining;
}

function setMessage(text) {
  if (messageLabel) messageLabel.textContent = text;
}

function isWildSymbol(id) {
  return id === "wild" || id === "x4wild";
}

function isScatterSymbol(id) {
  return id === "scatter";
}

function isJackpotSymbol(id) {
  return id === "jackpot";
}

function isLinePayingSymbol(id) {
  return !isScatterSymbol(id) && !isJackpotSymbol(id);
}

function weightedRandomSymbolId() {
  const total = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * total;

  for (const sym of SYMBOLS) {
    rand -= sym.weight;
    if (rand <= 0) return sym.id;
  }

  return SYMBOLS[0].id;
}

function randomColumnSymbols() {
  return [weightedRandomSymbolId(), weightedRandomSymbolId(), weightedRandomSymbolId()];
}

function renderSymbol(id) {
  switch (id) {
    case "wild":
      return `
        <div class="symbol-box symbol-wild">
          <div class="symbol-main">WILD</div>
        </div>
      `;
    case "x4wild":
      return `
        <div class="symbol-box symbol-x4wild">
          <div class="symbol-main">x4</div>
          <div class="symbol-sub">WILD</div>
        </div>
      `;
    case "jackpot":
      return `
        <div class="symbol-box symbol-jackpot">
          <div class="gem">💎</div>
          <div class="ribbon">JACKPOT</div>
        </div>
      `;
    case "seven":
      return `
        <div class="symbol-box symbol-seven">
          <div class="symbol-main">7</div>
          <div class="flames">🔥🔥</div>
        </div>
      `;
    case "scatter":
      return `
        <div class="symbol-box symbol-scatter">
          <div class="symbol-main">SCATTER</div>
        </div>
      `;
    case "bar3":
      return `
        <div class="symbol-box symbol-bar3">
          <div class="bar-text">BAR</div>
          <div class="bar-num">3</div>
        </div>
      `;
    case "lemon":
      return `
        <div class="symbol-box symbol-fruit">
          <div class="fruit-emoji">🍋</div>
        </div>
      `;
    case "plum":
      return `
        <div class="symbol-box symbol-fruit">
          <div class="fruit-emoji">🟣</div>
        </div>
      `;
    case "cherries":
      return `
        <div class="symbol-box symbol-fruit">
          <div class="fruit-emoji">🍒</div>
        </div>
      `;
    case "bells":
      return `
        <div class="symbol-box symbol-bells">
          <div class="bells-emoji">🔔</div>
        </div>
      `;
    default:
      return `<div class="symbol-box"><div class="symbol-main">${id}</div></div>`;
  }
}

function renderGrid() {
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      reelCells[col][row].innerHTML = renderSymbol(visibleGrid[col][row]);
    }
  }
}

function clearWinningHighlights() {
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      reelCells[col][row].classList.remove("winning-cell");
    }
  }
  currentWinningPositions = [];
  if (paylineOverlay) paylineOverlay.innerHTML = "";
}

function addWinningPositions(positions) {
  positions.forEach(({ col, row }) => {
    const key = `${col}-${row}`;
    if (!currentWinningPositions.includes(key)) {
      currentWinningPositions.push(key);
      reelCells[col][row].classList.add("winning-cell");
    }
  });
}

function drawPayline(lineIndex, payline) {
  if (!paylineOverlay) return;

  const color = LINE_COLORS[lineIndex % LINE_COLORS.length];
  const points = [];

  for (let col = 0; col < 5; col++) {
    const row = payline[col];
    const cell = reelCells[col][row];
    const cellRect = cell.getBoundingClientRect();
    const gridRect = slotGrid.getBoundingClientRect();

    points.push({
      x: cellRect.left - gridRect.left + cellRect.width / 2,
      y: cellRect.top - gridRect.top + cellRect.height / 2
    });
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const seg = document.createElement("div");
    seg.className = "payline-line";
    seg.style.left = `${a.x}px`;
    seg.style.top = `${a.y}px`;
    seg.style.width = `${length}px`;
    seg.style.transform = `translateY(-50%) rotate(${angle}deg)`;
    seg.style.color = color;
    seg.style.background = color;
    paylineOverlay.appendChild(seg);
  }
}

function getLineSymbols(payline) {
  return payline.map((rowIndex, reelIndex) => visibleGrid[reelIndex][rowIndex]);
}

function evaluateLine(symbols, lineBet, lineNumber, payline) {
  if (!isLinePayingSymbol(symbols[0])) return null;

  let targetSymbol = null;

  for (const sym of symbols) {
    if (!isLinePayingSymbol(sym)) break;
    if (!isWildSymbol(sym)) {
      targetSymbol = sym;
      break;
    }
  }

  if (!targetSymbol) targetSymbol = "wild";

  let count = 0;
  let x4Count = 0;
  const winningPositions = [];

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];

    if (!isLinePayingSymbol(sym)) break;

    if (targetSymbol === "wild") {
      if (isWildSymbol(sym)) {
        count++;
        winningPositions.push({ col: i, row: payline[i] });
        if (sym === "x4wild") x4Count++;
      } else {
        break;
      }
    } else {
      if (sym === targetSymbol || isWildSymbol(sym)) {
        count++;
        winningPositions.push({ col: i, row: payline[i] });
        if (sym === "x4wild") x4Count++;
      } else {
        break;
      }
    }
  }

  const baseTable = PAYTABLE[targetSymbol] || {};
  const baseMultiplier = baseTable[count] || 0;
  if (baseMultiplier <= 0) return null;

  let specialMultiplier = 1;
  if (x4Count === 1) specialMultiplier = 4;
  if (x4Count >= 2) specialMultiplier = 8;

  const amount = Math.round(lineBet * baseMultiplier * specialMultiplier);

  return {
    lineNumber,
    targetSymbol,
    count,
    x4Count,
    baseMultiplier,
    specialMultiplier,
    amount,
    winningPositions,
    payline
  };
}

function evaluatePaylines(totalBet) {
  const lineBet = totalBet / TOTAL_PAYLINES;
  const wins = [];

  for (let i = 0; i < PAYLINES.length; i++) {
    const lineSymbols = getLineSymbols(PAYLINES[i]);
    const result = evaluateLine(lineSymbols, lineBet, i + 1, PAYLINES[i]);
    if (result) wins.push(result);
  }

  return wins;
}

function countSymbolInGrid(symbolId) {
  let count = 0;
  for (const col of visibleGrid) {
    for (const sym of col) {
      if (sym === symbolId) count++;
    }
  }
  return count;
}

function getScatterReward(totalBet) {
  const scatterCount = countSymbolInGrid("scatter");
  if (scatterCount < 3) {
    return { scatterCount, amount: 0, freeSpins: 0 };
  }

  const key = Math.min(scatterCount, 5);
  const cfg = SCATTER_TABLE[key];
  return {
    scatterCount,
    amount: Math.round(totalBet * cfg.mult),
    freeSpins: cfg.freeSpins
  };
}

function getJackpotReward(totalBet) {
  const jackpotCount = countSymbolInGrid("jackpot");
  if (jackpotCount < 3) {
    return { jackpotCount, amount: 0, multiplier: 0 };
  }

  const key = Math.min(jackpotCount, 10);
  const multiplier = JACKPOT_TABLE[key];
  return {
    jackpotCount,
    amount: Math.round(totalBet * multiplier),
    multiplier
  };
}

function getSpinOutcome(totalBet) {
  const lineWins = evaluatePaylines(totalBet);
  const scatterReward = getScatterReward(totalBet);
  const jackpotReward = getJackpotReward(totalBet);

  const lineWinTotal = lineWins.reduce((sum, item) => sum + item.amount, 0);
  const rawWin = lineWinTotal + scatterReward.amount + jackpotReward.amount;
  const creditedWin = Math.min(rawWin, MAX_WIN_PER_SPIN);

  return {
    lineWins,
    scatterReward,
    jackpotReward,
    lineWinTotal,
    rawWin,
    creditedWin,
    capped: rawWin > MAX_WIN_PER_SPIN
  };
}

async function claimParticipantName(name) {
  const normalized = normalizeName(name);
  const participantRef = doc(db, "participants", normalized);

  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(participantRef);

    if (snap.exists()) {
      return false;
    }

    transaction.set(participantRef, {
      name: name.trim(),
      normalizedName: normalized,
      updatedAt: serverTimestamp()
    });

    return true;
  });
}

async function saveWin(name, amount, combo) {
  try {
    await addDoc(collection(db, "wins"), {
      name: name.trim(),
      amount,
      combo,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Errore salvataggio vincita:", error);
  }
}

function renderLists() {
  if (!playersList || !winnersList || !topWinsList) return;

  playersList.innerHTML = "";
  winnersList.innerHTML = "";
  topWinsList.innerHTML = "";

  if (participantsCache.length === 0) {
    playersList.innerHTML = "<li>Nessun partecipante</li>";
  } else {
    participantsCache.slice(0, 8).forEach(entry => {
      const li = document.createElement("li");
      li.textContent = entry.name;
      playersList.appendChild(li);
    });
  }

  if (winsCache.length === 0) {
    winnersList.innerHTML = "<li>Nessun vincitore ancora</li>";
    topWinsList.innerHTML = "<li>Nessuna top vincita</li>";
    return;
  }

  winsCache.slice(0, 8).forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${entry.name}</strong><span class="mini">${entry.amount} crediti</span>`;
    winnersList.appendChild(li);
  });

  const bestByPlayer = {};

  for (const entry of winsCache) {
    const key = normalizeName(entry.name);
    if (!bestByPlayer[key] || entry.amount > bestByPlayer[key].amount) {
      bestByPlayer[key] = entry;
    }
  }

  const uniqueBestWins = Object.values(bestByPlayer)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  uniqueBestWins.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>#${index + 1} ${entry.name}</strong><span class="mini">${entry.amount} crediti</span>`;
    topWinsList.appendChild(li);
  });
}

function subscribeRealtimeData() {
  try {
    const participantsQuery = query(
      collection(db, "participants"),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    onSnapshot(
      participantsQuery,
      (snapshot) => {
        participantsCache = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        renderLists();
      },
      (error) => {
        console.error("Errore lettura participants:", error);
      }
    );

    const winsQuery = query(
      collection(db, "wins"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    onSnapshot(
      winsQuery,
      (snapshot) => {
        winsCache = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        renderLists();
      },
      (error) => {
        console.error("Errore lettura wins:", error);
      }
    );
  } catch (error) {
    console.error("Errore subscribeRealtimeData:", error);
  }
}

function openRulesModal() {
  if (!rulesModal) return;
  rulesModal.classList.remove("hidden");
}

function closeRulesModal() {
  if (!rulesModal) return;
  rulesModal.classList.add("hidden");
}

async function enterGame() {
  try {
    clearLoginError();

    const name = playerNameInput.value.trim();
    if (!name) {
      showLoginError("Inserisci un nome");
      return;
    }

    const normalized = normalizeName(name);

    const alreadyInCache = participantsCache.some(
      p => normalizeName(p.name) === normalized
    );

    if (alreadyInCache) {
      showLoginError("Nome già esistente");
      return;
    }

    const claimed = await claimParticipantName(name);

    if (!claimed) {
      showLoginError("Nome già esistente");
      return;
    }

    playerName = name;
    credits = STARTING_CREDITS;
    bet = 50;
    freeSpinsRemaining = 0;
    updateLabels();

    loginScreen.classList.remove("active");
    gameScreen.classList.add("active");

    setMessage(`Benvenuto ${playerName}! 20 linee attive.`);

    const sequenceId = breakCurrentAudioSequence();
    await playSequenceAudio(audioFiles.enter, sequenceId);
  } catch (error) {
    console.error("Errore enterGame:", error);
    showLoginError("Errore di collegamento, riprova");
  }
}

enterBtn.addEventListener("click", async () => {
  await unlockAllAudio();
  playButtonAudioNoAwait();
  await wait(90);
  await enterGame();
});

playerNameInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    await unlockAllAudio();
    playButtonAudioNoAwait();
    await wait(90);
    await enterGame();
  }
});

playerNameInput.addEventListener("input", () => {
  clearLoginError();
});

minusBtn.addEventListener("click", async () => {
  if (spinning) return;
  await unlockAllAudio();
  playButtonAudioNoAwait();
  bet = Math.max(MIN_BET, bet - 50);
  updateLabels();
});

plusBtn.addEventListener("click", async () => {
  if (spinning) return;
  await unlockAllAudio();
  playButtonAudioNoAwait();
  bet = Math.min(MAX_BET, bet + 50);
  updateLabels();
});

if (rulesBtn) {
  rulesBtn.addEventListener("click", async () => {
    if (spinning) return;
    await unlockAllAudio();
    playButtonAudioNoAwait();
    openRulesModal();
  });
}

if (closeRulesBtn) {
  closeRulesBtn.addEventListener("click", async () => {
    if (spinning) return;
    await unlockAllAudio();
    playButtonAudioNoAwait();
    closeRulesModal();
  });
}

if (rulesBackdrop) {
  rulesBackdrop.addEventListener("click", () => {
    closeRulesModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeRulesModal();
  }
});

if (leverZone) {
  leverZone.addEventListener("click", async () => {
    if (spinning) return;
    await unlockAllAudio();
    playButtonAudioNoAwait();
    await wait(120);
    await startSpin();
  });
}

if (spinBtn) {
  spinBtn.addEventListener("click", async () => {
    if (spinning) return;
    await unlockAllAudio();
    playButtonAudioNoAwait();
    await wait(120);
    await startSpin();
  });
}

function pullLever() {
  if (!leverZone) return;
  leverZone.classList.add("pulled");
  setTimeout(() => leverZone.classList.remove("pulled"), 320);
}

function highlightWinOutcome(outcome) {
  clearWinningHighlights();

  outcome.lineWins.forEach((lineWin, idx) => {
    addWinningPositions(lineWin.winningPositions);
    drawPayline(idx, lineWin.payline);
  });

  if (outcome.scatterReward.amount > 0 || outcome.scatterReward.freeSpins > 0) {
    const scatterPositions = [];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 3; row++) {
        if (visibleGrid[col][row] === "scatter") {
          scatterPositions.push({ col, row });
        }
      }
    }
    addWinningPositions(scatterPositions);
  }

  if (outcome.jackpotReward.amount > 0) {
    const jackpotPositions = [];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 3; row++) {
        if (visibleGrid[col][row] === "jackpot") {
          jackpotPositions.push({ col, row });
        }
      }
    }
    addWinningPositions(jackpotPositions);
  }
}

function canPlayerStillPlay() {
  return freeSpinsRemaining > 0 || credits >= MIN_BET;
}

async function startSpin() {
  if (spinning) return;

  clearWinningHighlights();

  const usingFreeSpin = freeSpinsRemaining > 0;

  if (!usingFreeSpin && credits < bet) {
    if (credits < MIN_BET) {
      setMessage("Hai finito tutti i crediti. Non puoi più giocare.");
      const sequenceId = breakCurrentAudioSequence();
      await playSequenceAudio(audioFiles.gameOver, sequenceId);
    } else {
      setMessage("Crediti insufficienti! Abbassa la puntata.");
    }
    return;
  }

  spinning = true;

  const sequenceId = breakCurrentAudioSequence();

  if (usingFreeSpin) {
    freeSpinsRemaining -= 1;
  } else {
    credits -= bet;
  }

  updateLabels();
  setMessage(usingFreeSpin ? `FREE SPIN! Rimasti dopo questo: ${freeSpinsRemaining}` : "I rulli stanno girando...");
  if (jackpotBanner) jackpotBanner.classList.remove("jackpot-flash");

  pullLever();

  if (isSequenceActive(sequenceId)) {
    await startAudio(audioFiles.reels);
  }

  const finalColumns = [
    randomColumnSymbols(),
    randomColumnSymbols(),
    randomColumnSymbols(),
    randomColumnSymbols(),
    randomColumnSymbols()
  ];

  for (let col = 0; col < 5; col++) {
    if (!isSequenceActive(sequenceId)) {
      spinning = false;
      return;
    }

    await spinSingleColumn(col, 850 + col * 220, finalColumns[col]);
    spawnSparks(10 + col * 4);
  }

  stopReelsAudio();

  const outcome = getSpinOutcome(bet);

  credits += outcome.creditedWin;
  freeSpinsRemaining += outcome.scatterReward.freeSpins;
  updateLabels();

  const messageParts = [];

  if (outcome.lineWins.length > 0) {
    messageParts.push(`${outcome.lineWins.length} linee vinte`);
  }

  if (outcome.scatterReward.amount > 0) {
    messageParts.push(`SCATTER +${outcome.scatterReward.amount}`);
  }

  if (outcome.scatterReward.freeSpins > 0) {
    messageParts.push(`+${outcome.scatterReward.freeSpins} Free Spins`);
  }

  if (outcome.jackpotReward.amount > 0) {
    messageParts.push(`DIAMANTI +${outcome.jackpotReward.amount}`);
  }

  if (freeSpinsRemaining > 0) {
    messageParts.push(`Free Spins rimasti: ${freeSpinsRemaining}`);
  }

  spinning = false;

  if (outcome.creditedWin > 0) {
    highlightWinOutcome(outcome);

    let comboLabel = "Vincita multipla";
    if (outcome.jackpotReward.amount > 0) {
      comboLabel = `${countSymbolInGrid("jackpot")} diamanti jackpot`;
    } else if (outcome.scatterReward.amount > 0) {
      comboLabel = `${outcome.scatterReward.scatterCount} scatter`;
    } else if (outcome.lineWins.length > 0) {
      comboLabel = `${outcome.lineWins[0].count} ${outcome.lineWins[0].targetSymbol}`;
    }

    if (outcome.capped) {
      messageParts.push("Massimo per spin raggiunto");
    }

    setMessage(`HAI VINTO ${outcome.creditedWin} CREDITI! ${messageParts.join(" | ")}`);

    const bigWin =
      outcome.creditedWin >= 5000 ||
      outcome.jackpotReward.amount > 0 ||
      outcome.scatterReward.freeSpins >= 12;

    const winAudio = getWinAudioForAmount(outcome.creditedWin);
    await playSequenceAudio(winAudio, sequenceId);

    if (isSequenceActive(sequenceId)) {
      if (bigWin && jackpotBanner) jackpotBanner.classList.add("jackpot-flash");

      stopAllAudio();
      startAudio(audioFiles.coins);

      if (bigWin) {
        spawnCoins(Math.min(380, 180 + Math.floor(outcome.creditedWin / 110)));
        spawnBigBurst();
      } else {
        spawnCoins(Math.min(260, 110 + Math.floor(outcome.creditedWin / 40)));
      }
    }

    await saveWin(playerName, outcome.creditedWin, comboLabel);
  } else {
    if (!canPlayerStillPlay()) {
      setMessage("Hai finito tutti i crediti. Non puoi più giocare.");
      await playSequenceAudio(audioFiles.gameOver, sequenceId);
    } else {
      setMessage(
        freeSpinsRemaining > 0
          ? `Nessuna vincita. Free Spins rimasti: ${freeSpinsRemaining}`
          : "Nessuna combinazione vincente, ritenta!"
      );
    }
  }
}

function spinSingleColumn(colIndex, duration, finalSymbols) {
  return new Promise(resolve => {
    const reelEl = reelColumns[colIndex];
    reelEl.classList.add("spinning");

    const interval = setInterval(() => {
      visibleGrid[colIndex] = randomColumnSymbols();
      renderGrid();
    }, 75);

    setTimeout(() => {
      clearInterval(interval);
      visibleGrid[colIndex] = [...finalSymbols];
      reelEl.classList.remove("spinning");
      renderGrid();
      resolve();
    }, duration);
  });
}

function spawnCoins(count = 90) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * fxCanvas.width,
      y: -60 - Math.random() * 500,
      r: 26 + Math.random() * 18,
      vy: 2.6 + Math.random() * 6.5,
      vx: -3.5 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: -0.18 + Math.random() * 0.36,
      type: "coin"
    });
  }
}

function spawnSparks(count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: fxCanvas.width * 0.5 + (Math.random() - 0.5) * 260,
      y: fxCanvas.height * 0.42 + (Math.random() - 0.5) * 120,
      r: 4 + Math.random() * 5,
      vy: -0.5 + Math.random() * 2.5,
      vx: -2.5 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: -0.14 + Math.random() * 0.28,
      life: 40 + Math.random() * 30,
      type: "spark"
    });
  }
}

function spawnBigBurst() {
  for (let i = 0; i < 140; i++) {
    particles.push({
      x: fxCanvas.width * 0.5,
      y: fxCanvas.height * 0.35,
      r: 5 + Math.random() * 10,
      vy: -1 + Math.random() * 5,
      vx: -6 + Math.random() * 12,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      life: 60 + Math.random() * 40,
      type: Math.random() > 0.35 ? "spark" : "coin"
    });
  }
}

function drawParticle(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);

  if (p.type === "coin") {
    ctx.beginPath();
    ctx.fillStyle = "#ffd700";
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#7a5600";
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#fff0a8";
    ctx.arc(0, 0, p.r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#5a4200";
    ctx.font = `${Math.max(20, p.r * 1.1)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
  } else {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 230, 120, 0.95)";
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function animateParticles() {
  ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

  particles.forEach(p => {
    p.y += p.vy;
    p.x += p.vx;
    p.rot += p.vr;

    if (p.life !== undefined) p.life -= 1;
    drawParticle(p);
  });

  particles = particles.filter(p => {
    const inside = p.y < fxCanvas.height + 140 && p.x > -160 && p.x < fxCanvas.width + 160;
    const alive = p.life === undefined || p.life > 0;
    return inside && alive;
  });

  requestAnimationFrame(animateParticles);
}

registerGlobalAudioUnlock();
animateParticles();
renderGrid();
updateLabels();
subscribeRealtimeData();