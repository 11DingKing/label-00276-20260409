# -*- coding: utf-8 -*-
"""
数据库迁移脚本
Database Migration Script
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import db


def check_column_exists(table_name, column_name):
    """检查列是否存在"""
    sql = """
    SELECT COUNT(*) as cnt 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = %s 
    AND column_name = %s
    """
    result = db.execute_one(sql, (table_name, column_name))
    return result and result.get('cnt', 0) > 0


def add_column_if_not_exists(table_name, column_name, column_definition):
    """如果列不存在则添加"""
    if not check_column_exists(table_name, column_name):
        try:
            sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
            db.execute_update(sql)
            print(f"✓ 已添加列 {table_name}.{column_name}")
            return True
        except Exception as e:
            print(f"✗ 添加列失败 {table_name}.{column_name}: {e}")
            return False
    else:
        print(f"- 列已存在 {table_name}.{column_name}")
        return True


def run_migrations():
    """运行所有迁移"""
    print("=" * 50)
    print("开始数据库迁移...")
    print("=" * 50)
    
    try:
        if not db.test_connection():
            print("✗ 数据库连接失败")
            return False
        
        print("✓ 数据库连接成功\n")
        
        # 迁移1: materials 表添加 category_id 字段
        add_column_if_not_exists('materials', 'category_id', 'INT DEFAULT NULL')
        
        # 迁移2: materials 表添加 is_active 字段
        add_column_if_not_exists('materials', 'is_active', 'TINYINT(1) DEFAULT 1')
        
        # 迁移3: products 表添加 is_active 字段
        add_column_if_not_exists('products', 'is_active', 'TINYINT(1) DEFAULT 1')
        
        # 迁移4: material_categories 表添加 is_active 字段
        add_column_if_not_exists('material_categories', 'is_active', 'TINYINT(1) DEFAULT 1')
        
        print("\n" + "=" * 50)
        print("数据库迁移完成!")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"迁移失败: {e}")
        return False


if __name__ == "__main__":
    run_migrations()
