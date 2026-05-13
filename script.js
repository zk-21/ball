const appLock = document.querySelector("#appLock");
const appRoot = document.querySelector("#appRoot");
const appPassword = document.querySelector("#appPassword");
const toggleAppPasswordButton = document.querySelector("#toggleAppPasswordButton");
const unlockAppButton = document.querySelector("#unlockAppButton");
const appAuthMessage = document.querySelector("#appAuthMessage");
const board = document.querySelector("#board");
const boardWrap = document.querySelector(".board-wrap");
const frontBoard = document.querySelector("#frontBoard");
const backBoard = document.querySelector("#backBoard");
const rowInput = document.querySelector("#rowInput");
const zoneInput = document.querySelector("#zoneInput");
const numberInput = document.querySelector("#numberInput");
const colorInput = document.querySelector("#colorInput");
const sizeInput = document.querySelector("#sizeInput");
const zoomInput = document.querySelector("#zoomInput");
const addBallButton = document.querySelector("#addBallButton");
const eraseButton = document.querySelector("#eraseButton");
const deleteColorButton = document.querySelector("#deleteColorButton");
const clearButton = document.querySelector("#clearButton");
const sampleButton = document.querySelector("#sampleButton");
const saveHistoryButton = document.querySelector("#saveHistoryButton");
const saveVersionButton = document.querySelector("#saveVersionButton");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const clearVersionsButton = document.querySelector("#clearVersionsButton");
const ballCount = document.querySelector("#ballCount");
const currentBaseLabel = document.querySelector("#currentBaseLabel");
const historyList = document.querySelector("#historyList");
const versionList = document.querySelector("#versionList");
const versionSearch = document.querySelector("#versionSearch");
const versionPassword = document.querySelector("#versionPassword");
const unlockVersionsButton = document.querySelector("#unlockVersionsButton");
const lockVersionsButton = document.querySelector("#lockVersionsButton");
const versionAuthMessage = document.querySelector("#versionAuthMessage");
const versionPreview = document.querySelector("#versionPreview");
const versionPreviewTitle = document.querySelector("#versionPreviewTitle");
const drawDateInput = document.querySelector("#drawDateInput");
const drawDataInput = document.querySelector("#drawDataInput");
const generateDrawVersionButton = document.querySelector("#generateDrawVersionButton");
const drawImportMessage = document.querySelector("#drawImportMessage");
const versionModal = document.querySelector("#versionModal");
const versionModalTitle = document.querySelector("#versionModalTitle");
const versionModalBody = document.querySelector("#versionModalBody");
const closeVersionModalButton = document.querySelector("#closeVersionModalButton");
const swatches = [...document.querySelectorAll(".swatch")];

const rows = 50;
const pagePasswordValue = "zk@001";
const versionPasswordValue = "zk@001";
const pageAuthStorageKey = "lottery-page-auth";
const versionAuthStorageKey = "lottery-version-auth";
const historyStorageKey = "lottery-board-history";
const versionStorageKey = "lottery-board-versions";
const draftStorageKey = "lottery-board-current-draft";
const zones = {
  front: { label: "前区", max: 35, element: frontBoard },
  back: { label: "后区", max: 12, element: backBoard },
};

let eraseMode = false;
let history = readStorage(historyStorageKey);
let versions = readStorage(versionStorageKey);
let versionsUnlocked = sessionStorage.getItem(versionAuthStorageKey) === "true";
let currentBaseTitle = "";
let userAdjustedZoom = false;

