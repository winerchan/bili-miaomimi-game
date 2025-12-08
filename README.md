# 🎮 喵喵游戏中心

一个为星流喵（MiaoMimi）主播创建的HTML静态小游戏合集项目。

## 📖 项目介绍

本项目是一个纯静态的HTML游戏合集网站，包含多个独立的小游戏，适合在直播中与观众互动。所有游戏都是独立的，可以单独运行，无需后端服务器支持。

### ✨ 特性

- 🎯 **模块化设计**：每个游戏独立文件夹，便于管理和维护
- 🎨 **精美界面**：现代化的卡片式布局，响应式设计
- 🔍 **智能搜索**：支持按名称、标签搜索游戏
- 📊 **分类筛选**：按游戏类型快速筛选
- 📱 **移动适配**：完美支持手机、平板等设备
- ⚡ **性能优化**：纯静态页面，加载速度快
- ☁️ **云端部署**：支持Cloudflare Pages一键部署

## 🎮 已有游戏

### 1. 幸运转盘 🎡
- **类型**：互动/抽奖
- **说明**：可自定义奖项的幸运转盘，适合直播抽奖互动
- **特点**：支持自定义奖项列表，流畅的旋转动画

### 2. 记忆翻牌 🃏
- **类型**：益智
- **说明**：经典的记忆力游戏，找出所有配对的卡片
- **特点**：三种难度选择，计步和计时功能

## 📁 项目结构

```
bili-miaomimi-game/
├── index.html              # 主页面（游戏列表）
├── games.json              # 游戏配置文件
├── assets/                 # 公共资源目录
│   ├── css/
│   │   └── main.css       # 主页面样式
│   ├── js/
│   │   └── main.js        # 主页面脚本
│   └── images/            # 图片资源
│       └── README.md      # 图片使用说明
├── games/                 # 游戏目录
│   ├── lucky-wheel/       # 幸运转盘游戏
│   │   ├── index.html
│   │   ├── style.css
│   │   └── game.js
│   └── memory-cards/      # 记忆翻牌游戏
│       ├── index.html
│       ├── style.css
│       └── game.js
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 快速开始

### 本地运行

1. 克隆仓库到本地：
```bash
git clone https://github.com/winerchan/bili-miaomimi-game.git
cd bili-miaomimi-game
```

2. 使用任意HTTP服务器运行：

**方法1：使用Python（推荐）**
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

**方法2：使用Node.js**
```bash
npx serve
```

**方法3：使用VS Code**
- 安装 Live Server 扩展
- 右键点击 index.html
- 选择 "Open with Live Server"

3. 在浏览器中访问 `http://localhost:8000`

### Cloudflare Pages 部署

本项目已针对Cloudflare Pages进行优化，可以直接部署：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages 部分
3. 点击 "创建项目"
4. 连接你的 GitHub 仓库
5. 配置构建设置：
   - **构建命令**：留空（无需构建）
   - **构建输出目录**：`/`（根目录）
   - **根目录**：`/`
6. 点击 "保存并部署"

部署完成后，每次推送到仓库，Cloudflare Pages会自动更新网站。

## 🎯 如何添加新游戏

### 步骤1：创建游戏文件夹

在 `games/` 目录下创建新的游戏文件夹，例如 `my-new-game/`：

```bash
mkdir games/my-new-game
```

### 步骤2：创建游戏文件

在游戏文件夹中创建以下文件：
- `index.html` - 游戏主页面
- `style.css` - 游戏样式
- `game.js` - 游戏逻辑

**建议的HTML模板：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的新游戏 - 喵喵游戏中心</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <!-- 返回按钮 -->
        <a href="../../index.html" class="back-button">← 返回游戏中心</a>
        
        <!-- 游戏内容 -->
        <h1>我的新游戏</h1>
        <!-- 在这里添加你的游戏内容 -->
    </div>
    
    <script src="game.js"></script>
</body>
</html>
```

### 步骤3：更新游戏配置

编辑 `games.json` 文件，添加新游戏的配置：

```json
{
  "id": "my-new-game",
  "name": "我的新游戏",
  "description": "这是一个有趣的新游戏！",
  "category": "休闲",
  "thumbnail": "assets/images/my-new-game-thumb.png",
  "path": "games/my-new-game/index.html",
  "tags": ["休闲", "趣味"],
  "difficulty": "简单",
  "players": "单人",
  "featured": false,
  "hidden": false
}
```

### 步骤4：（可选）添加缩略图

在 `assets/images/` 目录下添加游戏缩略图（推荐尺寸：600x400像素）。

### 步骤5：测试

在浏览器中打开主页面，确认新游戏正确显示，点击可以正常进入游戏。

## 🎨 游戏配置说明

`games.json` 配置文件的字段说明：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 游戏唯一标识符（英文） |
| `name` | string | 是 | 游戏名称（中文） |
| `description` | string | 是 | 游戏简介 |
| `category` | string | 是 | 游戏分类（互动/益智/休闲/竞速/策略） |
| `thumbnail` | string | 否 | 缩略图路径 |
| `path` | string | 是 | 游戏页面路径 |
| `tags` | array | 是 | 游戏标签数组 |
| `difficulty` | string | 是 | 难度（简单/中等/困难） |
| `players` | string | 是 | 玩家数量 |
| `featured` | boolean | 否 | 是否为推荐游戏 |
| `hidden` | boolean | 否 | 是否隐藏游戏（隐藏后不会显示在列表中，也不会被搜索到） |

## 🛠️ 技术栈

- **前端**：原生HTML5 + CSS3 + JavaScript（ES6+）
- **部署**：Cloudflare Pages
- **版本控制**：Git + GitHub

## 📝 开发规范

### 代码规范

- 使用中文注释
- 变量和函数命名使用驼峰命名法
- CSS类名使用短横线命名法
- 每个游戏保持独立，避免依赖外部库（除非必要）

### 目录规范

- 每个游戏必须在独立文件夹中
- 游戏文件夹名称使用小写字母和短横线
- 每个游戏至少包含：index.html、style.css、game.js

### 样式规范

- 保持与主页面风格一致
- 必须包含返回按钮
- 支持响应式设计
- 使用渐变背景增强视觉效果

## 🤝 贡献指南

欢迎提交新游戏或改进建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingGame`)
3. 提交更改 (`git commit -m '添加了一个很棒的游戏'`)
4. 推送到分支 (`git push origin feature/AmazingGame`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 💬 联系方式

- **项目作者**：[winerchan](https://github.com/winerchan)
- **项目地址**：[https://github.com/winerchan/bili-miaomimi-game](https://github.com/winerchan/bili-miaomimi-game)
- **问题反馈**：[Issues](https://github.com/winerchan/bili-miaomimi-game/issues)

## 🌟 致谢

感谢星流喵（MiaoMimi）主播的支持和灵感！

---

**祝游戏愉快！🎮✨**
