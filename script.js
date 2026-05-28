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
const captureBoardButton = document.querySelector("#captureBoardButton");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const clearVersionsButton = document.querySelector("#clearVersionsButton");
const ballCount = document.querySelector("#ballCount");
const currentBaseLabel = document.querySelector("#currentBaseLabel");
const versionBanner = document.querySelector("#versionBanner");
const versionBannerText = document.querySelector("#versionBannerText");
const historyList = document.querySelector("#historyList");
const versionList = document.querySelector("#versionList");
const versionSearch = document.querySelector("#versionSearch");
const compareVersionsButton = document.querySelector("#compareVersionsButton");
const versionPassword = document.querySelector("#versionPassword");
const unlockVersionsButton = document.querySelector("#unlockVersionsButton");
const lockVersionsButton = document.querySelector("#lockVersionsButton");
const versionAuthMessage = document.querySelector("#versionAuthMessage");
const versionPreview = document.querySelector("#versionPreview");
const versionPreviewTitle = document.querySelector("#versionPreviewTitle");
const drawDateInput = document.querySelector("#drawDateInput");
const drawDataInput = document.querySelector("#drawDataInput");
const drawFileInput = document.querySelector("#drawFileInput");
const generateDrawVersionButton = document.querySelector("#generateDrawVersionButton");
const cancelEditDrawVersionButton = document.querySelector("#cancelEditDrawVersionButton");
const drawImportMessage = document.querySelector("#drawImportMessage");
const versionModal = document.querySelector("#versionModal");
const versionModalTitle = document.querySelector("#versionModalTitle");
const versionModalBody = document.querySelector("#versionModalBody");
const closeVersionModalButton = document.querySelector("#closeVersionModalButton");
const compareModal = document.querySelector("#compareModal");
const compareVersionOne = document.querySelector("#compareVersionOne");
const compareVersionTwo = document.querySelector("#compareVersionTwo");
const compareVersionThree = document.querySelector("#compareVersionThree");
const compareHint = document.querySelector("#compareHint");
const applyCompareButton = document.querySelector("#applyCompareButton");
const saveCompareButton = document.querySelector("#saveCompareButton");
const closeCompareModalButton = document.querySelector("#closeCompareModalButton");
const descInput = document.querySelector("#descInput");
const descFileInput = document.querySelector("#descFileInput");
const descAddButton = document.querySelector("#descAddButton");
const descHelpButton = document.querySelector("#descHelpButton");
const descHelpTip = document.querySelector("#descHelpTip");
const swatches = [...document.querySelectorAll(".swatch")];

const drawRows = 35;
const extraPickRows = 10;
const rows = drawRows + extraPickRows;
const pagePasswordValue = "zk@001";
const versionPasswordValue = "zk@001";
const pageAuthStorageKey = "lottery-page-auth";
const versionAuthStorageKey = "lottery-version-auth";
const historyStorageKey = "lottery-board-history";
const versionStorageKey = "lottery-board-versions";
const draftStorageKey = "lottery-board-current-draft";
const browserOnlyStorage = globalThis.localStorage;
const localVersionNotice =
  "\u7248\u672c\u4fe1\u606f\u4f1a\u4fdd\u5b58\u5728\u5f53\u524d\u6d4f\u89c8\u5668\u672c\u673a\uff0c\u540c\u65f6\u4e0b\u8f7d\u5230\u4f60\u7684\u672c\u5730\u6587\u4ef6\u3002";
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
let rowIssues = {};
let activeCompareSelection = [];
let compareSourceVersionId = "";

function pad(value) {
  return String(value).padStart(2, "0");
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || min, min), max);
}

