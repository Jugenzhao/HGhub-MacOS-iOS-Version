<div align="center">

<img src="src-tauri/icons/128x128@2x.png" width="96" height="96" alt="HGhub" />

# HGhub · macOS & iOS 增强版

**黄果短剧跨平台客户端 —— 原生支持 macOS · iOS · Windows · Android**

[![Release iOS](https://img.shields.io/badge/iOS-IPA%20(TrollStore%20%2F%20AltStore)-007AFF?style=flat-square&logo=apple)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.2.2-ios)
[![Release macOS](https://img.shields.io/badge/macOS-Universal%20%2F%20Apple%20Silicon%20%2F%20Intel-111111?style=flat-square&logo=apple)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.2.2-macos)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.x-24C8DB?style=flat-square&logo=tauri)](https://v2.tauri.app/)
[![Version](https://img.shields.io/badge/version-v1.2.2-success?style=flat-square)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases)

[📥 下载 iOS 版 (.ipa)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.2.2-ios) · [💻 下载 macOS 版 (.dmg)](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.2.2-macos) · [📦 查看全部 Releases](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases)

</div>

> [!WARNING]
> **⚠️ 重要提醒（仓库下线预告）**：上游原版仓库（`Minireel/HGhub`）目前已删库停更，**本仓库预计也将在近期下线归档/删除**。请有需要的用户尽快前往 [GitHub Releases](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases) 下载保存最新安装包（`v1.2.2`），或自行 Clone / 备份全部源码。

---

## 📖 项目简介

本项目基于 [Minireel/HGhub](https://github.com/Minireel/HGhub)（Tauri 2 + React 19 + Rust）深度适配与增强，同步最新上游 **v1.2.0** 内核，专为 **Apple 生态（iOS / iPadOS 与 macOS）** 提供开箱即用的编译产物与移动端深度交互体验优化。

通过内置 Rust 媒体网关（`hg://localhost` 自定义协议），在客户端本地完成**封面图 AES-128-CBC 实时解密**、**HLS (`.m3u8`) 播放列表分片与密钥代理改写**、**IPv6 优先连接**与**内存级缓存加速**，彻底解决 WebView 跨域（CORS）、防盗链拦截与进度条拖动卡死问题。

---

## ✨ 核心功能特性

### 🆕 v1.2.2 新增特性：多档位 GPU 实时视频超分引擎（WebGL2 / Metal）
针对低码率在线短剧与漫剧片源，客户端内置基于 **WebGL2 GLSL ES 3.0 → Apple Metal** 的单通道零拷贝实时画质超分引擎（支持像素健康自检与硬件卷积零黑屏自动回退），在**播放中与暂停静帧状态下均可随时打开浮层选单直达切换并实时对比**：

| 档位名称 | 按钮标签 | 核心算法与画质特点 | 推荐片源 / 场景 |
| :--- | :---: | :--- | :--- |
| **自然清透** | `自然` | 对角等值线抗锯齿 + 严格零白边过冲的温和 RCAS，带肤质噪点保护门限 | 真人短剧日常默认推荐，耐看无硬边 |
| **影院质感** | `影院` | 自适应 RCAS 细节提清 + 局部微反差立体感（Local Clarity）+ 柔和胶片去灰雾曲线与自然净度 | 暗场偏灰、对比度偏平的实拍短剧 |
| **超清锐利** | `锐利` | 高频强力适应 RCAS + 亚像素高频细节重建 + 微余量抗振铃钳制 | 模糊低清片源、远景人脸或小字幕强化 |
| **漫剧锐线** | `漫剧` | **零双边磨皮模糊（100% 保留发丝/材质纹理）**，仅做轻量轮廓收紧 + 精细纹理 RCAS 重塑 | **AI 漫剧 / 3D 国漫 / 半写实漫剧推荐**，告别塑料涂抹感 |
| **二次元重绘** | `二次元` | 窄门限净底去蚊式块噪 + 双跨度 Sobel 描边收窄加固 + 鲜明色彩补偿 | 纯 2D 平涂线条番剧 / 手绘风动画 |
| **原画直通** | `原画` | 完全旁路超分渲染管线，直出原始解码画面 | 用于左右对比超分前后效果、极限省电 |

- **全端直达选单开关**：在移动端竖屏右上角、全屏横屏右上角/底部控制栏、吃瓜视频播放器以及 macOS 桌面端底部控制栏中，点击超分胶囊即可弹出带有特征说明的 6 档位毛玻璃选单，任意两档之间一键切换对比（竖屏下自动跟随屏幕保持正方向）。

### 🆕 v1.2.1 修复更新
- **修复视频无法加载（仅有封面）问题**：全面适配最新播放鉴权协议（切换至 `POST /api/videos/{id}/episodes/{ep}/playback` 与 `POST /api/posts/{id}/playback` 接口，优先解析 `streams.main` 兼容流并动态注入 CDN 鉴权请求头），恢复短剧信息流、选集与吃瓜视频正常播放。
- **新增内置可用镜像线路**：补充最新实测可用 API 线路，开箱即连免手动寻址。

### 🆕 v1.2.0 新增特性
- **播放控制锁（防误触）**：播放界面新增一键锁屏按钮，锁定后屏蔽手势、进度条、选集与快捷键误触，仅保留半透明解锁入口。
- **启动默认静音开关**：在「设置」中新增启动时默认静音开关，自动保存个人偏好。
- **IPv6 优先与网络加固**：DNS 解析优先尝试 IPv6 地址，内置 30 秒连接池复用、非重试型 `4xx` 快速失败以及严格安全模式（SSRF 防护与 HTML 净化）开关。
- **macOS 原生红绿灯居中与 Ad-hoc 签名**：根据系统标题栏高度动态计算并垂直居中 macOS 窗口红绿灯按钮，打包产物内置 Ad-hoc 签名，并移除横屏视频伪圆角黑框。
- **播放诊断日志与代理分流规则**：设置页支持一键开启/导出播放诊断日志，仓库内置 Mihomo (Clash) 与 sing-box 分流规则（[`rules/`](rules)）。

### 📱 iOS / iPadOS 专属增强
- **原生横竖屏智能切换**：
  - 观看横屏视频时提供一键**「横屏全屏」**胶囊按钮，直接调用 iOS 16+ `UIWindowScene.requestGeometryUpdate` 原生旋转屏幕方向；
  - 支持**手机物理横置自动进入全屏、竖回自动退出全屏**，杜绝“画面横了屏幕没横”或“手机横过来视频反而竖过去”的错位问题；
  - 采用独立固定舞台层（`.fs-immersive` / `.fs-landscape`）渲染全屏画面，并在旋转过渡窗口期自动保活播放，彻底解决横屏全屏闪现封面或跑偏到其他剧集的问题。
- **丝滑触控手势体系**：
  - **单击清屏 / 双击暂停**：播放中**单击屏幕**一键隐藏所有控件与渐变遮罩（纯享视频内容），**双击屏幕**切换暂停/播放；
  - **双指无级缩放（1x ~ 3.5x）与自由平移**：竖屏观看横屏视频支持双指捏合放大与拖拽平移，并提供「放大铺满 / 完整适应 / 还原缩放」快捷切换；
  - **长按 2.0x 倍速 + 上滑锁定**：长按屏幕开启 2.0x 倍速快进，长按同时上滑即可锁定 2.0x 倍速；
  - **全屏任意位置横滑定位**：手指左右滑动实时预览目标时间点并精准 Seek。
- **iOS WebKit 播放链路深度调优**：
  - 针对 iOS `WKWebView` 自定义协议专门关闭 HLS WebWorker 跨线程死锁风险，加大分片缓冲池并内置 **AES Key 与 TS 分片内存缓存**；
  - 拖动进度条或遇到网络波动时，支持非致命卡顿自动重连与最高 4 次静默解码恢复，片尾自动触发下一集连播。

### 💻 macOS 桌面端体验
- **三架构完整构建**：同时提供 **Apple Silicon (`arm64`)**、**Intel (`x64`)** 与 **Universal (`通用双架构`)** `.dmg` 安装包及 `.app.tar.gz` 免安装版。
- **原生 Overlay 沉浸式标题栏**：适配 macOS 原生圆角窗口与交通灯（红绿灯）按钮垂直居中，支持深色 / 浅色 Fluent 主题切换、影院模式、画中画（PiP）、侧边选集/评论停靠栏与全键盘快捷键控制。

### 🎬 全功能内容聚合
- **无限推荐流 & 题材分类**：沉浸式上下滑刷剧，涵盖都市、古装、逆袭、虐恋、甜宠、悬疑等全部分类频道。
- **三大实时榜单 & 全局搜索**：热门榜、推荐榜、潜力榜实时同步，支持关键词搜索与搜索历史记录。
- **吃瓜社区（图文 + 视频）**：内置「黄果吃瓜」爆料流，支持富文本图文浏览与内嵌视频播放。
- **选集连播 & 观看历史续播**：自动记录每部短剧观看集数与秒级进度，从个人中心或历史记录点开即可无缝续播。
- **多线路切换 & 镜像域名测速**：内置固定主备线路，支持从地址发布页动态抓取最新可用镜像域名并一键并发测速。

---

## 📥 下载与安装指南

请前往 [**GitHub Releases 页面**](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases) 下载对应平台的最新安装包：

### 1. iOS / iPadOS 安装说明（[`HGhub_1.2.2_ios.ipa`](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.2.2-ios)）

> Release 提供的 `.ipa` 为已内嵌完整静态前端资源的**免签名生产包（Unsigned Production IPA）**，支持以下任意方式安装（系统要求 iOS / iPadOS 15.0+）：

| 安装工具 | 适用设备 | 安装步骤 |
| :--- | :--- | :--- |
| **TrollStore（巨魔商店）** | iOS 14.0 – 17.0 支持巨魔设备 | 下载 `HGhub_1.2.2_ios.ipa` → 在「文件」中共享给 **TrollStore** 直接永久安装（推荐） |
| **AltStore / SideStore** | 任意 iOS 设备（免费 Apple ID） | 打开 AltStore / SideStore → 点击 `+` 导入 `.ipa` 自签安装（每 7 天自动刷新） |
| **Sideloadly** | 任意 iOS 设备（电脑辅助自签） | 连接电脑打开 Sideloadly → 拖入 `.ipa` 输入 Apple ID 签名安装 |
| **轻松签 (ESign) / Feather / 牛蛙助手** | 拥有个人或企业证书设备 | 导入 `.ipa` 至签名工具 → 选择自有证书签名后直接安装 |

### 2. macOS 安装说明（[`v1.2.2-macos`](https://github.com/LNPANDY/HGhub-MacOS-iOS-Version/releases/tag/v1.2.2-macos)）

- **Apple Silicon (M1 / M2 / M3 / M4 系列芯片)**：推荐下载 `HGhub_1.2.2_arm64.dmg`
- **Intel 处理器 Mac**：推荐下载 `HGhub_1.2.2_x64.dmg`
- **Universal 通用版**：下载 `HGhub_1.2.2_universal.dmg`

> **💡 macOS 首次打开提示「已损坏」或「无法验证开发者」解决方法：**
> 由于开源版本未挂载付费 Apple Developer ID 公证（仅做 Ad-hoc 签名），将 `HGhub.app` 拖入「应用程序（Applications）」后，若首次打开被 Gatekeeper 拦截，请在「终端（Terminal）」执行以下命令清除隔离属性即可正常打开：
> ```bash
> sudo xattr -rd com.apple.quarantine /Applications/HGhub.app
> ```

---

## ⌨️ 快捷键与手势速查

| 平台 | 操作 | 功能说明 |
| :--- | :--- | :--- |
| **iOS / 移动端** | **单击屏幕** | 清屏模式（隐藏/显示全部界面控件与底部导航栏，只看视频） |
| **iOS / 移动端** | **双击屏幕** | 暂停 / 继续播放 |
| **iOS / 移动端** | **右上角锁形图标** | 锁定播放控制（防误触，锁屏后点按屏幕唤醒解锁按钮） |
| **iOS / 移动端** | **双指捏合 / 拖动** | 自由缩放画面（`0.85x` ~ `3.5x`）与任意方向平移画面 |
| **iOS / 移动端** | **长按屏幕** | 开启 `2.0x` 倍速快进（长按同时**上滑**可锁定 `2.0x` 倍速） |
| **iOS / 移动端** | **屏幕左右横滑** | 实时预览并跳转播放进度 |
| **iOS / 移动端** | **手机横置 / 点「横屏全屏」** | 原生旋转屏幕进入横屏全屏（手机竖回或点右上角按钮退出） |
| **iOS / 移动端** | **播放界面「自然/漫剧/原画」超分胶囊** | 展开 6 档 GPU 实时视频超分浮层选单（支持暂停定帧对比） |
| **macOS / 桌面端** | `Space`（空格） | 播放 / 暂停 |
| **macOS / 桌面端** | **底部控制栏 ✨ 超分胶囊** | 展开 6 档 WebGL2 / Metal 画质超分档位选单 |
| **macOS / 桌面端** | `↑` / `↓` | 切换上一部 / 下一部短剧 |
| **macOS / 桌面端** | `←` / `→` | 快退 5 秒 / 快进 5 秒 |
| **macOS / 桌面端** | `F` / `T` / `M` | 全屏 (`F`) / 影院模式 (`T`) / 静音 (`M`) |
| **macOS / 桌面端** | `E` / `C` / `L` / `S` | 选集面板 (`E`) / 评论面板 (`C`) / 点赞 (`L`) / 收藏 (`S`) |
| **macOS / 桌面端** | `1` `2` `3` `4` / `/` | 切换主导航栏标签 / 聚焦搜索页 (`/`) |

---

## 🛠️ 本地开发与构建

### 环境要求
- **Node.js** 22+ & **pnpm** 10+
- **Rust** 1.90+ (`rustup`)
- **macOS / iOS 构建**：需 macOS 系统与 Xcode 16+

```bash
# 1. 安装前端依赖
pnpm install

# 2. 启动桌面开发调试
pnpm tauri dev

# 3. 编译 macOS 安装包 (.dmg / .app)
pnpm tauri build --config src-tauri/tauri.macos.conf.json --target aarch64-apple-darwin

# 4. 初始化并编译 iOS 免签名生产包
pnpm tauri ios init
pnpm build
pnpm tauri ios build --no-sign --ci --features custom-protocol
```

---

## 📄 开源许可与致谢

- 感谢上游项目 [Minireel/HGhub](https://github.com/Minireel/HGhub) 提供的核心架构与跨平台基础。
- 感谢 [stclock1988/hghub-ios](https://github.com/stclock1988/hghub-ios) 在 iOS 播放器过渡保活与片尾连播机制上的参考启发。
- 本仓库遵循 [PolyForm Noncommercial License 1.0.0](LICENSE) 协议，仅供个人学习与非商业交流使用。
