/**
 * 喵喵扭蛋机 - 主脚本
 * B站风格扭蛋机游戏
 */

class GashaponMachine {
  constructor() {
    this.config = null;
    this.isSpinning = false;
    this.history = [];
    this.adminClickCount = 0;
    this.adminClickTimer = null;
    this.capsuleColors = ['red', 'blue', 'yellow', 'pink', 'green', 'purple', 'orange'];
    
    this.init();
  }
  
  async init() {
    // 先获取按钮元素并禁用
    const handleButton = document.getElementById('handleButton');
    if (handleButton) {
      handleButton.disabled = true;
      handleButton.querySelector('.handle-text').textContent = '加载中...';
    }
    
    await this.loadConfig();
    this.setupDOM();
    this.bindEvents();
    this.createCapsules();
    this.loadHistory();
    
    // 配置加载完成，启用按钮
    if (this.elements.handleButton) {
      this.elements.handleButton.disabled = false;
      this.elements.handleButton.querySelector('.handle-text').textContent = '扭一扭';
    }
  }
  
  // 加载配置文件
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
      alert('加载配置文件失败，请检查 config/gifts.json 是否存在');
    }
  }
  
  // 设置DOM引用
  setupDOM() {
    this.elements = {
      capsulesArea: document.getElementById('capsulesArea'),
      handleButton: document.getElementById('handleButton'),
      fallingCapsule: document.getElementById('fallingCapsule'),
      capsuleDropContainer: document.getElementById('capsuleDropContainer'),
      dropCapsule: document.getElementById('dropCapsule'),
      resultDisplay: document.getElementById('resultDisplay'),
      resultCard: document.getElementById('resultCard'),
      capsuleOpenAnimation: document.getElementById('capsuleOpenAnimation'),
      giftReveal: document.getElementById('giftReveal'),
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
    if (this.config && this.config.settings) {
      document.querySelector('.main-title').textContent = this.config.settings.title;
      document.querySelector('.subtitle').textContent = this.config.settings.subtitle;
    }
  }
  
  // 绑定事件
  bindEvents() {
    // 手柄按钮
    this.elements.handleButton.addEventListener('click', () => this.spin());
    
    // 关闭结果
    this.elements.resultClose.addEventListener('click', () => this.hideResult());
    this.elements.resultDisplay.addEventListener('click', (e) => {
      if (e.target === this.elements.resultDisplay || e.target.classList.contains('result-overlay')) {
        this.hideResult();
      }
    });
    
    // 管理入口
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
  
  // 创建扭蛋球
  createCapsules() {
    const area = this.elements.capsulesArea;
    if (!area || !this.config) return;
    
    area.innerHTML = '';
    
    // 扭蛋数量
    const capsuleCount = this.config.settings.capsuleCount || 20;
    
    // 定义特殊球的数量（保证至少有1个金色、2个银色）
    const specialCapsules = [
      { color: 'gold', tier: 'legendary' },
      { color: 'silver', tier: 'rare' },
      { color: 'silver', tier: 'rare' }
    ];
    
    // 创建扭蛋球
    for (let i = 0; i < capsuleCount; i++) {
      let capsule;
      if (i < specialCapsules.length) {
        // 前几个是特殊颜色的球
        capsule = this.createCapsuleElement(i, specialCapsules[i].color, specialCapsules[i].tier);
      } else {
        // 其余是普通彩色球
        capsule = this.createCapsuleElement(i);
      }
      area.appendChild(capsule);
    }
    
    // 延迟后定位扭蛋球（等待DOM更新）
    setTimeout(() => this.positionCapsules(), 50);
  }
  
  // 创建单个扭蛋球元素
  createCapsuleElement(index, forceColor = null, forceTier = null) {
    const capsule = document.createElement('div');
    
    // 如果指定了颜色，使用指定颜色，否则随机选择普通彩色
    let color;
    if (forceColor) {
      color = forceColor;
    } else {
      // 普通球使用彩色（排除金色和银色）
      const commonColors = ['red', 'blue', 'yellow', 'pink', 'green', 'purple', 'orange'];
      color = commonColors[index % commonColors.length];
    }
    
    capsule.className = `capsule color-${color}`;
    capsule.dataset.index = index;
    capsule.dataset.color = color;
    
    // 根据指定的等级添加特效
    if (forceTier === 'legendary') {
      capsule.classList.add('legendary', 'shining');
    } else if (forceTier === 'rare') {
      capsule.classList.add('rare', 'shining');
    }
    
    // 随机旋转角度（分割线方向随机）
    const randomRotation = Math.random() * 360;
    
    capsule.innerHTML = `
      <div class="capsule-inner" style="transform: rotate(${randomRotation}deg)">
        <div class="capsule-top-part"></div>
        <div class="capsule-line"></div>
        <div class="capsule-bottom-part"></div>
        <div class="capsule-shine"></div>
      </div>
    `;
    
    return capsule;
  }
  
  // 定位扭蛋球 - 物理堆积，贴着两边，金字塔形
  positionCapsules() {
    const area = this.elements.capsulesArea;
    const capsules = Array.from(area.querySelectorAll('.capsule'));
    const areaWidth = area.offsetWidth;
    const areaHeight = area.offsetHeight;
    const capsuleSize = 42;
    const overlap = 8; // 重叠量
    
    // 打乱顺序
    const shuffled = capsules.sort(() => Math.random() - 0.5);
    
    const baseY = areaHeight - capsuleSize - 5;
    const effectiveSize = capsuleSize - overlap;
    
    // 计算每层能放多少个（贴着两边）
    const bottomRowCount = Math.floor((areaWidth - 10) / effectiveSize);
    
    // 金字塔堆叠：每层比下面少一个，居中放置
    const rows = [];
    let count = bottomRowCount;
    let y = baseY;
    while (count >= 1 && rows.length < 6) {
      rows.push({ count: count, y: y });
      count--;
      y -= capsuleSize * 0.75;
    }
    
    let capsuleIndex = 0;
    
    rows.forEach((row, rowIndex) => {
      // 计算这一行的起始位置（居中）
      const rowWidth = row.count * effectiveSize;
      const rowStartX = (areaWidth - rowWidth) / 2;
      
      for (let col = 0; col < row.count && capsuleIndex < shuffled.length; col++) {
        const capsule = shuffled[capsuleIndex];
        
        // 基础位置
        let x = rowStartX + col * effectiveSize;
        let yPos = row.y;
        
        // 只有顶层的球有较大随机偏移
        if (rowIndex >= rows.length - 2) {
          x += (Math.random() - 0.5) * 20;
          yPos += (Math.random() - 0.5) * 10;
        } else {
          // 底层只有很小的随机偏移
          x += (Math.random() - 0.5) * 4;
          yPos += (Math.random() - 0.5) * 3;
        }
        
        capsule.style.left = `${Math.max(3, Math.min(x, areaWidth - capsuleSize - 3))}px`;
        capsule.style.top = `${yPos}px`;
        
        // z-index: 上层在前面
        capsule.style.zIndex = 10 + rowIndex * 5 + col;
        
        capsuleIndex++;
      }
    });
    
    // 如果还有剩余的球，随机放在最顶层
    while (capsuleIndex < shuffled.length) {
      const capsule = shuffled[capsuleIndex];
      const lastRow = rows[rows.length - 1];
      const x = (areaWidth - capsuleSize) / 2 + (Math.random() - 0.5) * 60;
      const y = lastRow ? lastRow.y - capsuleSize * 0.7 : baseY - capsuleSize * 3;
      
      capsule.style.left = `${Math.max(5, Math.min(x, areaWidth - capsuleSize - 5))}px`;
      capsule.style.top = `${Math.max(5, y + (Math.random() - 0.5) * 15)}px`;
      capsule.style.zIndex = 60 + capsuleIndex;
      
      capsuleIndex++;
    }
  }
  
  // 补充一个扭蛋球（替代滚出去的）
  replenishCapsule(rolledOutColor) {
    const area = this.elements.capsulesArea;
    if (!area) return;
    
    // 检查当前还有多少金色和银色球
    const capsules = Array.from(area.querySelectorAll('.capsule'));
    const goldCount = capsules.filter(c => c.dataset.color === 'gold').length;
    const silverCount = capsules.filter(c => c.dataset.color === 'silver').length;
    
    // 决定补充什么颜色的球
    let newColor, newTier;
    if (rolledOutColor === 'gold' || goldCount < 1) {
      // 如果滚出的是金色球，或者金色球不足1个，补充金色
      newColor = 'gold';
      newTier = 'legendary';
    } else if (rolledOutColor === 'silver' || silverCount < 2) {
      // 如果滚出的是银色球，或者银色球不足2个，补充银色
      newColor = 'silver';
      newTier = 'rare';
    } else {
      // 否则补充普通彩色球
      const commonColors = ['red', 'blue', 'yellow', 'pink', 'green', 'purple', 'orange'];
      newColor = commonColors[Math.floor(Math.random() * commonColors.length)];
      newTier = null;
    }
    
    // 创建新球
    const newCapsule = this.createCapsuleElement(Date.now(), newColor, newTier);
    
    // 设置初始位置（从顶部掉落）
    const areaWidth = area.offsetWidth;
    newCapsule.style.left = `${(areaWidth - 42) / 2}px`;
    newCapsule.style.top = '-50px';
    newCapsule.style.opacity = '0';
    newCapsule.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    area.appendChild(newCapsule);
    
    // 延迟后让球出现
    setTimeout(() => {
      newCapsule.style.opacity = '1';
    }, 50);
    
    // 等新球出现后，重新定位所有球形成金字塔堆叠
    setTimeout(() => {
      this.repositionAllCapsules();
    }, 100);
  }
  
  // 重新定位所有球（带动画）
  repositionAllCapsules() {
    const area = this.elements.capsulesArea;
    const capsules = Array.from(area.querySelectorAll('.capsule'));
    const areaWidth = area.offsetWidth;
    const areaHeight = area.offsetHeight;
    const capsuleSize = 42;
    const overlap = 8;
    
    const baseY = areaHeight - capsuleSize - 5;
    const effectiveSize = capsuleSize - overlap;
    const bottomRowCount = Math.floor((areaWidth - 10) / effectiveSize);
    
    // 金字塔堆叠
    const rows = [];
    let count = bottomRowCount;
    let y = baseY;
    while (count >= 1 && rows.length < 6) {
      rows.push({ count: count, y: y });
      count--;
      y -= capsuleSize * 0.75;
    }
    
    // 设置过渡动画
    capsules.forEach(capsule => {
      capsule.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    let capsuleIndex = 0;
    
    rows.forEach((row, rowIndex) => {
      const rowWidth = row.count * effectiveSize;
      const rowStartX = (areaWidth - rowWidth) / 2;
      
      for (let col = 0; col < row.count && capsuleIndex < capsules.length; col++) {
        const capsule = capsules[capsuleIndex];
        
        let x = rowStartX + col * effectiveSize;
        let yPos = row.y;
        
        // 只有顶层的球有较大随机偏移
        if (rowIndex >= rows.length - 2) {
          x += (Math.random() - 0.5) * 15;
          yPos += (Math.random() - 0.5) * 8;
        } else {
          x += (Math.random() - 0.5) * 4;
          yPos += (Math.random() - 0.5) * 3;
        }
        
        capsule.style.left = `${Math.max(3, Math.min(x, areaWidth - capsuleSize - 3))}px`;
        capsule.style.top = `${yPos}px`;
        capsule.style.zIndex = 10 + rowIndex * 5 + col;
        
        capsuleIndex++;
      }
    });
    
    // 剩余的球放在最顶层
    while (capsuleIndex < capsules.length) {
      const capsule = capsules[capsuleIndex];
      const lastRow = rows[rows.length - 1];
      const x = (areaWidth - capsuleSize) / 2 + (Math.random() - 0.5) * 40;
      const yPos = (lastRow ? lastRow.y - capsuleSize * 0.75 : baseY - capsuleSize) + (Math.random() - 0.5) * 10;
      
      capsule.style.left = `${Math.max(3, Math.min(x, areaWidth - capsuleSize - 3))}px`;
      capsule.style.top = `${Math.max(10, yPos)}px`;
      capsule.style.zIndex = 60 + capsuleIndex;
      
      capsuleIndex++;
    }
    
    // 动画结束后清除transition
    setTimeout(() => {
      capsules.forEach(capsule => {
        capsule.style.transition = 'none';
      });
    }, 500);
  }
  
  // 开始抽奖
  async spin() {
    if (this.isSpinning) return;
    if (!this.config || !this.config.gifts || this.config.gifts.length === 0) {
      alert('配置未加载或奖品列表为空');
      return;
    }
    
    this.isSpinning = true;
    this.elements.handleButton.disabled = true;
    this.elements.handleButton.classList.add('spinning');
    this.elements.handleButton.querySelector('.handle-text').textContent = '扭动中...';
    
    // 先决定结果
    this.currentResult = this.selectGiftByWeight();
    const tier = this.getGiftTier(this.currentResult.battery);
    
    // 根据等级决定球的颜色：传说=金色，稀有=银色，普通=随机彩色
    let capsuleColor = this.getCapsuleColorByTier(tier);
    
    // 播放扭蛋机动画
    await this.playMachineAnimation(tier, capsuleColor);
    
    // 使用实际选中的球的颜色（在playMachineAnimation中设置）
    const actualColor = this.selectedCapsuleColor || capsuleColor;
    
    // 显示大扭蛋掉落动画
    await this.playDropAnimation(tier, actualColor);
    
    // 显示结果
    this.showResult(this.currentResult, actualColor);
    
    // 添加到历史
    this.addToHistory(this.currentResult);
    
    // 补充一个新球替代滚出的球
    this.replenishCapsule(actualColor);
    
    // 重置按钮状态
    this.isSpinning = false;
    this.elements.handleButton.disabled = false;
    this.elements.handleButton.classList.remove('spinning');
    this.elements.handleButton.querySelector('.handle-text').textContent = '扭一扭';
  }
  
  // 播放扭蛋机动画 - 有重力的滚动效果
  async playMachineAnimation(tier, capsuleColor) {
    const area = this.elements.capsulesArea;
    const capsules = Array.from(area.querySelectorAll('.capsule'));
    const shakeTime = this.config.settings.shakeTime || 2000;
    
    const areaWidth = area.offsetWidth;
    const areaHeight = area.offsetHeight;
    const capsuleSize = 42;
    const baseY = areaHeight - capsuleSize - 5;
    
    // 保存原始位置
    const originalPositions = capsules.map(c => ({
      left: parseFloat(c.style.left) || 0,
      top: parseFloat(c.style.top) || 0,
      zIndex: c.style.zIndex
    }));
    
    // 设置过渡效果
    capsules.forEach(capsule => {
      capsule.style.transition = 'left 0.08s ease-out, top 0.08s ease-out';
    });
    
    const startTime = Date.now();
    let lastSwapTime = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= shakeTime) {
        return;
      }
      
      const progress = elapsed / shakeTime;
      // 慢慢减速
      const intensity = 1 - progress * 0.7;
      
      capsules.forEach((capsule, index) => {
        const origPos = originalPositions[index];
        
        // 在原位置附近晃动，但保持在底部
        const shakeX = (Math.sin(elapsed * 0.02 + index * 0.5) * 15 * intensity);
        const shakeY = (Math.cos(elapsed * 0.025 + index * 0.7) * 8 * intensity);
        
        // 新位置 = 原位置 + 晃动，但不能超出底部
        let newX = origPos.left + shakeX;
        let newY = origPos.top + shakeY;
        
        // 确保不会飘到太高
        newY = Math.max(newY, 10);
        newY = Math.min(newY, baseY + 5);
        
        // 确保不会出界
        newX = Math.max(3, Math.min(newX, areaWidth - capsuleSize - 3));
        
        capsule.style.left = `${newX}px`;
        capsule.style.top = `${newY}px`;
        
        // 让球本身也旋转
        const innerEl = capsule.querySelector('.capsule-inner');
        if (innerEl) {
          const currentRotation = elapsed * 0.3 + index * 45;
          innerEl.style.transition = 'transform 0.1s linear';
          innerEl.style.transform = `rotate(${currentRotation}deg)`;
        }
      });
      
      // 定期交换一些球的位置
      if (elapsed - lastSwapTime > 200 && Math.random() > 0.5) {
        lastSwapTime = elapsed;
        const i = Math.floor(Math.random() * capsules.length);
        const j = Math.floor(Math.random() * capsules.length);
        if (i !== j) {
          // 交换原始位置记录
          const tempLeft = originalPositions[i].left;
          const tempTop = originalPositions[i].top;
          originalPositions[i].left = originalPositions[j].left;
          originalPositions[i].top = originalPositions[j].top;
          originalPositions[j].left = tempLeft;
          originalPositions[j].top = tempTop;
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // 等待滚动完成
    await this.delay(shakeTime);
    
    // 清除过渡效果，让球停在最后的位置
    capsules.forEach((capsule, index) => {
      capsule.style.transition = 'none';
      // 球停在当前交换后的位置
      capsule.style.left = `${originalPositions[index].left}px`;
      capsule.style.top = `${originalPositions[index].top}px`;
    });
    
    await this.delay(100);
    
    // 根据等级和颜色找到对应的球
    let selectedCapsule = null;
    
    if (tier === 'legendary') {
      // 传说级：找金色球
      selectedCapsule = capsules.find(c => c.dataset.color === 'gold');
    } else if (tier === 'rare') {
      // 稀有级：找银色球
      selectedCapsule = capsules.find(c => c.dataset.color === 'silver');
    } else {
      // 普通级：找与capsuleColor匹配的球
      selectedCapsule = capsules.find(c => c.dataset.color === capsuleColor);
      
      // 如果没找到匹配的，找任意彩色球
      if (!selectedCapsule) {
        const coloredCapsules = capsules.filter(c => 
          c.dataset.color !== 'gold' && c.dataset.color !== 'silver'
        );
        if (coloredCapsules.length > 0) {
          selectedCapsule = coloredCapsules[0];
          // 更新capsuleColor为实际选中的颜色
          // 注意：这里我们需要通知调用者更新颜色
        }
      }
    }
    
    // 如果没找到对应颜色的球，随机选一个
    if (!selectedCapsule) {
      const randomIndex = Math.floor(Math.random() * capsules.length);
      selectedCapsule = capsules[randomIndex];
    }
    
    // 记录实际选中的球的颜色，以便后续动画使用
    this.selectedCapsuleColor = selectedCapsule ? selectedCapsule.dataset.color : capsuleColor;
    
    if (selectedCapsule) {
      // 球已经是对应颜色，不需要改变
      // 只需要确保闪光特效在传说/稀有时显示
      if (tier === 'legendary' && !selectedCapsule.classList.contains('shining')) {
        selectedCapsule.classList.add('legendary', 'shining');
      } else if (tier === 'rare' && !selectedCapsule.classList.contains('shining')) {
        selectedCapsule.classList.add('rare', 'shining');
      }
      
      // 扭蛋滚向出口动画
      selectedCapsule.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      selectedCapsule.style.left = `${(areaWidth - capsuleSize) / 2}px`;
      selectedCapsule.style.top = `${areaHeight + 10}px`;
      selectedCapsule.style.opacity = '0.5';
      selectedCapsule.style.zIndex = '100';
      
      // 内部旋转
      const innerEl = selectedCapsule.querySelector('.capsule-inner');
      if (innerEl) {
        innerEl.style.transition = 'transform 0.5s ease-out';
        innerEl.style.transform = 'rotate(720deg)';
      }
      
      // 动画结束后移除这个球
      setTimeout(() => {
        if (selectedCapsule.parentNode) {
          selectedCapsule.remove();
        }
      }, 600);
    }
    
    await this.delay(400);
    
    // 显示出口处的扭蛋掉落
    const fallingCapsule = this.elements.fallingCapsule;
    
    // 设置与等级对应的颜色
    fallingCapsule.className = 'falling-capsule';
    fallingCapsule.style.background = this.getCapsuleGradientByColor(capsuleColor);
    
    // 传说和稀有等级添加闪光特效
    if (tier === 'legendary' || tier === 'rare') {
      fallingCapsule.classList.add('shining');
    }
    
    fallingCapsule.classList.add('falling');
    
    await this.delay(800);
    
    // 重置出口扭蛋
    fallingCapsule.classList.remove('falling', 'shining');
    fallingCapsule.style.opacity = '0';
  }
  
  // 获取扭蛋渐变色（根据tier）
  getCapsuleGradient(tier) {
    switch (tier) {
      case 'legendary':
        return 'linear-gradient(180deg, #ffe66d 0%, #ffd700 50%, #daa520 50%, #b8860b 100%)';
      case 'rare':
        return 'linear-gradient(180deg, #c39bd3 0%, #9b59b6 50%, #7d3c98 50%, #5b2c6f 100%)';
      default:
        return 'linear-gradient(180deg, #ff9eb5 0%, #fb7299 50%, #d45a7a 50%, #a84466 100%)';
    }
  }
  
  // 获取扭蛋渐变色（根据颜色名）
  getCapsuleGradientByColor(color) {
    const colorMap = {
      'gold': 'linear-gradient(180deg, #ffe66d 0%, #ffd700 50%, #daa520 50%, #b8860b 100%)',
      'silver': 'linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 50%, #888888 100%)',
      'pink': 'linear-gradient(180deg, #ff9eb5 0%, #fb7299 50%, #d45a7a 50%, #a84466 100%)',
      'blue': 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 50%, #0284c7 100%)',
      'yellow': 'linear-gradient(180deg, #fef08a 0%, #facc15 50%, #eab308 50%, #ca8a04 100%)',
      'green': 'linear-gradient(180deg, #86efac 0%, #4ade80 50%, #22c55e 50%, #16a34a 100%)',
      'purple': 'linear-gradient(180deg, #c39bd3 0%, #9b59b6 50%, #7d3c98 50%, #5b2c6f 100%)',
      'orange': 'linear-gradient(180deg, #fed7aa 0%, #fb923c 50%, #f97316 50%, #ea580c 100%)',
      'red': 'linear-gradient(180deg, #fca5a5 0%, #f87171 50%, #ef4444 50%, #dc2626 100%)'
    };
    return colorMap[color] || colorMap['pink'];
  }
  
  // 根据等级获取扭蛋颜色：传说=金色，稀有=银色，普通=随机彩色
  getCapsuleColorByTier(tier) {
    switch (tier) {
      case 'legendary': 
        return 'gold';
      case 'rare': 
        return 'silver';
      default: 
        // 普通等级随机返回彩色（排除金色和银色）
        const commonColors = ['pink', 'blue', 'yellow', 'green', 'purple', 'orange', 'red'];
        return commonColors[Math.floor(Math.random() * commonColors.length)];
    }
  }
  
  // 播放大扭蛋掉落动画
  async playDropAnimation(tier, capsuleColor) {
    const container = this.elements.capsuleDropContainer;
    const dropCapsule = this.elements.dropCapsule;
    
    // 设置颜色
    const topHalf = dropCapsule.querySelector('.capsule-top');
    const bottomHalf = dropCapsule.querySelector('.capsule-bottom');
    
    // 颜色映射
    const colorStyles = {
      'gold': {
        top: 'linear-gradient(180deg, #ffe66d 0%, #ffd700 100%)',
        bottom: 'linear-gradient(180deg, #daa520 0%, #b8860b 100%)'
      },
      'silver': {
        top: 'linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)',
        bottom: 'linear-gradient(180deg, #a8a8a8 0%, #888888 100%)'
      },
      'pink': {
        top: 'linear-gradient(180deg, #ff9eb5 0%, #fb7299 100%)',
        bottom: 'linear-gradient(180deg, #d45a7a 0%, #a84466 100%)'
      },
      'blue': {
        top: 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 100%)',
        bottom: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)'
      },
      'yellow': {
        top: 'linear-gradient(180deg, #fef08a 0%, #facc15 100%)',
        bottom: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)'
      },
      'green': {
        top: 'linear-gradient(180deg, #86efac 0%, #4ade80 100%)',
        bottom: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)'
      },
      'purple': {
        top: 'linear-gradient(180deg, #c39bd3 0%, #9b59b6 100%)',
        bottom: 'linear-gradient(180deg, #7d3c98 0%, #5b2c6f 100%)'
      },
      'orange': {
        top: 'linear-gradient(180deg, #fed7aa 0%, #fb923c 100%)',
        bottom: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
      },
      'red': {
        top: 'linear-gradient(180deg, #fca5a5 0%, #f87171 100%)',
        bottom: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
      }
    };
    
    const colors = colorStyles[capsuleColor] || colorStyles['pink'];
    topHalf.style.background = colors.top;
    bottomHalf.style.background = colors.bottom;
    
    // 传说和稀有等级添加闪光特效
    dropCapsule.classList.remove('shining', 'legendary-glow', 'rare-glow');
    if (tier === 'legendary') {
      dropCapsule.classList.add('shining', 'legendary-glow');
    } else if (tier === 'rare') {
      dropCapsule.classList.add('shining', 'rare-glow');
    }
    
    container.classList.add('active');
    
    await this.delay(1300);
    
    container.classList.remove('active');
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
  async showResult(gift, selectedColor) {
    const tier = this.getGiftTier(gift.battery || 0);
    const tierConfig = this.config.giftTiers[tier];
    
    // 重置状态 - 移除所有可能的状态类
    this.elements.resultCard.className = `result-card ${tier}`;
    
    // 设置礼物信息（在动画开始前设置好）
    this.elements.resultTierLabel.textContent = tierConfig.label;
    
    // 处理Emoji图片
    if (gift.image && gift.image.startsWith('emoji:')) {
      const emoji = gift.image.replace('emoji:', '');
      this.elements.resultImage.style.display = 'none';
      // 检查是否已有emoji容器
      let emojiContainer = this.elements.giftReveal.querySelector('.gift-emoji');
      if (!emojiContainer) {
        emojiContainer = document.createElement('div');
        emojiContainer.className = 'gift-emoji';
        this.elements.resultImage.parentNode.insertBefore(emojiContainer, this.elements.resultImage);
      }
      emojiContainer.textContent = emoji;
      emojiContainer.style.display = 'flex';
    } else {
      // 普通图片
      this.elements.resultImage.style.display = 'block';
      this.elements.resultImage.src = gift.image;
      this.elements.resultImage.onerror = function() {
        this.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>';
      };
      // 隐藏emoji容器
      const emojiContainer = this.elements.giftReveal.querySelector('.gift-emoji');
      if (emojiContainer) {
        emojiContainer.style.display = 'none';
      }
    }
    
    this.elements.resultName.textContent = gift.name;
    
    // 根据isVirtual字段判断是否为虚拟礼物
    const isVirtual = gift.isVirtual === true;
    if (!isVirtual && gift.battery > 0) {
      this.elements.resultBattery.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
        </svg>
        ${gift.battery} 电池
      `;
    } else {
      this.elements.resultBattery.innerHTML = `<span class="virtual-gift-label">✨ 虚拟奖励</span>`;
    }
    
    // 设置扭蛋颜色（使用与等级对应的颜色）
    const topHalf = this.elements.capsuleOpenAnimation.querySelector('.capsule-top-half');
    const bottomHalf = this.elements.capsuleOpenAnimation.querySelector('.capsule-bottom-half');
    if (topHalf && bottomHalf) {
      // 颜色映射
      const colorStyles = {
        'gold': {
          top: 'linear-gradient(180deg, #ffe66d 0%, #ffd700 100%)',
          bottom: 'linear-gradient(180deg, #daa520 0%, #b8860b 100%)'
        },
        'silver': {
          top: 'linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)',
          bottom: 'linear-gradient(180deg, #a8a8a8 0%, #888888 100%)'
        },
        'pink': {
          top: 'linear-gradient(180deg, #ff9eb5 0%, #fb7299 100%)',
          bottom: 'linear-gradient(180deg, #d45a7a 0%, #a84466 100%)'
        },
        'blue': {
          top: 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 100%)',
          bottom: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)'
        },
        'yellow': {
          top: 'linear-gradient(180deg, #fef08a 0%, #facc15 100%)',
          bottom: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)'
        },
        'green': {
          top: 'linear-gradient(180deg, #86efac 0%, #4ade80 100%)',
          bottom: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)'
        },
        'purple': {
          top: 'linear-gradient(180deg, #c39bd3 0%, #9b59b6 100%)',
          bottom: 'linear-gradient(180deg, #7d3c98 0%, #5b2c6f 100%)'
        },
        'orange': {
          top: 'linear-gradient(180deg, #fed7aa 0%, #fb923c 100%)',
          bottom: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
        },
        'red': {
          top: 'linear-gradient(180deg, #fca5a5 0%, #f87171 100%)',
          bottom: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
        }
      };
      
      const colors = colorStyles[selectedColor] || colorStyles['pink'];
      topHalf.style.background = colors.top;
      bottomHalf.style.background = colors.bottom;
      
      // 传说和稀有等级添加闪光特效
      this.elements.capsuleOpenAnimation.classList.remove('shining');
      if (tier === 'legendary' || tier === 'rare') {
        this.elements.capsuleOpenAnimation.classList.add('shining');
      }
    }
    
    // 显示弹窗
    this.elements.resultDisplay.classList.add('show');
    
    // 等待一小段时间后开始开蛋动画
    await this.delay(400);
    
    // 播放开蛋动画
    this.elements.resultCard.classList.add('opening');
    
    await this.delay(700);
    
    // 显示礼物
    this.elements.resultCard.classList.remove('opening');
    this.elements.resultCard.classList.add('revealed');
    
    // 根据等级播放庆祝效果
    if (tier === 'legendary') {
      this.playLegendaryCelebration();
    } else if (tier === 'rare') {
      this.playRareCelebration();
    } else {
      this.playCommonCelebration();
    }
  }
  
  // 隐藏结果
  hideResult() {
    this.elements.resultDisplay.classList.remove('show');
    this.elements.resultCard.classList.remove('opening', 'revealed');
    this.elements.confettiContainer.innerHTML = '';
  }
  
  // 传说级庆祝效果
  playLegendaryCelebration() {
    this.createConfetti(100);
    this.createStarBurst(10);
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
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#fb7299', '#23ade5'];
    
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
      
      confetti.addEventListener('animationend', () => {
        confetti.remove();
      });
    }
  }
  
  // 创建星星爆发效果
  createStarBurst(count) {
    const container = this.elements.confettiContainer;
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFE66D'];
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const star = document.createElement('div');
        star.className = 'star-burst';
        star.style.left = (20 + Math.random() * 60) + '%';
        star.style.top = (20 + Math.random() * 40) + '%';
        star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(star);
        
        star.addEventListener('animationend', () => {
          star.remove();
        });
      }, i * 150);
    }
  }
  
  // 播放音效
  playSound(type) {
    console.log(`Playing ${type} sound`);
  }
  
  // 添加到历史记录
  addToHistory(gift) {
    const tier = this.getGiftTier(gift.battery);
    this.history.unshift({ ...gift, tier, timestamp: Date.now() });
    
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
      
      // 处理Emoji图片
      if (item.image && item.image.startsWith('emoji:')) {
        const emoji = item.image.replace('emoji:', '');
        historyItem.innerHTML = `<span class="history-emoji">${emoji}</span>`;
      } else {
        historyItem.innerHTML = `<img src="${item.image}" alt="${item.name}" 
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2240%22>?</text></svg>'">`;
      }
      
      // 根据isVirtual字段判断虚拟礼物
      const isVirtual = item.isVirtual === true;
      const batteryText = (!isVirtual && item.battery > 0) ? `${item.battery}电池` : '虚拟奖励';
      historyItem.title = `${item.name} - ${batteryText}`;
      list.appendChild(historyItem);
    });
  }
  
  // 保存历史到本地
  saveHistory() {
    localStorage.setItem('gashapon_history', JSON.stringify(this.history));
  }
  
  // 加载历史记录
  loadHistory() {
    try {
      const saved = localStorage.getItem('gashapon_history');
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
    
    if (this.adminClickTimer) {
      clearTimeout(this.adminClickTimer);
    }
    
    this.adminClickTimer = setTimeout(() => {
      this.adminClickCount = 0;
    }, 2000);
    
    if (this.adminClickCount >= (this.config?.settings?.adminClickCount || 8)) {
      this.adminClickCount = 0;
      window.location.href = 'admin.html';
    }
  }
  
  // 工具函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.gashaponMachine = new GashaponMachine();
});
