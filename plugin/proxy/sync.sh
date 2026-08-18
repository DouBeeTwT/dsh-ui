#!/usr/bin/env bash
# 代理插件（UA 改写反代）：源码 → 安装（同步）→ 验证
#
# 用法:
#   ./sync.sh --install    # 全新安装/覆盖（幂等）：软链 + 依赖软链 + bundle 组合
#   ./sync.sh              # 仅同步软链并报告安装状态
#   ./sync.sh --verify     # 校验包解析、语法、client 挂载契约、bundle
#   ./sync.sh --dump       # 查看 bundle 组合行 / 软链 / 规则文件
#   ./sync.sh --uninstall  # 移除软链与 bundle 组合行
#
# 说明:
#   - 插件源码位于本目录 (plugin/proxy)，通过软链接安装:
#       ~/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-proxy
#   - 组合采用 dsh 的 profile bundle 机制（唯一来源，避免与 patch 行重复）:
#       ~/.dsh/profiles/web/package.json  → dsh.profile.bundles
#     插件自带 bundle patch（本目录 cordis.patch.yml，dsh.bundle.patch 指向它）。
#     整个过程**不经过 pnpm**：不写 file: 依赖、不生成 pnpm-workspace.yaml。
#   - @deepseek-ai/dsh-typert-protocol 与 @deepseek-ai/dsh-settings 必须是
#     指向运行中 dsh 部署副本的软链（实体拷贝会让插件与网关各持一个模块实例，
#     Remote 标记互相不可见，RPC 会返回 invocation-unavailable）。
#   - 代理规则持久化在 ~/.dsh/proxy-rules.json，由插件 Host 读写。
#   - 修改本目录 lib/*.js 后无需重新安装；重启 dsh web 服务即加载新代码。
set -eo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG_NAME="@deepseek-ai/dsh-client-ui-proxy"
FALLBACK_LINK="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-proxy"
PROFILE_DIR="$HOME/.dsh/profiles/web"
MANIFEST="$PROFILE_DIR/package.json"
PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"
TYPERT_LINK="$ROOT/node_modules/@deepseek-ai/dsh-typert-protocol"
SETTINGS_LINK="$ROOT/node_modules/@deepseek-ai/dsh-settings"
RULES_FILE="$HOME/.dsh/proxy-rules.json"

echo "== 插件源码: $ROOT"

# ---- 推导运行中 dsh 部署包根目录（网关解析依赖包的位置）----
deployment_root() {
  local bin real pkg
  bin="$(command -v dsh 2>/dev/null || true)"
  [ -n "$bin" ] || return 1
  real="$(readlink -f "$bin" 2>/dev/null || echo "$bin")"
  pkg="$(dirname "$(dirname "$real")")"   # .../lib/node_modules/@deepseek-ai/dsh
  [ -f "$pkg/package.json" ] || return 1
  echo "$pkg"
}

# ---- 通用：确保插件依赖是指向部署副本的软链（幂等）----
# 用法: ensure_dep_link <包名如 dsh-typert-protocol> <目标软链路径> <缺失时是否致命>
ensure_dep_link() {
  local dep="$1" link="$2" required="${3:-warn}"
  local root src
  root="$(deployment_root || true)"
  src="$root/node_modules/@deepseek-ai/$dep"
  if [ -z "$root" ] || [ ! -d "$src" ]; then
    if [ "$required" = "fatal" ]; then
      echo "!! 无法定位 dsh 部署内的 $dep，跳过依赖软链（插件 Remote 将不可用，请先安装 dsh）" >&2
    else
      echo "!! 无法定位 dsh 部署内的 $dep，跳过依赖软链（相关功能将降级）" >&2
    fi
    return 0
  fi
  mkdir -p "$(dirname "$link")"
  local current=""
  current="$(readlink "$link" 2>/dev/null || true)"
  if [ "$current" = "$src" ]; then
    echo "== $dep 依赖软链已就位: $link -> $src"
    return 0
  fi
  if [ -e "$link" ] || [ -L "$link" ]; then
    echo "== 旧 $dep 依赖存在，先移除再重建（实体拷贝会导致网关看不到 Remote 端点）..."
    rm -rf "$link"
  fi
  ln -s "$src" "$link"
  echo "   created $link -> $src"
}

# ---- 兼容旧调用：typert-protocol 为主依赖 ----
deployment_typert() {
  local root
  root="$(deployment_root || true)"
  [ -n "$root" ] && [ -d "$root/node_modules/@deepseek-ai/dsh-typert-protocol" ] || return 1
  echo "$root/node_modules/@deepseek-ai/dsh-typert-protocol"
}

# ---- 确保插件的 typert-protocol / dsh-settings 是指向部署副本的软链（幂等）----
ensure_typert_link() {
  ensure_dep_link dsh-typert-protocol "$TYPERT_LINK" fatal
  ensure_dep_link dsh-settings "$SETTINGS_LINK" fatal
}

