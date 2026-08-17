#!/usr/bin/env bash
# 模型用量统计插件：源码 → 安装（同步）→ 验证
#
# 用法:
#   ./sync.sh --install   # 安装/覆盖插件：建软链 + 写入组合行（幂等，可反复执行）
#   ./sync.sh             # 仅同步软链并报告组合行状态
#   ./sync.sh --verify    # 校验包解析、host 加载、client RPC 挂载契约
#   ./sync.sh --dump      # 查看组合配置里 token-usage 行
#   ./sync.sh --uninstall # 移除软链与组合行
#
# 说明:
#   - 插件源码位于本目录 (plugin/token_usage)。
#   - 已通过软链接安装到部署的扁平回退目录:
#       ~/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage
#     （与内置插件同样的解析机制，Node 会跟随软链读取本目录源码）
#   - 组合行位于:
#       ~/.dsh/profiles/web/cordis.patch.yml  (id: token-usage)
#   - 因此修改本目录 lib/*.js 后无需重新安装；重启 dsh web 服务即加载新代码。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG_NAME="@deepseek-ai/dsh-client-ui-token-usage"
FALLBACK_LINK="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage"
PATCH_FILE="$HOME/.dsh/profiles/web/cordis.patch.yml"

echo "== 插件源码: $ROOT"

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

# ---- 幂等的组合行写入：已存在则跳过，缺失则追加（YAML 允许多个 - insert 顶层项）----
ensure_composition() {
  mkdir -p "$(dirname "$PATCH_FILE")"
  if [ -f "$PATCH_FILE" ] && grep -Fq "$PKG_NAME" "$PATCH_FILE"; then
    echo "== 组合行已存在: $PATCH_FILE"
    return 0
  fi
  if [ -f "$PATCH_FILE" ] && [ -s "$PATCH_FILE" ]; then
    # 已有内容：若还没有我们的注释头再补，避免重复
    if ! grep -Fq "模型用量统计" "$PATCH_FILE"; then
      printf '\n# Local plugin: 模型用量统计 (token usage stats)\n' >> "$PATCH_FILE"
    else
      printf '\n' >> "$PATCH_FILE"
    fi
  else
    printf '# Local plugin: 模型用量统计 (token usage stats)\n' > "$PATCH_FILE"
  fi
  cat >> "$PATCH_FILE" <<'EOF'
- insert:
    - id: token-usage
      name: '@deepseek-ai/dsh-client-ui-token-usage'
EOF
  echo "== 已写入组合行: $PATCH_FILE"
}

# ---- 移除软链与组合行 ----
remove_all() {
  if [ -e "$FALLBACK_LINK" ] || [ -L "$FALLBACK_LINK" ]; then
    rm -rf "$FALLBACK_LINK"
    echo "== 已移除软链: $FALLBACK_LINK"
  fi
  if [ -f "$PATCH_FILE" ] && grep -Fq "$PKG_NAME" "$PATCH_FILE"; then
    # 用 python3 精确删除我们写入的那一段
    # （避免 perl 正则里 @deepseek 被当作数组插值导致匹配失败）
    python3 - "$PATCH_FILE" <<'PY' || true
import sys
p = sys.argv[1]
s = open(p).read()
block = "- insert:\n    - id: token-usage\n      name: '@deepseek-ai/dsh-client-ui-token-usage'\n"
if block in s:
    s = s.replace(block, "")
    # 若只剩下我们的注释头，直接删除整个文件，保持目录干净
    if s.strip() in ("", "# Local plugin: 模型用量统计 (token usage stats)"):
        import os
        os.remove(p)
        print("== 已移除组合文件:", p)
    else:
        open(p, "w").write(s)
        print("== 已从组合文件移除 token-usage:", p)
else:
    print("!! 组合文件里的 token-usage 块与预期格式不一致，请手动检查:", p)
PY
  fi
}

case "${1:-}" in
  --install)
    ensure_symlink
    ensure_composition
    echo ""
    echo "完成。重启 dsh web 服务后插件生效。"
    ;;
  --verify)
    ensure_symlink
    echo "== 校验包解析..."
    node --input-type=module -e "
      import { createRequire } from 'node:module'
      import { pathToFileURL } from 'node:url'
      const require = createRequire('$HOME/.dsh/profiles/web/package.json')
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
    echo "== 组合配置中的 token-usage 行:"
    grep -n -A2 -B1 "token-usage" "$PATCH_FILE"
    ;;
  --uninstall)
    remove_all
    echo "完成。插件已卸载。"
    ;;
  *)
    ensure_symlink
    echo "== 组合行检查（缺失时请用 --install 写入）..."
    if grep -q "dsh-client-ui-token-usage" "$PATCH_FILE" 2>/dev/null; then
      echo "== 组合行已存在: $PATCH_FILE"
    else
      echo "!! 组合行缺失: 请运行 ./sync.sh --install 自动写入，或手动在 $PATCH_FILE 添加:"
      echo "   - insert:"
      echo "       - id: token-usage"
      echo "         name: '@deepseek-ai/dsh-client-ui-token-usage'"
    fi
    echo ""
    echo "完成。修改 lib/*.js 后重启 dsh web 服务即可生效（无需重新安装）。"
    ;;
esac
