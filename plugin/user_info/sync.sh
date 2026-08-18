#!/usr/bin/env bash
# 角色信息插件：源码 → 安装（同步）→ 验证 → 卸载
#
# 用法:
#   ./sync.sh --install    # 全新安装/覆盖（幂等，可反复执行）：软链 + 依赖软链 +
#                          # profile patch 组合行
#   ./sync.sh              # 仅同步软链并报告安装状态
#   ./sync.sh --verify     # 校验包解析、host 加载、client 语法、组合行
#   ./sync.sh --dump       # 查看软链 / 组合行状态
#   ./sync.sh --uninstall  # 移除软链与 profile patch 组合行
#
# 说明:
#   - 插件源码位于本目录 (plugin/user_info)，通过软链接安装:
#       ~/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-user-info
#   - 组合采用 dsh 的 profile patch 机制（cordis.patch.yml 的 insert 行）:
#       ~/.dsh/profiles/web/cordis.patch.yml
#   - @deepseek-ai/dsh-typert-protocol 必须是指向运行中 dsh 部署副本的软链
#     （实体拷贝会让插件与网关各持一个模块实例，Remote 标记互相不可见，
#     角色信息 RPC 返回 invocation-unavailable）。
#   - 修改本目录 lib/*.js 后无需重新安装；重启 dsh web 服务即加载新代码。
set -eo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG_NAME="@deepseek-ai/dsh-client-ui-user-info"
FALLBACK_LINK="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-user-info"
PROFILE_DIR="$HOME/.dsh/profiles/web"
PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"
# 运行时网关 (@deepseek-ai/dsh-api-gateway) 通过部署内 node_modules 解析
# @deepseek-ai/dsh-typert-protocol。Remote 标记存在该模块的私有 WeakMap 里，
# 因此插件必须解析到"同一个"模块实例：这里必须是指向部署副本的软链，
# 绝不能是实体拷贝（拷贝会静默导致网关看不到任何 Remote 端点）。
TYPERT_LINK="$ROOT/node_modules/@deepseek-ai/dsh-typert-protocol"
CORDIS_LINK="$ROOT/node_modules/@deepseek-ai/cordis"
REACT_LINK="$ROOT/node_modules/react"

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
deployment_pkg() {
  local bin real pkg
  bin="$(command -v dsh 2>/dev/null || true)"
  [ -n "$bin" ] || return 1
  real="$(readlink -f "$bin" 2>/dev/null || echo "$bin")"
  pkg="$(dirname "$(dirname "$real")")"
  [ -f "$pkg/package.json" ] || return 1
  echo "$pkg"
}

ensure_link() {
  # ensure_link <link> <target>：覆盖安全地建软链
  local link="$1" target="$2"
  mkdir -p "$(dirname "$link")"
  local current=""
  current="$(readlink "$link" 2>/dev/null || true)"
  if [ "$current" = "$target" ]; then
    echo "== 软链已就位: $link -> $target"
    return 0
  fi
  if [ -e "$link" ] || [ -L "$link" ]; then
    echo "== 旧的软链/实体存在，先移除再重建: $link"
    rm -rf "$link"
  fi
  ln -s "$target" "$link"
  echo "   created $link -> $target"
}

# ---- 确保插件的 typert-protocol / cordis / react 是指向部署副本的软链 ----
ensure_dep_links() {
  local dep_root
  dep_root="$(deployment_pkg || true)"
  if [ -z "$dep_root" ]; then
    echo "!! 无法定位 dsh 部署根目录，跳过依赖软链（插件 Remote 将不可用，请先安装 dsh）" >&2
    return 0
  fi
  ensure_link "$TYPERT_LINK" "$dep_root/node_modules/@deepseek-ai/dsh-typert-protocol"
  ensure_link "$CORDIS_LINK" "$dep_root/node_modules/@deepseek-ai/cordis"
  ensure_link "$REACT_LINK" "$dep_root/node_modules/react"
}

# ---- 确保 profile patch 组合行（cordis.patch.yml 的 insert 行）----
ensure_profile_patch() {
  mkdir -p "$PROFILE_DIR"
  if [ ! -f "$PATCH_FILE" ]; then
    printf '# Your patch layer for this dsh profile.\n[]\n' > "$PATCH_FILE"
  fi
  if grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
    echo "== profile patch 组合行已就位: $PATCH_FILE"
    return 0
  fi
  python3 - "$PATCH_FILE" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
entry = "- insert:\n    - id: user-info\n      name: '@deepseek-ai/dsh-client-ui-user-info'\n"
if "@deepseek-ai/dsh-client-ui-user-info" in s:
    sys.exit(0)
# 去掉结尾多余空行后追加
s = s.rstrip("\n")
sep = "\n\n" if s and s != "[]" else "\n"
open(p, "w").write(s + sep + entry + "\n")
PY
  echo "== profile patch 组合行已追加: $PATCH_FILE"
}