function pad(value) {
  return String(value).padStart(2, "0");
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || min, min), max);
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function formatTime(date = new Date()) {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeColor(color) {
  return String(color || "").trim().toLowerCase();
}

function normalizePassword(value) {
  return String(value || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "");
}

function passwordMatches(value, expected) {
  return normalizePassword(value) === expected;
}

function getCell(row, zone, number) {
  return board.querySelector(`[data-row="${row}"][data-zone="${zone}"][data-number="${number}"]`);
}

function getBallData(ball) {
  const cell = ball.closest(".cell");
  return {
    row: Number(cell.dataset.row),
    zone: cell.dataset.zone,
    number: Number(cell.dataset.number),
    label: ball.textContent,
    color: normalizeColor(ball.dataset.color),
  };
}

function cloneBall(ball) {
  const number = Number(ball.number) || Number(ball.label) || 0;
  return {
    row: Number(ball.row) || 0,
    zone: ball.zone,
    number,
    label: String(ball.label || pad(number)),
    color: normalizeColor(ball.color) || "#999999",
  };
}

function cloneBalls(balls) {
  return (Array.isArray(balls) ? balls : []).filter(Boolean).map(cloneBall);
}

function makeBall(row, zone, number, color) {
  return { row, zone, number, label: pad(number), color };
}

function collectBalls() {
  return [...board.querySelectorAll(".ball")].map(getBallData);
}

function unlockPage() {
  appRoot.hidden = false;
  appLock.classList.add("is-hidden");
  versionsUnlocked = true;
  sessionStorage.setItem(versionAuthStorageKey, "true");
  renderVersions();
}

function updateBaseLabel() {
  currentBaseLabel.textContent = currentBaseTitle
    ? `当前编辑：基于 ${currentBaseTitle} 调整`
    : "当前编辑：空白画面";
}

function persistDraft() {
  writeStorage(draftStorageKey, {
    baseTitle: currentBaseTitle,
    updatedAt: formatTime(),
    balls: cloneBalls(collectBalls()),
  });
}

function addHistory(action, balls) {
  const normalizedBalls = cloneBalls(Array.isArray(balls) ? balls : [balls]);
  if (normalizedBalls.length === 0) return;

  history.unshift({
    id: makeId(),
    action,
    time: formatTime(),
    balls: normalizedBalls,
  });
  history = history.slice(0, 80);
  writeStorage(historyStorageKey, history);
  renderHistory();
}

function createChip(ball) {
  const cleanBall = cloneBall(ball);
  const chip = document.createElement("span");
  chip.className = "history-chip";
  chip.style.setProperty("--ball-color", cleanBall.color);
  chip.textContent = `${zones[cleanBall.zone]?.label || "未知区"}${pad(cleanBall.number)} / ${cleanBall.row}行`;
  chip.title = `颜色 ${cleanBall.color}`;
  return chip;
}

function createDetailRow(ball) {
  const cleanBall = cloneBall(ball);
  const row = document.createElement("div");
  row.className = "version-detail-row";
  row.style.setProperty("--ball-color", cleanBall.color);
  row.innerHTML = `
    <span class="detail-dot"></span>
    <strong>${zones[cleanBall.zone]?.label || "未知区"} ${pad(cleanBall.number)}</strong>
    <span>第 ${cleanBall.row} 行</span>
    <code>${cleanBall.color}</code>
  `;
  return row;
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "还没有记录";
    historyList.append(empty);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";
    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.innerHTML = `<strong>${entry.action}</strong><span>${entry.time}</span>`;
    const balls = document.createElement("div");
    balls.className = "history-balls";
    cloneBalls(entry.balls).forEach((ball) => balls.append(createChip(ball)));
    item.append(meta, balls);
    historyList.append(item);
  });
}

function updateCount() {
  ballCount.textContent = board.querySelectorAll(".ball").length;
}

function addBall(row, zone, number, label = numberInput.value, color = colorInput.value, shouldRecord = true) {
  const cell = getCell(row, zone, number);
  if (!cell) return;

  const previous = cell.querySelector(".ball");
  const cleanColor = normalizeColor(color);
  const cleanLabel = String(label || cell.dataset.value).slice(0, 2).padStart(2, "0");
  cell.innerHTML = `<span class="ball" data-color="${cleanColor}" style="--ball-color:${cleanColor}">${cleanLabel}</span>`;
  updateCount();

  if (shouldRecord) {
    addHistory(previous ? "替换球" : "添加球", { row, zone, number, label: cleanLabel, color: cleanColor });
    persistDraft();
  }
}

function removeBall(cell, shouldRecord = true, action = "删除球") {
  const ball = cell.querySelector(".ball");
  if (!ball) return null;

  const removed = getBallData(ball);
  cell.textContent = cell.dataset.value;
  updateCount();

  if (shouldRecord) {
    addHistory(action, removed);
    persistDraft();
  }

  return removed;
}

function clearBoard(shouldRecord = true) {
  const removed = collectBalls();
  board.querySelectorAll(".cell").forEach((cell) => removeBall(cell, false));
  updateCount();

  if (shouldRecord) {
    currentBaseTitle = "";
    updateBaseLabel();
    addHistory("清空画面", removed);
    persistDraft();
  }
}

