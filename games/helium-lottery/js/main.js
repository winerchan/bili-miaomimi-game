/**
 * 氦氦的轮盘机 - 主脚本
 * 由船船碎片打造~
 */

class LotteryMachine {
  constructor() {
    this.config = null;
    this.isSpinning = false;
    this.history = [];
    this.adminClickCount = 0;
    this.adminClickTimer = null;
    
    this.init();
  }
  
  async init() {
    // 先获取按钮元素并禁用
    const leverButton = document.getElementById('leverButton');
    if (leverButton) {
      leverButton.disabled = true;
      leverButton.textContent = '加载中...';
    }
    
    await this.loadConfig();
    this.setupDOM();
    this.bindEvents();
    this.buildReel();
    this.loadHistory();
    
    // 配置加载完成，启用按钮
    if (this.elements.leverButton) {
      this.elements.leverButton.disabled = false;
      this.elements.leverButton.textContent = '开始';
    }
  }
  
  // 加载配置文件（始终从JSON读取）
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
      alert('加载配置文件失败，请检查 config/gifts.json 是否存在');
    }
  }
  
  // 设置DOM引用
  setupDOM() {
    this.elements = {
      slotReel: document.getElementById('slotReel'),
      leverButton: document.getElementById('leverButton'),
      resultDisplay: document.getElementById('resultDisplay'),
      resultCard: document.getElementById('resultCard'),
      resultTierLabel: document.getElementById('resultTierLabel'),
      resultImage: document.getElementById('resultImage'),
      resultName: document.getElementById('resultName'),
      resultBattery: document.getElementById('resultBattery'),
      resultClose: document.getElementById('resultClose'),
      historyList: document.getElementById('historyList'),
      confettiContainer: document.getElementById('confettiContainer'),
      adminTrigger: document.getElementById('adminTrigger')
    };
    
    // 更新标题
    document.querySelector('.main-title').textContent = this.config.settings.title;
    document.querySelector('.subtitle').innerHTML = this.config.settings.subtitle.replace('船船', '<span>船船</span>');
  }
  
  // 绑定事件
  bindEvents() {
    // 拉杆按钮
    this.elements.leverButton.addEventListener('click', () => this.spin());
    
    // 关闭结果
    this.elements.resultClose.addEventListener('click', () => this.hideResult());
    this.elements.resultDisplay.addEventListener('click', (e) => {
      if (e.target === this.elements.resultDisplay || e.target.classList.contains('result-overlay')) {
        this.hideResult();
      }
    });
    
    // 管理入口（隐藏）
    this.elements.adminTrigger.addEventListener('click', () => this.handleAdminClick());
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isSpinning) {
        e.preventDefault();
        this.spin();
      }
      if (e.code === 'Escape') {
        this.hideResult();
      }
    });
  }
  
  // 构建轮盘
  buildReel() {
    const reel = this.elements.slotReel;
    if (!reel) return;
    
    reel.innerHTML = '';
    
    // 检查配置是否存在
    if (!this.config || !this.config.gifts || this.config.gifts.length === 0) {
      console.warn('配置未加载或礼物列表为空');
      return;
    }
    
    // 创建足够多的项目用于滚动
    const items = this.shuffleArray([...this.config.gifts]);
    const repeatCount = 10; // 重复次数
    
    for (let i = 0; i < repeatCount; i++) {
      items.forEach(gift => {
        const item = this.createSlotItem(gift);
        reel.appendChild(item);
      });
    }
  }
  
  // 创建轮盘项
  createSlotItem(gift) {
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.dataset.giftId = gift.id;
    
    item.innerHTML = `
      <img src="${gift.image}" alt="${gift.name}" class="slot-item-image" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>'">
      <div class="slot-item-info">
        <span class="slot-item-name">${gift.name}</span>
        <span class="slot-item-battery">
          <svg class="battery-icon" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
          </svg>
          ${gift.battery}
        </span>
      </div>
    `;
    
    return item;
  }
  
  // 开始抽奖
  async spin() {
    if (this.isSpinning) return;
    if (!this.config || !this.config.gifts || this.config.gifts.length === 0) {
      alert('配置未加载或礼物列表为空');
      return;
    }
    
    this.isSpinning = true;
    this.elements.leverButton.disabled = true;
    this.elements.leverButton.classList.add('spinning');
    this.elements.leverButton.textContent = '抽奖中...';
    
    // 根据权重选择结果
    this.currentResult = this.selectGiftByWeight();
    
    // 获取轮盘元素
    const reel = this.elements.slotReel;
    
    // 先瞬间重置位置
    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0)';
    
    // 重建轮盘内容
    const targetIndex = this.buildReelWithResult(this.currentResult);
    
    // 强制重绘
    void reel.offsetHeight;
    
    // 计算滚动位置
    const itemHeight = window.innerWidth <= 480 ? 70 : (window.innerWidth <= 768 ? 80 : 90);
    
    // 计算滚动距离（让目标项居中显示在指示器内）
    const windowHeight = this.elements.slotReel.parentElement.offsetHeight;
    const targetPosition = targetIndex * itemHeight - (windowHeight / 2) + (itemHeight / 2);
    
    // 应用动画
    reel.style.transition = `transform ${this.config.settings.spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    reel.style.transform = `translateY(-${targetPosition}px)`;
    
    // 等待动画完成
    await this.delay(this.config.settings.spinDuration);
    
    // 额外等待一小段时间，让用户看清结果
    await this.delay(500);
    
    // 显示结果
    this.showResult(this.currentResult);
    
    // 添加到历史
    this.addToHistory(this.currentResult);
    
    // 重置按钮状态
    this.isSpinning = false;
    this.elements.leverButton.disabled = false;
    this.elements.leverButton.classList.remove('spinning');
    this.elements.leverButton.textContent = '开始';
  }
  
  // 构建包含结果的轮盘，返回目标项的索引
  buildReelWithResult(targetGift) {
    const reel = this.elements.slotReel;
    reel.innerHTML = '';
    
    const gifts = [...this.config.gifts];
    const repeatCount = 10;
    const giftsPerRound = gifts.length;
    
    // 目标位置：第7轮的中间
    const targetRound = 7;
    const targetPositionInRound = Math.floor(giftsPerRound / 2);
    
    let currentIndex = 0;
    let actualTargetIndex = 0;
    
    for (let round = 0; round < repeatCount; round++) {
      const shuffled = this.shuffleArray([...gifts]);
      
      for (let j = 0; j < shuffled.length; j++) {
        // 在目标位置插入目标礼物
        if (round === targetRound && j === targetPositionInRound) {
          const item = this.createSlotItem(targetGift);
          reel.appendChild(item);
          actualTargetIndex = currentIndex;
          currentIndex++;
        }
        
        const item = this.createSlotItem(shuffled[j]);
        reel.appendChild(item);
        currentIndex++;
      }
    }
    
    return actualTargetIndex;
  }
  
  // 隐藏结果（关闭弹窗，但不重置轮盘）
  hideResult() {
    this.elements.resultDisplay.classList.remove('show');
    this.elements.confettiContainer.innerHTML = '';
  }
  
  // 根据权重选择礼物
  selectGiftByWeight() {
    const gifts = this.config.gifts;
    const totalWeight = gifts.reduce((sum, g) => sum + g.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const gift of gifts) {
      random -= gift.weight;
      if (random <= 0) {
        return gift;
      }
    }
    
    return gifts[gifts.length - 1];
  }
  
  // 获取礼物等级
  getGiftTier(battery) {
    const tiers = this.config.giftTiers;
    if (battery >= tiers.legendary.minBattery) return 'legendary';
    if (battery >= tiers.rare.minBattery) return 'rare';
    return 'common';
  }
  
  // 显示结果
  showResult(gift) {
    const tier = this.getGiftTier(gift.battery);
    const tierConfig = this.config.giftTiers[tier];
    
    // 设置卡片样式
    this.elements.resultCard.className = `result-card ${tier}`;
    this.elements.resultTierLabel.textContent = tierConfig.label;
    this.elements.resultImage.src = gift.image;
    this.elements.resultImage.onerror = function() {
      this.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>';
    };
    this.elements.resultName.textContent = gift.name;
    this.elements.resultBattery.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
      </svg>
      ${gift.battery} 电池
    `;
    
    // 显示弹窗
    this.elements.resultDisplay.classList.add('show');
    
    // 根据等级播放庆祝效果
    if (tier === 'legendary') {
      this.playLegendaryCelebration();
    } else if (tier === 'rare') {
      this.playRareCelebration();
    } else {
      this.playCommonCelebration();
    }
  }
  
  // 传说级庆祝效果
  playLegendaryCelebration() {
    // 五彩纸屑
    this.createConfetti(100);
    
    // 烟花效果
    this.createFireworks(5);
    
    // 播放音效（如果有）
    this.playSound('legendary');
  }
  
  // 稀有级庆祝效果
  playRareCelebration() {
    this.createConfetti(50);
    this.playSound('rare');
  }
  
  // 普通级庆祝效果
  playCommonCelebration() {
    this.createConfetti(20);
    this.playSound('common');
  }
  
  // 创建五彩纸屑
  createConfetti(count) {
    const container = this.elements.confettiContainer;
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      
      // 随机形状
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%';
      } else {
        confetti.style.width = '8px';
        confetti.style.height = '14px';
      }
      
      container.appendChild(confetti);
      
      // 动画结束后移除
      confetti.addEventListener('animationend', () => {
        confetti.remove();
      });
    }
  }
  
  // 创建烟花
  createFireworks(count) {
    const container = this.elements.confettiContainer;
    const colors = ['#FFD700', '#FF6347', '#00CED1', '#FF69B4', '#32CD32'];
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = (20 + Math.random() * 60) + '%';
        firework.style.top = (20 + Math.random() * 40) + '%';
        firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        firework.style.boxShadow = `0 0 20px ${firework.style.backgroundColor}`;
        
        container.appendChild(firework);
        
        firework.addEventListener('animationend', () => {
          firework.remove();
        });
      }, i * 300);
    }
  }
  
  // 播放音效（占位）
  playSound(type) {
    // 可以后续添加音效
    console.log(`Playing ${type} sound`);
  }
  
  // 添加到历史记录
  addToHistory(gift) {
    const tier = this.getGiftTier(gift.battery);
    this.history.unshift({ ...gift, tier, timestamp: Date.now() });
    
    // 最多保留20条
    if (this.history.length > 20) {
      this.history.pop();
    }
    
    this.renderHistory();
    this.saveHistory();
  }
  
  // 渲染历史记录
  renderHistory() {
    const list = this.elements.historyList;
    list.innerHTML = '';
    
    this.history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = `history-item ${item.tier}`;
      historyItem.innerHTML = `<img src="${item.image}" alt="${item.name}" 
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>'">`;
      historyItem.title = `${item.name} - ${item.battery}电池`;
      list.appendChild(historyItem);
    });
  }
  
  // 保存历史到本地
  saveHistory() {
    localStorage.setItem('lottery_history', JSON.stringify(this.history));
  }
  
  // 加载历史记录
  loadHistory() {
    try {
      const saved = localStorage.getItem('lottery_history');
      if (saved) {
        this.history = JSON.parse(saved);
        this.renderHistory();
      }
    } catch (e) {
      console.error('加载历史记录失败:', e);
    }
  }
  
  // 管理入口点击处理
  handleAdminClick() {
    this.adminClickCount++;
    
    // 清除之前的计时器
    if (this.adminClickTimer) {
      clearTimeout(this.adminClickTimer);
    }
    
    // 设置新的计时器（2秒内重置）
    this.adminClickTimer = setTimeout(() => {
      this.adminClickCount = 0;
    }, 2000);
    
    // 达到点击次数，进入管理页面
    if (this.adminClickCount >= this.config.settings.adminClickCount) {
      this.adminClickCount = 0;
      window.location.href = 'admin.html';
    }
  }
  
  // 工具函数
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.lotteryMachine = new LotteryMachine();
});
