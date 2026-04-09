# 后端服务

Flask API 后端 + PyQt6 桌面应用。

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动

```bash
python main.py
```

## 目录结构

```
├── main.py          # 桌面应用入口
├── api/             # REST API 接口
├── config/          # 数据库配置
├── database/        # 数据库连接/迁移/初始化
├── models/          # 数据模型
└── utils/           # 工具函数
```

## API 端口

- API 服务: http://127.0.0.1:5000
- 前端服务: http://127.0.0.1:3002
