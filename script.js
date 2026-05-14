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
const versionBanner = document.querySelector("#versionBanner");
const versionBannerText = document.querySelector("#versionBannerText");
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
const cancelEditDrawVersionButton = document.querySelector("#cancelEditDrawVersionButton");
const drawImportMessage = document.querySelector("#drawImportMessage");
const versionModal = document.querySelector("#versionModal");
const versionModalTitle = document.querySelector("#versionModalTitle");
const versionModalBody = document.querySelector("#versionModalBody");
const closeVersionModalButton = document.querySelector("#closeVersionModalButton");
const descInput = document.querySelector("#descInput");
const descAddButton = document.querySelector("#descAddButton");
const descHelpButton = document.querySelector("#descHelpButton");
const descHelpTip = document.querySelector("#descHelpTip");
const swatches = [...document.querySelectorAll(".swatch")];

const drawRows = 50;
const extraPickRows = 5;
const rows = drawRows + extraPickRows;
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
let editingDrawVersionId = "";
let rowIssues = {}; // { rowNumber: issueNumber }

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

function parseBallDescription(text) {
  // 中文数字转阿拉伯数字
  const cnToNum = (str) => {
    const cnMap = { "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10 };
    str = str.replace(/零/g, "0").replace(/一/g, "1").replace(/二/g, "2").replace(/三/g, "3").replace(/四/g, "4").replace(/五/g, "5").replace(/六/g, "6").replace(/七/g, "7").replace(/八/g, "8").replace(/九/g, "9").replace(/十/g, "10");
    return Number(str) || 0;
  };

  // 颜色映射
  const colorMap = {
    "红": "#d6202a", "红色": "#d6202a", "红球": "#d6202a",
    "蓝": "#1768b7", "蓝色": "#1768b7", "蓝球": "#1768b7",
    "绿": "#14a365", "绿色": "#14a365", "绿球": "#14a365",
    "橙": "#f59e0b", "橙色": "#f59e0b", "橙球": "#f59e0b", "橙色球": "#f59e0b",
    "紫": "#7c3aed", "紫色": "#7c3aed", "紫球": "#7c3aed",
    "黑": "#111827", "黑色": "#111827", "黑球": "#111827",
  };

  const normalized = String(text || "").replace(/\s+/g, "");

  // 识别区：前区 / 后区
  let zone = "front";
  if (/后区/.test(normalized)) zone = "back";
  else if (/前区/.test(normalized)) zone = "front";
  else return null; // 必须指定区

  // 识别行号（支持直接行号或期号映射）
  let row = 1;

  // 优先匹配 "第X行" 或 "X行" 作为直接行号
  const rowMatch = normalized.match(/(?:第)?([零一二三四五六七八九十\d]{1,2})行/);
  if (rowMatch) {
    row = clamp(cnToNum(rowMatch[1]), 1, rows);
  } else {
    // 没有直接行号，尝试匹配期号（如 2026051）映射为行号
    const issueMatch = normalized.match(/\b(20\d{5})\b/);
    if (issueMatch) {
      const issue = issueMatch[1];
      const foundRow = Object.entries(rowIssues).find(([, val]) => val === issue);
      if (foundRow) {
        row = Number(foundRow[0]);
      } else {
        // 期号不在当前 rowIssues 中，从末尾取 1-2 位作为行号
        const fallback = issue.match(/(\d{1,2})$/);
        if (fallback) row = clamp(Number(fallback[1]), 1, rows);
      }
    } else {
      return null; // 必须指定行号或期号
    }
  }

  // 识别颜色
  let color = colorInput.value;
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key)) {
      color = value;
      break;
    }
  }

  // 识别号码（支持逗号分隔的多个号码）
  // 匹配 "04,10,15,22,27" 或 "4,10,15,22,27" 格式
  const numStrMatch = normalized.match(/[\d,，]+(?=[红蓝绿橙紫黑])/);
  if (numStrMatch) {
    const nums = numStrMatch[0].split(/[,，]/).map(n => cnToNum(n.trim())).filter(n => n > 0);
    return { row, zone, numbers: nums, color };
  }

  // 单个号码
  const numMatch = normalized.match(/(?:第?)?([零一二三四五六七八九十\d]{1,2})(?:[号个])/);
  const number = numMatch ? clamp(cnToNum(numMatch[1]), 1, zones[zone].max) : clamp(Number(numberInput.value), 1, zones[zone].max);

  return { row, zone, number, color };
}

