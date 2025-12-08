/**
 * 氦氦的轮盘机 - 管理页面脚本
 */

class AdminPanel {
  constructor() {
    this.config = null;
    this.init();
  }
  
  async init() {
    await this.loadConfig();
    this.setupDOM();
    this.bindEvents();
    this.renderSettings();
    this.renderGifts();
  }
  
  // 加载配置（始终从JSON读取）
  async loadConfig() {
    try {
      const response = await fetch('config/gifts.json?' + Date.now()); // 加时间戳防缓存
      if (!response.ok) {
        throw new Error('HTTP error: ' + response.status);
      }
      this.config = await response.json();
      console.log('配置加载成功:', this.config);
    } catch (error) {
      console.error('加载配置失败:', error);
      this.showToast('加载配置失败: ' + error.message, 'error');
      // 使用最小默认配置
      this.config = {
        settings: {
          title: "氦氦的轮盘机",
          subtitle: "由船船碎片打造~",
          spinDuration: 4000,
          adminClickCount: 5
        },
        giftTiers: {
          legendary: { minBattery: 1000, label: "传说礼物", color: "#FFD700" },
          rare: { minBattery: 100, label: "稀有礼物", color: "#9B59B6" },
          common: { minBattery: 0, label: "普通礼物", color: "#3498DB" }
        },
        gifts: []
      };
    }
  }
  
  // 设置DOM引用
  setupDOM() {
    this.elements = {
      // 设置
      settingTitle: document.getElementById('settingTitle'),
      settingSubtitle: document.getElementById('settingSubtitle'),
      settingSpinDuration: document.getElementById('settingSpinDuration'),
      settingAdminClicks: document.getElementById('settingAdminClicks'),
      settingLegendaryMin: document.getElementById('settingLegendaryMin'),
      settingRareMin: document.getElementById('settingRareMin'),
      
      // 礼物列表
      giftsList: document.getElementById('giftsList'),
      
      // 统计
      statGiftCount: document.getElementById('statGiftCount'),
      statTotalWeight: document.getElementById('statTotalWeight'),
      statExpectedBattery: document.getElementById('statExpectedBattery'),
      statExpectedValue: document.getElementById('statExpectedValue'),
      
      // 按钮
      btnSave: document.getElementById('btnSave'),
      btnExport: document.getElementById('btnExport'),
      btnImport: document.getElementById('btnImport'),
      fileImport: document.getElementById('fileImport'),
      btnReset: document.getElementById('btnReset'),
      btnBack: document.getElementById('btnBack'),
      
      // 提示
      toast: document.getElementById('toast')
    };
  }
  
  // 绑定事件
  bindEvents() {
    // 返回按钮
    this.elements.btnBack.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    
    // 保存配置
    this.elements.btnSave.addEventListener('click', () => this.saveConfig());
    
    // 导出配置
    this.elements.btnExport.addEventListener('click', () => this.exportConfig());
    
    // 导入配置
    this.elements.btnImport.addEventListener('click', () => {
      this.elements.fileImport.click();
    });
    
    this.elements.fileImport.addEventListener('change', (e) => this.importConfig(e));
    
    // 重置配置
    this.elements.btnReset.addEventListener('click', () => this.resetConfig());
    
    // 设置变更
    const settingInputs = [
      'settingTitle', 'settingSubtitle', 'settingSpinDuration',
      'settingAdminClicks', 'settingLegendaryMin', 'settingRareMin'
    ];
    
    settingInputs.forEach(id => {
      if (this.elements[id]) {
        this.elements[id].addEventListener('change', () => this.updateSettings());
      }
    });
  }
  
  // 渲染设置
  renderSettings() {
    this.elements.settingTitle.value = this.config.settings.title;
    this.elements.settingSubtitle.value = this.config.settings.subtitle;
    this.elements.settingSpinDuration.value = this.config.settings.spinDuration;
    this.elements.settingAdminClicks.value = this.config.settings.adminClickCount;
    this.elements.settingLegendaryMin.value = this.config.giftTiers.legendary.minBattery;
    this.elements.settingRareMin.value = this.config.giftTiers.rare.minBattery;
  }
  
  // 更新设置
  updateSettings() {
    this.config.settings.title = this.elements.settingTitle.value;
    this.config.settings.subtitle = this.elements.settingSubtitle.value;
    this.config.settings.spinDuration = parseInt(this.elements.settingSpinDuration.value) || 4000;
    this.config.settings.adminClickCount = parseInt(this.elements.settingAdminClicks.value) || 5;
    this.config.giftTiers.legendary.minBattery = parseInt(this.elements.settingLegendaryMin.value) || 1000;
    this.config.giftTiers.rare.minBattery = parseInt(this.elements.settingRareMin.value) || 100;
  }
  
