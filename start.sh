#!/bin/bash
# 家具生产管理系统启动脚本

set -e
cd "$(dirname "$0")"

echo "🏠 家具生产管理系统"
echo "===================="

# 检查并设置 Python 虚拟环境
VENV_DIR="backend/venv"

# 检查虚拟环境是否有效（解决移动目录或 Python 版本变化导致的损坏）
check_venv_valid() {
    [ -d "$VENV_DIR" ] && [ -f "$VENV_DIR/bin/python" ] && "$VENV_DIR/bin/python" --version &>/dev/null
}

if ! check_venv_valid; then
    echo "📦 创建 Python 虚拟环境..."
    rm -rf "$VENV_DIR"
    python3 -m venv "$VENV_DIR"
fi

# 激活虚拟环境
source "$VENV_DIR/bin/activate"

# 检查依赖是否已安装（检查所有关键依赖）
check_deps() {
    python -c "
from PyQt6.QtWebEngineWidgets import QWebEngineView
from flask import Flask
import pymysql
import bcrypt
import jwt
" 2>/dev/null
}

if ! check_deps; then
    echo "📥 安装 Python 依赖..."
    pip install --upgrade pip
    pip install -r backend/requirements.txt
    
    # 再次检查
    if ! check_deps; then
        echo "❌ 依赖安装失败，请检查错误信息"
        exit 1
    fi
fi
echo "✅ Python 依赖已就绪"

# 数据库连接检测函数
check_db() {
    local use_local=$1
    python -c "
import sys
sys.path.insert(0, 'backend')
import os
os.environ['USE_LOCAL_DB'] = '$use_local'
import importlib
from config import database
importlib.reload(database)
from config.database import DATABASE_CONFIG
import pymysql
try:
    conn = pymysql.connect(**DATABASE_CONFIG, connect_timeout=5)
    conn.close()
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null
}

# 检查数据库是否已初始化
check_db_initialized() {
    python -c "
import sys
sys.path.insert(0, 'backend')
import os
os.environ['USE_LOCAL_DB'] = '1'
import importlib
from config import database
importlib.reload(database)
from config.database import DATABASE_CONFIG
import pymysql
try:
    conn = pymysql.connect(**DATABASE_CONFIG, connect_timeout=5)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM sys_users')
    result = cursor.fetchone()
    conn.close()
    sys.exit(0 if result and result[0] > 0 else 1)
except:
    sys.exit(1)
" 2>/dev/null
}

# 初始化数据库表结构和数据
init_database() {
    echo "� 初始化数据库表结构和数据..."
    python -c "
import sys
import os
sys.path.insert(0, 'backend')
os.environ['USE_LOCAL_DB'] = '1'

# 重新加载配置
import importlib
from config import database
importlib.reload(database)

# 重新加载 connection 模块以使用新配置
from database import connection
importlib.reload(connection)

from database.init_db import run_init
run_init()
"
}

# 启动 Docker MySQL
start_docker_mysql() {
    local container_name="ruanjin-mysql"
    local need_init=false
    
    # 检查 Docker 是否安装
    if ! command -v docker &>/dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        echo "   https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查 Docker 是否运行
    if ! docker info &>/dev/null; then
        echo "❌ Docker 未运行，请先启动 Docker Desktop"
        exit 1
    fi
    
    # 检查容器是否已存在
    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        # 容器存在，检查是否运行中
        if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
            echo "🐳 启动已有的 MySQL 容器..."
            docker start "$container_name"
        else
            echo "🐳 MySQL 容器已在运行"
        fi
    else
        # 创建新容器
        echo "🐳 创建 MySQL Docker 容器..."
        docker run -d \
            --name "$container_name" \
            -p 3306:3306 \
            -e MYSQL_ROOT_PASSWORD=root123 \
            -e MYSQL_DATABASE=ruanjin \
            -e MYSQL_CHARACTER_SET_SERVER=utf8mb4 \
            -e MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci \
            -v ruanjin-mysql-data:/var/lib/mysql \
            mysql:8.0
        need_init=true
    fi
    
    # 等待 MySQL 就绪
    echo "⏳ 等待 MySQL 启动..."
    for i in {1..30}; do
        if docker exec "$container_name" mysqladmin ping -h localhost -u root -proot123 &>/dev/null; then
            echo "✅ MySQL 已就绪"
            
            # 新容器或数据库未初始化时，执行初始化
            if [ "$need_init" = true ]; then
                # 等待几秒让 MySQL 完全准备好
                sleep 3
                init_database
            elif ! check_db_initialized; then
                echo "🔍 检测到数据库未初始化..."
                init_database
            else
                echo "✅ 数据库已初始化"
            fi
            return 0
        fi
        sleep 1
    done
    
    echo "❌ MySQL 启动超时"
    return 1
}

echo "🔍 检查数据库连接..."

# 优先尝试远程数据库
export USE_LOCAL_DB=0
if check_db "0"; then
    echo "✅ 远程数据库连接成功"
else
    echo "⚠️  远程数据库连接失败，切换到本地 Docker MySQL..."
    
    # 启动 Docker MySQL（包含初始化逻辑）
    start_docker_mysql
    
    # 本地数据库已在 start_docker_mysql 中验证过，直接标记使用本地
    export USE_LOCAL_DB=1
    echo "✅ 本地数据库准备就绪"
fi

# 安装前端依赖并构建
echo "📦 安装前端依赖并构建..."
cd frontend-admin
npm install
npm run build
cd ..

# 启动桌面应用
echo "🚀 启动应用..."
python backend/main.py