function applyBalls(balls, options = {}) {
  clearBoard(false);
  cloneBalls(balls).forEach((ball) => addBall(ball.row, ball.zone, ball.number, ball.label, ball.color, false));
  updateCount();

  if (Object.prototype.hasOwnProperty.call(options, "baseTitle")) {
    currentBaseTitle = options.baseTitle || "";
  }

  updateBaseLabel();
  if (options.persist !== false) persistDraft();
}

function restoreDraft() {
  const draft = readStorage(draftStorageKey);
  if (!draft || !Array.isArray(draft.balls)) {
    updateBaseLabel();
    return;
  }

  currentBaseTitle = draft.baseTitle || "";
  applyBalls(draft.balls, { persist: false });
  updateBaseLabel();
}

function syncInputs(row, zone, number) {
  rowInput.value = row;
  zoneInput.value = zone;
  numberInput.max = zones[zone].max;
  numberInput.value = number;
}

function setColor(color) {
  colorInput.value = color;
  swatches.forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color.toLowerCase() === color.toLowerCase());
  });
}

function getBoardNaturalWidth() {
  const rootStyle = getComputedStyle(document.documentElement);
  const boardStyle = getComputedStyle(board);
  const cellSize = parseFloat(rootStyle.getPropertyValue("--cell")) || 28;
  const gap = parseFloat(boardStyle.gap) || 14;
  const paddingLeft = parseFloat(boardStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(boardStyle.paddingRight) || 0;
  return (zones.front.max + zones.back.max) * cellSize + gap + paddingLeft + paddingRight;
}

function setBoardZoom(value) {
  const zoom = Math.min(Math.max(value, 0.3), 1.3);
  document.documentElement.style.setProperty("--board-zoom", `${zoom}`);
  zoomInput.value = Math.round(zoom * 100);
}

function fitBoardToScreen(force = false) {
  if (userAdjustedZoom && !force) return;
  const availableWidth = boardWrap.clientWidth - 2;
  const naturalWidth = getBoardNaturalWidth();
  if (availableWidth <= 0 || naturalWidth <= 0) return;
  const zoom = Math.min(1, Math.max(0.3, availableWidth / naturalWidth));
  setBoardZoom(zoom);
}

function buildBoard() {
  Object.entries(zones).forEach(([zone, config]) => {
    const fragment = document.createDocumentFragment();
    for (let row = 1; row <= rows; row += 1) {
      for (let number = 1; number <= config.max; number += 1) {
        const cell = document.createElement("button");
        const value = pad(number);
        cell.type = "button";
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.zone = zone;
        cell.dataset.number = number;
        cell.dataset.value = value;
        cell.textContent = value;
        cell.title = `${config.label} 第 ${row} 行，${value} 号`;
        fragment.append(cell);
      }
    }
    config.element.append(fragment);
  });
}

function createBuiltInDrawBalls() {
  const red = "#d6202a";
  const blue = "#1768b7";
  const draws = [
    { issue: "2026051", date: "2026-05-11", front: [13, 18, 28, 32, 33], back: [2, 11] },
    { issue: "2026050", date: "2026-05-09", front: [6, 10, 14, 23, 33], back: [8, 10] },
    { issue: "2026049", date: "2026-05-06", front: [1, 6, 14, 15, 17], back: [2, 3] },
    { issue: "2026048", date: "2026-05-04", front: [11, 17, 20, 23, 35], back: [1, 10] },
    { issue: "2026047", date: "2026-05-02", front: [9, 20, 21, 23, 28], back: [6, 11] },
    { issue: "2026046", date: "2026-04-29", front: [1, 13, 18, 27, 33], back: [4, 7] },
    { issue: "2026045", date: "2026-04-27", front: [1, 15, 21, 26, 33], back: [4, 7] },
    { issue: "2026044", date: "2026-04-25", front: [3, 8, 22, 26, 29], back: [7, 10] },
    { issue: "2026043", date: "2026-04-22", front: [8, 12, 14, 19, 22], back: [11, 12] },
    { issue: "2026042", date: "2026-04-20", front: [2, 7, 13, 19, 24], back: [3, 8] },
    { issue: "2026041", date: "2026-04-18", front: [24, 25, 27, 29, 34], back: [2, 6] },
    { issue: "2026040", date: "2026-04-15", front: [6, 12, 13, 21, 34], back: [8, 9] },
    { issue: "2026039", date: "2026-04-13", front: [9, 11, 20, 26, 27], back: [6, 9] },
    { issue: "2026038", date: "2026-04-11", front: [8, 17, 21, 33, 35], back: [6, 7] },
    { issue: "2026037", date: "2026-04-08", front: [7, 12, 13, 28, 32], back: [6, 8] },
    { issue: "2026036", date: "2026-04-06", front: [4, 7, 16, 26, 32], back: [5, 8] },
    { issue: "2026035", date: "2026-04-04", front: [2, 22, 30, 33, 34], back: [8, 12] },
    { issue: "2026034", date: "2026-04-01", front: [11, 12, 25, 26, 27], back: [8, 11] },
    { issue: "2026033", date: "2026-03-30", front: [3, 5, 7, 9, 18], back: [2, 10] },
    { issue: "2026032", date: "2026-03-28", front: [3, 4, 19, 26, 32], back: [1, 12] },
    { issue: "2026031", date: "2026-03-25", front: [6, 8, 22, 29, 34], back: [5, 7] },
    { issue: "2026030", date: "2026-03-23", front: [2, 13, 22, 28, 34], back: [5, 12] },
    { issue: "2026029", date: "2026-03-21", front: [3, 5, 17, 33, 35], back: [5, 7] },
    { issue: "2026028", date: "2026-03-18", front: [15, 27, 29, 30, 34], back: [1, 10] },
    { issue: "2026027", date: "2026-03-16", front: [9, 10, 11, 12, 16], back: [1, 11] },
    { issue: "2026026", date: "2026-03-14", front: [10, 11, 22, 26, 32], back: [1, 8] },
    { issue: "2026025", date: "2026-03-11", front: [3, 15, 24, 28, 29], back: [3, 7] },
    { issue: "2026024", date: "2026-03-09", front: [2, 4, 8, 10, 21], back: [9, 12] },
    { issue: "2026023", date: "2026-03-07", front: [9, 25, 26, 27, 28], back: [1, 8] },
    { issue: "2026022", date: "2026-03-04", front: [5, 9, 10, 18, 26], back: [5, 6] },
    { issue: "2026021", date: "2026-03-02", front: [5, 8, 12, 14, 17], back: [4, 5] },
    { issue: "2026020", date: "2026-02-28", front: [1, 10, 21, 23, 29], back: [10, 12] },
    { issue: "2026019", date: "2026-02-25", front: [12, 13, 14, 16, 31], back: [4, 12] },
    { issue: "2026018", date: "2026-02-23", front: [9, 11, 19, 30, 35], back: [1, 12] },
    { issue: "2026017", date: "2026-02-21", front: [4, 5, 10, 23, 31], back: [7, 12] },
    { issue: "2026016", date: "2026-02-18", front: [8, 9, 12, 19, 24], back: [1, 6] },
    { issue: "2026015", date: "2026-02-16", front: [1, 4, 10, 13, 17], back: [3, 11] },
    { issue: "2026014", date: "2026-02-14", front: [16, 18, 23, 34, 35], back: [1, 6] },
    { issue: "2026013", date: "2026-02-11", front: [3, 5, 6, 23, 26], back: [1, 4] },
    { issue: "2026012", date: "2026-02-09", front: [1, 2, 9, 22, 25], back: [1, 6] },
    { issue: "2026011", date: "2026-02-07", front: [14, 21, 23, 29, 33], back: [2, 10] },
    { issue: "2026010", date: "2026-02-04", front: [2, 3, 13, 18, 26], back: [2, 9] },
    { issue: "2026009", date: "2026-02-02", front: [5, 12, 13, 14, 33], back: [5, 8] },
    { issue: "2026008", date: "2026-01-31", front: [3, 6, 17, 21, 33], back: [5, 11] },
    { issue: "2026007", date: "2026-01-28", front: [1, 3, 13, 20, 26], back: [3, 10] },
    { issue: "2026006", date: "2026-01-26", front: [5, 12, 18, 23, 35], back: [6, 12] },
    { issue: "2026005", date: "2026-01-24", front: [2, 4, 16, 23, 35], back: [6, 11] },
    { issue: "2026004", date: "2026-01-21", front: [5, 18, 23, 25, 32], back: [5, 9] },
    { issue: "2026003", date: "2026-01-19", front: [2, 9, 11, 15, 16], back: [2, 4] },
    { issue: "2026002", date: "2026-01-17", front: [4, 8, 15, 20, 31], back: [7, 8] },
  ];

  return [...draws].reverse().flatMap((draw, index) => {
    const row = index + 1;
    return [
      ...draw.front.map((number) => makeBall(row, "front", number, red)),
      ...draw.back.map((number) => makeBall(row, "back", number, blue)),
    ];
  });
}

function seedLatestDrawVersion() {
  const title = "2026-05-11版本";
  const id = "preset-latest-draw-2026051";
  const latestVersion = {
    id,
    time: "2026-05-11 00:00:00",
    timestamp: new Date("2026-05-11T00:00:00").getTime(),
    title,
    balls: createBuiltInDrawBalls(),
  };
  const existing = versions.find(
    (version) => version.id === id || version.id === "preset-5-11" || version.title?.includes("5.11") || version.title === title,
  );

  if (existing) {
    Object.assign(existing, latestVersion);
  } else {
    versions.unshift(latestVersion);
  }
  writeStorage(versionStorageKey, versions);
}

function saveVersion() {
  const balls = cloneBalls(collectBalls());
  const time = formatTime();
  const version = {
    id: makeId(),
    time,
    timestamp: Date.now(),
    title: `版本 ${time}`,
    balls: cloneBalls(balls),
  };

  versions.unshift(version);
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  currentBaseTitle = version.title;
  updateBaseLabel();
  persistDraft();
  renderVersions();
  showVersion(version.id);
  addHistory("保存版本", balls);
}

function extractDate(text) {
  const match = text.match(/\b(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?\b/);
  if (!match) return "";
  return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
}

function parseDrawLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const issue = line.match(/\b(20\d{5})\b/)?.[1] || "";
      const date = extractDate(line);
      const cleanLine = line
        .replace(/\b20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}日?\b/g, " ")
        .replace(/\b20\d{5,}\b/g, " ");
      const numbers = (cleanLine.match(/\b\d{1,2}\b/g) || []).map(Number);
      if (numbers.length < 7) return null;
      const drawNumbers = numbers.slice(-7);
      const front = drawNumbers.slice(0, 5);
      const back = drawNumbers.slice(5, 7);
      const validFront = front.every((number) => number >= 1 && number <= 35);
      const validBack = back.every((number) => number >= 1 && number <= 12);
      if (!validFront || !validBack) return null;
      return { issue, date, front, back };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aKey = a.issue || a.date || "";
      const bKey = b.issue || b.date || "";
      return aKey.localeCompare(bKey);
    });
}

