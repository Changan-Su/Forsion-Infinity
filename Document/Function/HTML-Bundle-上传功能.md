# HTML Bundle 上传功能

## 功能概述

HTML Bundle 是一种允许在 Misskey 帖子中嵌入交互式 HTML、CSS、JavaScript 内容的功能。用户可以上传包含完整网页的 ZIP 文件，系统会自动解压并在帖子中以 iframe 形式展示。

## 功能特点

- ✅ 支持完整的 HTML/CSS/JavaScript 内容
- ✅ 安全的沙箱隔离（iframe sandbox）
- ✅ 自动解压和验证
- ✅ 预览和展开显示
- ✅ 多语言支持（中文、英文、日文）
- ✅ 文件大小和数量限制

## 使用方法

### 1. 创建 HTML Bundle

创建一个文件夹，包含以下文件：

```
my-bundle/
├── index.html (必须，入口文件)
├── style.css (可选)
├── script.js (可选)
└── ... (其他资源文件)
```

**示例 `index.html`：**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>我的交互组件</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello World!</h1>
    <button onclick="alert('你好！')">点击我</button>
    <script src="script.js"></script>
</body>
</html>
```

### 2. 打包为 ZIP

在 Linux/Mac 终端中：

```bash
cd my-bundle
zip -r my-bundle.zip *
```

在 Windows 中：
- 右键文件夹 → "发送到" → "压缩(zipped)文件夹"
- 或使用 7-Zip、WinRAR 等工具

**注意：** 确保 `index.html` 在 ZIP 根目录，而不是子文件夹中。

### 3. 在 Misskey 中上传

1. 打开发帖界面
2. 点击工具栏的 **📄 文件代码图标**（HTML Bundle 按钮）
3. 选择打包好的 ZIP 文件
4. 阅读说明对话框，点击确认
5. 等待上传完成
6. 发布帖子

### 4. 查看效果

- 发布后，帖子中会显示 HTML Bundle 的预览卡片
- 点击预览卡片，展开显示完整的交互内容
- 点击右上角的折叠按钮可以收起

## 技术限制

### 文件要求

- **格式**：必须是 ZIP 压缩包
- **入口文件**：必须包含 `index.html` 在根目录
- **大小限制**：总大小不超过 10MB
- **文件数量**：不超过 100 个文件

### 安全限制

**禁止的文件类型：**
- 可执行文件（`.exe`, `.dll`, `.so` 等）
- 服务器端脚本（`.php`, `.asp`, `.jsp` 等）
- 系统配置文件

**iframe 沙箱限制：**
- `allow-scripts`：允许执行 JavaScript
- `allow-same-origin`：允许访问同源资源
- 不允许弹出窗口、表单提交等危险操作

### 内容限制

- 不能包含恶意代码
- 不能访问外部资源（除非通过 CORS）
- 不能与父页面通信（受沙箱限制）

## 示例场景

### 1. 交互式图表

```html
<!-- 使用 Chart.js 创建图表 -->
<canvas id="myChart"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: { labels: ['A', 'B', 'C'], datasets: [...] }
  });
</script>
```

### 2. 简单游戏

```html
<!-- 猜数字游戏 -->
<div id="game">
  <p>猜一个 1-100 之间的数字</p>
  <input type="number" id="guess">
  <button onclick="checkGuess()">提交</button>
  <p id="result"></p>
</div>
<script>
  const target = Math.floor(Math.random() * 100) + 1;
  function checkGuess() {
    const guess = parseInt(document.getElementById('guess').value);
    const result = document.getElementById('result');
    if (guess === target) result.textContent = '✅ 猜对了！';
    else if (guess < target) result.textContent = '📈 太小了';
    else result.textContent = '📉 太大了';
  }
</script>
```

### 3. 数据可视化

```html
<!-- 使用 D3.js 创建可视化 -->
<svg id="viz"></svg>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
  // D3.js 可视化代码
</script>
```

### 4. 动画演示

```html
<!-- CSS 动画演示 -->
<style>
  .box { animation: spin 2s infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
<div class="box">🎨</div>
```

## 常见问题

### Q: 上传后显示错误？

**A:** 检查以下几点：
- ZIP 包是否包含 `index.html` 在根目录
- 文件是否超过 10MB
- 是否包含禁止的文件类型

### Q: 为什么 iframe 中的内容无法加载外部资源？

**A:** 可能是 CORS 限制。解决方法：
- 将所有资源打包到 ZIP 中
- 使用支持 CORS 的 CDN
- 使用 base64 内联资源

### Q: 可以使用哪些外部库？

**A:** 可以使用任何支持浏览器端的 JavaScript 库，例如：
- Chart.js（图表）
- D3.js（数据可视化）
- Three.js（3D 图形）
- P5.js（创意编程）
- 等等

只需在 HTML 中引入 CDN 链接即可。

### Q: 如何调试 HTML Bundle？

**A:** 
1. 在本地浏览器中打开 `index.html` 进行调试
2. 使用浏览器的开发者工具查看 iframe 内容
3. 在 ZIP 打包前确保所有功能正常

## 技术实现

### 后端处理流程

1. **上传检测**：检查 MIME 类型为 `application/zip`
2. **解压文件**：`HtmlBundleService.extractHtmlBundle()`
3. **验证内容**：
   - 检查文件数量和大小
   - 验证 `index.html` 存在
   - 检查禁止的文件扩展名
   - 防止路径遍历攻击
4. **存储**：解压到 `files/html-bundles/{fileId}/`
5. **数据库**：标记 `isHtmlBundle: true`，保存路径

### 前端显示流程

1. **列表显示**：`MkMediaList.vue` 识别 `isHtmlBundle`
2. **组件渲染**：`MkMediaHtmlBundle.vue` 渲染预览
3. **展开显示**：加载 iframe，地址为 `/files/{fileId}/html-bundle/index.html`
4. **安全隔离**：iframe 使用 `sandbox="allow-scripts allow-same-origin"`

### 相关文件

**后端：**
- `packages/backend/src/core/DriveService.ts`：文件上传处理
- `packages/backend/src/core/HtmlBundleService.ts`：解压和验证
- `packages/backend/src/server/file/FileServerHtmlBundleHandler.ts`：文件服务
- `packages/backend/src/models/DriveFile.ts`：数据模型
- `packages/backend/src/const.ts`：常量配置

**前端：**
- `packages/frontend/src/components/MkPostForm.vue`：发帖表单
- `packages/frontend/src/components/MkMediaHtmlBundle.vue`：展示组件
- `packages/frontend/src/components/MkMediaList.vue`：媒体列表
- `packages/frontend/src/components/MkMediaBanner.vue`：横幅展示

**国际化：**
- `locales/zh-CN.yml`
- `locales/en-US.yml`
- `locales/ja-JP.yml`

## 参考资料

- [MDN - iframe 沙箱](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/iframe#attr-sandbox)
- [Content Security Policy (CSP)](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [ZIP 文件格式](https://en.wikipedia.org/wiki/ZIP_(file_format))

## 更新历史

- **2025-01-25**：添加发帖工具栏专用按钮，优化用户体验
- **之前**：后端 HTML Bundle 处理功能实现
