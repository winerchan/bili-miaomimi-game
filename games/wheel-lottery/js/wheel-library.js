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
    const select = document.getElementById('wheelSelect');
    select.replaceChildren(...entries.map(entry => new Option(entry.config.settings.title, entry.id)));
    const preferred = entries.find(x => x.id === activeWheelId)
        || entries.find(x => x.id === wheelLibrary.state.selected) || entries[0];
    if (preferred) applyWheel(preferred);
}

function changeWheel(id) {
    if (isSpinning || awaitingWheelResult) {
        document.getElementById('wheelSelect').value = activeWheelId;
        return;
    }
    const entry = wheelLibrary.list().find(x => x.id === id);
    if (!entry) return;
    applyWheel(entry);
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
    document.getElementById('wheelSelect').value = entry.id;
    document.getElementById('wheelSelect').disabled = false;
    document.getElementById('spinBtn').disabled = false;
    document.getElementById('wheelSource').textContent = entry.source === 'cloud' ? '☁️ 云端转盘' : '💾 本地转盘';
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
