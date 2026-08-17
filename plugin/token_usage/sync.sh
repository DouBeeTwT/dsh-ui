#!/usr/bin/env bash
# 模型用量统计插件：源码 → 安装（同步）→ 验证
#
# 用法:
#   ./sync.sh            # 同步源码到安装位置（软链已指向源码目录，通常无需操作）
#   ./sync.sh --verify   # 校验包解析 + host 插件可加载
#   ./sync.sh --dump     # 查看组合配置里 token-usage 行
#
# 说明:
#   - 插件源码位于本目录 (plugin/token_usage)。
#   - 已通过软链接安装到部署的扁平回退目录:
#       ~/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage
#     （与内置插件同样的解析机制，Node 会跟随软链读取本目录源码）
#   - 组合行位于:
#       ~/.dsh/profiles/web/cordis.patch.yml  (id: token-usage)
#   - 因此修改本目录 lib/*.js 后无需重新安装；重启 dsh web 服务即加载新代码。
#   - 若需要“重新打包/更新”，直接修改源码即可，软链自动同步。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG_NAME="@deepseek-ai/dsh-client-ui-token-usage"
FALLBACK_LINK="$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-token-usage"
PATCH_FILE="$HOME/.dsh/profiles/web/cordis.patch.yml"

echo "== 插件源码: $ROOT"

# 1. 确保安装软链指向源码目录
if [ -L "$FALLBACK_LINK" ] && [ "$(readlink "$FALLBACK_LINK")" = "$ROOT" ]; then
  echo "== 安装软链已就位: $FALLBACK_LINK -> $ROOT"
else
  echo "== 安装软链缺失，重新创建..."
  mkdir -p "$(dirname "$FALLBACK_LINK")"
  ln -sfn "$ROOT" "$FALLBACK_LINK"
  echo "   created $FALLBACK_LINK -> $ROOT"
fi

# 2. 组合行检查（仅在 --fix 时写入；默认只提示）
if grep -q "dsh-client-ui-token-usage" "$PATCH_FILE" 2>/dev/null; then
  echo "== 组合行已存在: $PATCH_FILE"
else
  echo "!! 组合行缺失: 请手动在 $PATCH_FILE 添加:"
  echo "   - insert:"
  echo "       - id: token-usage"
  echo "         name: '@deepseek-ai/dsh-client-ui-token-usage'"
fi

case "${1:-}" in
  --verify)
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
    ;;
  --dump)
    echo "== 组合配置中的 token-usage 行:"
    grep -n -A2 -B1 "token-usage" "$PATCH_FILE"
    ;;
  *)
    echo ""
    echo "完成。修改 lib/*.js 后重启 dsh web 服务即可生效（无需重新安装）。"
    ;;
esac
