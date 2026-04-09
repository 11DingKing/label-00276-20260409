# -*- coding: utf-8 -*-
"""
原材料模型
Material Model
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db


class MaterialModel:
    """原材料数据模型"""
    
    @staticmethod
    def get_all_materials(active_only=True):
        """获取所有原材料"""
        # 首先尝试带 category_id 的查询
        try:
            sql = """
            SELECT m.*, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            """
            if active_only:
                sql += " WHERE m.is_active = 1"
            sql += " ORDER BY m.id DESC"
            return db.execute_query(sql)
        except Exception as e:
            error_msg = str(e).lower()
            # 如果 category_id 不存在，使用简单查询
            if 'category_id' in error_msg or 'unknown column' in error_msg:
                try:
                    sql = "SELECT *, NULL as category_name FROM materials"
                    if active_only:
                        sql += " WHERE is_active = 1"
                    sql += " ORDER BY id DESC"
                    return db.execute_query(sql)
                except:
                    # 如果 is_active 也不存在
                    sql = "SELECT *, NULL as category_name FROM materials ORDER BY id DESC"
                    return db.execute_query(sql)
            # 如果是 is_active 字段不存在的错误
            if 'is_active' in error_msg:
                try:
                    sql = """
                    SELECT m.*, c.name as category_name
                    FROM materials m
                    LEFT JOIN material_categories c ON m.category_id = c.id
                    ORDER BY m.id DESC
                    """
                    return db.execute_query(sql)
                except:
                    sql = "SELECT *, NULL as category_name FROM materials ORDER BY id DESC"
                    return db.execute_query(sql)
            raise e
    
    @staticmethod
    def get_material_by_id(material_id):
        """根据ID获取原材料"""
        try:
            sql = """
            SELECT m.*, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            WHERE m.id = %s
            """
            return db.execute_one(sql, (material_id,))
        except Exception as e:
            if 'category_id' in str(e).lower() or 'unknown column' in str(e).lower():
                sql = "SELECT *, NULL as category_name FROM materials WHERE id = %s"
                return db.execute_one(sql, (material_id,))
            raise e
    
    @staticmethod
    def get_material_by_code(code):
        """根据编码获取原材料"""
        try:
            sql = """
            SELECT m.*, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            WHERE m.code = %s
            """
            return db.execute_one(sql, (code,))
        except Exception as e:
            if 'category_id' in str(e).lower() or 'unknown column' in str(e).lower():
                sql = "SELECT *, NULL as category_name FROM materials WHERE code = %s"
                return db.execute_one(sql, (code,))
            raise e
    
    @staticmethod
    def create_material(data):
        """创建原材料"""
        sql = """
        INSERT INTO materials (name, code, category_id, unit, specification, 
                              stock_quantity, min_stock, unit_price, supplier, location)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data['name'],
            data['code'],
            data.get('category_id'),
            data.get('unit', '个'),
            data.get('specification', ''),
            data.get('stock_quantity', 0),
            data.get('min_stock', 0),
            data.get('unit_price', 0),
            data.get('supplier', ''),
            data.get('location', '')
        )
        return db.execute_insert(sql, params)
    
    @staticmethod
    def update_material(material_id, data):
        """更新原材料"""
        fields = []
        params = []
        
        update_fields = ['name', 'category_id', 'unit', 'specification', 
                        'stock_quantity', 'min_stock', 'unit_price', 'supplier', 'location', 'is_active']
        
        for field in update_fields:
            if field in data:
                fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not fields:
            return 0
        
        params.append(material_id)
        sql = f"UPDATE materials SET {', '.join(fields)} WHERE id = %s"
        
        try:
            return db.execute_update(sql, params)
        except Exception as e:
            # 如果是 is_active 字段不存在的错误，则移除该字段重试
            if 'is_active' in str(e) and 'is_active' in data:
                del data['is_active']
                return MaterialModel.update_material(material_id, data)
            raise e
    
    @staticmethod
    def update_stock(material_id, quantity, change_type, operator_id=None, remarks=''):
        """更新库存"""
        # 获取当前库存
        material = MaterialModel.get_material_by_id(material_id)
        if not material:
            return False
        
        before_qty = float(material['stock_quantity'])
        
        if change_type == 'IN':
            after_qty = before_qty + quantity
        elif change_type == 'OUT':
            if before_qty < quantity:
                return False  # 库存不足
            after_qty = before_qty - quantity
        else:
            after_qty = quantity  # 直接设置
        
        # 更新库存
        update_sql = "UPDATE materials SET stock_quantity = %s WHERE id = %s"
        db.execute_update(update_sql, (after_qty, material_id))
        
        # 记录库存变动
        record_sql = """
        INSERT INTO inventory_records (item_type, item_id, change_type, change_quantity, 
                                       before_quantity, after_quantity, operator_id, remarks)
        VALUES ('MATERIAL', %s, %s, %s, %s, %s, %s, %s)
        """
        db.execute_insert(record_sql, (
            material_id, change_type, quantity, before_qty, after_qty, operator_id, remarks
        ))
        
        return True
    
    @staticmethod
    def get_low_stock_materials():
        """获取库存不足的原材料"""
        try:
            sql = """
            SELECT m.*, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            WHERE m.stock_quantity <= m.min_stock AND m.is_active = 1
            ORDER BY (m.stock_quantity / NULLIF(m.min_stock, 0)) ASC
            """
            return db.execute_query(sql)
        except Exception as e:
            error_msg = str(e).lower()
            # 如果 category_id 不存在
            if 'category_id' in error_msg or 'unknown column' in error_msg:
                try:
                    sql = """
                    SELECT *, NULL as category_name FROM materials
                    WHERE stock_quantity <= min_stock AND is_active = 1
                    ORDER BY (stock_quantity / NULLIF(min_stock, 0)) ASC
                    """
                    return db.execute_query(sql)
                except:
                    sql = """
                    SELECT *, NULL as category_name FROM materials
                    WHERE stock_quantity <= min_stock
                    ORDER BY (stock_quantity / NULLIF(min_stock, 0)) ASC
                    """
                    return db.execute_query(sql)
            # 如果是 is_active 字段不存在的错误
            if 'is_active' in error_msg:
                try:
                    sql = """
                    SELECT m.*, c.name as category_name
                    FROM materials m
                    LEFT JOIN material_categories c ON m.category_id = c.id
                    WHERE m.stock_quantity <= m.min_stock
                    ORDER BY (m.stock_quantity / NULLIF(m.min_stock, 0)) ASC
                    """
                    return db.execute_query(sql)
                except:
                    sql = """
                    SELECT *, NULL as category_name FROM materials
                    WHERE stock_quantity <= min_stock
                    ORDER BY (stock_quantity / NULLIF(min_stock, 0)) ASC
                    """
                    return db.execute_query(sql)
            raise e
    
    @staticmethod
    def search_materials(keyword):
        """搜索原材料"""
        like_keyword = f"%{keyword}%"
        try:
            sql = """
            SELECT m.*, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            WHERE (m.name LIKE %s OR m.code LIKE %s OR m.specification LIKE %s)
            AND m.is_active = 1
            ORDER BY m.id DESC
            """
            return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
        except Exception as e:
            error_msg = str(e).lower()
            # 如果 category_id 不存在
            if 'category_id' in error_msg or 'unknown column' in error_msg:
                try:
                    sql = """
                    SELECT *, NULL as category_name FROM materials
                    WHERE (name LIKE %s OR code LIKE %s OR specification LIKE %s)
                    AND is_active = 1
                    ORDER BY id DESC
                    """
                    return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
                except:
                    sql = """
                    SELECT *, NULL as category_name FROM materials
                    WHERE (name LIKE %s OR code LIKE %s OR specification LIKE %s)
                    ORDER BY id DESC
                    """
                    return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
            # 如果是 is_active 字段不存在的错误
            if 'is_active' in error_msg:
                try:
                    sql = """
                    SELECT m.*, c.name as category_name
                    FROM materials m
                    LEFT JOIN material_categories c ON m.category_id = c.id
                    WHERE (m.name LIKE %s OR m.code LIKE %s OR m.specification LIKE %s)
                    ORDER BY m.id DESC
                    """
                    return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
                except:
                    sql = """
                    SELECT *, NULL as category_name FROM materials
                    WHERE (name LIKE %s OR code LIKE %s OR specification LIKE %s)
                    ORDER BY id DESC
                    """
                    return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
            raise e
    
    @staticmethod
    def get_all_categories():
        """获取所有原材料分类"""
        sql = "SELECT * FROM material_categories ORDER BY id"
        return db.execute_query(sql)
    
    @staticmethod
    def get_stock_records(material_id=None, limit=100):
        """获取库存变动记录"""
        sql = """
        SELECT ir.*, m.name as material_name, m.code as material_code, 
               u.real_name as operator_name
        FROM inventory_records ir
        LEFT JOIN materials m ON ir.item_id = m.id AND ir.item_type = 'MATERIAL'
        LEFT JOIN sys_users u ON ir.operator_id = u.id
        WHERE ir.item_type = 'MATERIAL'
        """
        params = []
        
        if material_id:
            sql += " AND ir.item_id = %s"
            params.append(material_id)
        
        sql += " ORDER BY ir.created_at DESC LIMIT %s"
        params.append(limit)
        
        return db.execute_query(sql, params)