function isDrawVersion(version) {
  const title = String(version?.title || "");
  const id = String(version?.id || "");
  return (
    version?.kind === "draw" ||
    id.startsWith("manual-draw-") ||
    id.startsWith("preset-latest-draw-") ||
    /^\d{4}-\d{2}-\d{2}/.test(title)
  );
}

function normalizeVersionRecord(version) {
  if (!version) return version;
  version.kind = isDrawVersion(version) ? "draw" : version.kind || "custom";
  return version;
}

function normalizeExistingVersions() {
  versions = versions.map(normalizeVersionRecord);
  writeStorage(versionStorageKey, versions);
}

function getDateFromVersion(version) {
  const fromDate = String(version?.drawDate || "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const fromTitle = String(version?.title || "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const fromTime = String(version?.time || "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return fromDate || fromTitle || fromTime || "";
}

function reconstructDrawText(version) {
  if (version?.sourceText) return version.sourceText;
  const grouped = new Map();
  cloneBalls(version?.balls).forEach((ball) => {
    if (!grouped.has(ball.row)) grouped.set(ball.row, { front: [], back: [] });
    grouped.get(ball.row)[ball.zone === "back" ? "back" : "front"].push(ball.number);
  });
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, draw]) => [...draw.front, ...draw.back].map(pad).join(" "))
    .join("\n");
}

function clearDrawEditMode() {
  editingDrawVersionId = "";
  generateDrawVersionButton.textContent = "生成版本";
  cancelEditDrawVersionButton.hidden = true;
}

