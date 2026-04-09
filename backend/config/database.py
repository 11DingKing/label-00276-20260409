# -*- coding: utf-8 -*-
"""
数据库配置文件
Database Configuration
"""
import os

# 远程数据库配置
REMOTE_DATABASE_CONFIG = {
    'host': 'rm-wz9s418scx6nrepq9xo.mysql.rds.aliyuncs.com',
    'port': 3306,
    'user': 'rh_ruanjian',
    'password': 'linghao520BB',
    'database': 'ruanjin',
    'charset': 'utf8mb4'
}

# 本地数据库配置 (Docker MySQL)
LOCAL_DATABASE_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'root123',
    'database': 'ruanjin',
    'charset': 'utf8mb4'
}

# 通过环境变量选择数据库，默认远程
USE_LOCAL_DB = os.environ.get('USE_LOCAL_DB', '0') == '1'
DATABASE_CONFIG = LOCAL_DATABASE_CONFIG if USE_LOCAL_DB else REMOTE_DATABASE_CONFIG

# 应用配置
APP_CONFIG = {
    'name': '家具生产管理系统',
    'version': '1.0.0',
    'company': '家具生产企业',
    'window_width': 1400,
    'window_height': 900
}

# 部门列表
DEPARTMENTS = [
    {'id': 1, 'name': '木工部', 'code': 'WOODWORK'},
    {'id': 2, 'name': '五金部', 'code': 'HARDWARE'},
    {'id': 3, 'name': '油漆部', 'code': 'PAINTING'},
    {'id': 4, 'name': '工艺部', 'code': 'CRAFT'},
    {'id': 5, 'name': '包装部', 'code': 'PACKAGING'},
    {'id': 6, 'name': '客服部', 'code': 'CUSTOMER_SERVICE'},
    {'id': 7, 'name': '业务部', 'code': 'BUSINESS'},
    {'id': 8, 'name': '原材料仓库', 'code': 'RAW_WAREHOUSE'},
    {'id': 9, 'name': '成品仓库', 'code': 'PRODUCT_WAREHOUSE'},
    {'id': 10, 'name': '工程部', 'code': 'ENGINEERING'},
    {'id': 11, 'name': '审计部', 'code': 'AUDIT'},
    {'id': 12, 'name': '采购部', 'code': 'PURCHASING'},
    {'id': 13, 'name': '财务部', 'code': 'FINANCE'}
]

# 用户权限等级
PERMISSION_LEVELS = {
    'SUPER_ADMIN': 1,    # 超级管理员
    'ADMIN': 2,          # 管理员
    'MANAGER': 3,        # 部门经理
    'EMPLOYEE': 4        # 普通员工
}

# 生产流程状态
PRODUCTION_STATUS = {
    'PENDING': '待处理',
    'IN_PROGRESS': '生产中',
    'QUALITY_CHECK': '质检中',
    'COMPLETED': '已完成',
    'REJECTED': '已退回'
}