  // 渲染礼物列表
  renderGifts() {
    const container = this.elements.giftsList;
    container.innerHTML = '';
    
    this.config.gifts.forEach((gift, index) => {
      const card = this.createGiftCard(gift, index);
      container.appendChild(card);
    });
    
    // 添加"添加礼物"按钮
    const addBtn = document.createElement('button');
    addBtn.className = 'add-gift-btn';
    addBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      添加新礼物
    `;
    addBtn.addEventListener('click', () => this.addGift());
    container.appendChild(addBtn);
    
    // 更新统计数据
    this.updateStats();
  }
  
  // 计算并更新统计数据
  updateStats() {
    const gifts = this.config.gifts;
    
    if (gifts.length === 0) {
      this.elements.statGiftCount.textContent = '0';
      this.elements.statTotalWeight.textContent = '0';
      this.elements.statExpectedBattery.textContent = '0.00';
      this.elements.statExpectedValue.textContent = '¥0.00';
      return;
    }
    
    // 礼物总数
    const giftCount = gifts.length;
    
    // 总权重
    const totalWeight = gifts.reduce((sum, g) => sum + (g.weight || 0), 0);
    
    // 期望电池数 E = Σ(电池数 × 概率) = Σ(电池数 × 权重/总权重)
    let expectedBattery = 0;
    if (totalWeight > 0) {
      expectedBattery = gifts.reduce((sum, g) => {
        const probability = (g.weight || 0) / totalWeight;
        return sum + (g.battery || 0) * probability;
      }, 0);
    }
    
    // 期望价值（B站1电池 = 0.1元）
    const expectedValue = expectedBattery * 0.1;
    
    // 更新显示
    this.elements.statGiftCount.textContent = giftCount;
    this.elements.statTotalWeight.textContent = totalWeight;
    this.elements.statExpectedBattery.textContent = expectedBattery.toFixed(2);
    this.elements.statExpectedValue.textContent = '¥' + expectedValue.toFixed(2);
  }
  
  // 创建礼物卡片
  createGiftCard(gift, index) {
    const tier = this.getGiftTier(gift.battery);
    
    const card = document.createElement('div');
    card.className = `gift-card ${tier}`;
    card.dataset.index = index;
    
    card.innerHTML = `
      <img src="${gift.image}" alt="${gift.name}" class="gift-image-preview"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>'">
      <div class="gift-info">
        <div class="gift-field">
          <label>礼物ID</label>
          <input type="number" value="${gift.id}" data-field="id" min="1" max="9999999">
        </div>
        <div class="gift-field">
          <label>礼物名称</label>
          <input type="text" value="${gift.name}" data-field="name" maxlength="20">
        </div>
        <div class="gift-field">
          <label>电池数</label>
          <input type="number" value="${gift.battery}" data-field="battery" min="1">
        </div>
        <div class="gift-field">
          <label>权重</label>
          <input type="number" value="${gift.weight}" data-field="weight" min="1" max="1000">
        </div>
        <div class="gift-field" style="grid-column: span 2;">
          <label>图片地址</label>
          <input type="url" value="${gift.image}" data-field="image" placeholder="https://...">
        </div>
      </div>
      <div class="gift-actions">
        <button class="btn-delete" data-action="delete">删除</button>
      </div>
    `;
    
    // 绑定输入事件
    const inputs = card.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => this.updateGift(index, e));
      input.addEventListener('blur', (e) => this.updateGift(index, e));
    });
    
    // 绑定删除事件
    const deleteBtn = card.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', () => this.deleteGift(index));
    
    // 图片预览更新
    const imageInput = card.querySelector('[data-field="image"]');
    const imagePreview = card.querySelector('.gift-image-preview');
    imageInput.addEventListener('change', () => {
      imagePreview.src = imageInput.value;
    });
    
    return card;
  }
  
  // 获取礼物等级
  getGiftTier(battery) {
    if (battery >= this.config.giftTiers.legendary.minBattery) return 'legendary';
    if (battery >= this.config.giftTiers.rare.minBattery) return 'rare';
    return 'common';
  }
  
  // 更新礼物数据
  updateGift(index, event) {
    const field = event.target.dataset.field;
    let value = event.target.value;
    
    // 类型转换
    if (['id', 'battery', 'weight'].includes(field)) {
      value = parseInt(value) || 0;
    }
    
    this.config.gifts[index][field] = value;
    
    // 如果是电池数变化，更新卡片等级样式
    if (field === 'battery') {
      const card = event.target.closest('.gift-card');
      const tier = this.getGiftTier(value);
      card.className = `gift-card ${tier}`;
    }
    
    // 如果是电池或权重变化，更新统计
    if (field === 'battery' || field === 'weight') {
      this.updateStats();
    }
  }
  
  // 添加新礼物
  addGift() {
    const newGift = {
      id: Math.floor(Math.random() * 90000) + 10000,
      name: "新礼物",
      battery: 1,
      image: "https://i0.hdslb.com/bfs/live/5c8467200c9fe256b8a004da2e39e22a1ddba323.png",
      weight: 50
    };
    
    this.config.gifts.push(newGift);
    this.renderGifts();
    
    // 滚动到底部
    this.elements.giftsList.scrollTop = this.elements.giftsList.scrollHeight;
    
    this.showToast('已添加新礼物，请编辑详情', 'success');
  }
  
  // 删除礼物
  deleteGift(index) {
    if (this.config.gifts.length <= 1) {
      this.showToast('至少保留一个礼物', 'error');
      return;
    }
    
    const gift = this.config.gifts[index];
    if (confirm(`确定要删除"${gift.name}"吗？`)) {
      this.config.gifts.splice(index, 1);
      this.renderGifts();
      this.showToast('礼物已删除', 'success');
    }
  }
  
  // 保存配置（导出JSON文件，用户需手动替换）
  saveConfig() {
    try {
      this.updateSettings();
      
      // 验证数据
      if (!this.validateConfig()) {
        return;
      }
      
      // 直接导出文件
      const dataStr = JSON.stringify(this.config, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gifts.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('配置已下载！请将 gifts.json 替换到 config 文件夹中', 'success');
    } catch (error) {
      console.error('保存配置失败:', error);
      this.showToast('保存失败：' + error.message, 'error');
    }
  }
  
  // 验证配置
  validateConfig() {
    // 检查必要字段
    if (!this.config.settings.title) {
      this.showToast('请输入标题', 'error');
      return false;
    }
    
    if (this.config.gifts.length === 0) {
      this.showToast('至少需要一个礼物', 'error');
      return false;
    }
    
    // 检查礼物数据
    for (let i = 0; i < this.config.gifts.length; i++) {
      const gift = this.config.gifts[i];
      if (!gift.name || !gift.id || gift.battery <= 0 || gift.weight <= 0) {
        this.showToast(`礼物 #${i + 1} 数据不完整`, 'error');
        return false;
      }
    }
    
    // 检查等级阈值
    if (this.config.giftTiers.legendary.minBattery <= this.config.giftTiers.rare.minBattery) {
      this.showToast('传说级阈值应大于稀有级阈值', 'error');
      return false;
    }
    
    return true;
  }
  
  // 导出配置
  exportConfig() {
    this.updateSettings();
    
    const dataStr = JSON.stringify(this.config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lottery_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('配置已导出', 'success');
  }
  
  // 导入配置
  importConfig(event) {
    const file = event.target.files[0];
    if (!file) {
      console.log('没有选择文件');
      return;
    }
    
    console.log('开始导入文件:', file.name);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        console.log('文件内容:', text.substring(0, 200) + '...');
        
        const newConfig = JSON.parse(text);
        
        // 验证导入的配置
        if (!newConfig.settings || !newConfig.gifts || !newConfig.giftTiers) {
          throw new Error('配置文件格式不正确，缺少必要字段');
        }
        
        if (!Array.isArray(newConfig.gifts)) {
          throw new Error('gifts 必须是数组');
        }
        
        this.config = newConfig;
        this.renderSettings();
        this.renderGifts();
        
        this.showToast(`配置已导入，共 ${newConfig.gifts.length} 个礼物`, 'success');
        console.log('导入成功:', newConfig);
      } catch (error) {
        console.error('导入配置失败:', error);
        this.showToast('导入失败：' + error.message, 'error');
      }
    };
    
    reader.onerror = (error) => {
      console.error('读取文件失败:', error);
      this.showToast('读取文件失败', 'error');
    };
    
    reader.readAsText(file);
    
    // 清除文件选择，允许重复选择同一文件
    event.target.value = '';
  }
  
  // 重置配置（重新从JSON文件加载）
  async resetConfig() {
    if (!confirm('确定要重新加载配置文件吗？未保存的修改将丢失！')) {
      return;
    }
    
    try {
      await this.loadConfig();
      this.renderSettings();
      this.renderGifts();
      this.showToast('已重新加载配置文件', 'success');
    } catch (error) {
      console.error('重置配置失败:', error);
      this.showToast('重置失败：' + error.message, 'error');
    }
  }
  
  // 显示提示消息
  showToast(message, type = 'success') {
    const toast = this.elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();
});
