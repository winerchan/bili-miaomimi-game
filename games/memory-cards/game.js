// 记忆翻牌游戏类
class MemoryGame {
    constructor() {
        // 游戏状态
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.time = 0;
        this.timer = null;
        this.isProcessing = false;
        
        // 难度配置
        this.difficulty = {
            easy: { rows: 4, cols: 4 },
            medium: { rows: 4, cols: 5 },
            hard: { rows: 4, cols: 6 }
        };
        this.currentLevel = 'easy';
        
        // 卡片图标（使用emoji）
        this.icons = ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
                      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
                      '🐧', '🐦', '🐤', '🐺', '🦄', '🐝', '🐛', '🦋'];
        
        this.init();
    }
    
    // 初始化游戏
    init() {
        this.setupEventListeners();
        this.startNewGame();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 重新开始按钮
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 新游戏按钮
        document.getElementById('newGameButton').addEventListener('click', () => {
            this.startNewGame();
        });
        
        // 再玩一次按钮
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.hideVictoryModal();
            this.startNewGame();
        });
        
        // 难度按钮
        document.querySelectorAll('.difficulty-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                this.currentLevel = e.target.dataset.level;
                this.startNewGame();
            });
        });
        
        // 设置按钮切换
        document.getElementById('settingsToggle').addEventListener('click', () => {
            const settingsPanel = document.getElementById('settingsPanel');
            if (settingsPanel.style.display === 'none') {
                settingsPanel.style.display = 'block';
            } else {
                settingsPanel.style.display = 'none';
            }
        });
    }
    
    // 开始新游戏
    startNewGame() {
        this.resetGameState();
        this.createCards();
        this.renderBoard();
        this.startTimer();
    }
    
    // 重新开始当前游戏
    restartGame() {
        this.resetGameState();
        this.renderBoard();
        this.startTimer();
    }
    
    // 重置游戏状态
    resetGameState() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.time = 0;
        this.isProcessing = false;
        
        this.stopTimer();
        this.updateDisplay();
    }
    
    // 创建卡片
    createCards() {
        const config = this.difficulty[this.currentLevel];
        const totalCards = config.rows * config.cols;
        const pairsNeeded = totalCards / 2;
        
        // 选择图标
        const selectedIcons = this.icons.slice(0, pairsNeeded);
        
        // 创建配对的卡片
        this.cards = [];
        selectedIcons.forEach(icon => {
            this.cards.push({ icon, id: Math.random() });
            this.cards.push({ icon, id: Math.random() });
        });
        
        // 洗牌
        this.shuffleCards();
    }
    
    // 洗牌算法（Fisher-Yates）
    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    // 渲染游戏板
    renderBoard() {
        const board = document.getElementById('gameBoard');
        const config = this.difficulty[this.currentLevel];
        
        // 设置网格布局
        board.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;
        
        // 清空现有卡片
        board.innerHTML = '';
        
        // 创建卡片元素
        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            board.appendChild(cardElement);
        });
    }
    
    // 创建卡片元素
    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.index = index;
        
        const front = document.createElement('div');
        front.className = 'card-front';
        front.textContent = '?';
        
        const back = document.createElement('div');
        back.className = 'card-back';
        back.textContent = card.icon;
        
        cardDiv.appendChild(front);
        cardDiv.appendChild(back);
        
        // 点击事件
        cardDiv.addEventListener('click', () => this.handleCardClick(index));
        
        return cardDiv;
    }
    
    // 处理卡片点击
    handleCardClick(index) {
        // 如果正在处理或卡片已翻开或已匹配，忽略点击
        if (this.isProcessing || 
            this.flippedCards.includes(index) || 
            this.isCardMatched(index)) {
            return;
        }
        
        // 翻开卡片
        this.flipCard(index);
        this.flippedCards.push(index);
        
        // 如果翻开了两张卡片
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            this.checkMatch();
        }
    }
    
    // 翻开卡片
    flipCard(index) {
        const cardElement = document.querySelector(`[data-index="${index}"]`);
        cardElement.classList.add('flipped');
    }
    
    // 翻回卡片
    unflipCard(index) {
        const cardElement = document.querySelector(`[data-index="${index}"]`);
        cardElement.classList.remove('flipped');
    }
    
    // 标记卡片为已匹配
    markCardAsMatched(index) {
        const cardElement = document.querySelector(`[data-index="${index}"]`);
        cardElement.classList.add('matched');
    }
    
    // 检查卡片是否已匹配
    isCardMatched(index) {
        const cardElement = document.querySelector(`[data-index="${index}"]`);
        return cardElement.classList.contains('matched');
    }
    
    // 检查匹配
    checkMatch() {
        this.isProcessing = true;
        
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];
        
        if (card1.icon === card2.icon) {
            // 匹配成功
            setTimeout(() => {
                this.markCardAsMatched(index1);
                this.markCardAsMatched(index2);
                this.matchedPairs++;
                this.flippedCards = [];
                this.isProcessing = false;
                this.updateDisplay();
                this.checkVictory();
            }, 500);
        } else {
            // 匹配失败
            setTimeout(() => {
                this.unflipCard(index1);
                this.unflipCard(index2);
                this.flippedCards = [];
                this.isProcessing = false;
            }, 1000);
        }
    }
    
    // 检查是否胜利
    checkVictory() {
        const totalPairs = this.cards.length / 2;
        if (this.matchedPairs === totalPairs) {
            this.stopTimer();
            this.showVictoryModal();
        }
    }
    
    // 显示胜利模态框
    showVictoryModal() {
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalTime').textContent = this.time;
        document.getElementById('victoryModal').style.display = 'flex';
    }
    
    // 隐藏胜利模态框
    hideVictoryModal() {
        document.getElementById('victoryModal').style.display = 'none';
    }
    
    // 开始计时器
    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.updateDisplay();
        }, 1000);
    }
    
    // 停止计时器
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    // 更新显示
    updateDisplay() {
        document.getElementById('movesCount').textContent = this.moves;
        document.getElementById('timeCount').textContent = this.time + 's';
        const totalPairs = this.cards.length / 2;
        document.getElementById('pairsCount').textContent = `${this.matchedPairs}/${totalPairs}`;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
});
