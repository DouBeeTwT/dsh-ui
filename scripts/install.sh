#!/bin/bash
# Install DSH.app: first ensure every prerequisite via scripts/bootstrap.sh
# (auto-installing anything missing), then build from source and install to
# /Applications. Options are forwarded to bootstrap.sh:
#
#   bash install.sh            interactive
#   bash install.sh --yes      auto-install any missing prerequisites
#   bash install.sh --check    only verify prerequisites, then exit
#
# 输出约定：每个步骤成功只打一行 ✔；失败时回放完整子脚本输出再终止。
# 子脚本中以 "!!" 开头的警告行会在成功时透传（如缺少可选依赖的降级提示）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
info() { printf '%s==> %s%s\n' "$BLUE" "$*" "$RESET"; }
ok()   { printf '    %s✔ %s%s\n' "$GREEN" "$*" "$RESET"; }
warn() { printf '    %s! %s%s\n' "$YELLOW" "$*" "$RESET" >&2; }
die()  { printf '%sError: %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

CHECK=0
for arg in "$@"; do
  [ "$arg" = "--check" ] && CHECK=1
done

resolve_command() {
  local name="$1" resolved=""
  resolved="$(command -v "$name" 2>/dev/null || true)"
  if [ -z "$resolved" ]; then
    resolved="$(/bin/zsh -lic "command -v $name" 2>/dev/null | tail -n 1 || true)"
  fi
  if [ -n "$resolved" ] && [ -x "$resolved" ]; then
    printf '%s\n' "$resolved"
    return 0
  fi
  return 1
}

# 静默执行：run_quiet "描述" <cmd> [args...]
run_quiet() {
  local desc="$1"; shift
  local out
  if out="$("$@" 2>&1)"; then
    ok "$desc"
    printf '%s\n' "$out" | grep '^!!' >&2 || true
  else
    printf '%s\n' "$out" >&2
    die "$desc 失败（完整输出见上）"
  fi
}

# 自愈 ~/.dsh/profiles/web/cordis.patch.yml：丢弃与其它内容并存的 [] 占位符行。
# 历史 bug 会生成 "[]" + insert 两段无 --- 分隔的非法 YAML，令 dsh web 启动崩溃。
heal_profile_patch() {
  local f="$HOME/.dsh/profiles/web/cordis.patch.yml" healed=""
  [ -f "$f" ] || return 0
  healed="$(python3 - "$f" <<'PY'
import sys
p = sys.argv[1]
lines = open(p).read().split("\n")
has_placeholder = any(l.strip() == "[]" for l in lines)
has_content = any(l.strip() and l.strip() != "[]" and not l.strip().startswith("#") for l in lines)
if has_placeholder and has_content:
    s = "\n".join(l for l in lines if l.strip() != "[]").strip("\n")
    open(p, "w").write((s + "\n") if s else "[]\n")
    print("1")
PY
)" || healed=""
  [ -n "$healed" ] && ok "已修复 cordis.patch.yml 中残留的 [] 占位符"
  return 0
}

# --check 用：一行汇总一个插件的安装状态
check_plugin() { # check_plugin "标签" "相对目录" "包名" bundle|patch
  local label="$1" dir pkg mode link good=1
  dir="$ROOT/$2"; pkg="$3"; mode="$4"
  link="$HOME/.dsh/profiles/node_modules/$pkg"
  { [ -L "$link" ] && [ "$(readlink "$link")" = "$dir" ]; } || good=0
  [ -L "$dir/node_modules/@deepseek-ai/dsh-typert-protocol" ] || good=0
  if [ "$mode" = "bundle" ]; then
    python3 - "$HOME/.dsh/profiles/web/package.json" "$pkg" 2>/dev/null <<'PY' || good=0
import json, sys
m = json.load(open(sys.argv[1]))
sys.exit(0 if sys.argv[2] in m.get('dsh', {}).get('profile', {}).get('bundles', []) else 1)
PY
  else
    grep -Fq "$pkg" "$HOME/.dsh/profiles/web/cordis.patch.yml" 2>/dev/null || good=0
  fi
  if [ "$good" -eq 1 ]; then
    # 注意 ${label} 必须带花括号：bash 3.2 下 $var 后紧跟全角冒号会被误解析进变量名
    ok "${label}：已安装"
  else
    warn "${label}：未完整安装（重新运行 install.command 可修复）"
  fi
}

