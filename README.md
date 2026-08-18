# DSH — macOS 桌面封装

把 DeepSeek Harness 的 Web 界面（`dsh web`）封装成一个原生 macOS App，
后端由 App 以**静默子进程**方式启动——完全不需要 Terminal；退出 App 时，
该后端进程也会同步停止。

```
┌──────────────────────────────┐
│   DSH.app (Swift + WKWebView)│   ← 原生窗口，内嵌浏览器视图
│        http://127.0.0.1:3080 │
└──────────────────────────────┘
        ▲                          ┌──────────────────────────┐
        │  HTTP                    │  App-owned child process │
        └──────────────────────────│   dsh web --port 3080    │
                                   └──────────────────────────┘
                                    (随 App 启动 / 退出)
```

## 特性

- **原生 macOS App**：Swift + WKWebView，几十 KB 的二进制，无 Electron 冗余。
- **生命周期同步**：打开 App 时静默启动 `dsh web`，退出 App 时同步停止（关闭窗口只隐藏到菜单栏，后端继续运行）；
  App 运行期间如果后端意外退出会自动恢复。
- **单实例保护**：重复打开 App 只会激活已有窗口，避免多个窗口争用同一个后端。
- **无需终端**：`dsh` 和对应的 Node 可自动解析（兼容 nvm / npx / brew），
  stdout/stderr 统一写入日志。
- **端口冲突保护**：如果 3080 已有 DSH 实例在跑，代理脚本会安静等待而不是冲突崩溃。
- **菜单栏控制**：启动 / 重启 / 停止后端、在系统浏览器打开、查看后端日志。
- **系统托盘图标**：右上角菜单栏常驻小图标；点击窗口关闭按钮只隐藏窗口、不退出，点击图标可重新打开窗口，或通过「退出 DSH」彻底退出并停止后端。
- **外部链接分流**：界面里点击的站外链接自动用系统浏览器打开。

## 下载与安装

本项目只发布源码，不提供 DMG。App 会在使用者自己的 Mac 上编译并安装，
不需要 Apple 开发者账号。

### 使用 Git 克隆（推荐）

```bash
git clone https://github.com/DouBeeTwT/dsh-ui.git
cd dsh-ui
bash install.command
```

### 下载源码 ZIP

在 GitHub 页面点击 **Code → Download ZIP**，解压后打开 Terminal，进入源码目录并运行：

```bash
bash install.command
```

也可以在 Finder 中双击 `install.command`。如果 macOS 首次阻止脚本运行，
请右键该文件并选择“打开”，或使用上面的 Terminal 命令。

### 依赖自动检测与补全

用户拿到源码后不需要手动安装任何东西——安装脚本会先检测并自动补全所有依赖
（每项都会先征求同意，输入 `y` 继续，`n` 跳过）：

1. **macOS**（必需，仅支持 macOS）；
2. **Xcode Command Line Tools**：用于编译 App，缺少时自动触发
   `xcode-select --install` 并等待安装完成；
3. **Homebrew**：用于安装 Node.js，缺少时自动安装（未安装也不阻塞，Node.js
   会改用官方安装包）；
4. **Node.js + npm**：缺少时优先用 `brew install node`，否则下载 Node.js LTS
   官方安装包自动安装；
5. **dsh**（`@deepseek-ai/dsh`）：缺少时通过 `npm install -g` 自动安装，
   需要管理员权限时会自动改用 `sudo`。

之后才进入编译与安装步骤：

1. 在本机编译 App，安装到 `/Applications/DSH.app`（覆盖已存在的旧版本）；
2. 安装内置插件（模型用量统计、角色信息、代理），并自动回填安装前的历史用量；
3. 启动 DSH。

#### 常用选项

```bash
bash install.command            # 交互式：逐项询问是否安装缺失依赖
bash install.command --yes      # 全自动：缺失的依赖全部自动安装，不询问
bash install.command --check    # 只检测依赖是否齐全，不做任何安装
bash scripts/bootstrap.sh       # 只做依赖检测与补全，不编译 App
```

### 只构建，不安装

```bash
bash DSHApp/build.sh
open build/DSH.app
```

## 状态自检

```bash
# 查看依赖 + 插件是否齐全（只检测不安装）
bash install.command --check
# 例：✔ Xcode Command Line Tools  ✔ Homebrew  ✔ Node.js + npm (v22.x.x)  ✔ dsh ...
#     ✔ token-usage（用量统计）：已安装  ✔ user-info（角色信息）：已安装  ✔ proxy（代理）：已安装

# 查看 App 运行状态
build/DSH.app/Contents/MacOS/DSH --check
# 例：server_up=true owned_process=false legacy_agent=false dsh=/.../bin/dsh ...
```

