#!/usr/bin/env bash
# 模型用量统计插件：源码 → 安装（同步）→ 验证 → 历史回填
#
# 用法:
#   ./sync.sh --install    # 全新安装/覆盖（幂等，可反复执行）：软链 + 依赖软链 +
#                          # bundle 组合 + 清理旧 patch 行 + 回填安装前历史用量
#   ./sync.sh              # 仅同步软链并报告安装状态
#   ./sync.sh --verify     # 校验包解析、host 加载、client 挂载契约、bundle、回填产物
#   ./sync.sh --dump       # 查看 bundle 组合行 / 软链 / 回填状态
#   ./sync.sh --backfill   # 仅重新生成历史用量回填文件
#   ./sync.sh --uninstall  # 移除软链、bundle 组合行与旧 patch 行
#
# 说明:
#   - 插件源码位于本目录 (plugin/token_usage)，通过软链接安装:
#       ~/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage
#   - 组合采用 dsh 的 profile bundle 机制（唯一来源，避免与 patch 行重复）:
#       ~/.dsh/profiles/web/package.json  → dsh.profile.bundles
#     插件自带 bundle patch（本目录 cordis.patch.yml，dsh.bundle.patch 指向它）。
#     旧版写入的 ~/.dsh/profiles/web/cordis.patch.yml 组合行会被自动清理，
#     否则与 bundle 重复会触发 "duplicate loader entry id: token-usage" 启动崩溃。
#   - @deepseek-ai/dsh-typert-protocol 必须是指向运行中 dsh 部署副本的软链
#     （实体拷贝会让插件与网关各持一个模块实例，Remote 标记互相不可见，
#     用量统计 RPC 返回 invocation-unavailable）。
#   - 历史用量在安装时一次性回填：扫描 ~/.dsh/sessions 生成
#     ~/.dsh/usage-stats.backfill.json，插件 Host 首次启动时合并进
#     ~/.dsh/usage-stats.json（去重 + 防重叠），无需手动补数据。
#   - 修改本目录 lib/*.js 后无需重新安装；重启 dsh web 服务即加载新代码。
set -eo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG_NAME="@deepseek-ai/dsh-client-ui-token-usage"
FALLBACK_LINK="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage"
PROFILE_DIR="$HOME/.dsh/profiles/web"
MANIFEST="$PROFILE_DIR/package.json"
PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"
# 运行时网关 (@deepseek-ai/dsh-api-gateway) 通过部署内 node_modules 解析
# @deepseek-ai/dsh-typert-protocol。Remote 标记存在该模块的私有 WeakMap 里，
# 因此插件必须解析到"同一个"模块实例：这里必须是指向部署副本的软链，
# 绝不能是实体拷贝（拷贝会静默导致网关看不到任何 Remote 端点）。
TYPERT_LINK="$ROOT/node_modules/@deepseek-ai/dsh-typert-protocol"
BACKFILL_FILE="$HOME/.dsh/usage-stats.backfill.json"

echo "== 插件源码: $ROOT"

# ---- 推导运行中 dsh 部署包根目录（网关解析 typert-protocol 的位置）----
deployment_typert() {
  local bin real pkg
  bin="$(command -v dsh 2>/dev/null || true)"
  [ -n "$bin" ] || return 1
  real="$(readlink -f "$bin" 2>/dev/null || echo "$bin")"
  pkg="$(dirname "$(dirname "$real")")"   # .../lib/node_modules/@deepseek-ai/dsh
  [ -f "$pkg/package.json" ] || return 1
  [ -d "$pkg/node_modules/@deepseek-ai/dsh-typert-protocol" ] || return 1
  echo "$pkg/node_modules/@deepseek-ai/dsh-typert-protocol"
}