# ---------------------------------------------------------------- 1. 依赖检查
# bootstrap.sh 自带标题与逐项 ✔ 输出（可能含交互确认，故不静默捕获）
if ! bash "$ROOT/scripts/bootstrap.sh" "$@"; then
  echo ""
  if [ "$CHECK" -eq 1 ]; then
    exit 1
  fi
  die "Prerequisites are not fully installed (see above). Re-run with '--yes' to auto-install everything: bash install.command --yes"
fi

if [ "$CHECK" -eq 1 ]; then
  echo ""
  info "插件状态"
  check_plugin "token-usage（用量统计）" "plugin/token_usage" "@deepseek-ai/dsh-client-ui-token-usage" bundle
  check_plugin "user-info（角色信息）"   "plugin/user_info"   "@deepseek-ai/dsh-client-ui-user-info"  patch
  check_plugin "proxy（代理）"           "plugin/proxy"       "@deepseek-ai/dsh-client-ui-proxy"      bundle
  exit 0
fi

# 把 dsh 所在目录并入 PATH，保证插件脚本能定位 dsh 部署（nvm 等非登录环境）
DSH_PATH="$(resolve_command dsh || true)"
if [ -n "$DSH_PATH" ]; then
  export PATH="$(dirname "$DSH_PATH"):$PATH"
fi

# ---------------------------------------------------------------- 2. 编译
info "编译 DSH.app"
run_quiet "Swift 编译并打包" bash "$ROOT/DSHApp/build.sh"

# ---------------------------------------------------------------- 3. 安装 App
info "安装到 /Applications"
APP_DIR="$ROOT/build/DSH.app"
APP_NAME="DSH.app"
if pgrep -x DSH >/dev/null 2>&1; then
  osascript -e 'tell application "DSH" to quit' 2>/dev/null || true
  sleep 1
  pgrep -x DSH >/dev/null 2>&1 && pkill -x DSH 2>/dev/null || true
  sleep 1
fi
# 清理可能泄漏的孤儿后端（非优雅退出时 App 的子进程会残留在 3080 上，
# 导致新装的 App 一直复用旧后端）；安装本就要求干净状态，一并释放端口
if lsof -ti :3080 >/dev/null 2>&1; then
  lsof -ti :3080 | xargs kill 2>/dev/null || true
  sleep 1
  lsof -ti :3080 >/dev/null 2>&1 && { lsof -ti :3080 | xargs kill -9 2>/dev/null || true; sleep 1; } || true
fi
if [ ! -w /Applications ]; then
  echo "    /Applications 不可直接写入，尝试 sudo（可能需要输入密码）"
  sudo rm -rf "/Applications/$APP_NAME"
  sudo cp -R "$APP_DIR" "/Applications/$APP_NAME"
else
  rm -rf "/Applications/$APP_NAME"
  cp -R "$APP_DIR" "/Applications/$APP_NAME"
fi
ok "DSH.app -> /Applications"
# 清理历史遗留的常驻 LaunchAgent（若有）
"/Applications/$APP_NAME/Contents/MacOS/DSH" --stop-agent >/dev/null 2>&1 || true

# ---------------------------------------------------------------- 4. 安装插件
info "安装插件"
heal_profile_patch
run_quiet "token-usage（模型用量统计）" bash "$ROOT/plugin/token_usage/sync.sh" --install
run_quiet "user-info（角色信息）"       bash "$ROOT/plugin/user_info/sync.sh" --install
run_quiet "proxy（代理）"               bash "$ROOT/plugin/proxy/sync.sh" --install

echo ""
echo "✅ 安装完成。后端随 DSH.app 自动启动/停止，日志: ~/Library/Logs/dsh-web.log"
