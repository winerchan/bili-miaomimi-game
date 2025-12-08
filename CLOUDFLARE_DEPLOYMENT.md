# Cloudflare Pages 部署指南

本文档详细介绍如何将喵喵游戏中心部署到Cloudflare Pages。

## 🌐 为什么选择Cloudflare Pages？

- ✅ **完全免费**：无需支付任何费用
- ⚡ **全球CDN**：超快的访问速度
- 🔄 **自动部署**：推送代码后自动更新
- 🔒 **免费SSL**：自动配置HTTPS
- 📊 **无限流量**：没有流量限制
- 🎯 **零配置**：静态网站开箱即用

## 📋 部署前准备

1. 一个GitHub账号
2. 一个Cloudflare账号（免费注册：https://dash.cloudflare.com/sign-up）
3. 本项目仓库已推送到GitHub

## 🚀 部署步骤

### 步骤1：登录Cloudflare

访问 https://dash.cloudflare.com/ 并登录你的账号。

### 步骤2：进入Pages

在左侧菜单中找到并点击 **"Workers 和 Pages"** 或 **"Pages"**。

### 步骤3：创建项目

1. 点击 **"创建应用程序"** 或 **"Create application"**
2. 选择 **"Pages"** 标签
3. 点击 **"连接到 Git"** 或 **"Connect to Git"**

### 步骤4：连接GitHub

1. 选择 **GitHub** 作为Git提供商
2. 如果是第一次使用，需要授权Cloudflare访问你的GitHub账号
3. 在仓库列表中找到 `bili-miaomimi-game` 仓库
4. 点击仓库右侧的 **"开始设置"** 或 **"Begin setup"**

### 步骤5：配置构建设置

在构建配置页面，使用以下设置：

```
项目名称: bili-miaomimi-game (或自定义名称)
生产分支: main (或你的主分支名称)
框架预设: None (无)
构建命令: (留空)
构建输出目录: / (根目录)
根目录: / (根目录)
```

**重要说明**：
- 本项目是纯静态网站，不需要构建命令
- 构建输出目录设置为 `/` 表示使用根目录的所有文件

### 步骤6：环境变量

本项目不需要环境变量，可以跳过此步骤。

### 步骤7：部署

1. 点击 **"保存并部署"** 或 **"Save and Deploy"**
2. 等待部署完成（通常1-2分钟）
3. 部署成功后，会显示网站的URL

### 步骤8：访问网站

部署完成后，你会得到一个类似这样的URL：
```
https://bili-miaomimi-game.pages.dev
```

点击访问，确认网站正常运行！

## 🔧 后续管理

### 自动部署

配置完成后，每次向GitHub仓库推送代码时，Cloudflare Pages会自动：
1. 检测到新的提交
2. 拉取最新代码
3. 重新部署网站
4. 几分钟后更新生效

### 自定义域名（可选）

如果你有自己的域名：

1. 在Pages项目页面，点击 **"自定义域"** 或 **"Custom domains"**
2. 点击 **"设置自定义域"** 或 **"Set up a custom domain"**
3. 输入你的域名（例如：games.example.com）
4. 按照指示添加DNS记录到你的域名管理面板
5. 等待DNS生效（可能需要几分钟到几小时）

Cloudflare会自动为自定义域名配置SSL证书。

### 查看部署历史

在Pages项目页面，你可以：
- 查看所有部署记录
- 回滚到之前的版本
- 查看部署日志
- 预览构建详情

### 配置预览部署

Cloudflare Pages支持为Pull Request创建预览部署：
- 每个PR都会生成一个独立的预览URL
- 可以在合并前测试更改
- 合并后预览环境自动删除

## 🔍 故障排除

### 问题1：页面显示404

**解决方案**：
- 检查构建输出目录是否设置为 `/`
- 确认 `index.html` 在仓库根目录

### 问题2：样式或脚本无法加载

**解决方案**：
- 检查资源路径是否正确（相对路径）
- 确认所有文件都已提交到Git仓库
- 查看浏览器开发者工具的网络标签

### 问题3：部署失败

**解决方案**：
- 查看部署日志了解具体错误
- 检查文件名是否有特殊字符
- 确认仓库中没有损坏的文件

### 问题4：更新没有生效

**解决方案**：
- 确认代码已推送到GitHub
- 等待几分钟让部署完成
- 清除浏览器缓存并刷新页面
- 使用无痕模式测试

## 📊 性能优化建议

### 1. 图片优化
- 压缩图片文件大小
- 使用WebP格式
- 设置合适的图片尺寸

### 2. 缓存策略
Cloudflare Pages自动配置了最佳缓存策略：
- 静态资源自动缓存
- HTML文件合理缓存
- 支持缓存清除

### 3. 资源优化
- 压缩CSS和JS文件（如果需要）
- 移除未使用的代码
- 使用现代CSS特性

## 🔐 安全建议

1. **HTTPS**：Cloudflare Pages自动配置HTTPS
2. **访问控制**：可在设置中配置密码保护（付费功能）
3. **安全头部**：可通过 `_headers` 文件配置安全头部

### 添加安全头部（可选）

在项目根目录创建 `_headers` 文件：

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 📈 监控和分析

### Web Analytics（可选）

1. 在Cloudflare面板中启用Web Analytics
2. 添加跟踪代码到 `index.html`
3. 查看访问统计、页面浏览量等数据

### 性能监控

- Cloudflare提供实时性能指标
- 可以查看请求数、带宽使用等
- 免费账户有基本的分析功能

## 💡 高级配置

### 重定向规则

创建 `_redirects` 文件配置重定向：

```
/old-game  /games/new-game  301
/about     /index.html      200
```

### 自定义404页面

创建 `404.html` 文件，用户访问不存在的页面时会显示。

## 🎉 完成！

恭喜！你的喵喵游戏中心现在已经在Cloudflare Pages上运行了！

**后续步骤**：
- 分享你的网站URL给朋友
- 添加更多游戏
- 优化游戏体验
- 收集用户反馈

## 📞 获取帮助

- Cloudflare Pages文档：https://developers.cloudflare.com/pages/
- Cloudflare社区：https://community.cloudflare.com/
- 项目Issues：https://github.com/winerchan/bili-miaomimi-game/issues

---

**祝部署顺利！🚀**