function generateDrawVersion() {
  const drawText = drawDataInput.value.trim();
  const parsedDraws = parseDrawLines(drawText);
  if (parsedDraws.length === 0) {
    drawImportMessage.textContent = "没有解析到有效开奖数据。请保证每行至少包含 5 个前区和 2 个后区号码。";
    return;
  }

  const latestParsedDate = [...parsedDraws].reverse().find((draw) => draw.date)?.date;
  const date = drawDateInput.value || latestParsedDate || extractDate(drawText) || new Date().toISOString().slice(0, 10);
  const red = "#d6202a";
  const blue = "#1768b7";
  const sourceDraws = parsedDraws.slice(-rows);
  const balls = sourceDraws.flatMap((draw, index) => {
    const row = index + 1;
    return [
      ...draw.front.map((number) => makeBall(row, "front", number, red)),
      ...draw.back.map((number) => makeBall(row, "back", number, blue)),
    ];
  });
  const title = `${date}版本`;
  const version = {
    id: `manual-draw-${date}-${makeId()}`,
    time: `${date} 00:00:00`,
    timestamp: new Date(`${date}T00:00:00`).getTime() || Date.now(),
    title,
    balls,
  };

  versions.unshift(version);
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  drawImportMessage.textContent = `已生成 ${title}，共 ${sourceDraws.length} 期、${balls.length} 个球。`;
  applyBalls(balls, { baseTitle: title });
  addHistory(`生成 ${title}`, balls);
  renderVersions();
  showVersion(version.id);
}