# ---- 确保插件的 typert-protocol 是指向部署副本的软链（幂等）----
ensure_typert_link() {
  local src
  src="$(deployment_typert || true)"
  if [ -z "$src" ]; then
    echo "!! 无法定位 dsh 部署内的 dsh-typert-protocol，跳过依赖软链（插件 Remote 将不可用，请先安装 dsh）" >&2
    return 0
  fi
  mkdir -p "$(dirname "$TYPERT_LINK")"
  local current=""
  current="$(readlink "$TYPERT_LINK" 2>/dev/null || true)"
  if [ "$current" = "$src" ]; then
    echo "== typert-protocol 依赖软链已就位: $TYPERT_LINK -> $src"
    return 0
  fi
  if [ -e "$TYPERT_LINK" ] || [ -L "$TYPERT_LINK" ]; then
    echo "== 旧 typert-protocol 依赖存在（实体拷贝或旧软链），先移除再重建（实体拷贝会导致网关看不到 Remote 端点）..."
    rm -rf "$TYPERT_LINK"
  fi
  ln -s "$src" "$TYPERT_LINK"
  echo "   created $TYPERT_LINK -> $src"
}

# ---- 覆盖安全的软链创建：先清掉旧的软链/实体目录，避免 ln 把软链建进目录内部 ----
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

# ---- 确保 profile bundle 组合（唯一来源）：初始化缺失的 profile，并在
#      已有 manifest 上幂等追加 bundle 与 file: 依赖 ----
ensure_profile_manifest() {
  mkdir -p "$PROFILE_DIR"
  if [ ! -f "$MANIFEST" ]; then
    echo "== 初始化 profile manifest（新机器首次安装）: $MANIFEST"
    cat > "$MANIFEST" <<EOF
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "@deepseek-ai/dsh-client-ui-token-usage": "file:$ROOT"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@deepseek-ai/dsh-client-ui-token-usage"
      ]
    }
  }
}
EOF
  fi
  # dsh 首次启动时也会补的配套文件；缺失就先建好，保持目录形态一致。
  if [ ! -f "$PROFILE_DIR/cordis.yml" ]; then
    printf '# dsh profile root — composed as patches (bundles → cordis.patch.yml → overlays).\n[]\n' > "$PROFILE_DIR/cordis.yml"
  fi
  if [ ! -f "$PATCH_FILE" ]; then
    printf '[]\n' > "$PATCH_FILE"
  fi
  if [ ! -f "$PROFILE_DIR/pnpm-workspace.yaml" ]; then
    printf 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n' > "$PROFILE_DIR/pnpm-workspace.yaml"
  fi
  # 幂等追加 bundle + file: 依赖（用 python3 做精确 JSON 编辑）
  python3 - "$MANIFEST" "$ROOT" <<'PY'
import json, sys
p, root = sys.argv[1], sys.argv[2]
with open(p) as f:
    m = json.load(f)
deps = m.setdefault('dependencies', {})
deps.setdefault('@deepseek-ai/dsh-client-ui-token-usage', 'file:' + root)
bundles = m.setdefault('dsh', {}).setdefault('profile', {}).setdefault('bundles', [])
if '@deepseek-ai/dsh-client-ui-token-usage' not in bundles:
    bundles.append('@deepseek-ai/dsh-client-ui-token-usage')
with open(p, 'w') as f:
    json.dump(m, f, indent=2, ensure_ascii=False)
    f.write('\n')
PY
  echo "== profile bundle 已就位: $MANIFEST"
  echo "   bundles: $(python3 -c "import json,sys; print(', '.join(json.load(open('$MANIFEST'))['dsh']['profile']['bundles']))")"
}

# ---- 清理旧版写入 cordis.patch.yml 的 token-usage 组合行（防重复崩溃）----
clean_legacy_patch() {
  [ -f "$PATCH_FILE" ] || return 0
  if ! grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
    return 0
  fi
  echo "== 清理旧版 token-usage 组合行（bundle 机制下会与 bundle 重复导致启动崩溃）: $PATCH_FILE"
  python3 - "$PATCH_FILE" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
block = "- insert:\n    - id: token-usage\n      name: '@deepseek-ai/dsh-client-ui-token-usage'\n"
s = s.replace(block, "")
for line in ["# Local plugin: 模型用量统计 (token usage stats)\n", "# Local plugin: 模型用量统计\n"]:
    s = s.replace(line, "")
s = s.strip()
open(p, "w").write("[]\n" if s in ("", "[]") else s + "\n")
print("   清理完成")
PY
}

