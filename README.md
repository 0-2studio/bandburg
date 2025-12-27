# BandBurg - Vela 设备现代化管理界面
https://bandburg.bandbbs.cn/

基于 miband-web-install项目( https://github.com/0-2studio/miband-web-install ) 的米坛风格 Web 管理界面，用于连接和管理 Vela 系列设备。

本项目由 Astrobox-NG ( https://github.com/AstralSightStudios/AstroBox-NG ) 提供技术支持。

**项目亮点**：
- 🎨 **米坛设计**：统一现代的扁平化界面
- 📱 **响应式布局**：完美适配 PC 和移动设备，侧边栏智能收缩
- ⚡ **WebAssembly 驱动**：高性能底层操作，浏览器直接调用
- 🔗 **Web Bluetooth 集成**：无需额外驱动，浏览器直接连接设备



## ✨ 功能特性

### 🚀 设备管理
- **智能设备发现**：通过 Web Bluetooth API 扫描附近设备
- **多设备支持**：保存多个设备配置，快速切换连接
- **实时状态监控**：电池电量、存储空间、固件版本等信息实时显示
- **一键连接/断开**：简洁的操作体验

### 🎨 内容管理
- **表盘管理**：查看、切换、卸载设备上的表盘
- **应用管理**：管理快应用（启动、卸载）
- **文件安装**：支持 .bin (表盘/固件) 和 .rpk (快应用) 文件安装
- **自动类型检测**：智能识别文件类型，自动填充包名

### 🖥️ 现代化 UI
- **黑白极简风格**：纯黑+纯白高对比度配色，无渐变、阴影、纹理
- **响应式设计**：桌面端固定侧边栏，移动端可收缩侧边栏
- **直观交互**：折叠式设备列表、标签式内容切换、汉堡菜单
- **操作日志**：完整记录所有操作，便于追踪和调试

### 🔧 技术特性
- **WebAssembly 后端**：基于 Astrobox-NG 的 Rust 编译 WASM 模块
- **React 18 + TypeScript**：类型安全的前端开发
- **TailwindCSS 3.x**：实用的 CSS 框架，黑白主题定制
- **Vite 构建工具**：快速的开发和构建体验

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- 支持 Web Bluetooth API 的现代浏览器（Chrome/Edge 推荐）

### 1. 克隆项目
```bash
git clone https://github.com/NEORUAA/bandburg.git
cd bandburg
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm start
```
访问：http://localhost:3000

### 4. 构建生产版本
```bash
npm run build
```
构建后的文件位于 `dist/` 目录，可直接部署到任何静态文件服务器。

## 📖 使用指南

### 连接设备
1. 点击"添加新设备"按钮
2. 选择"扫描附近设备"模式
3. 在浏览器授权弹窗中选择您的手环设备
4. 设备信息自动填充后，输入认证密钥（authkey）
5. 点击"保存设备"，然后在设备列表中点击"连接"

### 界面导航
- **设备页面**：设备管理、表盘管理、应用管理、文件安装
- **关于页面**：项目介绍、功能说明、版本信息
- **移动端**：点击左上角汉堡菜单按钮展开/收起侧边栏

### 文件安装
1. 切换到"安装"标签页
2. 点击"选择文件"按钮，选择 `.bin` 或 `.rpk` 文件
3. （可选）设置安装类型或使用自动检测
4. 点击"开始安装"，等待进度完成

## 🏗️ 技术架构

### 前端架构
```
BandBurg/
├── src/
│   ├── App.tsx              # 主应用组件（响应式布局、侧边栏、状态管理）
│   ├── main.tsx             # React 应用入口点
│   ├── index.css            # 全局样式
│   └── hooks/
│       └── useWasmClient.ts # WASM 客户端自定义钩子
├── public/
│   ├── wasm/                # 预编译的 WebAssembly 模块
│   │   ├── astrobox_ng_wasm.js
│   │   ├── astrobox_ng_wasm_bg.wasm
│   │   └── ...
│   └── icon.png             # 应用图标
├── package.json             # 项目依赖和脚本
└── tailwind.config.js       # TailwindCSS 黑白主题配置
```

### 核心依赖
- **React 18**：组件化 UI 开发
- **TypeScript**：类型安全的 JavaScript 超集
- **TailwindCSS**：实用优先的 CSS 框架
- **Vite**：现代化构建工具
- **JSZip**：ZIP 文件处理库
- **Web Bluetooth API**：浏览器原生蓝牙接口

### WASM 集成
项目使用预编译的 WebAssembly 模块（基于 Astrobox-NG 项目），提供：
- 设备连接和通信
- 表盘和应用管理
- 文件安装和处理
- 设备状态读取

## 🌐 浏览器支持

### 推荐浏览器
- Google Chrome 89+ (完全支持)
- Microsoft Edge 89+ (完全支持)

### 必需功能
- **Web Bluetooth API**：设备连接和通信
- **WebAssembly**：高性能计算和操作
- **ES6 Modules**：现代 JavaScript 模块系统
- **CSS Grid/Flexbox**：响应式布局支持

## ⚠️ 注意事项

### 使用限制
1. **浏览器权限**：首次使用需要授予蓝牙访问权限
2. **设备兼容性**：支持 Vela 设备系列，具体型号取决于 WASM 模块
3. **网络环境**：建议在安全、可信的网络环境中使用
4. **文件格式**：仅支持 `.bin` 和 `.rpk` 格式文件

### 安全建议
1. **本地使用**：建议在本地网络或安全环境中使用
2. **数据存储**：设备配置存储在浏览器 localStorage 中
3. **文件验证**：仅安装来自可信来源的文件
4. **权限管理**：及时撤销不必要的蓝牙权限

## 📄 许可证

AGPL-3.0

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### Q: 为什么无法扫描到设备？
A: 
1. 确保浏览器已授予蓝牙权限
2. 检查设备蓝牙已开启且可被发现
3. 尝试刷新页面后重新扫描
4. 确保设备电量充足

### Q: 文件安装失败怎么办？
A:
1. 检查文件格式是否正确 (.bin/.rpk)
2. 确保设备有足够的存储空间
3. 检查设备连接状态
4. 查看操作日志中的错误信息

### Q: 如何在移动端使用？
A:
1. 打开支持 Web Bluetooth 的浏览器（如 Chrome）
2. 访问 BandBurg 页面
3. 点击左上角汉堡菜单按钮展开侧边栏
4. 操作与桌面端相同

### Q: 设备配置会保存吗？
A:
- 设备配置保存在浏览器的 localStorage 中
- 同一浏览器下次访问时设备列表会自动加载
- 不同浏览器或隐私模式不会共享配置
- 清除浏览器数据会删除所有配置

---

**BandBurg** - 简洁、高效的 Vela 设备管理工具