// 前台转盘选择与按转盘隔离的本次访问记录。
const wheelLibrary = new WheelStore();
const wheelHistories = new Map();
let activeWheelId = '';
let pendingLibraryRefresh = false;
let awaitingWheelResult = false;

async function init() {
    document.getElementById('spinBtn').disabled = true;
    await wheelLibrary.load(getDefaultConfig);
    createBackgroundParticles();
    createWheelLights();
    populateWheels();
    document.getElementById('wheelLoadStatus').textContent = wheelLibrary.messages.join('；');
}

function populateWheels() {
    const entries = wheelLibrary.list();
    const preferred = entries.find(x => x.id === activeWheelId)
        || entries.find(x => x.id === wheelLibrary.state.selected) || entries[0];
    if (preferred) applyWheel(preferred);
}

function changeWheel(id) {
    if (isSpinning || awaitingWheelResult) {
        return;
    }
    const entry = wheelLibrary.list().find(x => x.id === id);
    if (!entry) return;
    applyWheel(entry);
    closeWheelPicker(true);
    try { wheelLibrary.select(id); }
    catch (error) { showConfigNotice(error.message); }
}

function applyWheel(entry) {
    if (activeWheelId) wheelHistories.set(activeWheelId, history);
    activeWheelId = entry.id;
    config = WheelStore.copy(entry.config);
    history = wheelHistories.get(entry.id) || [];
    currentRotation = 0;
    stopEffect();
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('wheelPickerToggle').disabled = false;
    renderWheelPicker();
    document.getElementById('spinBtn').disabled = false;
    document.getElementById('wheelPickerToggle').title = '选择转盘：' + entry.config.settings.title;
    document.getElementById('wheelPickerToggle').setAttribute('aria-label', '选择转盘，当前：' + entry.config.settings.title);
    document.querySelector('.admin-link').href = 'admin.html?wheel=' + encodeURIComponent(entry.id);
    drawWheel();
    updateUI();
    updateProbabilityPanel();
    updateHistoryPanel();
    updateHistoryBadge();
}

// 后台在另一标签页保存时，等待本轮结果关闭再刷新，避免动画中途换配置。
function refreshWheelLibrary() {
    if (isSpinning || awaitingWheelResult) {
        pendingLibraryRefresh = true;
        return;
    }
    try {
        wheelLibrary.state = wheelLibrary.read();
        populateWheels();
        pendingLibraryRefresh = false;
    } catch (error) { showConfigNotice(error.message); }
}
window.addEventListener('storage', event => {
    if (event.key === WheelStore.KEY || event.key === null) refreshWheelLibrary();
});

// 紧凑入口固定在设置左侧，列表向上展开，不挤占转盘内容区域。
function renderWheelPicker() {
    const list = document.getElementById('wheelPickerList');
    list.replaceChildren(...wheelLibrary.list().map(entry => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wheel-picker-option';
        button.dataset.wheelId = entry.id;
        button.setAttribute('aria-pressed', String(entry.id === activeWheelId));
        const title = document.createElement('span');
        title.textContent = entry.config.settings.title;
        const source = document.createElement('small');
        source.textContent = (entry.source === 'cloud' ? '云端转盘' : '本地转盘') + (entry.id === activeWheelId ? ' · 当前使用' : '');
        button.append(title, source);
        button.onclick = () => changeWheel(entry.id);
        return button;
    }));
}

function toggleWheelPicker() {
    if (isSpinning || awaitingWheelResult || !config) return;
    const panel = document.getElementById('wheelPickerPanel');
    if (!panel.hidden) { closeWheelPicker(true); return; }
    panel.hidden = false;
    document.getElementById('wheelPickerToggle').setAttribute('aria-expanded', 'true');
    panel.querySelector('[aria-pressed="true"]')?.focus();
}

function closeWheelPicker(restoreFocus = false) {
    document.getElementById('wheelPickerPanel').hidden = true;
    const trigger = document.getElementById('wheelPickerToggle');
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
}

document.addEventListener('click', event => {
    if (!event.target.closest('#wheelPickerPanel, #wheelPickerToggle')) closeWheelPicker();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('wheelPickerPanel').hidden) closeWheelPicker(true);
});