# ---- 一次性回填插件安装前的历史用量（扫描会话日志 → 回填文件，Host 首次启动合并）----
backfill_history() {
  local node_bin
  node_bin="$(command -v node 2>/dev/null || true)"
  if [ -z "$node_bin" ] || [ ! -x "$node_bin" ]; then
    node_bin="$(/bin/zsh -lic 'command -v node' 2>/dev/null | tail -n 1 || true)"
  fi
  if [ -z "$node_bin" ] || [ ! -x "$node_bin" ]; then
    echo "!! node 不可用，跳过历史回填（插件首次启动时 Host 仍会自动回填）" >&2
    return 0
  fi
  echo "== 回填安装前历史用量（扫描 ~/.dsh/sessions，产出 $BACKFILL_FILE）..."
  "$node_bin" "$ROOT/tools/backfill-sessions.mjs"
}

# ---- 卸载：移除软链、manifest 中的 bundle 行与旧 patch 行 ----
remove_all() {
  if [ -e "$FALLBACK_LINK" ] || [ -L "$FALLBACK_LINK" ]; then
    rm -rf "$FALLBACK_LINK"
    echo "== 已移除软链: $FALLBACK_LINK"
  fi
  if [ -f "$MANIFEST" ]; then
    python3 - "$MANIFEST" <<'PY' || true
import json, sys
p = sys.argv[1]
try:
    with open(p) as f:
        m = json.load(f)
except Exception:
    raise SystemExit(0)
changed = False
bundles = m.get('dsh', {}).get('profile', {}).get('bundles')
if isinstance(bundles, list) and '@deepseek-ai/dsh-client-ui-token-usage' in bundles:
    bundles.remove('@deepseek-ai/dsh-client-ui-token-usage')
    changed = True
deps = m.get('dependencies')
if isinstance(deps, dict) and '@deepseek-ai/dsh-client-ui-token-usage' in deps:
    del deps['@deepseek-ai/dsh-client-ui-token-usage']
    changed = True
if changed:
    with open(p, 'w') as f:
        json.dump(m, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print("== 已从 manifest 移除 token-usage bundle:", p)
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
    backfill_history
    echo ""
    echo "完成。重启 dsh web 服务后插件生效，历史用量会在首次启动时并入统计。"
    ;;
  --verify)
    ensure_symlink
    ensure_typert_link
    echo "== 校验 typert-protocol 模块身份（Remote 标记共享前提）..."
    {
      src="$(deployment_typert || true)"
      if [ -z "$src" ]; then
        echo "!! 无法定位部署内 dsh-typert-protocol，跳过身份校验" >&2
      elif [ "$(readlink "$TYPERT_LINK" 2>/dev/null || true)" != "$src" ]; then
        echo "!! $TYPERT_LINK 不是指向部署副本的软链（当前: $(readlink "$TYPERT_LINK" 2>/dev/null || echo '缺失')）" >&2
        echo "   实体拷贝会让插件与网关使用不同的 dsh-typert-protocol 模块实例，" >&2
        echo "   Remote 标记互相不可见，用量统计 RPC 将返回 invocation-unavailable。" >&2
        echo "   请运行 ./sync.sh --install 重建软链。" >&2
        exit 1
      else
        echo "   OK: $TYPERT_LINK -> $src"
      fi
    }
    echo "== 校验 profile bundle 组合..."
    if [ ! -f "$MANIFEST" ]; then
      echo "!! profile manifest 缺失: $MANIFEST（请先运行 dsh web 初始化 profile，或直接 ./sync.sh --install）" >&2
      exit 1
    fi
    if python3 -c "
import json, sys
m = json.load(open('$MANIFEST'))
b = m.get('dsh', {}).get('profile', {}).get('bundles', [])
sys.exit(0 if '@deepseek-ai/dsh-client-ui-token-usage' in b else 1)
"; then
      echo "   OK: bundle 已声明"
    else
      echo "!! manifest 缺少 bundle: '@deepseek-ai/dsh-client-ui-token-usage'（请运行 ./sync.sh --install）" >&2
      exit 1
    fi
    if grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "!! cordis.patch.yml 仍残留旧版 token-usage 组合行，会与 bundle 重复导致启动崩溃（请运行 ./sync.sh --install）" >&2
      exit 1
    else
      echo "   OK: 无旧版 patch 行残留"
    fi
    echo "== 校验历史回填产物..."
    if [ -f "$BACKFILL_FILE" ]; then
      echo "   OK: $BACKFILL_FILE（Host 首次启动合并；若已被合并会清空为 {\"records\":[]}）"
    else
      echo "   未发现回填文件（全新机器无历史数据时正常；可运行 ./sync.sh --backfill）"
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
    echo "== 校验 client bundle 语法..."
    node --check "$ROOT/lib/client.js" && echo "   client.js OK"
    node --check "$ROOT/lib/index.js" && echo "   index.js OK"
    echo "== 校验 client Remote 挂载契约..."
    require_client_contract() {
      local expected="$1"
      if ! grep -Fq "$expected" "$ROOT/lib/client.js"; then
        echo "!! client.js 缺少关键 RPC 逻辑: $expected" >&2
        echo "   请勿把 remote.tokenUsage 作为启动依赖；插件必须先通过 remote.\$mount() 创建它。" >&2
        return 1
      fi
    }
    require_client_contract 'const inject = ["slots", "remote"];'
    require_client_contract 'await ctx.remote.$mount(TYPERT_REMOTE)'
    require_client_contract 'const service = ctx.get("remote.tokenUsage");'
    require_client_contract 'const result = await tokenUsageRemote(ctx).get();'
    require_client_contract 'const result = await tokenUsageRemote(ctx).setPrices(request);'
    require_client_contract 'if (!result.ok) {'
    require_client_contract 'await disposeRemote();'
    if grep -Fq 'const inject = ["slots", "remote", "remote.tokenUsage"];' "$ROOT/lib/client.js"; then
      echo "!! client.js 检测到循环依赖: remote.tokenUsage 不能作为插件启动依赖。" >&2
      exit 1
    fi
    if grep -Eq 'inject\s*=\s*\[[^]]*"remote\.tokenUsage"' "$ROOT/lib/client.js"; then
      echo "!! client.js inject 数组里出现 remote.tokenUsage（启动依赖），禁止。" >&2
      exit 1
    fi
    echo "   Remote mount + RPC envelope OK"
    ;;
  --dump)
    echo "== profile manifest bundle 行:"
    if [ -f "$MANIFEST" ]; then
      python3 -c "
