// 后台只编辑本地副本；配置保存与列表排序相互独立。
const wheelLibrary = new WheelStore();
let editingWheelId = '';
let editingSource = 'cloud';
let savedSnapshot = '';
let adminReady = false;

function canEditWheel() { return editingSource === 'local'; }

async function init() {
    document.getElementById('wheelEditor').disabled = true;
    document.getElementById('saveWheelBtn').disabled = true;
    await wheelLibrary.load(getDefaultConfig);
    adminReady = true;
    document.getElementById('libraryStatus').textContent = wheelLibrary.messages.join('；');
    const requested = new URLSearchParams(location.search).get('wheel');
    const entries = wheelLibrary.list(true);
    openAdminWheel(entries.find(x => x.id === requested) || entries.find(x => x.id === wheelLibrary.state.selected) || entries[0]);
}

function hasUnsavedChanges() {
    if (!adminReady || !canEditWheel() || !config) return false;
    collectSettingsFromForm();
    return !editingWheelId || JSON.stringify(config) !== savedSnapshot;
}

function allowLeavingWheel() {
    return !hasUnsavedChanges() || confirm('当前转盘有未保存的修改，确定放弃这些修改吗？');
}

function openAdminWheel(entry) {
    if (!entry) return;
    editingWheelId = entry.id;
    editingSource = entry.source;
    config = WheelStore.copy(entry.config);
    renderEditor();
    savedSnapshot = JSON.stringify(config);
    renderWheelManager();
}

function renderEditor() {
    closeEmojiPicker();
    renderSettings();
    renderRaritySettings();
    renderPrizeList();
    // 云端只读时不从表单回写，保持导出与云端文件完全一致。
    document.getElementById('jsonPreview').textContent = JSON.stringify(config, null, 2);
    updateStats();
    document.getElementById('wheelEditor').disabled = !canEditWheel();
    document.getElementById('saveWheelBtn').disabled = !canEditWheel() || !wheelLibrary.cloudReady;
    document.getElementById('resetWheelBtn').disabled = !canEditWheel();
}

function renderWheelManager() {
    const entries = wheelLibrary.list(true);
    const select = document.getElementById('adminWheelSelect');
    select.replaceChildren(...entries.map(entry => new Option(
        entry.config.settings.title + (entry.source === 'cloud' ? ' · 云端只读' : ' · 本地') + (entry.hidden ? ' · 同名，改名后显示' : ''), entry.id)));
    if (!editingWheelId) select.add(new Option(config.settings.title + ' · 未保存', ''));
    select.value = editingWheelId;
    document.getElementById('wheelEditStatus').textContent = canEditWheel()
        ? '本地转盘：可编辑和改名，保存后仅在当前浏览器生效。'
        : '云端转盘：仅供查看。需要修改时，请复制到本地并使用不同的名称。';
    document.getElementById('newWheelBtn').disabled = !wheelLibrary.cloudReady;
    document.getElementById('copyWheelBtn').disabled = !wheelLibrary.cloudReady;
    document.getElementById('deleteWheelBtn').disabled = !canEditWheel() || !editingWheelId;
    renderWheelOrder();
}

function selectAdminWheel(id) {
    if (!allowLeavingWheel()) {
        document.getElementById('adminWheelSelect').value = editingWheelId;
        return;
    }
    const entry = wheelLibrary.list(true).find(x => x.id === id);
    if (entry) openAdminWheel(entry);
}

function askNewName(base) {
    const result = prompt('请输入新的转盘名称（不能与云端或本地转盘重名）', wheelLibrary.uniqueName(base));
    if (result === null) return null;
    try { return wheelLibrary.checkName(result); }
    catch (error) { showToast(error.message, 'error'); return null; }
}

function startLocalDraft(value, name) {
    config = WheelStore.copy(value);
    config.settings.title = name;
    editingWheelId = '';
    editingSource = 'local';
    savedSnapshot = '';
    renderEditor();
    renderWheelManager();
    showToast('已建立本地草稿，编辑完成后请保存', 'success');
}

