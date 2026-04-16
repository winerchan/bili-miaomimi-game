// 全局变量，存储游戏数据
let allGames = [];
let filteredGames = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadGames();
    setupEventListeners();
});

/**
 * 从games.json加载游戏配置数据
 */
async function loadGames() {
    try {
        const response = await fetch('games.json');
        const data = await response.json();
        // 过滤掉隐藏的游戏
        allGames = sortGamesByFeatured(data.games.filter(game => !game.hidden));
        filteredGames = [...allGames];
        
        // 初始化分类选择器
        initCategories(data.categories);
        
        // 渲染游戏卡片
        renderGames(filteredGames);
    } catch (error) {
        console.error('加载游戏数据失败:', error);
        showError('加载游戏列表失败，请刷新页面重试');
    }
}

/**
 * 初始化分类选择器
 */
function initCategories(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    // 搜索输入事件（添加防抖）
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterGames();
        }, 300);
    });
    
    // 分类筛选事件
    categoryFilter.addEventListener('change', () => {
        filterGames();
    });
}

/**
 * 筛选游戏
 */
function filterGames() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    
    filteredGames = sortGamesByFeatured(allGames.filter(game => {
        // 分类筛选
        const categoryMatch = selectedCategory === '全部' || game.category === selectedCategory;
        
        // 搜索筛选（搜索名称、描述、标签）
        const searchMatch = searchText === '' || 
            game.name.toLowerCase().includes(searchText) ||
            game.description.toLowerCase().includes(searchText) ||
            game.tags.some(tag => tag.toLowerCase().includes(searchText));
        
        return categoryMatch && searchMatch;
    }));
    
    renderGames(filteredGames);
}

/**
 * 将推荐游戏排在前面，其他游戏保持在后面
 */
function sortGamesByFeatured(games) {
    return [...games].sort((leftGame, rightGame) => Number(Boolean(rightGame.featured)) - Number(Boolean(leftGame.featured)));
}

/**
 * 渲染游戏卡片
 */
function renderGames(games) {
    const gamesContainer = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    
    // 清空容器
    gamesContainer.innerHTML = '';
    
    if (games.length === 0) {
        // 显示无结果提示
        noResults.style.display = 'block';
        gamesContainer.style.display = 'none';
    } else {
        noResults.style.display = 'none';
        gamesContainer.style.display = 'grid';
        
        // 创建游戏卡片
        games.forEach(game => {
            const card = createGameCard(game);
            gamesContainer.appendChild(card);
        });
    }
}

/**
 * 创建单个游戏卡片元素
 */
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card' + (game.featured ? ' featured' : '');
    card.setAttribute('data-game-id', game.id);
    
    // 创建缩略图
    const thumbnail = document.createElement('div');
    thumbnail.className = 'game-thumbnail';
    
    // 检查是否有实际图片，否则显示emoji占位符
    if (game.thumbnail && game.thumbnail.endsWith('.png')) {
        const img = document.createElement('img');
        img.src = game.thumbnail;
        img.alt = game.name;
        img.className = 'thumbnail-image';
        thumbnail.appendChild(img);
    } else {
        thumbnail.innerHTML = getGameEmoji(game.category);
    }
    
    // 创建游戏信息区域
    const info = document.createElement('div');
    info.className = 'game-info';
    
    // 游戏头部（标题和分类）
    const header = document.createElement('div');
    header.className = 'game-header';
    
    const title = document.createElement('h3');
    title.className = 'game-title';
    title.textContent = game.name;
    
    const category = document.createElement('span');
    category.className = 'game-category';
    category.textContent = game.category;
    
    header.appendChild(title);
    header.appendChild(category);
    
    // 游戏描述
    const description = document.createElement('p');
    description.className = 'game-description';
    description.textContent = game.description;
    
    // 游戏元信息
    const meta = document.createElement('div');
    meta.className = 'game-meta';
    meta.innerHTML = `
        <span>⚡ ${game.difficulty}</span>
        <span>👥 ${game.players}</span>
    `;
    
    // 游戏标签
    const tags = document.createElement('div');
    tags.className = 'game-tags';
    game.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'game-tag';
        tagSpan.textContent = tag;
        tags.appendChild(tagSpan);
    });
    
    // 开始游戏按钮
    const playButton = document.createElement('a');
    playButton.className = 'play-button';
    playButton.href = game.path;
    playButton.textContent = '🎮 开始游戏';
    
    // 组装卡片
    info.appendChild(header);
    info.appendChild(description);
    info.appendChild(meta);
    info.appendChild(tags);
    info.appendChild(playButton);
    
    card.appendChild(thumbnail);
    card.appendChild(info);
    
    return card;
}

/**
 * 根据游戏分类返回对应的emoji图标
 */
function getGameEmoji(category) {
    const emojiMap = {
        '互动': '🎭',
        '益智': '🧩',
        '休闲': '🎨',
        '竞速': '🏎️',
        '策略': '♟️'
    };
    return emojiMap[category] || '🎮';
}

/**
 * 显示错误信息
 */
function showError(message) {
    const gamesContainer = document.getElementById('gamesContainer');
    gamesContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: white;">
            <h2>😿 ${message}</h2>
        </div>
    `;
}
