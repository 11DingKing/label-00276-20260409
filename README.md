# 家具生产管理系统

基于 PyQt6 + React + Ant Design 的家具生产管理桌面应用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | PyQt6 + QWebEngineView |
| 前端 | React 18 + Vite + Ant Design 5 |
| API | Flask + Flask-CORS |
| 数据库 | MySQL 8.0 (支持远程/本地Docker) |

## 快速启动

```bash
./start.sh
```

启动脚本会自动：
1. 创建 Python 虚拟环境并安装依赖
2. 检测数据库连接（优先远程，失败则启动本地 Docker MySQL）
3. 安装前端依赖并构建
4. 启动桌面应用

## 本地开发

```bash
# 后端 (需要先激活虚拟环境)
cd backend
source venv/bin/activate
USE_LOCAL_DB=1 python -c "from api.app import app; app.run(host='127.0.0.1', port=5000, debug=True)"

# 前端
cd frontend-admin
npm install
npm run dev
```

## 项目结构

```
├── start.sh                    # 启动脚本
├── backend/                    # 后端
│   ├── main.py                # 桌面应用入口 (PyQt6)
│   ├── api/app.py             # REST API (Flask)
│   ├── config/database.py     # 数据库配置
│   ├── database/              # 数据库连接和初始化
│   └── models/                # 数据模型
└── frontend-admin/            # 前端 (React)
    └── src/
        ├── layouts/           # 布局组件
        ├── pages/             # 页面组件
        └── utils/             # 工具函数和API
```

## 功能模块

- **用户管理**: 用户增删改查、权限分级
- **部门管理**: 13个部门独立界面（木工部、五金部、油漆部等）
- **生产管理**: 生产订单、流程跟踪、状态管理
- **原材料管理**: 物料信息、库存管理
- **成品管理**: 产品信息、库存预警
- **库存管理**: 库存统计、预警提醒
- **数据统计**: 生产报表、部门绩效
- **系统设置**: 系统配置管理

## 默认账户

- 用户名: `admin`
- 密码: `admin123`

## 环境要求

- Python 3.10+
- Node.js 18+
- Docker (可选，用于本地数据库)