function readStorage(key) {
  try {
    return JSON.parse(browserOnlyStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  browserOnlyStorage.setItem(key, JSON.stringify(value));
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

function boostCaptureBallColor(color) {
  const normalized = normalizeColor(color);
  const boostMap = {
    "#d6202a": "#c91721",
    "#1768b7": "#0f5aa8",
    "#14a365": "#0f8f58",
    "#f59e0b": "#db8500",
    "#7c3aed": "#6b21d9",
    "#111827": "#111827",
  };
  return boostMap[normalized] || color;
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
  const rawColors = ball.dataset.colors;
  const colors = rawColors ? rawColors.split(",").filter(Boolean).map(normalizeColor) : null;
  return {
    row: Number(cell.dataset.row),
    zone: cell.dataset.zone,
    number: Number(cell.dataset.number),
    label: ball.textContent,
    color: normalizeColor(ball.dataset.color),
    colors: colors && colors.length > 1 ? colors : null,
    protected: ball.dataset.protected === "true",
  };
}

function cloneBall(ball) {
  const number = Number(ball.number) || Number(ball.label) || 0;
  const result = {
    row: Number(ball.row) || 0,
    zone: ball.zone,
    number,
    label: String(ball.label || pad(number)),
    color: normalizeColor(ball.color) || "#999999",
  };
  if (ball.colors && Array.isArray(ball.colors) && ball.colors.length > 1) {
    result.colors = ball.colors.map(normalizeColor).filter(Boolean);
  }
  if (ball.protected) {
    result.protected = true;
  }
  return result;
}

function cloneBalls(balls) {
  return (Array.isArray(balls) ? balls : []).filter(Boolean).map(cloneBall);
}

function makeBall(row, zone, number, color) {
  return { row, zone, number, label: pad(number), color };
}

function parseBallDescription(text) {
  const normalized = String(text || "").replace(/\s+/g, "");
  const zone = normalized.includes("后区") ? "back" : normalized.includes("前区") ? "front" : "";
  if (!zone) return null;

  const colorMap = {
    红: "#d6202a",
    蓝: "#1768b7",
    绿: "#14a365",
    橙: "#f59e0b",
    紫: "#7c3aed",
    黑: "#111827",
  };
  const colorKey = Object.keys(colorMap).find((key) => normalized.includes(key));
  const color = colorKey ? colorMap[colorKey] : colorInput.value;

  const issueMatch = normalized.match(/\b(20?\d{5})\b/);
  const rowMatch = normalized.match(/(\d{1,2})行/);
  let row = rowMatch ? Number(rowMatch[1]) : 0;
  if (!row && issueMatch) {
    const issue = normalizeIssue(issueMatch[1]);
    const found = Object.entries(rowIssues).find(([, value]) => normalizeIssue(value) === issue);
    row = found ? Number(found[0]) : 0;
  }
  if (!row) return null;

  const numberPart = normalized
    .replace(/20?\d{5}/g, "")
    .replace(/\d{1,2}行/g, "")
    .replace(/[前后]区/g, "")
    .replace(/[红蓝绿橙紫黑]色?球?/g, "");
  const numbers = (numberPart.match(/\d{1,2}/g) || [])
    .map(Number)
    .filter((number) => number >= 1 && number <= zones[zone].max);
  return numbers.length > 0 ? { row: clamp(row, 1, rows), zone, numbers, color } : null;
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
  fitBoardToScreen(true);
}

function updateBaseLabel() {
  currentBaseLabel.textContent = currentBaseTitle
    ? `当前编辑：基于 ${currentBaseTitle} 调整`
    : "当前编辑：空白画面";
}

function updateVersionBanner() {
  if (!versionBanner || !versionBannerText) return;
  versionBanner.hidden = !currentBaseTitle;
  versionBannerText.textContent = currentBaseTitle;
}

function getVersionLabel(version) {
  const title = version?.title || "历史版本";
  const time = version?.time ? ` / ${version.time}` : "";
  return `${title}${time}`;
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
  if (!historyList) return;
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

function addBall(row, zone, number, label = numberInput.value, color = colorInput.value, shouldRecord = true, existingColors = null, options = {}) {
  const cell = getCell(row, zone, number);
  if (!cell) return;

  const previous = cell.querySelector(".ball");
  const cleanColor = normalizeColor(color);
  const cleanLabel = String(label || cell.dataset.value).slice(0, 2).padStart(2, "0");
  const isProtected = Boolean(options.protected) || previous?.dataset.protected === "true";
  const protectedAttr = isProtected ? ' data-protected="true"' : "";

  // 从版本恢复彩虹球（shouldRecord=false 且 existingColors 包含多种颜色）
  if (!shouldRecord && existingColors && existingColors.length > 1) {
    const colorsStr = existingColors.join(",");
    cell.innerHTML = `<span class="ball rainbow-ball" data-color="${cleanColor}" data-colors="${colorsStr}"${protectedAttr} style="--ball-color:#1f2937;background:#1f2937">${cleanLabel}</span>`;
    updateCount();
    return;
  }

  // 检查是否已有球，如果有则叠加彩虹效果（黑色）
  if (previous) {
    const existingColorsArr = previous.dataset.colors
      ? previous.dataset.colors.split(",")
      : [previous.dataset.color];
    const shouldStackAsBlack = !shouldRecord || !existingColorsArr.includes(cleanColor);
    if (shouldStackAsBlack) {
      const hadColor = existingColorsArr.includes(cleanColor);
      if (!hadColor) {
        existingColorsArr.push(cleanColor);
      }
      const newColors = existingColorsArr.join(",");
      previous.dataset.colors = newColors;
      if (isProtected) previous.dataset.protected = "true";
      previous.style.background = "#1f2937";
      previous.classList.add("rainbow-ball");
      updateCount();
      if (shouldRecord) {
        addHistory("叠加彩虹球", { row, zone, number, label: cleanLabel, color: newColors, colors: existingColorsArr });
        persistDraft();
      }
      return;
    }
  }

  cell.innerHTML = `<span class="ball" data-color="${cleanColor}"${protectedAttr} style="--ball-color:${cleanColor}">${cleanLabel}</span>`;
  updateCount();

  if (shouldRecord) {
    addHistory(previous ? "替换球" : "添加球", { row, zone, number, label: cleanLabel, color: cleanColor });
    persistDraft();
  }
}

function removeBall(cell, shouldRecord = true, action = "删除球", options = {}) {
  const ball = cell.querySelector(".ball");
  if (!ball) return null;
  if (ball.dataset.protected === "true" && !options.force) return null;

  const removed = getBallData(ball);
  cell.textContent = cell.dataset.value;
  updateCount();

  if (shouldRecord) {
    addHistory(action, removed);
    persistDraft();
  }

  return removed;
}

function clearBoard(shouldRecord = true, force = false) {
  const removed = [];
  board.querySelectorAll(".cell").forEach((cell) => {
    const removedBall = removeBall(cell, false, "删除球", { force });
    if (removedBall) removed.push(removedBall);
  });
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
    if (label.dataset.zone === "front" && issue) {
      label.innerHTML = `<span class="row-label-issue">${String(issue).replace(/^20(\d{5})$/, "$1")}</span><span class="row-label-num">${row}</span>`;
      label.title = `${issue}期 第${row}行`;
    } else {
      label.innerHTML = `<span class="row-label-num">${row}</span>`;
      label.title = `第${row}行`;
    }
  });
}

function applyBalls(balls, options = {}) {
  clearBoard(false, true);
  if (options.rowIssues) rowIssues = { ...options.rowIssues };
  cloneBalls(balls).forEach((ball) => {
    addBall(ball.row, ball.zone, ball.number, ball.label, ball.color, false, ball.colors, {
      protected: Boolean(options.protectBalls || ball.protected),
    });
  });
  updateCount();
  updateRowLabels();

  if (Object.prototype.hasOwnProperty.call(options, "baseTitle")) {
    currentBaseTitle = options.baseTitle || "";
  }

  updateBaseLabel();
  updateVersionBanner();
  if (options.persist !== false) persistDraft();
}

function getVersionById(id) {
  return versions.find((version) => version.id === id) || null;
}

function buildCompareBalls(selectedVersions) {
  const segments = [
    { start: 1, end: 15 },
    { start: 16, end: 30 },
    { start: 31, end: 45 },
  ];
  const compareBalls = [];
  const compareRows = {};

  selectedVersions.forEach((version, versionIndex) => {
    const segment = segments[versionIndex];
    if (!version || !segment) return;
    const sourceBalls = cloneBalls(version.balls).filter((ball) => ball.row >= 16 && ball.row <= 30);
    for (let offset = 0; offset < 15; offset += 1) {
      const sourceRow = 16 + offset;
      const mappedRow = segment.start + offset;
      compareRows[mappedRow] = version.rowIssues?.[sourceRow] || `${version.title || "历史版本"}-${sourceRow}`;
    }
    sourceBalls.forEach((ball) => {
      const mappedRow = segment.start + (ball.row - 16);
      const mappedNumber = Number(ball.number);
      if (mappedNumber < 1 || mappedNumber > zones[ball.zone]?.max) return;
      compareBalls.push({
        ...ball,
        row: mappedRow,
        zone: ball.zone,
        number: mappedNumber,
        label: pad(mappedNumber),
        protected: true,
      });
    });
  });

  return { compareBalls, compareRows };
}

function populateCompareSelects() {
  const selects = [compareVersionOne, compareVersionTwo, compareVersionThree];
  const availableVersions = versions.slice();
  selects.forEach((select, index) => {
    if (!select) return;
    if (index === 2 && availableVersions.length < 3) {
      select.innerHTML = "";
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "不选择第三个版本";
      select.append(option);
      select.value = "";
      return;
    }
    const previous = activeCompareSelection[index] || select.value;
    select.innerHTML = "";
    if (index === 2) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "不选择第三个版本";
      select.append(emptyOption);
    }
    availableVersions.forEach((version) => {
      const option = document.createElement("option");
      option.value = version.id;
      option.textContent = getVersionLabel(version);
      select.append(option);
    });
    const fallback = index === 2 ? "" : availableVersions[index]?.id || availableVersions[0]?.id || "";
    select.value = availableVersions.some((version) => version.id === previous) ? previous : fallback;
  });
  activeCompareSelection = selects.map((select) => select?.value || "");
}

function openCompareModal() {
  if (!versionsUnlocked) {
    versionAuthMessage.textContent = "请先输入密码验证，再查看对比图。";
    return;
  }
  if (versions.length < 2) {
    versionAuthMessage.textContent = "至少需要 2 个版本才能生成对比图。";
    return;
  }
  populateCompareSelects();
  compareHint.textContent = "可选择 2 个或 3 个版本：各版本第 16-30 行会映射到主选号区行分段，选中的号码仍按原号码落位。";
  compareModal.hidden = false;
}

function applyCompareView() {
  const selectedIds = [compareVersionOne.value, compareVersionTwo.value, compareVersionThree.value].filter(Boolean);
  activeCompareSelection = selectedIds;
  const selectedVersions = selectedIds.map(getVersionById);
  if (selectedVersions.length < 2 || selectedVersions.some((version) => !version)) {
    compareHint.textContent = "请至少选择 2 个有效版本后再加载。";
    return;
  }

  const { compareBalls, compareRows } = buildCompareBalls(selectedVersions);
  const compareTitle = `对比图：${selectedVersions.map((version) => version.title || "历史版本").join(" / ")}`;
  applyBalls(compareBalls, {
    baseTitle: compareTitle,
    rowIssues: compareRows,
    protectBalls: true,
  });
  addHistory(compareTitle, compareBalls);
  compareHint.textContent = "对比图已加载到主选号区。";
  compareModal.hidden = true;
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
  const frontRowLabelWidth = parseFloat(rootStyle.getPropertyValue("--row-label-w")) || 92;
  const backRowLabelWidth = parseFloat(rootStyle.getPropertyValue("--back-row-label-w")) || 19;
  const gap = parseFloat(boardStyle.gap) || 14;
  const paddingLeft = parseFloat(boardStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(boardStyle.paddingRight) || 0;
  const frontWidth = frontRowLabelWidth + zones.front.max * cellSize;
  const backWidth = backRowLabelWidth + zones.back.max * cellSize;
  return frontWidth + backWidth + gap + paddingLeft + paddingRight;
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
      const labelCell = document.createElement("div");
      labelCell.className = "row-label";
      labelCell.dataset.row = row;
      labelCell.dataset.zone = zone;
      if (row % 5 === 0) labelCell.dataset.groupEnd = "true";
      if (zone === "front" && (row === 15 || row === 30)) labelCell.dataset.frontSplit = "true";
      if (row > drawRows) labelCell.dataset.pick = "true";
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
        if (row % 5 === 0) cell.dataset.groupEnd = "true";
        if (zone === "front" && (row === 15 || row === 30)) cell.dataset.frontSplit = "true";
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

  const sourceDraws = sortDrawsByIssue(draws).slice(-drawRows);

  rowIssues = {};
  sourceDraws.forEach((draw, index) => {
    rowIssues[index + 1] = draw.issue;
  });

  return sourceDraws.flatMap((draw, index) => {
    const row = index + 1;
    return [
      ...draw.front.map((number) => ({ ...makeBall(row, "front", number, red), protected: true })),
      ...draw.back.map((number) => ({ ...makeBall(row, "back", number, blue), protected: true })),
    ];
  });
}

function seedLatestDrawVersion() {
  const title = "2026-05-11版本";
  const id = "preset-latest-draw-2026051";
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
    versions.unshift(latestVersion);
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

  versions.unshift(version);
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  currentBaseTitle = version.title;
  updateBaseLabel();
  persistDraft();
  renderVersions();
  showVersion(version.id);
  addHistory("保存版本", balls);
  downloadVersionFile(version);
}

async function captureBoard() {
  if (!globalThis.html2canvas) {
    alert("截图组件加载失败，请刷新页面后重试。");
    return;
  }

  const target = document.querySelector(".board");
  const boardShell = document.querySelector(".board-shell");
  const boardActions = boardShell?.querySelector(".board-actions");
  if (!target) return;

  const filenameBase = currentBaseTitle
    ? currentBaseTitle.replace(/[\\/:*?\"<>|]/g, "-")
    : `选号区-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;

  const previousText = captureBoardButton?.textContent;
  let captureHost = null;
  if (captureBoardButton) {
    captureBoardButton.disabled = true;
    captureBoardButton.textContent = "生成中...";
  }

  try {
    const previousActionsDisplay = boardActions?.style.display || "";
    const previousZoom = document.documentElement.style.getPropertyValue("--board-zoom");
    if (boardActions) boardActions.style.display = "none";
    document.documentElement.style.setProperty("--board-zoom", "1");

    captureHost = document.createElement("div");
    captureHost.style.position = "fixed";
    captureHost.style.left = "-100000px";
    captureHost.style.top = "0";
    captureHost.style.padding = "0";
    captureHost.style.margin = "0";
    captureHost.style.background = "#ffffff";
    captureHost.style.zIndex = "-1";

    const clone = target.cloneNode(true);
    clone.style.zoom = "1";
    clone.style.transform = "none";
    clone.style.width = "max-content";
    clone.style.minWidth = "0";
    clone.style.overflow = "visible";

    clone.querySelectorAll('.cell[data-zone="front"]:not([data-pick="true"])').forEach((cell) => {
      cell.style.background = "#ffe9e7";
      cell.style.color = "#e06f66";
    });
    clone.querySelectorAll('.cell[data-zone="back"]:not([data-pick="true"])').forEach((cell) => {
      cell.style.background = "#edf6ff";
      cell.style.color = "#6f9ecf";
    });
    clone.querySelectorAll('.cell[data-pick="true"]').forEach((cell) => {
      cell.style.background = "#fff6d8";
      cell.style.color = "#b3913a";
    });
    clone.querySelectorAll('.cell[data-pick="true"][data-zone="back"]').forEach((cell) => {
      cell.style.background = "#eaf8f0";
      cell.style.color = "#58a07b";
    });
    clone.querySelectorAll(".row-label").forEach((label) => {
      label.style.color = "#3f4b5f";
      label.style.background = "#f1f4f9";
    });

    const sourceBalls = [...target.querySelectorAll(".ball")];
    const clonedBalls = [...clone.querySelectorAll(".ball")];
    sourceBalls.forEach((ball, index) => {
      const cloneBall = clonedBalls[index];
      if (!cloneBall) return;
      const computed = getComputedStyle(ball);
      const sourceColor = ball.dataset.color || computed.backgroundColor;
      const boostedColor = boostCaptureBallColor(sourceColor);
      cloneBall.style.background = boostedColor;
      cloneBall.style.color = "#ffffff";
      cloneBall.style.boxShadow = "0 2px 4px rgba(31, 41, 55, 0.28)";
      cloneBall.style.border = "1px solid rgba(255, 255, 255, 0.3)";
      cloneBall.style.setProperty("--ball-color", boostedColor);
    });

    captureHost.append(clone);
    document.body.append(captureHost);

    const canvas = await globalThis.html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: Math.max(2, globalThis.devicePixelRatio || 1),
      useCORS: true,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${filenameBase}.png`;
    link.click();
    captureHost.remove();
    if (boardActions) boardActions.style.display = previousActionsDisplay;
    document.documentElement.style.setProperty("--board-zoom", previousZoom || `${zoomInput.value / 100}`);
  } catch (error) {
    console.error(error);
    alert("截图失败，请稍后重试。");
  } finally {
    captureHost?.remove();
    document.documentElement.style.setProperty("--board-zoom", `${zoomInput.value / 100}`);
    if (boardActions) boardActions.style.display = "";
    if (captureBoardButton) {
      captureBoardButton.disabled = false;
      captureBoardButton.textContent = previousText || "截图";
    }
  }
}

function downloadVersionFile(version) {
  if (!version) return;
  const safeTitle = String(version.title || "版本")
    .replace(/[\\/:*?\"<>|]/g, "-")
    .trim() || "版本";
  const payload = {
    exportedAt: new Date().toISOString(),
    version,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeTitle}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function saveCurrentBoardAsVersion(title = "") {
  const balls = cloneBalls(collectBalls());
  const time = formatTime();
  const version = {
    id: makeId(),
    kind: "custom",
    time,
    timestamp: Date.now(),
    title: title || `版本 ${time}`,
    balls: cloneBalls(balls),
    rowIssues: { ...rowIssues },
  };

  versions.unshift(version);
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  currentBaseTitle = version.title;
  updateBaseLabel();
  updateVersionBanner();
  persistDraft();
  renderVersions();
  showVersion(version.id);
  addHistory(`保存版本 ${version.title}`, balls);
  downloadVersionFile(version);
  return version;
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

function extractDrawDate(text) {
  const normalized = String(text || "")
    .replace(/[年月]/g, "-")
    .replace(/日/g, "");
  const match = normalized.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (!match) return "";
  return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
}

function parseIntegerValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const match = String(value).replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeIssue(value) {
  const number = parseIntegerValue(value);
  if (!number) return "";
  const digits = String(number);
  if (digits.length === 7 && digits.startsWith("20")) return digits.slice(2);
  if (digits.length > 5) return digits.slice(-5);
  return digits.padStart(5, "0");
}

function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
  }
  return extractDrawDate(String(value || ""));
}

function sortDrawsByIssue(draws) {
  return [...draws].sort((a, b) => {
    const aIssue = parseIntegerValue(a.issue);
    const bIssue = parseIntegerValue(b.issue);
    if (aIssue && bIssue && aIssue !== bIssue) return aIssue - bIssue;
    if (aIssue && !bIssue) return -1;
    if (!aIssue && bIssue) return 1;
    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    return dateCompare || ((a.sequence || 0) - (b.sequence || 0));
  });
}

function parseNumberList(value, max, expected) {
  if (value == null || value === "") return [];
  const text = typeof value === "number" ? String(Math.trunc(value)) : String(value);
  const numbers = (text.match(/\d{1,2}/g) || []).map(Number).filter((number) => number >= 1 && number <= max);
  return expected ? numbers.slice(0, expected) : numbers;
}

function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(/[（）()【】[\]：:、,_-]/g, "");
}

function getColumnIndex(headers, names) {
  return headers.findIndex((header) => names.some((name) => header === name || header.includes(name)));
}

function getNumberColumnIndexes(headers, zone, count) {
  const digits = zone === "前区" ? ["一", "二", "三", "四", "五", "1", "2", "3", "4", "5"] : ["一", "二", "1", "2"];
  const result = [];
  digits.some((digit) => {
    const index = headers.findIndex((header, columnIndex) => {
      return !result.includes(columnIndex) && header.includes(zone) && header.includes(digit) && !header.includes("注数") && !header.includes("奖金");
    });
    if (index >= 0) result.push(index);
    return result.length >= count;
  });
  return result.slice(0, count);
}

function parseDrawRowsFromSheet(rowsData, options = {}) {
  const cleanRows = rowsData.filter((row) => row.some((cell) => String(cell ?? "").trim()));
  const headerRowIndex = cleanRows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return headers.some((header) => header.includes("前区")) && headers.some((header) => header.includes("后区"));
  });
  if (headerRowIndex < 0) return [];

  const headers = cleanRows[headerRowIndex].map(normalizeHeader);
  const issueColumn = getColumnIndex(headers, ["期号", "开奖期号"]);
  const sequenceColumn = getColumnIndex(headers, ["序号", "顺序", "行号"]);
  const dateColumn = getColumnIndex(headers, ["开奖时间", "开奖日期", "日期"]);
  const frontColumns = getNumberColumnIndexes(headers, "前区", 5);
  const backColumns = getNumberColumnIndexes(headers, "后区", 2);
  const frontCombinedColumn = getColumnIndex(headers, ["前区号码", "前区号"]);
  const backCombinedColumn = getColumnIndex(headers, ["后区号码", "后区号"]);

  const parsedRows = cleanRows.slice(headerRowIndex + 1).map((row, index) => {
    const front = frontColumns.length === 5
      ? frontColumns.flatMap((column) => parseNumberList(row[column], 35)).slice(0, 5)
      : parseNumberList(row[frontCombinedColumn], 35, 5);
    const back = backColumns.length === 2
      ? backColumns.flatMap((column) => parseNumberList(row[column], 12)).slice(0, 2)
      : parseNumberList(row[backCombinedColumn], 12, 2);
    if (front.length !== 5 || back.length !== 2) return null;
    return {
      sequence: parseIntegerValue(row[sequenceColumn]) || index + 1,
      issue: normalizeIssue(row[issueColumn]),
      date: parseDateValue(row[dateColumn]),
      front,
      back,
    };
  }).filter(Boolean);

  return options.sort === false ? parsedRows : sortDrawsByIssue(parsedRows);
}

function serializeDraws(draws) {
  return sortDrawsByIssue(draws).map((draw) => {
    return [draw.issue, draw.date, draw.sequence ? `序号${draw.sequence}` : "", "前区", ...draw.front.map(pad), "后区", ...draw.back.map(pad)]
      .filter(Boolean)
      .join(" ");
  }).join("\n");
}

async function handleDrawFileImport() {
  const file = drawFileInput?.files?.[0];
  if (!file) return;
  if (!globalThis.XLSX) {
    drawImportMessage.textContent = "Excel 解析库加载失败，请刷新页面后重试，或复制 Excel 内容粘贴到输入框。";
    drawFileInput.value = "";
    return;
  }
  try {
    const workbook = globalThis.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rowsData = globalThis.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    const parsedDraws = parseDrawRowsFromSheet(rowsData);
    if (parsedDraws.length === 0) {
      drawImportMessage.textContent = "没有从文件中解析到有效数据，请确认表格包含期号、前区号码和后区号码。";
      return;
    }
    drawDataInput.value = serializeDraws(parsedDraws);
    const latestDate = parsedDraws.map((draw) => draw.date).filter(Boolean).sort().at(-1);
    if (latestDate) drawDateInput.value = latestDate;
    drawImportMessage.textContent = `已从 ${file.name} 导入 ${parsedDraws.length} 期，并按期号从小到大排列。`;
  } catch (error) {
    console.error(error);
    drawImportMessage.textContent = "文件读取失败，请确认导入的是 Excel、CSV 或制表符文本文件。";
  } finally {
    drawFileInput.value = "";
  }
}

function parseDrawLinesSafe(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.some((line) => line.includes("\t"))) {
    const parsedRows = parseDrawRowsFromSheet(lines.map((line) => line.split("\t")));
    if (parsedRows.length > 0) return parsedRows;
  }

  return sortDrawsByIssue(lines
    .map((line) => {
      const fullIssue = line.match(/\b(20\d{5})\b/)?.[1] || "";
      const shortIssue = line.match(/\b(\d{5})\b/)?.[1] || "";
      const issue = normalizeIssue(fullIssue || shortIssue);
      const date = extractDrawDate(line);
      const cleanLine = line
        .replace(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, " ")
        .replace(/20\d{2}年\d{1,2}月\d{1,2}日?/g, " ")
        .replace(/\b20\d{5,}\b/g, " ");
      const numbers = (cleanLine.match(/\b\d{1,2}\b/g) || []).map(Number);
      if (numbers.length < 7) return null;
      const drawNumbers = numbers.slice(-7);
      const front = drawNumbers.slice(0, 5);
      const back = drawNumbers.slice(5, 7);
      if (!front.every((number) => number >= 1 && number <= 35)) return null;
      if (!back.every((number) => number >= 1 && number <= 12)) return null;
      return { issue, date, front, back };
    })
    .filter(Boolean));
}

function generateDrawVersion() {
  const drawText = drawDataInput.value.trim();
  const parsedDraws = sortDrawsByIssue(parseDrawLinesSafe(drawText));
  if (parsedDraws.length === 0) {
    drawImportMessage.textContent = "没有解析到有效开奖数据。请保证每行至少包含 5 个前区和 2 个后区号码。";
    return;
  }

  const latestParsedDate = parsedDraws.map((draw) => draw.date).filter(Boolean).sort().at(-1);
  const date = drawDateInput.value || latestParsedDate || extractDrawDate(drawText) || new Date().toISOString().slice(0, 10);
  const red = "#d6202a";
  const blue = "#1768b7";
  const sourceDraws = parsedDraws.slice(-drawRows);
  const newRowIssues = {};
  const balls = sourceDraws.flatMap((draw, index) => {
    const row = index + 1;
    newRowIssues[row] = draw.issue || `${draw.date}-${row}`;
    return [
      ...draw.front.map((number) => ({ ...makeBall(row, "front", number, red), protected: true })),
      ...draw.back.map((number) => ({ ...makeBall(row, "back", number, blue), protected: true })),
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
      versions.unshift(version);
    }
  } else {
    versions.unshift(version);
  }
  versions = versions.slice(0, 80);
  writeStorage(versionStorageKey, versions);
  drawImportMessage.textContent = `已生成 ${title}，共 ${sourceDraws.length} 期、${balls.length} 个球。`;
  applyBalls(balls, { baseTitle: title, rowIssues: newRowIssues, protectBalls: true });
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
  compareVersionsButton.disabled = !versionsUnlocked || versions.length < 2;
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

  versionAuthMessage.textContent = `已验证。${localVersionNotice}历史版本是冻结快照，点击“在此基础上调整”只会复制到当前编辑区。`;
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
      applyBalls(version.balls, { baseTitle: version.title || "历史版本", rowIssues: version.rowIssues, protectBalls: isDrawVersion(version) });
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
  hint.textContent = balls.length === 0 ? "此版本为空" : "历史版本信息不展示颜色、球、行，点击“查看”可打开详情。";
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
  if (cell.querySelector(".ball")) {
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

function handleDescAdd() {
  const text = descInput?.value.trim();
  if (!text) return;

  let addedCount = 0;
  const added = [];
  text.split(/[\r\n;；]+/).forEach((line) => {
    const parsed = parseBallDescription(line);
    if (!parsed) return;
    parsed.numbers.forEach((number) => {
      const before = getCell(parsed.row, parsed.zone, number)?.querySelector(".ball");
      addBall(parsed.row, parsed.zone, number, pad(number), parsed.color, false);
      if (!before) addedCount += 1;
      added.push({ row: parsed.row, zone: parsed.zone, number, label: pad(number), color: parsed.color });
    });
  });

  if (added.length === 0) {
    descInput.select();
    return;
  }
  addHistory(`按描述添加 ${addedCount} 个球`, added);
  persistDraft();
  updateCount();
  descInput.value = "";
  descInput.placeholder = `已添加 ${addedCount} 个球`;
}

function addDrawRowsByReverseOrder(draws, sourceName = "Excel") {
  const currentColor = colorInput.value;
  const importedDraws = draws.slice(-rows).reverse();
  const added = [];

  importedDraws.forEach((draw, index) => {
    const row = index + 1;
    [
      ...draw.front.map((number) => ({ zone: "front", number })),
      ...draw.back.map((number) => ({ zone: "back", number })),
    ].forEach(({ zone, number }) => {
      addBall(row, zone, number, pad(number), currentColor, false, null, { protected: true });
      added.push({ row, zone, number, label: pad(number), color: currentColor, protected: true });
    });
  });

  updateCount();
  persistDraft();
  addHistory(`按描述导入 ${sourceName}（倒序）`, added);
  if (descInput) {
    descInput.value = "";
    descInput.placeholder = `已倒序导入 ${importedDraws.length} 行，最下面的数据在第1行`;
  }
}

async function handleDescFileImport() {
  const file = descFileInput?.files?.[0];
  if (!file) return;
  if (!globalThis.XLSX) {
    descInput.placeholder = "Excel 解析库加载失败，请刷新页面后重试。";
    descFileInput.value = "";
    return;
  }

  try {
    const workbook = globalThis.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rowsData = globalThis.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    const parsedDraws = parseDrawRowsFromSheet(rowsData, { sort: false });
    if (parsedDraws.length === 0) {
      descInput.placeholder = "没有解析到有效数据，请确认 Excel 包含前区和后区号码。";
      return;
    }
    addDrawRowsByReverseOrder(parsedDraws, file.name);
  } catch (error) {
    console.error(error);
    descInput.placeholder = "Excel 导入失败，请确认文件格式正确。";
  } finally {
    descFileInput.value = "";
  }
}

descFileInput?.addEventListener("change", handleDescFileImport);
descAddButton?.addEventListener("click", handleDescAdd);
descInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) handleDescAdd();
});
descHelpButton?.addEventListener("click", () => {
  if (!descHelpTip) return;
  descHelpTip.hidden = !descHelpTip.hidden;
  descHelpButton.textContent = descHelpTip.hidden ? "?" : "×";
});

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

saveHistoryButton?.addEventListener("click", () => addHistory("保存记录", collectBalls()));
saveVersionButton.addEventListener("click", saveVersion);
captureBoardButton?.addEventListener("click", captureBoard);
drawFileInput?.addEventListener("change", handleDrawFileImport);
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

closeCompareModalButton.addEventListener("click", () => {
  compareModal.hidden = true;
});

versionModal.addEventListener("click", (event) => {
  if (event.target === versionModal) versionModal.hidden = true;
});

compareModal.addEventListener("click", (event) => {
  if (event.target === compareModal) compareModal.hidden = true;
});

compareVersionsButton?.addEventListener("click", openCompareModal);
applyCompareButton?.addEventListener("click", applyCompareView);

clearHistoryButton?.addEventListener("click", () => {
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
updateRowLabels();
updateVersionBanner();
updateCount();
renderHistory();
renderVersions();
function getDefaultCompareSelection(sourceVersionId = "") {
  const availableVersions = versions.slice();
  if (availableVersions.length < 2) return ["", "", ""];
  if (!sourceVersionId) {
    return [
      availableVersions[1]?.id || availableVersions[0]?.id || "",
      availableVersions[0]?.id || "",
      availableVersions[2]?.id || "",
    ];
  }

  const sourceIndex = availableVersions.findIndex((version) => version.id === sourceVersionId);
  if (sourceIndex < 0) {
    return [
      availableVersions[1]?.id || availableVersions[0]?.id || "",
      availableVersions[0]?.id || "",
      availableVersions[2]?.id || "",
    ];
  }

  const previousVersion = availableVersions[sourceIndex + 1] || availableVersions[sourceIndex];
  const currentVersion = availableVersions[sourceIndex];
  const nextVersion = availableVersions[sourceIndex - 1] || null;
  return [previousVersion?.id || "", currentVersion?.id || "", nextVersion?.id || ""];
}

populateCompareSelects = function populateCompareSelectsOverride() {
  const selects = [compareVersionOne, compareVersionTwo, compareVersionThree];
  const availableVersions = versions.slice();
  const defaults = getDefaultCompareSelection(compareSourceVersionId);

  selects.forEach((select, index) => {
    if (!select) return;
    const previous = activeCompareSelection[index] || select.value || defaults[index] || "";
    select.innerHTML = "";

    if (index === 2) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "不选择第三个版本";
      select.append(emptyOption);
    }

    availableVersions.forEach((version) => {
      const option = document.createElement("option");
      option.value = version.id;
      option.textContent = getVersionLabel(version);
      select.append(option);
    });

    const fallback = defaults[index] || (index === 2 ? "" : availableVersions[index]?.id || availableVersions[0]?.id || "");
    select.value = availableVersions.some((version) => version.id === previous) ? previous : fallback;
  });

  if (availableVersions.length < 3 && compareVersionThree) {
    compareVersionThree.value = "";
  }

  activeCompareSelection = selects.map((select) => select?.value || "");
};

openCompareModal = function openCompareModalOverride(sourceVersionId = "") {
  if (!versionsUnlocked) {
    versionAuthMessage.textContent = "请先输入密码验证，再查看对比图。";
    return;
  }
  if (versions.length < 2) {
    versionAuthMessage.textContent = "至少需要 2 个版本才能生成对比图。";
    return;
  }
  compareSourceVersionId = sourceVersionId;
  activeCompareSelection = [];
  populateCompareSelects();
  compareHint.textContent = "默认已选当前版本及前后版本；会取各版本第 16-30 行，并保留原号码位置。";
  compareModal.hidden = false;
};

function saveCompareAsVersion() {
  const selectedIds = [compareVersionOne.value, compareVersionTwo.value, compareVersionThree.value].filter(Boolean);
  activeCompareSelection = selectedIds;
  const selectedVersions = selectedIds.map(getVersionById);
  if (selectedVersions.length < 2 || selectedVersions.some((version) => !version)) {
    compareHint.textContent = "请至少选择 2 个有效版本后再保存。";
    return;
  }

  const { compareBalls, compareRows } = buildCompareBalls(selectedVersions);
  const compareTitle = `对比图：${selectedVersions.map((version) => version.title || "历史版本").join(" / ")}`;
  applyBalls(compareBalls, {
    baseTitle: compareTitle,
    rowIssues: compareRows,
    protectBalls: true,
  });
  const version = saveCurrentBoardAsVersion(compareTitle);
  compareHint.textContent = `对比图已保存为版本：${version.title}`;
  compareModal.hidden = true;
}

renderVersions = function renderVersionsOverride() {
  document.querySelector(".version-shell").classList.toggle("locked", !versionsUnlocked);
  versionSearch.disabled = !versionsUnlocked;
  clearVersionsButton.disabled = !versionsUnlocked;
  compareVersionsButton.disabled = !versionsUnlocked || versions.length < 2;
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

  versionAuthMessage.textContent = `已验证。${localVersionNotice}历史版本是冻结快照，点击“在此基础上调整”只会复制到当前编辑区。`;
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

    const summary = document.createElement("div");
    summary.className = "version-summary";
    if (balls.length === 0) {
      const empty = document.createElement("span");
      empty.className = "history-empty";
      empty.textContent = "此版本为空";
      summary.append(empty);
    } else {
      balls.slice(0, 10).forEach((ball) => summary.append(createChip(ball)));
      if (balls.length > 10) {
        const more = document.createElement("span");
        more.className = "version-more";
        more.textContent = `还有 ${balls.length - 10} 个球`;
        summary.append(more);
      }
    }

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
      applyBalls(version.balls, { baseTitle: version.title || "历史版本", rowIssues: version.rowIssues, protectBalls: isDrawVersion(version) });
      showVersion(version.id);
      addHistory(`基于 ${version.title || "历史版本"} 调整`, version.balls);
    });

    const compareButton = document.createElement("button");
    compareButton.type = "button";
    compareButton.textContent = "对比图";
    compareButton.addEventListener("click", () => {
      showVersion(version.id);
      openCompareModal(version.id);
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

    actions.append(viewButton, restoreButton, compareButton, deleteButton);
    item.append(info, actions);
    versionList.append(item);
  });
};

saveCompareButton?.addEventListener("click", saveCompareAsVersion);
compareVersionsButton?.addEventListener("click", () => openCompareModal());
versionSearch.addEventListener("input", () => renderVersions());
renderVersions();
sizeInput.value = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ball-size"), 10);
fitBoardToScreen(true);
window.addEventListener("resize", () => fitBoardToScreen());
if (sessionStorage.getItem(pageAuthStorageKey) === "true") unlockPage();
