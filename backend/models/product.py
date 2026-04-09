# -*- coding: utf-8 -*-
"""
产品模型
Product Model
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db


class ProductModel:
    """产品数据模型"""
    
    @staticmethod
    def get_all_products(active_only=True):
        """获取所有产品"""
        try:
            sql = "SELECT * FROM products"
            if active_only:
                sql += " WHERE is_active = 1"
            sql += " ORDER BY id DESC"
            return db.execute_query(sql)
        except Exception as e:
            if 'is_active' in str(e):
                sql = "SELECT * FROM products ORDER BY id DESC"
                return db.execute_query(sql)
            raise e
    
    @staticmethod
    def get_product_by_id(product_id):
        """根据ID获取产品"""
        sql = "SELECT * FROM products WHERE id = %s"
        return db.execute_one(sql, (product_id,))
    
    @staticmethod
    def get_product_by_code(code):
        """根据编码获取产品"""
        sql = "SELECT * FROM products WHERE code = %s"
        return db.execute_one(sql, (code,))
    
    @staticmethod
    def create_product(data):
        """创建产品"""
        sql = """
        INSERT INTO products (name, code, category, specification, unit, 
                             unit_price, stock_quantity, min_stock, description, image_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data['name'],
            data['code'],
            data.get('category', ''),
            data.get('specification', ''),
            data.get('unit', '件'),
            data.get('unit_price', 0),
            data.get('stock_quantity', 0),
            data.get('min_stock', 0),
            data.get('description', ''),
            data.get('image_path', '')
        )
        return db.execute_insert(sql, params)
    
    @staticmethod
    def update_product(product_id, data):
        """更新产品"""
        fields = []
        params = []
        
        update_fields = ['name', 'category', 'specification', 'unit', 
                        'unit_price', 'stock_quantity', 'min_stock', 'description', 
                        'image_path', 'is_active']
        
        for field in update_fields:
            if field in data:
                fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not fields:
            return 0
        
        params.append(product_id)
        sql = f"UPDATE products SET {', '.join(fields)} WHERE id = %s"
        
        try:
            return db.execute_update(sql, params)
        except Exception as e:
            if 'is_active' in str(e) and 'is_active' in data:
                del data['is_active']
                return ProductModel.update_product(product_id, data)
            raise e
    
    @staticmethod
    def update_stock(product_id, quantity, change_type, operator_id=None, remarks=''):
        """更新库存"""
        product = ProductModel.get_product_by_id(product_id)
        if not product:
            return False
        
        before_qty = float(product['stock_quantity'])
        
        if change_type == 'IN':
            after_qty = before_qty + quantity
        elif change_type == 'OUT':
            if before_qty < quantity:
                return False
            after_qty = before_qty - quantity
        else:
            after_qty = quantity
        
        update_sql = "UPDATE products SET stock_quantity = %s WHERE id = %s"
        db.execute_update(update_sql, (after_qty, product_id))
        
        record_sql = """
        INSERT INTO inventory_records (item_type, item_id, change_type, change_quantity, 
                                       before_quantity, after_quantity, operator_id, remarks)
        VALUES ('PRODUCT', %s, %s, %s, %s, %s, %s, %s)
        """
        db.execute_insert(record_sql, (
            product_id, change_type, quantity, before_qty, after_qty, operator_id, remarks
        ))
        
        return True
    
    @staticmethod
    def get_low_stock_products():
        """获取库存不足的产品"""
        try:
            sql = """
            SELECT * FROM products
            WHERE stock_quantity <= min_stock AND is_active = 1
            ORDER BY (stock_quantity / NULLIF(min_stock, 0)) ASC
            """
            return db.execute_query(sql)
        except Exception as e:
            if 'is_active' in str(e):
                sql = """
                SELECT * FROM products
                WHERE stock_quantity <= min_stock
                ORDER BY (stock_quantity / NULLIF(min_stock, 0)) ASC
                """
                return db.execute_query(sql)
            raise e
    
    @staticmethod
    def search_products(keyword):
        """搜索产品"""
        try:
            sql = """
            SELECT * FROM products
            WHERE (name LIKE %s OR code LIKE %s OR category LIKE %s OR specification LIKE %s)
            AND is_active = 1
            ORDER BY id DESC
            """
            like_keyword = f"%{keyword}%"
            return db.execute_query(sql, (like_keyword, like_keyword, like_keyword, like_keyword))
        except Exception as e:
            if 'is_active' in str(e):
                sql = """
                SELECT * FROM products
                WHERE (name LIKE %s OR code LIKE %s OR category LIKE %s OR specification LIKE %s)
                ORDER BY id DESC
                """
                like_keyword = f"%{keyword}%"
                return db.execute_query(sql, (like_keyword, like_keyword, like_keyword, like_keyword))
            raise e
    
    @staticmethod
    def get_products_by_category(category):
        """根据分类获取产品"""
        try:
            sql = "SELECT * FROM products WHERE category = %s AND is_active = 1 ORDER BY id DESC"
            return db.execute_query(sql, (category,))
        except Exception as e:
            if 'is_active' in str(e):
                sql = "SELECT * FROM products WHERE category = %s ORDER BY id DESC"
                return db.execute_query(sql, (category,))
            raise e
    
    @staticmethod
    def get_categories():
        """获取所有产品分类"""
        try:
            sql = "SELECT DISTINCT category FROM products WHERE is_active = 1 AND category != '' ORDER BY category"
            result = db.execute_query(sql)
            return [r['category'] for r in result]
        except Exception as e:
            if 'is_active' in str(e):
                sql = "SELECT DISTINCT category FROM products WHERE category != '' ORDER BY category"
                result = db.execute_query(sql)
                return [r['category'] for r in result]
            raise e
    
    @staticmethod
    def get_stock_records(product_id=None, limit=100):
        """获取库存变动记录"""
        sql = """
        SELECT ir.*, p.name as product_name, p.code as product_code,
               u.real_name as operator_name
        FROM inventory_records ir
        LEFT JOIN products p ON ir.item_id = p.id AND ir.item_type = 'PRODUCT'
        LEFT JOIN sys_users u ON ir.operator_id = u.id
        WHERE ir.item_type = 'PRODUCT'
        """
        params = []
        
        if product_id:
            sql += " AND ir.item_id = %s"
            params.append(product_id)
        
        sql += " ORDER BY ir.created_at DESC LIMIT %s"
        params.append(limit)
        
        return db.execute_query(sql, params)