function startDrawEditMode(version) {
  editingDrawVersionId = version.id;
  drawDateInput.value = getDateFromVersion(version);
  drawDataInput.value = reconstructDrawText(version);
  generateDrawVersionButton.textContent = "保存修改";
  cancelEditDrawVersionButton.hidden = false;
  drawImportMessage.textContent = `正在修改 ${version.title || "开奖版本"}，保存后会覆盖这个版本。`;
  document.querySelector(".draw-import-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

function updateVersionBanner() {
  if (currentBaseTitle) {
    versionBanner.hidden = false;
    versionBannerText.textContent = currentBaseTitle;
  } else {
    versionBanner.hidden = true;
  }
}

function persistDraft() {
  writeStorage(draftStorageKey, {
    baseTitle: currentBaseTitle,
    updatedAt: formatTime(),
    balls: cloneBalls(collectBalls()),
    rowIssues: { ...rowIssues },
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

  // 检查是否已有球，如果有则叠加彩虹效果（黑色）
  if (previous) {
    const existingColors = previous.dataset.colors
      ? previous.dataset.colors.split(",")
      : [previous.dataset.color];
    if (!existingColors.includes(cleanColor)) {
      existingColors.push(cleanColor);
      const newColors = existingColors.join(",");
      previous.dataset.colors = newColors;
      previous.style.background = "#1f2937";
      previous.classList.add("rainbow-ball");
      updateCount();
      if (shouldRecord) {
        addHistory("叠加彩虹球", { row, zone, number, label: cleanLabel, color: newColors });
        persistDraft();
      }
      return;
    }
  }

  cell.innerHTML = `<span class="ball" data-color="${cleanColor}" style="--ball-color:${cleanColor}"><span class="ball-label">${cleanLabel}</span></span>`;
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
  rowIssues = {};
  updateCount();

  if (shouldRecord) {
    currentBaseTitle = "";
    updateBaseLabel();
    updateVersionBanner();
    addHistory("清空画面", removed);
    persistDraft();
  }
}

function updateRowLabels() {
  board.querySelectorAll(".row-label").forEach((label) => {
    const row = Number(label.dataset.row);
    const issue = rowIssues[row];
    const zone = label.dataset.zone;
    if (zone === "front" && issue) {
      // 前区：水平显示 "期号 行号"（去掉 "20" 前缀显示 5 位）
      const shortIssue = issue.replace(/^20(\d{5})$/, "$1");
      label.innerHTML = `<span class="row-label-issue">${shortIssue}</span><span class="row-label-num">${row}</span>`;
      label.title = `${shortIssue}期 第${row}行`;
    } else {
      // 后区或无极号：只显示行号
      label.innerHTML = `<span class="row-label-num">${row}</span>`;
      label.title = `第${row}行`;
    }
  });
}

function applyBalls(balls, options = {}) {
  clearBoard(false);
  if (options.rowIssues) {
    rowIssues = { ...options.rowIssues };
  }
  cloneBalls(balls).forEach((ball) => addBall(ball.row, ball.zone, ball.number, ball.label, ball.color, false));
  updateCount();
  updateRowLabels();

  if (Object.prototype.hasOwnProperty.call(options, "baseTitle")) {
    currentBaseTitle = options.baseTitle || "";
  }

  updateBaseLabel();
  updateVersionBanner();
  if (options.persist !== false) persistDraft();
}

function restoreDraft() {
  const draft = readStorage(draftStorageKey);
  if (!draft || !Array.isArray(draft.balls)) {
    updateBaseLabel();
    return;
  }

  currentBaseTitle = draft.baseTitle || "";
  if (draft.rowIssues) rowIssues = { ...draft.rowIssues };
  applyBalls(draft.balls, { persist: false });
  updateBaseLabel();
  updateVersionBanner();
  updateRowLabels();
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
      // Row number label
      const labelCell = document.createElement("div");
      labelCell.className = "row-label";
      labelCell.dataset.row = row;
      labelCell.dataset.zone = zone;
      labelCell.textContent = row;
      labelCell.title = `第${row}行`;
      fragment.append(labelCell);

      for (let number = 1; number <= config.max; number += 1) {
        const cell = document.createElement("button");
        const value = pad(number);
        cell.type = "button";
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.zone = zone;
        cell.dataset.number = number;
        cell.dataset.value = value;
        if (row > drawRows) cell.dataset.pick = "true";
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
    { issue: "26051", date: "2026-05-11", front: [13, 18, 28, 32, 33], back: [2, 11] },
    { issue: "26050", date: "2026-05-09", front: [6, 10, 14, 23, 33], back: [8, 10] },
    { issue: "26049", date: "2026-05-06", front: [1, 6, 14, 15, 17], back: [2, 3] },
    { issue: "26048", date: "2026-05-04", front: [11, 17, 20, 23, 35], back: [1, 10] },
    { issue: "26047", date: "2026-05-02", front: [9, 20, 21, 23, 28], back: [6, 11] },
    { issue: "26046", date: "2026-04-29", front: [1, 13, 18, 27, 33], back: [4, 7] },
    { issue: "26045", date: "2026-04-27", front: [1, 15, 21, 26, 33], back: [4, 7] },
    { issue: "26044", date: "2026-04-25", front: [3, 8, 22, 26, 29], back: [7, 10] },
    { issue: "26043", date: "2026-04-22", front: [8, 12, 14, 19, 22], back: [11, 12] },
    { issue: "26042", date: "2026-04-20", front: [2, 7, 13, 19, 24], back: [3, 8] },
    { issue: "26041", date: "2026-04-18", front: [24, 25, 27, 29, 34], back: [2, 6] },
    { issue: "26040", date: "2026-04-15", front: [6, 12, 13, 21, 34], back: [8, 9] },
    { issue: "26039", date: "2026-04-13", front: [9, 11, 20, 26, 27], back: [6, 9] },
    { issue: "26038", date: "2026-04-11", front: [8, 17, 21, 33, 35], back: [6, 7] },
    { issue: "26037", date: "2026-04-08", front: [7, 12, 13, 28, 32], back: [6, 8] },
    { issue: "26036", date: "2026-04-06", front: [4, 7, 16, 26, 32], back: [5, 8] },
    { issue: "26035", date: "2026-04-04", front: [2, 22, 30, 33, 34], back: [8, 12] },
    { issue: "26034", date: "2026-04-01", front: [11, 12, 25, 26, 27], back: [8, 11] },
    { issue: "26033", date: "2026-03-30", front: [3, 5, 7, 9, 18], back: [2, 10] },
    { issue: "26032", date: "2026-03-28", front: [3, 4, 19, 26, 32], back: [1, 12] },
    { issue: "26031", date: "2026-03-25", front: [6, 8, 22, 29, 34], back: [5, 7] },
    { issue: "26030", date: "2026-03-23", front: [2, 13, 22, 28, 34], back: [5, 12] },
    { issue: "26029", date: "2026-03-21", front: [3, 5, 17, 33, 35], back: [5, 7] },
    { issue: "26028", date: "2026-03-18", front: [15, 27, 29, 30, 34], back: [1, 10] },
    { issue: "26027", date: "2026-03-16", front: [9, 10, 11, 12, 16], back: [1, 11] },
    { issue: "26026", date: "2026-03-14", front: [10, 11, 22, 26, 32], back: [1, 8] },
    { issue: "26025", date: "2026-03-11", front: [3, 15, 24, 28, 29], back: [3, 7] },
    { issue: "26024", date: "2026-03-09", front: [2, 4, 8, 10, 21], back: [9, 12] },
    { issue: "26023", date: "2026-03-07", front: [9, 25, 26, 27, 28], back: [1, 8] },
    { issue: "26022", date: "2026-03-04", front: [5, 9, 10, 18, 26], back: [5, 6] },
    { issue: "26021", date: "2026-03-02", front: [5, 8, 12, 14, 17], back: [4, 5] },
    { issue: "26020", date: "2026-02-28", front: [1, 10, 21, 23, 29], back: [10, 12] },
    { issue: "26019", date: "2026-02-25", front: [12, 13, 14, 16, 31], back: [4, 12] },
    { issue: "26018", date: "2026-02-23", front: [9, 11, 19, 30, 35], back: [1, 12] },
    { issue: "26017", date: "2026-02-21", front: [4, 5, 10, 23, 31], back: [7, 12] },
    { issue: "26016", date: "2026-02-18", front: [8, 9, 12, 19, 24], back: [1, 6] },
    { issue: "26015", date: "2026-02-16", front: [1, 4, 10, 13, 17], back: [3, 11] },
    { issue: "26014", date: "2026-02-14", front: [16, 18, 23, 34, 35], back: [1, 6] },
    { issue: "26013", date: "2026-02-11", front: [3, 5, 6, 23, 26], back: [1, 4] },
    { issue: "26012", date: "2026-02-09", front: [1, 2, 9, 22, 25], back: [1, 6] },
    { issue: "26011", date: "2026-02-07", front: [14, 21, 23, 29, 33], back: [2, 10] },
    { issue: "26010", date: "2026-02-04", front: [2, 3, 13, 18, 26], back: [2, 9] },
    { issue: "26009", date: "2026-02-02", front: [5, 12, 13, 14, 33], back: [5, 8] },
    { issue: "26008", date: "2026-01-31", front: [3, 6, 17, 21, 33], back: [5, 11] },
    { issue: "26007", date: "2026-01-28", front: [1, 3, 13, 20, 26], back: [3, 10] },
    { issue: "26006", date: "2026-01-26", front: [5, 12, 18, 23, 35], back: [6, 12] },
    { issue: "26005", date: "2026-01-24", front: [2, 4, 16, 23, 35], back: [6, 11] },
    { issue: "26004", date: "2026-01-21", front: [5, 18, 23, 25, 32], back: [5, 9] },
    { issue: "26003", date: "2026-01-19", front: [2, 9, 11, 15, 16], back: [2, 4] },
    { issue: "26002", date: "2026-01-17", front: [4, 8, 15, 20, 31], back: [7, 8] },
  ];

  // Populate rowIssues
  rowIssues = {};
  [...draws].reverse().forEach((draw, index) => {
    const row = index + 1;
    rowIssues[row] = draw.issue;
  });

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
  // Build balls first to populate rowIssues
  const balls = createBuiltInDrawBalls();
  const latestVersion = {
    id,
    kind: "draw",
    drawDate: "2026-05-11",
    protected: true,
    time: "2026-05-11 00:00:00",
    timestamp: new Date("2026-05-11T00:00:00").getTime(),
    title,
    rowIssues: { ...rowIssues },
    balls,
  };
  const existing = versions.find(
    (version) => version.id === id || version.id === "preset-5-11" || version.title?.includes("5.11") || version.title === title,
  );

  if (existing) {
    Object.assign(existing, latestVersion);
  } else {
    versions.push(latestVersion);
  }
  writeStorage(versionStorageKey, versions);
}

function saveVersion() {
  const balls = cloneBalls(collectBalls());
  const time = formatTime();
  const version = {
    id: makeId(),
    kind: "custom",
    time,
    timestamp: Date.now(),
    title: `版本 ${time}`,
    balls: cloneBalls(balls),
  };

  versions.push(version);
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  currentBaseTitle = version.title;
  updateBaseLabel();
  updateVersionBanner();
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
      // 提取期号并转为5位格式（如 26052）
      const fullIssue = line.match(/\b(20\d{5})\b/)?.[1] || "";
      const issue = fullIssue.replace(/^20(\d{5})$/, "$1");
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

function extractDrawDate(text) {
  const normalized = String(text || "")
    .replace(/[年月]/g, "-")
    .replace(/日/g, "");
  const match = normalized.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (!match) return "";
  return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
}

function parseDrawLinesSafe(text) {
  // 预处理：移除 Markdown 表格分隔线（如 | --- | --- | --- |）
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !line.match(/^\|[\s\-:|]+\|$/) && Boolean(line));

  return lines.map((line) => {
    let issue = "";
    let cleanLine = line;

    // 处理 Markdown 表格格式：| 26052 | 02 03 20 28 33 | 02 12 |
    const mdMatch = line.match(/^\|\s*(\d{5})\s*\|\s*([\d\s]+)\s*\|\s*([\d\s]+)\s*\|/);
    if (mdMatch) {
      issue = mdMatch[1];
      const frontNums = mdMatch[2].trim().split(/\s+/).map(Number);
      const backNums = mdMatch[3].trim().split(/\s+/).map(Number);
      if (frontNums.length === 5 && backNums.length === 2) {
        const front = frontNums;
        const back = backNums;
        if (front.every((n) => n >= 1 && n <= 35) && back.every((n) => n >= 1 && n <= 12)) {
          return { issue, date: "", front, back };
        }
      }
    }

    // 原始解析逻辑：支持普通文本格式
    // 先匹配7位期号
    const fullIssue = line.match(/\b(20\d{5})\b/)?.[1];
    if (fullIssue) {
      issue = fullIssue.replace(/^20(\d{5})$/, "$1");
      cleanLine = cleanLine.replace(fullIssue, " ");
    } else {
      // 再尝试匹配行首的5位期号
      const fiveDigitMatch = line.match(/^\s*(\d{5})\b/);
      if (fiveDigitMatch) {
        issue = fiveDigitMatch[1];
        cleanLine = cleanLine.replace(fiveDigitMatch[0], " ");
      }
    }

    const date = extractDrawDate(line);
    cleanLine = cleanLine
      .replace(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, " ")
      .replace(/20\d{2}年\d{1,2}月\d{1,2}日?/g, " ");

    const numbers = (cleanLine.match(/\b\d{1,2}\b/g) || []).map(Number);
    if (numbers.length < 7) return null;
    const drawNumbers = numbers.slice(-7);
    const front = drawNumbers.slice(0, 5);
    const back = drawNumbers.slice(5, 7);
    if (!front.every((number) => number >= 1 && number <= 35)) return null;
    if (!back.every((number) => number >= 1 && number <= 12)) return null;
    return { issue, date, front, back };
  }).filter(Boolean).sort((a, b) => {
    const aKey = a.issue || a.date || "";
    const bKey = b.issue || b.date || "";
    return aKey.localeCompare(bKey);
  });
}

function generateDrawVersion() {
  const drawText = drawDataInput.value.trim();
  const parsedDraws = parseDrawLinesSafe(drawText);
  if (parsedDraws.length === 0) {
    drawImportMessage.textContent = "没有解析到有效开奖数据。请保证每行至少包含 5 个前区和 2 个后区号码。";
    return;
  }

  const latestParsedDate = [...parsedDraws].reverse().find((draw) => draw.date)?.date;
  const date = drawDateInput.value || latestParsedDate || extractDrawDate(drawText) || new Date().toISOString().slice(0, 10);
  const red = "#d6202a";
  const blue = "#1768b7";
  const sourceDraws = parsedDraws.slice(-drawRows);
  const newRowIssues = {};
  const balls = sourceDraws.flatMap((draw, index) => {
    const row = index + 1;
    newRowIssues[row] = draw.issue || `${draw.date}-${row}`;
    return [
      ...draw.front.map((number) => makeBall(row, "front", number, red)),
      ...draw.back.map((number) => makeBall(row, "back", number, blue)),
    ];
  });
  const title = `${date}版本`;
  const version = {
    id: editingDrawVersionId || `manual-draw-${date}-${makeId()}`,
    kind: "draw",
    drawDate: date,
    sourceText: drawText,
    rowIssues: newRowIssues,
    time: `${date} 00:00:00`,
    timestamp: new Date(`${date}T00:00:00`).getTime() || Date.now(),
    title,
    balls,
  };

  const wasEditing = Boolean(editingDrawVersionId);
  if (wasEditing) {
    const index = versions.findIndex((item) => item.id === editingDrawVersionId);
    if (index >= 0) {
      versions[index] = { ...versions[index], ...version };
    } else {
      versions.push(version);
    }
  } else {
    versions.push(version);
  }
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  clearDrawEditMode();
  drawImportMessage.textContent = `${wasEditing ? "已修改" : "已生成"} ${title}，共 ${sourceDraws.length} 期、${balls.length} 个球。`;
  applyBalls(balls, { baseTitle: title, rowIssues: newRowIssues });
  addHistory(`${wasEditing ? "修改" : "生成"} ${title}`, balls);
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
    info.innerHTML = `<strong>${version.title || "历史版本"}</strong><span>${balls.length} 个球 · ${isDrawVersion(version) ? "开奖版本" : "调整版本"}</span>`;

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
      applyBalls(version.balls, { baseTitle: version.title || "历史版本", rowIssues: version.rowIssues });
      showVersion(version.id);
      addHistory(`基于 ${version.title || "历史版本"} 调整`, version.balls);
    });

    if (isDrawVersion(version) && !version.protected) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "修改";
      editButton.addEventListener("click", () => startDrawEditMode(version));
      actions.append(editButton);
    }

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
  if (eraseMode) {
    removeBall(cell);
    return;
  }
  syncInputs(row, zone, number);
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
  board.classList.toggle("erase-mode", eraseMode);
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

function handleDescAdd() {
  const text = descInput.value.trim();
  if (!text) return;

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return;

  // 检测格式
  const isMarkdownTable = lines.some(line => line.match(/^\|\s*\d+\s*\|/));
  const isTabSeparated = lines.some(line => line.includes('\t'));

  let addedCount = 0;

  if (isMarkdownTable) {
    // 解析 Markdown 表格格式
    const currentColor = colorInput.value;
    for (const line of lines) {
      const match = line.match(/^\|\s*(\d+)\s*\|\s*([\d\s]+)\s*\|\s*([\d\s]+)\s*\|/);
      if (!match) continue;

      const row = parseInt(match[1], 10);
      const frontNums = match[2].trim().split(/\s+/).map(Number);
      const backNums = match[3].trim().split(/\s+/).map(Number);

      if (frontNums.length === 5 && backNums.length === 2) {
        // 添加前区号码
        for (const num of frontNums) {
          const cell = getCell(row, "front", num);
          if (cell) {
            const existing = cell.querySelector(".ball");
            if (!existing) {
              addBall(row, "front", num, pad(num), currentColor, false);
              addedCount++;
            } else {
              addBall(row, "front", num, pad(num), currentColor, false);
            }
          }
        }
        // 添加后区号码
        for (const num of backNums) {
          const cell = getCell(row, "back", num);
          if (cell) {
            const existing = cell.querySelector(".ball");
            if (!existing) {
              addBall(row, "back", num, pad(num), currentColor, false);
              addedCount++;
            } else {
              addBall(row, "back", num, pad(num), currentColor, false);
            }
          }
        }
      }
    }
  } else if (isTabSeparated) {
    // 支持制表符分隔格式（如从Excel复制的数据）
    const currentColor = colorInput.value;
    for (const line of lines) {
      const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
      // 跳过表头
      if (parts[0] === '序号' || parts[0] === '顺序' || isNaN(parseInt(parts[0], 10))) continue;

      if (parts.length >= 3) {
        const row = parseInt(parts[0], 10);
        if (row < 1 || row > rows) continue;

        const frontNums = parts[1].split(/\s+/).map(Number).filter(n => n > 0 && n <= 35);
        const backNums = parts[2].split(/\s+/).map(Number).filter(n => n > 0 && n <= 12);

        if (frontNums.length === 5 && backNums.length === 2) {
          // 添加前区号码
          for (const num of frontNums) {
            const cell = getCell(row, "front", num);
            if (cell) {
              const existing = cell.querySelector(".ball");
              if (!existing) {
                addBall(row, "front", num, pad(num), currentColor, false);
                addedCount++;
              } else {
                addBall(row, "front", num, pad(num), currentColor, false);
              }
            }
          }
          // 添加后区号码
          for (const num of backNums) {
            const cell = getCell(row, "back", num);
            if (cell) {
              const existing = cell.querySelector(".ball");
              if (!existing) {
                addBall(row, "back", num, pad(num), currentColor, false);
                addedCount++;
              } else {
                addBall(row, "back", num, pad(num), currentColor, false);
              }
            }
          }
        }
      }
    }
  } else {
    // 原有的单条/批量格式解析
    const batchLines = text.split(/[\n;；]/).filter(l => l.trim());
    let lastResult = null;

    for (const line of batchLines) {
      const result = parseBallDescription(line.trim());
      if (!result) continue;

      // 如果是多个号码（逗号分隔）
      if (result.numbers && result.numbers.length > 0) {
        for (const num of result.numbers) {
          const cell = getCell(result.row, result.zone, num);
          if (cell) {
            const existing = cell.querySelector(".ball");
            if (!existing) {
              addBall(result.row, result.zone, num, pad(num), result.color, false);
              addedCount++;
            } else {
              // 已有球，叠加颜色
              addBall(result.row, result.zone, num, pad(num), result.color, false);
            }
          }
        }
      } else {
        // 单个号码
        const cell = getCell(result.row, result.zone, result.number);
        if (cell) {
          const existing = cell.querySelector(".ball");
          if (!existing) {
            addBall(result.row, result.zone, result.number, pad(result.number), result.color, false);
            addedCount++;
          } else {
            // 已有球，叠加颜色
            addBall(result.row, result.zone, result.number, pad(result.number), result.color, false);
          }
        }
      }
      lastResult = result;
    }
  }

  if (addedCount > 0) {
    addHistory(`按描述添加 ${addedCount} 个球`, cloneBalls(collectBalls()));
    persistDraft();
    updateCount();
    descInput.value = "";
    descInput.placeholder = `已添加 ${addedCount} 个球`;
  } else {
    descInput.select();
  }
}

descAddButton.addEventListener("click", handleDescAdd);
descInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") descAddButton.click();
});
descHelpButton.addEventListener("click", () => {
  const isHidden = descHelpTip.hidden;
  descHelpTip.hidden = !isHidden;
  descHelpButton.textContent = isHidden ? "×" : "?";
  if (isHidden) descHelpTip.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

sampleButton.addEventListener("click", () => {
  const added = [];
  const colors = ["#d6202a", "#1768b7", "#14a365", "#f59e0b"];
  for (let row = 1; row <= drawRows; row += 1) {
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
cancelEditDrawVersionButton.addEventListener("click", () => {
  clearDrawEditMode();
  drawImportMessage.textContent = "已取消修改。";
});

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
  const removedCount = versions.filter((version) => !isDrawVersion(version)).length;
  versions = versions.filter(isDrawVersion);
  writeStorage(versionStorageKey, versions);
  renderVersions();
  versionPreviewTitle.textContent = "未选择版本";
  versionPreview.innerHTML = "";
  versionAuthMessage.textContent = `已清空 ${removedCount} 个普通调整版本，开奖版本已保留。`;
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
normalizeExistingVersions();
seedLatestDrawVersion();
normalizeExistingVersions();
// Auto-load the latest draw version (always load latest version, ignore draft)
const drawVersions = versions.filter((v) => isDrawVersion(v));
const latest = drawVersions.length > 0
  ? drawVersions.reduce((a, b) => (a.timestamp || 0) > (b.timestamp || 0) ? a : b)
  : null;
if (latest) {
  applyBalls(latest.balls, { baseTitle: latest.title || "最新开奖", rowIssues: latest.rowIssues, persist: true });
} else {
  restoreDraft();
}
updateRowLabels();
updateVersionBanner();
updateCount();
renderHistory();
renderVersions();
sizeInput.value = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ball-size"), 10);
fitBoardToScreen(true);
window.addEventListener("resize", () => fitBoardToScreen());
if (sessionStorage.getItem(pageAuthStorageKey) === "true") unlockPage();
