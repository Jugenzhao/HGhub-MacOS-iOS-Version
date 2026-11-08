<div align="center">

# HGhub (macOS & iOS 增强版)

**黄果短剧跨平台第三方客户端 · Rust + Tauri 2**

**iOS (`.ipa`) / macOS (`Apple Silicon & Intel .dmg`) / Windows / Android 全平台支持**  
Fluent & Apple 原生沉浸设计 · 竖屏无限刷剧流 · 触控手势与原生横屏全屏

[![GitHub Releases](https://img.shields.io/github/v/release/LNPANDY/HGhub-MacOS-iOS-Version?include_prereleases&label=Release&color=blue)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20macOS%20%7C%20Windows%20%7C%20Android-success)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases)
[![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-orange)](LICENSE)

[📥 下载 iOS 版 (.ipa)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.1.0-ios) · [💻 下载 macOS 版 (.dmg)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.1.0-macos) · [📦 查看全部 Releases](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases)

</div>

---

> ⚠️ 本项目仅供 **学习与技术交流**，不提供、不存储、不分发任何音视频内容。  
> 所有内容均来自第三方站点，版权归原作者与上游站点所有。

---

## ✨ 核心功能与亮点

### 📱 1. iOS 移动端深度适配与专属手势（全新）
- **原生横竖屏智能切换**：
  - 观看横屏（16:9）视频时点击「横屏全屏」，直接调用 iOS 原生 `UIWindowScene` 旋转系统屏幕方向；
  - 支持**手机物理横置自动进入横屏全屏、竖回自动退出**，采用独立固定舞台层渲染，横竖屏切换零错位、不闪封面、不断流。
- **双指自由缩放与拖拽平移（Pinch-to-Zoom）**：
  - 竖屏下观看横屏视频时，支持 `1.0x ~ 4.0x` 双指无级放大与画面平移；
  - 内置快捷胶囊按钮，一键切换 **「放大铺满 / 完整适应 / 还原缩放」**。
- **直觉化触控手势体系**：
  - **单击屏幕**：清屏模式（一键隐藏所有操作按钮与底部渐变遮罩，只留纯粹视频画面；再次单击恢复）；
  - **双击屏幕**：快速暂停 / 继续播放；
  - **长按屏幕 + 上滑锁定**：长按画面开启 `2.0x` 倍速播放，按住向上滑动即可**锁定 `2.0x` 倍速**，松手也能持续倍速观看；
  - **左右横滑调节进度**：在屏幕任意区域左右滑动即可实时预览时间点并精准跳转。
- **iOS HLS 播放引擎专项加固**：
  - 针对 iOS `WKWebView` 优化自定义协议流媒体传输，内置内存级 AES Key 与分片缓存；
  - 具备网络抖动与拖动进度条后的自动重连/解码器自愈恢复机制；
  - 全屏/旋转过渡期持续保活（`keepPlayingThroughTransition`）+ 片尾双保险自动连播下一集。

### 💻 2. macOS 桌面端原生体验
- **全架构原生编译支持**：同时提供 **Apple Silicon (`arm64`，M1/M2/M3/M4)**、**Intel (`x64`)** 以及 **Universal 通用双架构** `.dmg` 安装包与 `.app.tar.gz` 免安装版。
- **macOS 原生窗口融合**：采用系统 Overlay 沉浸式标题栏，完美适配 macOS 红绿灯窗口控制键与原生全屏切换。
- **桌面端效率特性**：支持**影院模式（Theater Mode）**、**画中画（PiP）**、右侧停靠式选集/评论面板，以及全局键盘快捷键（`1~4` 切换导航栏、`/` 快速搜索、`Esc` 返回）。

### 🎬 3. 全站内容与互动体验
- **沉浸式上下滑刷剧流（Feed）**：首页无限流推荐，上下滑动秒切剧集。
- **全分类 / 三大榜单 / 搜索**：支持按题材分类筛选，「热门 / 推荐 / 潜力」三大榜单实时同步，支持关键词搜索。
- **吃瓜社区（图文 + 视频帖）**：支持浏览社区吃瓜帖、图文混排正文解析（图片自动走本地解密代理）及内嵌视频播放。
- **账号与本地双轨记录**：支持账号登录/注册、点赞、收藏、关注作者、评论互动，同时自动保存本地观看历史与分集续播进度。

### 🌐 4. 多线路与镜像防失联系统
- **内置主备线路 + 自动抓取最新镜像**：支持在「设置 → 线路」中一键从发布页拉取最新可用镜像域名。
- **并发延迟测速**：一键探测所有线路连通性与响应耗时，切换后立即生效并持久化保存。
- **网络环境自愈**：当系统代理切换或上游偶发 TLS 抖动时，自动重建连接池并重试。

---

## 📥 下载与安装指南

请前往本项目 **[GitHub Releases](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases)** 页面下载对应平台安装包：

### 📱 iOS 版安装说明（`HGhub_x.x.x_ios.ipa`）
本仓库发布的 `.ipa` 为无证书编译包（已内置完整前端生产资源，非 dev 调试包），支持以下任意方式安装到 iPhone / iPad：
1. **TrollStore（巨魔商店）**：直接下载 `.ipa` 后通过巨魔导入即可永久安装（推荐 iOS 14.0 ~ 17.0 巨魔设备）。
2. **AltStore / SideStore / Sideloadly**：在电脑端使用个人免费 Apple ID 自签安装。
3. **轻松签（ESign）/ 牛蛙助手 / Feather / 全能签**：导入个人证书或企业证书签名后直接安装。

### 💻 macOS 版安装说明（`HGhub_x.x.x_*.dmg`）
- **M1 / M2 / M3 / M4 芯片 Mac**：推荐下载 `HGhub_x.x.x_arm64.dmg`
- **Intel 芯片 Mac**：推荐下载 `HGhub_x.x.x_x64.dmg`
- **通用版（全机型兼容）**：可下载 `HGhub_x.x.x_universal.dmg`

> **💡 macOS 首次打开提示「已损坏」或「无法验证开发者」的解决方法：**  
> 由于开源个人构建未接入 Apple 付费开发者公证（Notarization），将 `HGhub.app` 拖入「应用程序（Applications）」后，请在「终端（Terminal）」中执行以下命令清除隔离属性即可正常打开：
> ```bash
> sudo xattr -rd com.apple.quarantine /Applications/HGhub.app
> ```

---

## 🛠️ 技术栈与项目结构

| 层级 | 技术选型 |
| --- | --- |
| 跨平台宿主 | Tauri 2（Rust 1.9x，支持 iOS / macOS / Windows / Android） |
| 前端界面 | React 19 + TypeScript + Vite 7 + Tailwind CSS 4 |
| 视频引擎 | hls.js + 原生 HLS（AES-128 加密流 + 分片/Key 内存缓存 + 自动重连恢复） |
| 网络与解密 | reqwest + rustls + AES-128-CBC 封面实时解密 |
| CI/CD | GitHub Actions（全自动构建 macOS 三架构 DMG 与 iOS 免签 IPA 并发布 Release） |

```text
.
├─ .github/workflows/
│  ├─ build-ios.yml          iOS IPA 自动化编译、生产模式校验与 Release 发布工作流
│  └─ build-macos.yml        macOS (arm64 / x64 / universal) DMG 自动化构建与发布工作流
├─ src/                      前端源码
│  ├─ api.ts                 接口封装 + 跨平台本地媒体协议 URL (hg://localhost)
│  ├─ store.tsx              全局状态（导航栈 / 用户 / 本地收藏 / 历史 / 全屏与清屏状态）
│  ├─ html.ts                吃瓜正文清洗与加密图片代理
│  ├─ components/            Feed（沉浸播放流）/ VideoSurface / PlayerControls / Panels / UI
│  └─ pages/                 Home / Search / Category / Profile / Posts / Settings
├─ src-tauri/                Rust 后端源码
│  └─ src/
│     ├─ net.rs              网络层（统一边缘信封 + TLS 重试 + 代理自愈）
│     ├─ api.rs              业务命令 + iOS 原生屏幕方向旋转控制 (UIWindowScene)
│     ├─ lines.rs            固定线路与发布页镜像自动探测
│     ├─ media.rs            AES-128-CBC 封面解密 + HLS m3u8/Key/分片代理与内存缓存
│     └─ session.rs          登录会话持久化
└─ docs/API.md               接口文档
```

---

## 🚀 本地开发与构建

### 1. 安装依赖与桌面端开发
```bash
pnpm install          # 安装前端依赖
pnpm app:dev          # 启动桌面端热重载开发模式
pnpm app:build        # 构建桌面端安装包（macOS → .app + .dmg；Windows → NSIS）
```

### 2. macOS 指定架构打包
```bash
pnpm tauri build --config src-tauri/tauri.macos.conf.json --target aarch64-apple-darwin
pnpm tauri build --config src-tauri/tauri.macos.conf.json --target x86_64-apple-darwin
pnpm tauri build --config src-tauri/tauri.macos.conf.json --target universal-apple-darwin
```

### 3. iOS 构建与免签 IPA 打包（需 macOS + Xcode）
```bash
pnpm ios:init         # 首次生成 iOS Xcode 工程 (src-tauri/gen/apple)
pnpm build            # 编译前端静态资源
pnpm tauri ios build --no-sign --ci --features custom-protocol
```
> **注意**：构建 iOS 生产包时必须显式传入 `--features custom-protocol`，确保 Tauri 将 `dist/` 前端静态资源编译内嵌至二进制文件中，而非连接 `localhost:1420` 开发服务器。

### 4. Android 构建（需 Android SDK + NDK）
```bash
pnpm android:init     # 首次生成 Android 工程
pnpm android:dev      # 真机 / 模拟器调试
pnpm android:build    # 构建 APK
```

---

## 📌 使用须知与免责声明

- **以访客身份正常使用**：像普通访客一样浏览即可，请勿滥用本项目。
- **不要给上游增加压力**：本项目不提供批量下载功能，请勿改动代码去做批量抓取或高频并发请求；请保留内置的封面与播放分片缓存。
- **不要商业化**：本项目遵循 [PolyForm Noncommercial License 1.0.0](LICENSE)，**严禁任何商业用途**（禁止打包出售、接入卡密/会员/广告变现或作为收费服务的一部分分发）。
- **致谢**：本项目基于开源项目 [Minireel/HGhub](https://github.com/Minireel/HGhub) 进行 macOS 与 iOS 平台深度适配、播放稳定性加固与触控交互增强，并参考了 [stclock1988/hghub-ios](https://github.com/stclock1988/hghub-ios) 的全屏过渡保活与片尾连播机制。
- **免责声明**：本项目与内容提供方无任何关联，作者不参与任何音视频内容的制作、上传与分发。使用者应自行遵守所在地法律法规，因使用本项目产生的任何后果由使用者自行承担。