# ---- 覆盖安全的软链创建 ----
ensure_symlink() {
  mkdir -p "$(dirname "$FALLBACK_LINK")"
  local current=""
  current="$(readlink "$FALLBACK_LINK" 2>/dev/null || true)"
  if [ "$current" = "$ROOT" ]; then
    echo "== 安装软链已就位: $FALLBACK_LINK -> $ROOT"
    return 0
  fi
  if [ -e "$FALLBACK_LINK" ] || [ -L "$FALLBACK_LINK" ]; then
    echo "== 旧的安装路径存在，先移除再重建（覆盖安装）..."
    rm -rf "$FALLBACK_LINK"
  fi
  ln -s "$ROOT" "$FALLBACK_LINK"
  echo "   created $FALLBACK_LINK -> $ROOT"
}

# ---- 确保 profile bundle 组合（幂等追加）----
ensure_profile_manifest() {
  mkdir -p "$PROFILE_DIR"
  if [ ! -f "$MANIFEST" ]; then
    echo "== 初始化 profile manifest（新机器首次安装）: $MANIFEST"
    cat > "$MANIFEST" <<EOF
{
  "name": "dsh-profile-web",
  "private": true,
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "$PKG_NAME"
      ]
    }
  }
}
EOF
  fi
  if [ ! -f "$PROFILE_DIR/cordis.yml" ]; then
    printf '# dsh profile root — composed as patches (bundles → cordis.patch.yml → overlays).\n[]\n' > "$PROFILE_DIR/cordis.yml"
  fi
  if [ ! -f "$PATCH_FILE" ]; then
    printf '[]\n' > "$PATCH_FILE"
  fi
  PKG_NAME="$PKG_NAME" python3 - "$MANIFEST" <<'PY'
import json, os, sys
p = sys.argv[1]
pkg = os.environ['PKG_NAME']
with open(p) as f:
    m = json.load(f)
bundles = m.setdefault('dsh', {}).setdefault('profile', {}).setdefault('bundles', [])
if pkg not in bundles:
    bundles.append(pkg)
with open(p, 'w') as f:
    json.dump(m, f, indent=2, ensure_ascii=False)
    f.write('\n')
PY
  echo "== profile bundle 已就位: $MANIFEST"
  echo "   bundles: $(python3 -c "import json; print(', '.join(json.load(open('$MANIFEST'))['dsh']['profile']['bundles']))")"
}

# ---- 清理可能残留的 patch 行（与 bundle 重复会触发启动崩溃）----
clean_legacy_patch() {
  [ -f "$PATCH_FILE" ] || return 0
  if ! grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
    return 0
  fi
  echo "== 清理 cordis.patch.yml 中的 proxy 组合行（与 bundle 重复会导致启动崩溃）: $PATCH_FILE"
  PKG_NAME="$PKG_NAME" python3 - "$PATCH_FILE" <<'PY'
import os, sys
p = sys.argv[1]
pkg = os.environ['PKG_NAME']
s = open(p).read()
block = "- insert:\n    - id: proxy\n      name: '%s'\n" % pkg
s = s.replace(block, "")
s = s.strip()
open(p, "w").write("[]\n" if s in ("", "[]") else s + "\n")
print("   清理完成")
PY
}

# ---- 卸载 ----
remove_all() {
  if [ -e "$FALLBACK_LINK" ] || [ -L "$FALLBACK_LINK" ]; then
    rm -rf "$FALLBACK_LINK"
    echo "== 已移除软链: $FALLBACK_LINK"
  fi
  if [ -f "$MANIFEST" ]; then
    PKG_NAME="$PKG_NAME" python3 - "$MANIFEST" <<'PY' || true
import json, os, sys
p = sys.argv[1]
pkg = os.environ['PKG_NAME']
try:
    with open(p) as f:
        m = json.load(f)
except Exception:
    raise SystemExit(0)
changed = False
bundles = m.get('dsh', {}).get('profile', {}).get('bundles')
if isinstance(bundles, list) and pkg in bundles:
    bundles.remove(pkg)
    changed = True
deps = m.get('dependencies')
if isinstance(deps, dict) and pkg in deps:
    del deps[pkg]
    changed = True
if changed:
    with open(p, 'w') as f:
        json.dump(m, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print("== 已从 manifest 移除 proxy bundle:", p)
PY
  fi
  clean_legacy_patch || true
}

case "${1:-}" in
  --install)
    ensure_symlink
    ensure_typert_link
    ensure_profile_manifest
    clean_legacy_patch
    echo ""
    echo "完成。重启 dsh web 服务后，设置页面最下方会出现「代理」分类。"
    ;;
  --verify)
    ensure_symlink
    ensure_typert_link
    echo "== 校验 typert-protocol 模块身份（Remote 标记共享前提）..."
    src="$(deployment_typert || true)"
    if [ -z "$src" ]; then
      echo "!! 无法定位部署内 dsh-typert-protocol，跳过身份校验" >&2
    elif [ "$(readlink "$TYPERT_LINK" 2>/dev/null || true)" != "$src" ]; then
      echo "!! $TYPERT_LINK 不是指向部署副本的软链（当前: $(readlink "$TYPERT_LINK" 2>/dev/null || echo '缺失')）" >&2
      echo "   实体拷贝会让插件与网关使用不同模块实例，Remote 不可见。请运行 ./sync.sh --install" >&2
      exit 1
    else
      echo "   OK: $TYPERT_LINK -> $src"
    fi
    echo "== 校验 profile bundle 组合..."
    if [ ! -f "$MANIFEST" ]; then
      echo "!! profile manifest 缺失: $MANIFEST（请先运行 dsh web 初始化，或 ./sync.sh --install）" >&2
      exit 1
    fi
    if python3 -c "
