/**
 * 喵喵扭蛋机 - 管理页面脚本
 * 支持：概率显示、Emoji礼物、虚拟礼物
 */

class AdminPanel {
  constructor() {
    this.config = null;
    this.currentEditingGiftIndex = null;
    this.selectedEmoji = null;
    
    // 常用Emoji列表
    this.emojiList = [
      // 表情
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
      '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪',
      '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶',
      '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
      // 动物
      '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
      '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐',
      '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊',
      // 食物
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
      '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞',
      '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩',
      '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆',
      '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣',
      '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢',
      '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭',
      '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼',
      '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃',
      // 活动/物品
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🎮', '🕹️', '🎲', '🧩',
      '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺',
      '🎸', '🪕', '🎻', '🎯', '🎳', '🎰', '🎪', '🎠', '🎡', '🎢',
      // 自然/天气
      '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱',
      '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂',
      '🍃', '🍄', '🌰', '🦀', '🐚', '🌍', '🌎', '🌏', '🌐', '🌑',
      '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛',
      '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈️',
      '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌈',
      // 符号/其他
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
      '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
      '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
      '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
      '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️',
      '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠',
      'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂',
      '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦',
      '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙',
      '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣',
      '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️',
      '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️',
      '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️',
      '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄',
      '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱',
      '™️', '©️', '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️',
      '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵',
      '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷',
      '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧',
      '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉',
      '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️',
      '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔'
    ];
    
    this.init();
  }
  
  async init() {
    await this.loadConfig();
    this.setupDOM();
    this.bindEvents();
    this.renderSettings();
    this.renderGifts();
    this.renderEmojiPicker();
  }
  