function versionMatches(version, query) {
  if (!query) return true;
  const balls = cloneBalls(version.balls);
  const text = [
    version.title,
    version.time,
    balls.length,
    ...balls.flatMap((ball) => [zones[ball.zone]?.label || "", pad(ball.number), `${ball.row}行`, ball.color]),
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

function renderVersions() {
  document.querySelector(".version-shell").classList.toggle("locked", !versionsUnlocked);
  versionSearch.disabled = !versionsUnlocked;
  clearVersionsButton.disabled = !versionsUnlocked;
  lockVersionsButton.hidden = !versionsUnlocked;
  unlockVersionsButton.hidden = versionsUnlocked;
  versionPassword.hidden = versionsUnlocked;

  if (!versionsUnlocked) {
    versionList.innerHTML = `<li class="history-empty">验证后显示历史版本</li>`;
    versionPreviewTitle.textContent = "未验证";
    versionPreview.innerHTML = "";
    versionAuthMessage.textContent = "请输入密码后查看历史版本。";
    return;
  }

  versionAuthMessage.textContent = "已验证。历史版本是冻结快照，点击“在此基础上调整”只会复制到当前编辑区。";
  const query = versionSearch.value.trim();
  const matchedVersions = versions.filter((version) => versionMatches(version, query));
  versionList.innerHTML = "";

  if (matchedVersions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = query ? "没有匹配的历史版本" : "还没有历史版本";
    versionList.append(empty);
    return;
  }

  matchedVersions.forEach((version) => {
    const balls = cloneBalls(version.balls);
    const item = document.createElement("li");
    item.className = "version-item";

    const info = document.createElement("div");
    info.className = "version-info";
    info.innerHTML = `<strong>${version.title || "历史版本"}</strong><span>${balls.length} 个球</span>`;

    const actions = document.createElement("div");
    actions.className = "version-actions";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.textContent = "查看";
    viewButton.addEventListener("click", () => {
      showVersion(version.id);
      openVersionModal(version.id);
    });

    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.textContent = "在此基础上调整";
    restoreButton.addEventListener("click", () => {
      applyBalls(version.balls, { baseTitle: version.title || "历史版本" });
      showVersion(version.id);
      addHistory(`基于 ${version.title || "历史版本"} 调整`, version.balls);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => {
      versions = versions.filter((itemVersion) => itemVersion.id !== version.id);
      writeStorage(versionStorageKey, versions);
      renderVersions();
      versionPreviewTitle.textContent = "未选择版本";
      versionPreview.innerHTML = "";
    });

    actions.append(viewButton, restoreButton, deleteButton);
    item.append(info, actions);
    versionList.append(item);
  });
}

function showVersion(id) {
  const version = versions.find((item) => item.id === id);
  if (!version) return;

  const balls = cloneBalls(version.balls);
  versionPreviewTitle.textContent = `${version.title || "历史版本"}，共 ${balls.length} 个球`;
  versionPreview.innerHTML = "";
  versionPreview.className = "history-balls";

  const hint = document.createElement("span");
  hint.className = "history-empty";
  hint.textContent = balls.length === 0 ? "此版本为空" : "详细信息请点击“查看”打开。";
  versionPreview.append(hint);
}

function openVersionModal(id) {
  const version = versions.find((item) => item.id === id);
  if (!version) return;

  const balls = cloneBalls(version.balls);
  versionModalTitle.textContent = `${version.title || "历史版本"}，共 ${balls.length} 个球`;
  versionModalBody.innerHTML = "";
  if (balls.length === 0) {
    const empty = document.createElement("span");
    empty.className = "history-empty";
    empty.textContent = "此版本为空";
    versionModalBody.append(empty);
  } else {
    balls.forEach((ball) => versionModalBody.append(createDetailRow(ball)));
  }
  versionModal.hidden = false;
}

board.addEventListener("click", (event) => {
  const cell = event.target.closest(".cell");
  if (!cell) return;
  const row = Number(cell.dataset.row);
  const zone = cell.dataset.zone;
  const number = Number(cell.dataset.number);
  syncInputs(row, zone, number);
  if (eraseMode) {
    removeBall(cell);
    return;
  }
  addBall(row, zone, number, cell.dataset.value, colorInput.value);
});

addBallButton.addEventListener("click", () => {
  const row = clamp(rowInput.value, 1, rows);
  const zone = zoneInput.value;
  const number = clamp(numberInput.value, 1, zones[zone].max);
  rowInput.value = row;
  numberInput.value = number;
  addBall(row, zone, number, pad(number));
});

eraseButton.addEventListener("click", () => {
  eraseMode = !eraseMode;
  eraseButton.setAttribute("aria-pressed", String(eraseMode));
});

deleteColorButton.addEventListener("click", () => {
  const targetColor = normalizeColor(colorInput.value);
  const removed = [...board.querySelectorAll(".ball")]
    .filter((ball) => normalizeColor(ball.dataset.color) === targetColor)
    .map((ball) => removeBall(ball.closest(".cell"), false));
  addHistory(`删除颜色 ${targetColor}`, removed);
  persistDraft();
});

clearButton.addEventListener("click", () => clearBoard());

sampleButton.addEventListener("click", () => {
  const added = [];
  const colors = ["#d6202a", "#1768b7", "#14a365", "#f59e0b"];
  for (let row = 1; row <= rows; row += 1) {
    const frontOne = ((row * 7) % zones.front.max) + 1;
    const frontTwo = ((row * 13) % zones.front.max) + 1;
    const backOne = ((row * 5) % zones.back.max) + 1;
    [
      { zone: "front", number: frontOne, color: colors[0] },
      { zone: "front", number: frontTwo, color: colors[1] },
      { zone: "back", number: backOne, color: colors[1] },
    ].forEach((ball) => {
      addBall(row, ball.zone, ball.number, pad(ball.number), ball.color, false);
      added.push({ row, ...ball, label: pad(ball.number) });
    });
  }
  addHistory("生成示例", added);
  persistDraft();
});

saveHistoryButton.addEventListener("click", () => addHistory("保存记录", collectBalls()));
saveVersionButton.addEventListener("click", saveVersion);
generateDrawVersionButton.addEventListener("click", generateDrawVersion);

unlockAppButton.addEventListener("click", () => {
  if (passwordMatches(appPassword.value, pagePasswordValue)) {
    sessionStorage.setItem(pageAuthStorageKey, "true");
    appPassword.value = "";
    unlockPage();
    return;
  }
  appAuthMessage.textContent = "密码错误，请重新输入。";
  appPassword.select();
});

toggleAppPasswordButton.addEventListener("click", () => {
  const showing = appPassword.type === "text";
  appPassword.type = showing ? "password" : "text";
  toggleAppPasswordButton.textContent = showing ? "显示" : "隐藏";
});

appPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlockAppButton.click();
});

unlockVersionsButton.addEventListener("click", () => {
  if (passwordMatches(versionPassword.value, versionPasswordValue)) {
    versionsUnlocked = true;
    sessionStorage.setItem(versionAuthStorageKey, "true");
    versionPassword.value = "";
    renderVersions();
    return;
  }
  versionAuthMessage.textContent = "密码错误，请重新输入。";
  versionPassword.select();
});

versionPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlockVersionsButton.click();
});