import json
m = json.load(open('$MANIFEST'))
for b in m.get('dsh', {}).get('profile', {}).get('bundles', []):
    print('  -', b)
deps = m.get('dependencies', {})
print('  依赖:', deps.get('@deepseek-ai/dsh-client-ui-token-usage', '（无 file: 依赖）'))
"
    else
      echo "  （manifest 不存在: $MANIFEST）"
    fi
    echo "== 软链状态:"
    echo "  $FALLBACK_LINK -> $(readlink "$FALLBACK_LINK" 2>/dev/null || echo '缺失')"
    echo "  $TYPERT_LINK -> $(readlink "$TYPERT_LINK" 2>/dev/null || echo '缺失')"
    echo "== 历史回填:"
    if [ -f "$BACKFILL_FILE" ]; then
      echo "  $BACKFILL_FILE 存在（$(wc -c < "$BACKFILL_FILE" | tr -d ' ') 字节）"
    else
      echo "  $BACKFILL_FILE 不存在"
    fi
    ;;
  --backfill)
    backfill_history
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
sys.exit(0 if '@deepseek-ai/dsh-client-ui-token-usage' in m.get('dsh', {}).get('profile', {}).get('bundles', []) else 1)
" 2>/dev/null; then
      echo "== bundle 已声明: $MANIFEST"
    else
      echo "!! bundle 缺失: 请运行 ./sync.sh --install"
    fi
    if grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "!! cordis.patch.yml 残留旧版组合行（会与 bundle 重复导致启动崩溃）: 请运行 ./sync.sh --install"
    fi
    echo ""
    echo "完成。修改 lib/*.js 后重启 dsh web 服务即可生效（无需重新安装）。"
    ;;
esac
