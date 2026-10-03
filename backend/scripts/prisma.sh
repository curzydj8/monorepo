#!/bin/sh
# prisma 命令包装器：在预下载引擎存在时使用它们，绕过 prisma 内置下载器。
#
# 背景：某些受限网络环境（如本沙盒的 egress 代理）下，
# prisma CLI 内置的引擎下载会无限 hang 住。引擎已预先用 curl 下载到
# $HOME/.cache/prisma-engines/。本脚本仅在该目录存在可用二进制时
# 设置覆盖变量，否则完全走默认行为（普通网络不受影响）。
set -e

ENGINE_DIR="$HOME/.cache/prisma-engines"
if [ -x "$ENGINE_DIR/schema-engine" ]; then
  export PRISMA_SCHEMA_ENGINE_BINARY="$ENGINE_DIR/schema-engine"
  export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
fi
if [ -f "$ENGINE_DIR/libquery_engine.so.node" ]; then
  export PRISMA_QUERY_ENGINE_LIBRARY="$ENGINE_DIR/libquery_engine.so.node"
fi

npx --no-install prisma "$@"
status=$?

# generate 之后：确保 query engine 以带 binaryTarget 的文件名落在
# 生成的 client 目录（node_modules/.prisma/client/），否则运行时
# PrismaClient 会报 "could not locate the Query Engine"。
if [ "$1" = "generate" ] && [ -f "$ENGINE_DIR/libquery_engine.so.node" ]; then
  CLIENT_DIR="$PWD/../node_modules/.prisma/client"
  if [ -d "$CLIENT_DIR" ]; then
    TARGET=$(npx --no-install prisma --version 2>/dev/null | grep "Computed binaryTarget" | awk '{print $3}')
    if [ -n "$TARGET" ] && [ ! -f "$CLIENT_DIR/libquery_engine-$TARGET.so.node" ]; then
      cp "$ENGINE_DIR/libquery_engine.so.node" "$CLIENT_DIR/libquery_engine-$TARGET.so.node"
    fi
  fi
fi

exit $status