# ---- 卸载：移除软链与 patch 组合行 ----
remove_all() {
  if [ -e "$FALLBACK_LINK" ] || [ -L "$FALLBACK_LINK" ]; then
    rm -rf "$FALLBACK_LINK"
    echo "== 已移除软链: $FALLBACK_LINK"
  fi
  if [ -f "$PATCH_FILE" ]; then
    python3 - "$PATCH_FILE" <<'PY' || true
import sys
p = sys.argv[1]
s = open(p).read()
block = "- insert:\n    - id: user-info\n      name: '@deepseek-ai/dsh-client-ui-user-info'\n"
s = s.replace(block, "")
for line in ["# Local plugin: 角色信息 (user info).\n"]:
    s = s.replace(line, "")
s = s.strip()
open(p, "w").write("[]\n" if s in ("", "[]") else s + "\n")
print("== 已移除 patch 组合行")
PY
  fi
}

case "${1:-}" in
  --install)
    ensure_link "$FALLBACK_LINK" "$ROOT"
    ensure_dep_links
    ensure_profile_patch
    echo ""
    echo "完成。重启 dsh web 服务后插件生效。"
    ;;
  --verify)
    ensure_link "$FALLBACK_LINK" "$ROOT"
    ensure_dep_links
    echo "== 校验 typert-protocol 模块身份（Remote 标记共享前提）..."
    {
      src="$(deployment_typert || true)"
      if [ -z "$src" ]; then
        echo "!! 无法定位部署内 dsh-typert-protocol，跳过身份校验" >&2
      elif [ "$(readlink "$TYPERT_LINK" 2>/dev/null || true)" != "$src" ]; then
        echo "!! $TYPERT_LINK 不是指向部署副本的软链（当前: $(readlink "$TYPERT_LINK" 2>/dev/null || echo '缺失')）" >&2
        echo "   实体拷贝会让插件与网关使用不同的 dsh-typert-protocol 模块实例，" >&2
        echo "   Remote 标记互相不可见，角色信息 RPC 将返回 invocation-unavailable。" >&2
        echo "   请运行 ./sync.sh --install 重建软链。" >&2
        exit 1
      else
        echo "   OK: $TYPERT_LINK -> $src"
      fi
    }
    echo "== 校验 profile patch 组合..."
    if grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "   OK: patch 组合行已声明"
    else
      echo "!! patch 缺少组合行（请运行 ./sync.sh --install）" >&2
      exit 1
    fi
    echo "== 校验包解析..."
    node --input-type=module -e "
      import { createRequire } from 'node:module'
      import { pathToFileURL } from 'node:url'
      const require = createRequire('$PATCH_FILE')
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
    ;;
  --dump)
    echo "== 软链状态:"
    echo "  $FALLBACK_LINK -> $(readlink "$FALLBACK_LINK" 2>/dev/null || echo '缺失')"
    echo "  $TYPERT_LINK -> $(readlink "$TYPERT_LINK" 2>/dev/null || echo '缺失')"
    echo "  $CORDIS_LINK -> $(readlink "$CORDIS_LINK" 2>/dev/null || echo '缺失')"
    echo "  $REACT_LINK -> $(readlink "$REACT_LINK" 2>/dev/null || echo '缺失')"
    echo "== profile patch:"
    if [ -f "$PATCH_FILE" ] && grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "  OK: patch 组合行已声明"
    else
      echo "  缺失: 请运行 ./sync.sh --install"
    fi
    ;;
  --uninstall)
    remove_all
    echo "完成。插件已卸载。"
    ;;
  *)
    ensure_link "$FALLBACK_LINK" "$ROOT"
    ensure_dep_links
    echo "== 安装状态检查（缺失时请用 --install 自动补齐）..."
    if [ -f "$PATCH_FILE" ] && grep -Fq "$PKG_NAME" "$PATCH_FILE" 2>/dev/null; then
      echo "== patch 组合行已声明: $PATCH_FILE"
    else
      echo "!! patch 缺失: 请运行 ./sync.sh --install"
    fi
    echo ""
    echo "完成。修改 lib/*.js 后重启 dsh web 服务即可生效（无需重新安装）。"
    ;;
esac
