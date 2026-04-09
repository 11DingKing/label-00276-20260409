# -*- coding: utf-8 -*-
"""
数据库初始化脚本
Database Initialization Script
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import db
import hashlib


def hash_password(password):
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()


def init_tables():
    """初始化数据库表"""
    
    # 创建用户表
    create_users_table = """
    CREATE TABLE IF NOT EXISTS sys_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        department_id INT,
        permission_level INT DEFAULT 4,
        is_active TINYINT(1) DEFAULT 1,
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_department (department_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建部门表
    create_departments_table = """
    CREATE TABLE IF NOT EXISTS sys_departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        manager_id INT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建原材料分类表
    create_material_categories_table = """
    CREATE TABLE IF NOT EXISTS material_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        parent_id INT DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建原材料表
    create_materials_table = """
    CREATE TABLE IF NOT EXISTS materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_name VARCHAR(100) NOT NULL,
        material_code VARCHAR(50) NOT NULL UNIQUE,
        material_type VARCHAR(50),
        category_id INT,
        specification TEXT,
        unit VARCHAR(20) DEFAULT '个',
        current_stock DECIMAL(15,2) DEFAULT 0,
        safety_stock DECIMAL(15,2) DEFAULT 0,
        cost DECIMAL(15,2) DEFAULT 0,
        supplier VARCHAR(100),
        location VARCHAR(100),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (material_code),
        INDEX idx_category (category_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建产品表
    create_products_table = """
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        product_code VARCHAR(50) NOT NULL UNIQUE,
        product_type VARCHAR(50),
        specification TEXT,
        unit VARCHAR(20) DEFAULT '件',
        standard_cost DECIMAL(15,2) DEFAULT 0,
        stock_quantity DECIMAL(15,2) DEFAULT 0,
        min_stock DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        image_path VARCHAR(255),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (product_code),
        INDEX idx_type (product_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建生产订单表
    create_production_orders_table = """
    CREATE TABLE IF NOT EXISTS production_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(50) NOT NULL UNIQUE,
        product_id INT NOT NULL,
        quantity DECIMAL(15,2) NOT NULL,
        planned_start_date DATE,
        planned_end_date DATE,
        actual_start_date DATE,
        actual_end_date DATE,
        status VARCHAR(20) DEFAULT 'PENDING',
        priority INT DEFAULT 3,
        customer_name VARCHAR(100),
        customer_order_no VARCHAR(50),
        remarks TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_no (order_no),
        INDEX idx_status (status),
        INDEX idx_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建生产流程记录表
    create_production_process_table = """
    CREATE TABLE IF NOT EXISTS production_process (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        department_id INT NOT NULL,
        process_name VARCHAR(50) NOT NULL,
        sequence_no INT DEFAULT 1,
        start_time DATETIME,
        end_time DATETIME,
        status VARCHAR(20) DEFAULT 'PENDING',
        operator_id INT,
        quality_check_result VARCHAR(20),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order (order_id),
        INDEX idx_department (department_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建采购订单表
    create_purchase_orders_table = """
    CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(50) NOT NULL UNIQUE,
        supplier VARCHAR(100) NOT NULL,
        total_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'PENDING',
        order_date DATE,
        expected_date DATE,
        actual_date DATE,
        payment_status VARCHAR(20) DEFAULT 'UNPAID',
        remarks TEXT,
        created_by INT,
        approved_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_no (order_no),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建采购订单明细表
    create_purchase_items_table = """
    CREATE TABLE IF NOT EXISTS purchase_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        material_id INT NOT NULL,
        quantity DECIMAL(15,2) NOT NULL,
        unit_price DECIMAL(15,2) DEFAULT 0,
        total_price DECIMAL(15,2) DEFAULT 0,
        received_quantity DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order (order_id),
        INDEX idx_material (material_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建库存变动记录表
    create_inventory_records_table = """
    CREATE TABLE IF NOT EXISTS inventory_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_type VARCHAR(20) NOT NULL,
        item_id INT NOT NULL,
        change_type VARCHAR(20) NOT NULL,
        change_quantity DECIMAL(15,2) NOT NULL,
        before_quantity DECIMAL(15,2) DEFAULT 0,
        after_quantity DECIMAL(15,2) DEFAULT 0,
        related_order_no VARCHAR(50),
        operator_id INT,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item (item_type, item_id),
        INDEX idx_change_type (change_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建系统日志表
    create_system_logs_table = """
    CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        module VARCHAR(50),
        description TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # 创建系统设置表
    create_system_settings_table = """
    CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(50) NOT NULL UNIQUE,
        setting_value TEXT,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    tables = [
        ('sys_users', create_users_table),
        ('sys_departments', create_departments_table),
        ('material_categories', create_material_categories_table),
        ('materials', create_materials_table),
        ('products', create_products_table),
        ('production_orders', create_production_orders_table),
        ('production_process', create_production_process_table),
        ('purchase_orders', create_purchase_orders_table),
        ('purchase_items', create_purchase_items_table),
        ('inventory_records', create_inventory_records_table),
        ('system_logs', create_system_logs_table),
        ('system_settings', create_system_settings_table)
    ]
    
    for table_name, create_sql in tables:
        try:
            db.execute_update(create_sql)
            print(f"✓ 表 {table_name} 创建成功")
        except Exception as e:
            print(f"✗ 表 {table_name} 创建失败: {e}")


def init_departments():
    """初始化部门数据"""
    departments = [
        ('木工部', 'WOODWORK', '负责木材加工和家具组装'),
        ('五金部', 'HARDWARE', '负责五金配件的安装和管理'),
        ('油漆部', 'PAINTING', '负责家具的油漆和涂装工作'),
        ('工艺部', 'CRAFT', '负责工艺设计和质量控制'),
        ('包装部', 'PACKAGING', '负责成品的包装和防护'),
        ('客服部', 'CUSTOMER_SERVICE', '负责客户服务和售后支持'),
        ('业务部', 'BUSINESS', '负责业务拓展和客户关系'),
        ('原材料仓库', 'RAW_WAREHOUSE', '负责原材料的存储和管理'),
        ('成品仓库', 'PRODUCT_WAREHOUSE', '负责成品的存储和发货'),
        ('工程部', 'ENGINEERING', '负责设备维护和工程管理'),
        ('审计部', 'AUDIT', '负责内部审计和风险控制'),
        ('采购部', 'PURCHASING', '负责原材料和设备的采购'),
        ('财务部', 'FINANCE', '负责财务管理和成本核算')
    ]
    
    insert_sql = """
    INSERT IGNORE INTO sys_departments (name, code, description) 
    VALUES (%s, %s, %s)
    """
    
    for dept in departments:
        try:
            db.execute_insert(insert_sql, dept)
        except Exception as e:
            print(f"部门 {dept[0]} 初始化跳过: {e}")
    
    print("✓ 部门数据初始化完成")


def init_admin_user():
    """初始化管理员账户"""
    check_sql = "SELECT id FROM sys_users WHERE username = 'admin'"
    result = db.execute_one(check_sql)
    
    if not result:
        insert_sql = """
        INSERT INTO sys_users (username, password, real_name, permission_level, is_active) 
        VALUES (%s, %s, %s, %s, %s)
        """
        password_hash = hash_password('admin123')
        db.execute_insert(insert_sql, ('admin', password_hash, '系统管理员', 1, 1))
        print("✓ 管理员账户创建成功 (用户名: admin, 密码: admin123)")
    else:
        print("✓ 管理员账户已存在")


def init_material_categories():
    """初始化原材料分类"""
    categories = [
        ('木材', 0, '各类木材原料'),
        ('板材', 0, '各类板材'),
        ('五金配件', 0, '螺丝、铰链等五金件'),
        ('油漆涂料', 0, '各类油漆和涂料'),
        ('包装材料', 0, '纸箱、泡沫等包装材料'),
        ('辅助材料', 0, '胶水、砂纸等辅材')
    ]
    
    insert_sql = """
    INSERT IGNORE INTO material_categories (name, parent_id, description) 
    VALUES (%s, %s, %s)
    """
    
    for cat in categories:
        try:
            db.execute_insert(insert_sql, cat)
        except Exception as e:
            pass
    
    print("✓ 原材料分类初始化完成")


def init_sample_data():
    """初始化示例数据"""
    # 初始化一些示例原材料
    materials = [
        ('橡木板材', 'M001', 1, '张', '2440*1220*18mm', 100, 20, 350, '供应商A', 'A-01'),
        ('松木板材', 'M002', 1, '张', '2440*1220*15mm', 80, 15, 220, '供应商B', 'A-02'),
        ('三聚氰胺板', 'M003', 2, '张', '2440*1220*18mm', 150, 30, 180, '供应商A', 'B-01'),
        ('铰链', 'M004', 3, '个', '不锈钢缓冲', 500, 100, 8.5, '供应商C', 'C-01'),
        ('拉手', 'M005', 3, '个', '铝合金128mm', 300, 50, 12, '供应商C', 'C-02'),
        ('木蜡油', 'M006', 4, '桶', '5L/桶', 50, 10, 280, '供应商D', 'D-01'),
        ('纸箱', 'M007', 5, '个', '60*40*40cm', 200, 50, 15, '供应商E', 'E-01')
    ]
    
    insert_material_sql = """
    INSERT IGNORE INTO materials (material_name, material_code, category_id, unit, specification, 
                                  current_stock, safety_stock, cost, supplier, location) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    for mat in materials:
        try:
            db.execute_insert(insert_material_sql, mat)
        except Exception as e:
            pass
    
    print("✓ 示例原材料数据初始化完成")
    
    # 初始化一些示例产品
    products = [
        ('实木餐桌', 'P001', '餐厅家具', '1500*900*750mm', '张', 2500, 10, 5, '六人实木餐桌'),
        ('实木餐椅', 'P002', '餐厅家具', '450*450*900mm', '把', 650, 50, 10, '配套餐椅'),
        ('实木衣柜', 'P003', '卧室家具', '2000*600*2200mm', '个', 4800, 5, 2, '三门实木衣柜'),
        ('实木床', 'P004', '卧室家具', '2000*1800*1200mm', '张', 3500, 8, 3, '1.8米实木双人床'),
        ('电视柜', 'P005', '客厅家具', '1800*400*500mm', '个', 1800, 10, 5, '简约电视柜'),
        ('书桌', 'P006', '书房家具', '1200*600*750mm', '张', 1200, 15, 8, '学生书桌'),
        ('书柜', 'P007', '书房家具', '800*300*1800mm', '个', 1500, 10, 5, '五层书柜')
    ]
    
    insert_product_sql = """
    INSERT IGNORE INTO products (product_name, product_code, product_type, specification, unit, 
                                 standard_cost, stock_quantity, min_stock, description) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    for prod in products:
        try:
            db.execute_insert(insert_product_sql, prod)
        except Exception as e:
            pass
    
    print("✓ 示例产品数据初始化完成")
    
    # 初始化示例生产订单
    init_production_orders()


def init_production_orders():
    """初始化示例生产订单"""
    from datetime import datetime, timedelta
    
    # 检查是否已有订单
    check_sql = "SELECT COUNT(*) as cnt FROM production_orders"
    result = db.execute_one(check_sql)
    if result and result['cnt'] > 0:
        print("✓ 生产订单数据已存在")
        return
    
    # 获取产品ID
    products = db.execute_query("SELECT id, product_name as name FROM products LIMIT 5")
    if not products:
        print("- 暂无产品数据，跳过生产订单初始化")
        return
    
    # 获取部门ID
    departments = db.execute_query("SELECT id, code FROM sys_departments")
    dept_map = {d['code']: d['id'] for d in departments}
    
    today = datetime.now()
    
    orders = [
        ('PO20260115001', products[0]['id'], 10, 'IN_PROGRESS', '张三客户', 'C001'),
        ('PO20260115002', products[1]['id'], 20, 'PENDING', '李四客户', 'C002'),
        ('PO20260116001', products[2]['id'], 5, 'IN_PROGRESS', '王五客户', 'C003'),
        ('PO20260116002', products[0]['id'], 8, 'COMPLETED', '赵六客户', 'C004'),
        ('PO20260117001', products[3]['id'] if len(products) > 3 else products[0]['id'], 15, 'PENDING', '钱七客户', 'C005'),
    ]
    
    insert_order_sql = """
    INSERT IGNORE INTO production_orders 
    (order_no, product_id, quantity, status, customer_name, customer_order_no, 
     planned_start_date, planned_end_date, created_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1)
    """
    
    # 生产流程定义
    process_defs = [
        ('WOODWORK', '木工加工', 1),
        ('HARDWARE', '五金安装', 2),
        ('PAINTING', '油漆涂装', 3),
        ('CRAFT', '工艺检验', 4),
        ('PACKAGING', '包装入库', 5),
    ]
    
    for i, (order_no, product_id, qty, status, customer, cust_no) in enumerate(orders):
        start_date = today - timedelta(days=5-i)
        end_date = start_date + timedelta(days=7)
        
        try:
            order_id = db.execute_insert(insert_order_sql, (
                order_no, product_id, qty, status, customer, cust_no,
                start_date.date(), end_date.date()
            ))
            
            # 为每个订单创建生产流程
            for dept_code, process_name, seq in process_defs:
                dept_id = dept_map.get(dept_code)
                if dept_id:
                    proc_status = 'PENDING'
                    if status == 'COMPLETED':
                        proc_status = 'COMPLETED'
                    elif status == 'IN_PROGRESS' and seq <= 2:
                        proc_status = 'IN_PROGRESS' if seq == 2 else 'COMPLETED'
                    
                    proc_sql = """
                    INSERT IGNORE INTO production_process 
                    (order_id, department_id, process_name, sequence_no, status)
                    VALUES (%s, %s, %s, %s, %s)
                    """
                    db.execute_insert(proc_sql, (order_id, dept_id, process_name, seq, proc_status))
        except Exception as e:
            print(f"  订单 {order_no} 初始化跳过: {e}")
    
    print("✓ 示例生产订单数据初始化完成")


def run_init():
    """运行数据库初始化"""
    print("=" * 50)
    print("开始初始化数据库...")
    print("=" * 50)
    
    try:
        if db.test_connection():
            print("✓ 数据库连接成功")
        else:
            print("✗ 数据库连接失败")
            return False
        
        init_tables()
        init_departments()
        init_admin_user()
        init_material_categories()
        init_sample_data()
        
        print("=" * 50)
        print("数据库初始化完成!")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"初始化失败: {e}")
        return False


if __name__ == "__main__":
    run_init()