function createLocalWheel() {
    if (!adminReady || !allowLeavingWheel()) return;
    const name = askNewName('新转盘');
    if (name) startLocalDraft(getDefaultConfig(), name);
}

function copyLocalWheel() {
    if (!adminReady) return;
    collectSettingsFromForm();
    const value = WheelStore.copy(config);
    if (!allowLeavingWheel()) return;
    // 建议名称加后缀，最终名称仍须通过整个云端、本地集合的检查。
    const name = askNewName(config.settings.title);
    if (name) startLocalDraft(value, name);
}

function saveConfig() {
    if (!canEditWheel()) return;
    collectSettingsFromForm();
    try {
        editingWheelId = wheelLibrary.save(editingWheelId, config);
        const entry = wheelLibrary.list(true).find(x => x.id === editingWheelId);
        openAdminWheel(entry);
        showToast('“' + config.settings.title + '”已保存到浏览器', 'success');
    } catch (error) { showToast(error.message, 'error'); }
}

function deleteLocalWheel() {
    if (!canEditWheel() || !editingWheelId) return;
    if (!confirm('确定删除这个本地转盘吗？' + (hasUnsavedChanges() ? '未保存的修改也会丢失。' : ''))) return;
    try {
        wheelLibrary.remove(editingWheelId);
        openAdminWheel(wheelLibrary.list(true)[0]);
        showToast('本地转盘已删除', 'success');
    } catch (error) { showToast(error.message, 'error'); }
}

function resetConfig() {
    if (!canEditWheel() || !confirm('将当前本地转盘的奖项和样式重置为默认值？保留名称，保存后生效。')) return;
    const name = document.getElementById('settingTitle').value;
    config = getDefaultConfig();
    config.settings.title = name;
    renderEditor();
    showToast('当前转盘已重置，请保存以生效');
}

function importConfig(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file || !adminReady) return;
    if (!wheelLibrary.cloudReady) { showToast('云端配置尚未完整加载，请刷新后重试', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = WheelStore.validate(JSON.parse(reader.result));
            if (!allowLeavingWheel()) return;
            const name = askNewName(imported.settings.title);
            if (name) startLocalDraft(imported, name);
        } catch (error) { showToast('导入失败：' + error.message, 'error'); }
    };
    reader.onerror = () => showToast('读取文件失败', 'error');
    reader.readAsText(file);
}

function renderWheelOrder() {
    const entries = wheelLibrary.list();
    const list = document.getElementById('wheelOrderList');
    list.replaceChildren(...entries.map((entry, index) => {
        const row = document.createElement('div');
        row.className = 'wheel-order-row';
        const label = document.createElement('span');
        label.textContent = entry.config.settings.title + (entry.source === 'cloud' ? ' · 云端' : ' · 本地');
        row.append(label);
        for (const [delta, text] of [[-1, '上移'], [1, '下移']]) {
            const button = document.createElement('button');
            button.className = 'btn btn-secondary';
            button.textContent = text;
            button.setAttribute('aria-label', entry.config.settings.title + text);
            button.disabled = delta < 0 ? index === 0 : index === entries.length - 1;
            button.onclick = () => {
                try {
                    wheelLibrary.move(entry.id, delta);
                    renderWheelManager();
                    showToast('显示顺序已保存', 'success');
                } catch (error) { showToast(error.message, 'error'); }
            };
            row.append(button);
        }
        return row;
    }));
}

window.addEventListener('beforeunload', event => {
    if (hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('storage', event => {
    if (!adminReady || (event.key !== WheelStore.KEY && event.key !== null)) return;
    try {
        wheelLibrary.state = wheelLibrary.read();
        // 保留正在编辑的草稿；保存时重新检查名称和转盘是否仍存在。
        if (hasUnsavedChanges()) {
            document.getElementById('libraryStatus').textContent = '其他标签页更新了本地转盘；当前草稿已保留，请确认后再保存。';
        } else {
            const entries = wheelLibrary.list(true);
            openAdminWheel(entries.find(x => x.id === editingWheelId) || entries[0]);
        }
    } catch (error) { showToast(error.message, 'error'); }
});