## 内置插件

仓库自带三个 DSH 插件，由 `install.command` 自动安装：

| 插件 | 目录 | 功能 |
| --- | --- | --- |
| 模型用量统计 | `plugin/token_usage/` | token 消耗、费用与趋势统计 |
| 角色信息 | `plugin/user_info/` | 侧边栏用户卡片（HP/MP/XP 属性与等级） |
| 代理 | `plugin/proxy/` | UA 改写反向代理规则管理 |

三个插件均以**软链**方式安装：源码软链到 dsh 的扁平回退目录
（`~/.dsh/profiles/node_modules/`），并注册进 dsh profile（token-usage 与
proxy 走 bundle 组合，user-info 走 profile patch）。整个安装过程**不经过
pnpm 等包管理器**——不写 `file:` 依赖、无需执行 `pnpm install`，dsh 直接
通过软链解析本仓库源码并生成前后端 entry；插件依赖同样由安装脚本以软链
方式指向运行中的 dsh 部署，自动维护。

安装是覆盖式、幂等的，可安全重复执行（覆盖 App 前会先退出正在运行的
DSH）。因此更新插件只需 `git pull` 后**重启 DSH.app** 即生效，无需重新
安装。需要手动管理时，三个插件的 `sync.sh` 用法一致：

```bash
bash plugin/token_usage/sync.sh --install    # 全新安装/覆盖（幂等）
bash plugin/token_usage/sync.sh --verify     # 校验安装与代码契约
bash plugin/token_usage/sync.sh --dump       # 查看安装状态
bash plugin/token_usage/sync.sh --uninstall  # 卸载
```

### 模型用量统计（token-usage）

在界面中展示模型用量：token 消耗、费用、每日/每周趋势与缓存命中统计，
模型价格可在插件设置中自定义。数据文件：`~/.dsh/usage-stats.json`。

**历史用量自动回填**：安装时扫描 DSH 会话日志
（`~/.dsh/sessions/**/session.jsonl.zstd`）生成回填文件，插件首次启动时
自动合并进统计（去重），因此**插件安装之前**的用量也会出现在图表里，
无需手动补数据。需要时可用 `sync.sh --backfill` 重新生成。

### 角色信息（user-info）

在侧边栏渲染一张用户卡片：头像、昵称与 HP / MP / XP 三条属性进度条，
属性随模型用量的积累自动升级（Lv.60 起称号为「编程斗尊」）；卡片每分钟
自动刷新，昵称与头像可在卡片上自定义。数据文件：`~/.dsh/user-info.json`。

### 代理（proxy）

在设置页最下方的「代理」分类中管理反向代理规则：把指定上游站点代理到
本地端口，并可按规则改写 User-Agent；每条规则可单独开关、测试连通性。
代理进程运行在 DSH 后端内，随 App 启停。规则文件：`~/.dsh/proxy-rules.json`。

## 卸载

```bash
bash scripts/uninstall.sh
```

卸载会一并移除 App、全部内置插件（软链与组合行）以及遗留的 LaunchAgent；
`~/.dsh` 下的会话与统计数据、日志文件会保留。

## 工作原理

- App 启动时解析 `dsh` 及其配套的 Node 路径，直接创建无窗口子进程并运行
  `dsh web --port 3080`，等健康检查通过后加载界面。
- App 只会停止自己创建的子进程；如果 3080 已经由用户手动启动的 DSH 占用，
  App 会复用它但不会在退出时误杀该外部进程。
- 点击窗口关闭按钮只会隐藏窗口（App 与后端继续在后台运行）；点击右上角菜单栏的 DSH 图标可重新打开窗口，点击图标菜单里的「退出 DSH」才会完全退出并同步停止 App 创建的后端。
- 日志：`~/Library/Logs/dsh-web.log`。

## 开发

```bash
bash DSHApp/build.sh            # 编译到 build/DSH.app（ad-hoc 签名）
bash DSHApp/build.sh && open build/DSH.app
```

要求：macOS 12+、Node.js/npm、Xcode Command Line Tools（`xcode-select --install`）。
这些依赖都可以由 `install.command` 自动检测并安装（详见上文“依赖自动检测与补全”）。

编译结果会匹配当前 Mac 的处理器架构，因此 Apple Silicon 和 Intel Mac 都可以各自在本机生成适用版本。