  // 加载配置
  async loadConfig() {
    try {
      const response = await fetch('config/gifts.json?' + Date.now());
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
          title: "喵喵扭蛋机",
          subtitle: "转动手柄，收获惊喜~",
          capsuleCount: 20,
          shakeTime: 2500,
          adminClickCount: 8
        },
        giftTiers: {
          legendary: { minBattery: 1000, label: "传说奖励", color: "#FFD700" },
          rare: { minBattery: 100, label: "稀有奖励", color: "#C0C0C0" },
          common: { minBattery: 0, label: "普通奖励", color: "#3498DB" }
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
      settingCapsuleCount: document.getElementById('settingCapsuleCount'),
      settingShakeTime: document.getElementById('settingShakeTime'),
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
      btnAddNormal: document.getElementById('btnAddNormal'),
      btnAddVirtual: document.getElementById('btnAddVirtual'),
      btnSave: document.getElementById('btnSave'),
      btnExport: document.getElementById('btnExport'),
      btnImport: document.getElementById('btnImport'),
      fileImport: document.getElementById('fileImport'),
      btnReset: document.getElementById('btnReset'),
      btnBack: document.getElementById('btnBack'),
      
      // Emoji选择器
      emojiPickerOverlay: document.getElementById('emojiPickerOverlay'),
      emojiGrid: document.getElementById('emojiGrid'),
      emojiSearch: document.getElementById('emojiSearch'),
      emojiPickerClose: document.getElementById('emojiPickerClose'),
      emojiPickerCancel: document.getElementById('emojiPickerCancel'),
      emojiPickerConfirm: document.getElementById('emojiPickerConfirm'),
      
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
    
    // 添加礼物
    this.elements.btnAddNormal.addEventListener('click', () => this.addGift('normal'));
    this.elements.btnAddVirtual.addEventListener('click', () => this.addGift('virtual'));
    
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
      'settingTitle', 'settingSubtitle', 'settingCapsuleCount',
      'settingShakeTime', 'settingAdminClicks', 'settingLegendaryMin', 'settingRareMin'
    ];
    
    settingInputs.forEach(id => {
      if (this.elements[id]) {
        this.elements[id].addEventListener('change', () => this.updateSettings());
      }
    });
    
    // Emoji选择器事件
    this.elements.emojiPickerClose.addEventListener('click', () => this.hideEmojiPicker());
    this.elements.emojiPickerCancel.addEventListener('click', () => this.hideEmojiPicker());
    this.elements.emojiPickerConfirm.addEventListener('click', () => this.confirmEmojiSelection());
    this.elements.emojiSearch.addEventListener('input', (e) => this.filterEmojis(e.target.value));
    
    // 点击遮罩关闭
    this.elements.emojiPickerOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.emojiPickerOverlay) {
        this.hideEmojiPicker();
      }
    });
  }
  
  // 渲染设置
  renderSettings() {
    this.elements.settingTitle.value = this.config.settings.title || '';
    this.elements.settingSubtitle.value = this.config.settings.subtitle || '';
    this.elements.settingCapsuleCount.value = this.config.settings.capsuleCount || 20;
    this.elements.settingShakeTime.value = this.config.settings.shakeTime || 2500;
    this.elements.settingAdminClicks.value = this.config.settings.adminClickCount || 8;
    this.elements.settingLegendaryMin.value = this.config.giftTiers.legendary.minBattery || 1000;
    this.elements.settingRareMin.value = this.config.giftTiers.rare.minBattery || 100;
  }
  
  // 更新设置
  updateSettings() {
    this.config.settings.title = this.elements.settingTitle.value;
    this.config.settings.subtitle = this.elements.settingSubtitle.value;
    this.config.settings.capsuleCount = parseInt(this.elements.settingCapsuleCount.value) || 20;
    this.config.settings.shakeTime = parseInt(this.elements.settingShakeTime.value) || 2500;
    this.config.settings.adminClickCount = parseInt(this.elements.settingAdminClicks.value) || 8;
    this.config.giftTiers.legendary.minBattery = parseInt(this.elements.settingLegendaryMin.value) || 1000;
    this.config.giftTiers.rare.minBattery = parseInt(this.elements.settingRareMin.value) || 100;
  }
  
  // 渲染Emoji选择器
  renderEmojiPicker() {
    this.elements.emojiGrid.innerHTML = '';
    
    this.emojiList.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.textContent = emoji;
      item.addEventListener('click', () => this.selectEmoji(emoji, item));
      this.elements.emojiGrid.appendChild(item);
    });
  }
  
  // 过滤Emoji
  filterEmojis(searchText) {
    const items = this.elements.emojiGrid.querySelectorAll('.emoji-item');
    
    // 如果输入的是emoji，直接选中
    if (this.isEmoji(searchText)) {
      this.selectedEmoji = searchText;
      items.forEach(item => {
        item.classList.toggle('selected', item.textContent === searchText);
      });
      return;
    }
    
    // 否则显示所有（简单实现，不做复杂搜索）
    items.forEach(item => {
      item.style.display = '';
    });
  }
  
  // 判断是否为emoji
  isEmoji(str) {
    if (!str) return false;
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u;
    return emojiRegex.test(str);
  }
  
  // 选择Emoji
  selectEmoji(emoji, element) {
    // 取消之前的选择
    this.elements.emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // 选中当前
    element.classList.add('selected');
    this.selectedEmoji = emoji;
    this.elements.emojiSearch.value = emoji;
  }
  
  // 显示Emoji选择器
  showEmojiPicker(giftIndex) {
    this.currentEditingGiftIndex = giftIndex;
    this.selectedEmoji = null;
    this.elements.emojiSearch.value = '';
    this.elements.emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
      item.classList.remove('selected');
      item.style.display = '';
    });
    this.elements.emojiPickerOverlay.classList.add('show');
  }
  
  // 隐藏Emoji选择器
  hideEmojiPicker() {
    this.elements.emojiPickerOverlay.classList.remove('show');
    this.currentEditingGiftIndex = null;
    this.selectedEmoji = null;
  }
  
  // 确认Emoji选择
  confirmEmojiSelection() {
    const emoji = this.selectedEmoji || this.elements.emojiSearch.value;
    
    if (!emoji) {
      this.showToast('请选择或输入一个Emoji', 'error');
      return;
    }
    
    if (this.currentEditingGiftIndex !== null) {
      // 更新礼物图片为emoji格式
      this.config.gifts[this.currentEditingGiftIndex].image = `emoji:${emoji}`;
      this.config.gifts[this.currentEditingGiftIndex].isEmoji = true;
      this.renderGifts();
    }
    
    this.hideEmojiPicker();
  }
  
  // 渲染礼物列表
  renderGifts() {
    const container = this.elements.giftsList;
    container.innerHTML = '';
    
    // 计算总权重用于概率计算
    const totalWeight = this.config.gifts.reduce((sum, g) => sum + (g.weight || 0), 0);
    
    this.config.gifts.forEach((gift, index) => {
      const card = this.createGiftCard(gift, index, totalWeight);
      container.appendChild(card);
    });
    
    // 更新统计数据
    this.updateStats();
  }
  
  // 创建礼物卡片
  createGiftCard(gift, index, totalWeight) {
    const tier = this.getGiftTier(gift.battery || 0);
    const isVirtual = gift.isVirtual === true;  // 只根据isVirtual字段判断
    const isEmoji = gift.isEmoji || (gift.image && gift.image.startsWith('emoji:'));
    
    // 计算概率并自动选择合适的符号（%、‰、‱）
    const probabilityInfo = this.formatProbability(gift.weight || 0, totalWeight);
    
    const card = document.createElement('div');
    card.className = `gift-card ${tier}`;
    if (isVirtual) card.classList.add('virtual');
    card.dataset.index = index;
    
    // 构建图片/Emoji预览
    let previewContent;
    if (isEmoji) {
      const emoji = gift.image.replace('emoji:', '');
      previewContent = `<span class="emoji-display">${emoji}</span>`;
    } else {
      previewContent = `<img src="${gift.image}" alt="${gift.name}" 
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>'">`;
    }
    
    // 计算大约抽多少次出一次
    const drawCount = totalWeight > 0 && gift.weight > 0 
      ? Math.round(totalWeight / gift.weight) 
      : 0;
    const drawCountText = drawCount > 0 
      ? (drawCount >= 10000 ? `${(drawCount/10000).toFixed(1)}万` : drawCount)
      : '-';
    
    card.innerHTML = `
      <div class="gift-preview" title="点击更换图片">
        ${previewContent}
      </div>
      <div class="gift-info">
        <div class="gift-row">
          <div class="gift-field id-field">
            <label>ID</label>
            <input type="number" value="${gift.id || ''}" data-field="id" min="0" max="9999999" placeholder="可选">
          </div>
          <div class="gift-field name-field">
            <label>名称</label>
            <input type="text" value="${gift.name || ''}" data-field="name" maxlength="20">
          </div>
          <div class="gift-field switch-field">
            <label class="switch-label">虚拟奖励</label>
            <div class="toggle-switch">
              <input type="checkbox" data-field="isVirtual" ${isVirtual ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </div>
          </div>
        </div>
        <div class="gift-row">
          <div class="gift-field num-field">
            <label>电池</label>
            <input type="number" value="${gift.battery || 0}" data-field="battery" min="0">
          </div>
          <div class="gift-field weight-field">
            <label>权重</label>
            <input type="number" value="${gift.weight || 1}" data-field="weight" min="1" max="100000">
          </div>
        </div>
        <div class="gift-row image-row">
          <div class="gift-field image-field">
            <label>图片</label>
            <div class="image-input-wrapper">
              <input type="text" value="${gift.image || ''}" data-field="image" placeholder="https://... 或 emoji:😀">
              <button type="button" class="btn-emoji-picker" data-action="pickEmoji" title="选择Emoji">😀</button>
            </div>
          </div>
        </div>
      </div>
      <div class="gift-probability">
        <span class="probability-value">${probabilityInfo.value}${probabilityInfo.symbol}</span>
        <span class="probability-label">中奖率</span>
        <div class="probability-divider"></div>
        <span class="draw-count">约 ${drawCountText} 抽</span>
        <span class="draw-hint">出一次</span>
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
    
    // 绑定图片预览点击事件
    const preview = card.querySelector('.gift-preview');
    preview.addEventListener('click', () => this.showEmojiPicker(index));
    
    // 绑定Emoji选择按钮
    const emojiBtn = card.querySelector('[data-action="pickEmoji"]');
    if (emojiBtn) {
      emojiBtn.addEventListener('click', () => this.showEmojiPicker(index));
    }
    
    return card;
  }
  
  // 获取礼物等级
  getGiftTier(battery) {
    if (battery >= this.config.giftTiers.legendary.minBattery) return 'legendary';
    if (battery >= this.config.giftTiers.rare.minBattery) return 'rare';
    return 'common';
  }
  
  // 格式化概率显示，自动选择合适的符号（%、‰、‱）
  // 规则：确保小数点前是0时才使用更小的单位
  formatProbability(weight, totalWeight) {
    if (totalWeight <= 0 || weight <= 0) {
      return { value: '0', symbol: '%' };
    }
    
    const ratio = weight / totalWeight;
    
    // 百分比 (%)
    const percent = ratio * 100;
    if (percent >= 1) {
      // 大于等于1%，直接用百分比
      return { value: percent.toFixed(2), symbol: '%' };
    }
    
    // 小于1%但大于等于0.01%，仍用百分比
    if (percent >= 0.01) {
      return { value: percent.toFixed(2), symbol: '%' };
    }
    
    // 千分比 (‰)
    const permille = ratio * 1000;
    if (permille >= 0.01) {
      // 0.01‰ 以上用千分比
      return { value: permille.toFixed(2), symbol: '‰' };
    }
    
    // 万分比 (‱)
    const permyriad = ratio * 10000;
    if (permyriad >= 0.01) {
      return { value: permyriad.toFixed(2), symbol: '‱' };
    }
    
    // 极小概率
    return { value: '<0.01', symbol: '‱' };
  }
  
  // 更新礼物数据
  updateGift(index, event) {
    const field = event.target.dataset.field;
    let value;
    
    // 处理checkbox类型
    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    } else {
      value = event.target.value;
      // 类型转换
      if (['id', 'battery', 'weight'].includes(field)) {
        value = parseInt(value) || 0;
      }
    }
    
    this.config.gifts[index][field] = value;
    
    // 检查是否为emoji
    if (field === 'image') {
      this.config.gifts[index].isEmoji = value.startsWith('emoji:');
    }
    
    // 虚拟礼物勾选变化时更新卡片样式
    if (field === 'isVirtual') {
      const card = event.target.closest('.gift-card');
      card.classList.toggle('virtual', value);
    }
    
    // 电池数变化时更新等级样式
    if (field === 'battery') {
      const card = event.target.closest('.gift-card');
      const tier = this.getGiftTier(value);
      const isVirtual = this.config.gifts[index].isVirtual === true;
      card.className = `gift-card ${tier}`;
      if (isVirtual) card.classList.add('virtual');
    }
    
    // 如果是权重变化，更新所有概率显示
    if (field === 'weight') {
      this.renderGifts();
    }
    
    // 更新统计
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
    
    // 期望电池数 E = Σ(电池数 × 概率)
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
  
  // 添加新礼物
  addGift(type = 'normal') {
    let newGift;
    
    switch (type) {
      case 'virtual':
        newGift = {
          id: 0,
          name: "虚拟奖励",
          battery: 0,
          image: "emoji:✨",
          weight: 50,
          isVirtual: true,
          isEmoji: true
        };
        break;
      default:
        newGift = {
          id: Math.floor(Math.random() * 90000) + 10000,
          name: "新礼物",
          battery: 1,
          image: "https://i0.hdslb.com/bfs/live/5c8467200c9fe256b8a004da2e39e22a1ddba323.png",
          weight: 50
        };
    }
    
    this.config.gifts.push(newGift);
    this.renderGifts();
    
    // 滚动到底部
    this.elements.giftsList.scrollTop = this.elements.giftsList.scrollHeight;
    
    this.showToast(`已添加${type === 'virtual' ? '虚拟奖励' : '礼物'}`, 'success');
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
  
  // 保存配置
  saveConfig() {
    try {
      this.updateSettings();
      
      if (!this.validateConfig()) {
        return;
      }
      
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
      if (!gift.name || gift.weight <= 0) {
        this.showToast(`礼物 #${i + 1} 数据不完整（需要名称和权重）`, 'error');
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
    a.download = 'gashapon_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('配置已导出', 'success');
  }
  
  // 导入配置
  importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const newConfig = JSON.parse(e.target.result);
        
        if (!newConfig.settings || !newConfig.gifts || !newConfig.giftTiers) {
          throw new Error('配置文件格式不正确');
        }
        
        this.config = newConfig;
        this.renderSettings();
        this.renderGifts();
        
        this.showToast(`配置已导入，共 ${newConfig.gifts.length} 个礼物`, 'success');
      } catch (error) {
        this.showToast('导入失败：' + error.message, 'error');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  }
  
  // 重置配置
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
