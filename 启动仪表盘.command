#!/bin/bash
# 量化交易仪表盘 — 一键启动前端 + 后端
# 双击此文件即可启动，Ctrl+C 停止

# 自动定位到脚本所在目录（即项目根目录）
PROJECT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT" || exit 1

echo "========================================="
echo "  A-Share Quant & Oracle Dashboard"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8000"
echo "  按 Ctrl+C 停止所有服务"
echo "========================================="
echo ""

# 启动后端
cd "$PROJECT/backend" && uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# 启动前端
cd "$PROJECT" && npx next dev &
FRONTEND_PID=$!

# 等 2 秒后自动打开浏览器
sleep 2 && open "http://localhost:3000" &

# Ctrl+C 时同时杀掉前后端
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