import json, sys
m = json.load(open('$MANIFEST'))
b = m.get('dsh', {}).get('profile', {}).get('bundles', [])
sys.exit(0 if '$PKG_NAME' in b else 1)
"; then
      echo "   OK: bundle 已声明"
    else
      echo "!! manifest 缺少 bundle: '$PKG_NAME'（请运行 ./sync.sh --install）" >&2
      exit 1
    fi
    if grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "!! cordis.patch.yml 残留组合行，会与 bundle 重复导致启动崩溃（请运行 ./sync.sh --install）" >&2
      exit 1
    else
      echo "   OK: 无 patch 行残留"
    fi
    echo "== 校验包解析..."
    node --input-type=module -e "
      import { createRequire } from 'node:module'
      import { pathToFileURL } from 'node:url'
      const require = createRequire('$MANIFEST')
      const p = require.resolve('$PKG_NAME/package.json')
      console.log('   package ->', p)
      const entry = require.resolve('$PKG_NAME')
      const m = await import(pathToFileURL(entry).href)
      console.log('   host plugin export type:', typeof m.default)
      console.log('   static inject:', JSON.stringify(m.default.inject))
    "
    echo "== 校验语法..."
    node --check "$ROOT/lib/client.js" && echo "   client.js OK"
    node --check "$ROOT/lib/index.js" && echo "   index.js OK"
    node --check "$ROOT/lib/bridge.js" && echo "   bridge.js OK"
    echo "== 校验 client Remote 挂载契约..."
    require_client_contract() {
      local expected="$1"
      if ! grep -Fq "$expected" "$ROOT/lib/client.js"; then
        echo "!! client.js 缺少关键 RPC 逻辑: $expected" >&2
        echo "   请勿把 remote.proxyBridge 作为启动依赖；必须先 remote.\$mount() 创建它。" >&2
        return 1
      fi
    }
    require_client_contract 'const inject = ["slots", "remote"];'
    require_client_contract 'await ctx.remote.$mount(TYPERT_REMOTE)'
    require_client_contract 'ctx.get("remote.proxyBridge")'
    require_client_contract 'id: "proxy", order: 30'
    if grep -Eq 'inject\s*=\s*\[[^]]*"remote\.proxyBridge"' "$ROOT/lib/client.js"; then
      echo "!! client.js inject 数组里出现 remote.proxyBridge（启动依赖），禁止。" >&2
      exit 1
    fi
    echo "   Remote mount + section 注册 OK"
    ;;
  --dump)
    echo "== profile manifest bundle 行:"
    if [ -f "$MANIFEST" ]; then
      python3 -c "
import json
m = json.load(open('$MANIFEST'))
for b in m.get('dsh', {}).get('profile', {}).get('bundles', []):
    print('  -', b)
"
    else
      echo "  （manifest 不存在: $MANIFEST）"
    fi
    echo "== 软链状态:"
    echo "  $FALLBACK_LINK -> $(readlink "$FALLBACK_LINK" 2>/dev/null || echo '缺失')"
    echo "  $TYPERT_LINK -> $(readlink "$TYPERT_LINK" 2>/dev/null || echo '缺失')"
    echo "== 代理规则:"
    if [ -f "$RULES_FILE" ]; then
      echo "  $RULES_FILE:"
      python3 -c "
import json
d = json.load(open('$RULES_FILE'))
for r in d.get('rules', []):
    print('   -', r.get('name'), '| 127.0.0.1:%s' % r.get('listenPort'), '->', r.get('upstream'), '| enabled:', r.get('enabled'))
" 2>/dev/null || cat "$RULES_FILE"
    else
      echo "  $RULES_FILE 不存在（还没配置过规则）"
    fi
    ;;
  --uninstall)
    remove_all
    echo "完成。插件已卸载。"
    ;;
  *)
    ensure_symlink
    ensure_typert_link
    echo "== 安装状态检查（缺失时请用 --install 自动补齐）..."
    if [ -f "$MANIFEST" ] && python3 -c "
import json, sys
m = json.load(open('$MANIFEST'))
sys.exit(0 if '$PKG_NAME' in m.get('dsh', {}).get('profile', {}).get('bundles', []) else 1)
" 2>/dev/null; then
      echo "== bundle 已声明: $MANIFEST"
    else
      echo "!! bundle 缺失: 请运行 ./sync.sh --install"
    fi
    if grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "!! cordis.patch.yml 残留组合行（会与 bundle 重复导致启动崩溃）: 请运行 ./sync.sh --install"
    fi
    echo ""
    echo "完成。修改 lib/*.js 后重启 dsh web 服务即可生效（无需重新安装）。"
    ;;
esac
