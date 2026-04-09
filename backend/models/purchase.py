# -*- coding: utf-8 -*-
"""
采购订单模型
Purchase Model
"""

import sys
import os
from datetime import datetime, date

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db


class PurchaseModel:
    """采购订单数据模型"""
    
    @staticmethod
    def generate_order_no():
        """生成采购订单号"""
        today = datetime.now().strftime('%Y%m%d')
        sql = "SELECT COUNT(*) as count FROM purchase_orders WHERE order_no LIKE %s"
        result = db.execute_one(sql, (f"PU{today}%",))
        count = (result['count'] + 1) if result else 1
        return f"PU{today}{count:04d}"
    
    @staticmethod
    def get_all_orders(status=None, limit=100):
        """获取所有采购订单"""
        sql = """
        SELECT po.*, u.real_name as created_by_name, 
               au.real_name as approved_by_name
        FROM purchase_orders po
        LEFT JOIN sys_users u ON po.created_by = u.id
        LEFT JOIN sys_users au ON po.approved_by = au.id
        """
        params = []
        
        if status:
            sql += " WHERE po.status = %s"
            params.append(status)
        
        sql += " ORDER BY po.created_at DESC LIMIT %s"
        params.append(limit)
        
        return db.execute_query(sql, params)
    
    @staticmethod
    def get_order_by_id(order_id):
        """根据ID获取订单"""
        sql = """
        SELECT po.*, u.real_name as created_by_name,
               au.real_name as approved_by_name
        FROM purchase_orders po
        LEFT JOIN sys_users u ON po.created_by = u.id
        LEFT JOIN sys_users au ON po.approved_by = au.id
        WHERE po.id = %s
        """
        return db.execute_one(sql, (order_id,))
    
    @staticmethod
    def get_order_by_no(order_no):
        """根据订单号获取订单"""
        sql = """
        SELECT po.*, u.real_name as created_by_name,
               au.real_name as approved_by_name
        FROM purchase_orders po
        LEFT JOIN sys_users u ON po.created_by = u.id
        LEFT JOIN sys_users au ON po.approved_by = au.id
        WHERE po.order_no = %s
        """
        return db.execute_one(sql, (order_no,))
    
    @staticmethod
    def create_order(data, items):
        """创建采购订单"""
        order_no = PurchaseModel.generate_order_no()
        
        # 计算总金额
        total_amount = sum(item['quantity'] * item['unit_price'] for item in items)
        
        sql = """
        INSERT INTO purchase_orders (order_no, supplier, total_amount, status, 
                                    order_date, expected_date, payment_status, 
                                    remarks, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            order_no,
            data['supplier'],
            total_amount,
            data.get('status', 'PENDING'),
            data.get('order_date', date.today()),
            data.get('expected_date'),
            data.get('payment_status', 'UNPAID'),
            data.get('remarks', ''),
            data.get('created_by')
        )
        
        order_id = db.execute_insert(sql, params)
        
        # 插入订单明细
        for item in items:
            item_sql = """
            INSERT INTO purchase_items (order_id, material_id, quantity, unit_price, total_price)
            VALUES (%s, %s, %s, %s, %s)
            """
            item_total = item['quantity'] * item['unit_price']
            db.execute_insert(item_sql, (
                order_id, item['material_id'], item['quantity'], 
                item['unit_price'], item_total
            ))
        
        return order_id, order_no
    
    @staticmethod
    def update_order(order_id, data):
        """更新订单"""
        fields = []
        params = []
        
        update_fields = ['supplier', 'total_amount', 'status', 'expected_date', 
                        'actual_date', 'payment_status', 'remarks', 'approved_by']
        
        for field in update_fields:
            if field in data:
                fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not fields:
            return 0
        
        params.append(order_id)
        sql = f"UPDATE purchase_orders SET {', '.join(fields)} WHERE id = %s"
        return db.execute_update(sql, params)
    
    @staticmethod
    def get_order_items(order_id):
        """获取订单明细"""
        sql = """
        SELECT pi.*, m.name as material_name, m.code as material_code, m.unit
        FROM purchase_items pi
        JOIN materials m ON pi.material_id = m.id
        WHERE pi.order_id = %s
        """
        return db.execute_query(sql, (order_id,))
    
    @staticmethod
    def approve_order(order_id, approved_by):
        """审批订单"""
        data = {
            'status': 'APPROVED',
            'approved_by': approved_by
        }
        return PurchaseModel.update_order(order_id, data)
    
    @staticmethod
    def receive_order(order_id, operator_id):
        """收货"""
        # 更新订单状态
        data = {
            'status': 'RECEIVED',
            'actual_date': date.today()
        }
        PurchaseModel.update_order(order_id, data)
        
        # 更新库存
        items = PurchaseModel.get_order_items(order_id)
        for item in items:
            from models.material import MaterialModel
            MaterialModel.update_stock(
                item['material_id'], 
                float(item['quantity']), 
                'IN',
                operator_id,
                f"采购入库"
            )
            
            # 更新接收数量
            update_sql = "UPDATE purchase_items SET received_quantity = quantity WHERE id = %s"
            db.execute_update(update_sql, (item['id'],))
        
        return True
    
    @staticmethod
    def search_orders(keyword):
        """搜索订单"""
        sql = """
        SELECT po.*, u.real_name as created_by_name
        FROM purchase_orders po
        LEFT JOIN sys_users u ON po.created_by = u.id
        WHERE po.order_no LIKE %s OR po.supplier LIKE %s
        ORDER BY po.created_at DESC
        """
        like_keyword = f"%{keyword}%"
        return db.execute_query(sql, (like_keyword, like_keyword))
    
    @staticmethod
    def get_statistics():
        """获取采购统计"""
        stats = {}
        
        # 总订单数
        sql = "SELECT COUNT(*) as count FROM purchase_orders"
        result = db.execute_one(sql)
        stats['total_orders'] = result['count'] if result else 0
        
        # 总金额
        sql = "SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_orders"
        result = db.execute_one(sql)
        stats['total_amount'] = float(result['total']) if result else 0
        
        # 待处理订单
        sql = "SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'PENDING'"
        result = db.execute_one(sql)
        stats['pending_orders'] = result['count'] if result else 0
        
        # 本月采购金额
        sql = """
        SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_orders 
        WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
        """
        result = db.execute_one(sql)
        stats['month_amount'] = float(result['total']) if result else 0
        
        return stats
