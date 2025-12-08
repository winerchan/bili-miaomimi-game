// 转盘游戏类
class LuckyWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.spinSpeed = 0;
        
        // 默认奖项列表
        this.items = [
            '一等奖 🏆',
            '二等奖 🥈',
            '三等奖 🥉',
            '幸运奖 🍀',
            '安慰奖 💝',
            '谢谢参与 😊'
        ];
        
        // 颜色方案
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
        ];
        
        this.init();
    }
    
    // 初始化
    init() {
        this.draw();
        this.setupEventListeners();
        this.loadItemsFromTextarea();
    }
    
    // 绘制转盘
    draw() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const itemCount = this.items.length;
        const anglePerItem = (2 * Math.PI) / itemCount;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制每个扇形
        for (let i = 0; i < itemCount; i++) {
            const startAngle = this.currentAngle + i * anglePerItem;
            const endAngle = startAngle + anglePerItem;
            
            // 绘制扇形
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            // 填充颜色
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 绘制文字
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + anglePerItem / 2);
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 18px Arial, Microsoft YaHei';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(this.items[i], radius * 0.65, 5);
            this.ctx.restore();
        }
        
        // 绘制中心圆
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }
    
    // 开始旋转
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        document.getElementById('spinButton').disabled = true;
        document.getElementById('resultDisplay').style.display = 'none';
        
        // 随机转动圈数（5-10圈）+ 随机角度
        const minSpins = 5;
        const maxSpins = 10;
        const spins = Math.random() * (maxSpins - minSpins) + minSpins;
        
        // 目标角度
        this.targetAngle = this.currentAngle + spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
        this.spinSpeed = 0.5; // 初始速度
        
        this.animate();
    }
    
    // 动画循环
    animate() {
        if (!this.isSpinning) return;
        
        // 计算剩余角度
        const remainingAngle = this.targetAngle - this.currentAngle;
        
        // 减速效果
        if (remainingAngle > 0) {
            this.spinSpeed = Math.max(0.01, remainingAngle * 0.1);
            this.currentAngle += this.spinSpeed;
            
            this.draw();
            requestAnimationFrame(() => this.animate());
        } else {
            // 旋转结束
            this.currentAngle = this.targetAngle;
            this.isSpinning = false;
            document.getElementById('spinButton').disabled = false;
            
            this.showResult();
        }
    }
    
    // 显示结果
    showResult() {
        const itemCount = this.items.length;
        const anglePerItem = (2 * Math.PI) / itemCount;
        
        // 计算指针指向的位置（指针在正上方，所以是 -PI/2）
        const normalizedAngle = (this.currentAngle + Math.PI / 2) % (2 * Math.PI);
        const selectedIndex = Math.floor(normalizedAngle / anglePerItem);
        const actualIndex = (itemCount - selectedIndex) % itemCount;
        
        const result = this.items[actualIndex];
        
        // 显示结果
        document.getElementById('resultText').textContent = result;
        document.getElementById('resultDisplay').style.display = 'block';
    }
    
    // 重置转盘
    reset() {
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.spinSpeed = 0;
        this.isSpinning = false;
        document.getElementById('spinButton').disabled = false;
        document.getElementById('resultDisplay').style.display = 'none';
        this.draw();
    }
    
    // 更新奖项
    updateItems(newItems) {
        if (newItems.length === 0) {
            alert('请至少输入一个奖项！');
            return;
        }
        
        this.items = newItems;
        this.reset();
    }
    
    // 从文本框加载奖项
    loadItemsFromTextarea() {
        const textarea = document.getElementById('itemsInput');
        textarea.value = this.items.join('\n');
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 开始按钮
        document.getElementById('spinButton').addEventListener('click', () => {
            this.spin();
        });
        
        // 重置按钮
        document.getElementById('resetButton').addEventListener('click', () => {
            this.reset();
        });
        
        // 更新按钮
        document.getElementById('updateButton').addEventListener('click', () => {
            const textarea = document.getElementById('itemsInput');
            const items = textarea.value
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            this.updateItems(items);
        });
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const wheel = new LuckyWheel('wheelCanvas');
});