lockVersionsButton.addEventListener("click", () => {
  versionsUnlocked = false;
  sessionStorage.removeItem(versionAuthStorageKey);
  renderVersions();
});

closeVersionModalButton.addEventListener("click", () => {
  versionModal.hidden = true;
});

versionModal.addEventListener("click", (event) => {
  if (event.target === versionModal) versionModal.hidden = true;
});

clearHistoryButton.addEventListener("click", () => {
  history = [];
  writeStorage(historyStorageKey, history);
  renderHistory();
});

clearVersionsButton.addEventListener("click", () => {
  versions = [];
  writeStorage(versionStorageKey, versions);
  renderVersions();
  versionPreviewTitle.textContent = "未选择版本";
  versionPreview.innerHTML = "";
});

versionSearch.addEventListener("input", renderVersions);

zoneInput.addEventListener("change", () => {
  const zone = zoneInput.value;
  numberInput.max = zones[zone].max;
  numberInput.value = clamp(numberInput.value, 1, zones[zone].max);
});

sizeInput.addEventListener("input", () => {
  document.documentElement.style.setProperty("--ball-size", `${sizeInput.value}px`);
});

zoomInput.addEventListener("input", () => {
  userAdjustedZoom = true;
  document.documentElement.style.setProperty("--board-zoom", `${zoomInput.value / 100}`);
});

colorInput.addEventListener("input", () => {
  swatches.forEach((swatch) => swatch.classList.remove("active"));
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => setColor(swatch.dataset.color));
});

buildBoard();
seedLatestDrawVersion();
restoreDraft();
updateCount();
renderHistory();
renderVersions();
sizeInput.value = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ball-size"), 10);
fitBoardToScreen(true);
window.addEventListener("resize", () => fitBoardToScreen());
if (sessionStorage.getItem(pageAuthStorageKey) === "true") unlockPage();
