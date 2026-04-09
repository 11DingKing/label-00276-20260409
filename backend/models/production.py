# -*- coding: utf-8 -*-
"""
生产订单模型
Production Model
"""

import sys
import os
from datetime import datetime, date

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db


class ProductionModel:
    """生产订单数据模型"""
    
    @staticmethod
    def generate_order_no():
        """生成订单号"""
        today = datetime.now().strftime('%Y%m%d')
        sql = "SELECT COUNT(*) as count FROM production_orders WHERE order_no LIKE %s"
        result = db.execute_one(sql, (f"PO{today}%",))
        count = (result['count'] + 1) if result else 1
        return f"PO{today}{count:04d}"
    
    @staticmethod
    def get_all_orders(status=None, limit=100):
        """获取所有生产订单"""
        try:
            # 尝试使用 product_name 列
            sql = """
            SELECT po.*, p.product_name as product_name, p.product_code as product_code,
                   u.real_name as created_by_name
            FROM production_orders po
            LEFT JOIN products p ON po.product_id = p.id
            LEFT JOIN sys_users u ON po.created_by = u.id
            """
            params = []
            
            if status:
                sql += " WHERE po.status = %s"
                params.append(status)
            
            sql += " ORDER BY po.created_at DESC LIMIT %s"
            params.append(limit)
            
            return db.execute_query(sql, params)
        except Exception as e:
            error_msg = str(e).lower()
            if 'unknown column' in error_msg:
                try:
                    # 尝试使用 name 列
                    sql = """
                    SELECT po.*, p.name as product_name, p.code as product_code,
                           u.real_name as created_by_name
                    FROM production_orders po
                    LEFT JOIN products p ON po.product_id = p.id
                    LEFT JOIN sys_users u ON po.created_by = u.id
                    """
                    params = []
                    if status:
                        sql += " WHERE po.status = %s"
                        params.append(status)
                    sql += " ORDER BY po.created_at DESC LIMIT %s"
                    params.append(limit)
                    return db.execute_query(sql, params)
                except:
                    # 不使用产品信息
                    sql = "SELECT *, NULL as product_name, NULL as product_code, NULL as created_by_name FROM production_orders"
                    params = []
                    if status:
                        sql += " WHERE status = %s"
                        params.append(status)
                    sql += " ORDER BY created_at DESC LIMIT %s"
                    params.append(limit)
                    return db.execute_query(sql, params)
            raise e
    
    @staticmethod
    def get_order_by_id(order_id):
        """根据ID获取订单"""
        try:
            sql = """
            SELECT po.*, p.name as product_name, p.code as product_code,
                   u.real_name as created_by_name
            FROM production_orders po
            LEFT JOIN products p ON po.product_id = p.id
            LEFT JOIN sys_users u ON po.created_by = u.id
            WHERE po.id = %s
            """
            return db.execute_one(sql, (order_id,))
        except Exception as e:
            if 'unknown column' in str(e).lower():
                sql = "SELECT *, NULL as product_name, NULL as product_code, NULL as created_by_name FROM production_orders WHERE id = %s"
                return db.execute_one(sql, (order_id,))
            raise e
    
    @staticmethod
    def get_order_by_no(order_no):
        """根据订单号获取订单"""
        try:
            sql = """
            SELECT po.*, p.name as product_name, p.code as product_code,
                   u.real_name as created_by_name
            FROM production_orders po
            LEFT JOIN products p ON po.product_id = p.id
            LEFT JOIN sys_users u ON po.created_by = u.id
            WHERE po.order_no = %s
            """
            return db.execute_one(sql, (order_no,))
        except Exception as e:
            if 'unknown column' in str(e).lower():
                sql = "SELECT *, NULL as product_name, NULL as product_code, NULL as created_by_name FROM production_orders WHERE order_no = %s"
                return db.execute_one(sql, (order_no,))
            raise e
    
    @staticmethod
    def create_order(data):
        """创建生产订单"""
        order_no = ProductionModel.generate_order_no()
        
        sql = """
        INSERT INTO production_orders (order_no, product_id, quantity, planned_start_date, 
                                       planned_end_date, status, priority, customer_name,
                                       customer_order_no, remarks, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            order_no,
            data['product_id'],
            data['quantity'],
            data.get('planned_start_date'),
            data.get('planned_end_date'),
            data.get('status', 'PENDING'),
            data.get('priority', 3),
            data.get('customer_name', ''),
            data.get('customer_order_no', ''),
            data.get('remarks', ''),
            data.get('created_by')
        )
        
        order_id = db.execute_insert(sql, params)
        
        # 创建生产流程
        ProductionModel.init_production_process(order_id)
        
        return order_id, order_no
    
    @staticmethod
    def init_production_process(order_id):
        """初始化生产流程"""
        # 定义标准生产流程
        processes = [
            (1, '木工部', 'WOODWORK', '木工加工'),
            (3, '五金部', 'HARDWARE', '五金安装'),
            (4, '油漆部', 'PAINTING', '油漆涂装'),
            (5, '工艺部', 'CRAFT', '工艺检验'),
            (6, '包装部', 'PACKAGING', '包装入库')
        ]
        
        # 获取部门ID
        for seq, dept_name, dept_code, process_name in processes:
            dept_sql = "SELECT id FROM sys_departments WHERE code = %s"
            dept = db.execute_one(dept_sql, (dept_code,))
            
            if dept:
                sql = """
                INSERT INTO production_process (order_id, department_id, process_name, 
                                               sequence_no, status)
                VALUES (%s, %s, %s, %s, 'PENDING')
                """
                db.execute_insert(sql, (order_id, dept['id'], process_name, seq))
    
    @staticmethod
    def update_order(order_id, data):
        """更新订单"""
        fields = []
        params = []
        
        update_fields = ['quantity', 'planned_start_date', 'planned_end_date', 
                        'actual_start_date', 'actual_end_date', 'status', 'priority',
                        'customer_name', 'customer_order_no', 'remarks']
        
        for field in update_fields:
            if field in data:
                fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not fields:
            return 0
        
        params.append(order_id)
        sql = f"UPDATE production_orders SET {', '.join(fields)} WHERE id = %s"
        return db.execute_update(sql, params)
    
    @staticmethod
    def delete_order(order_id):
        """删除订单及其关联的生产流程"""
        # 先删除生产流程
        sql = "DELETE FROM production_process WHERE order_id = %s"
        db.execute_update(sql, (order_id,))
        
        # 再删除订单
        sql = "DELETE FROM production_orders WHERE id = %s"
        return db.execute_update(sql, (order_id,))
    
    @staticmethod
    def update_order_status(order_id, status):
        """更新订单状态"""
        data = {'status': status}
        
        if status == 'IN_PROGRESS':
            data['actual_start_date'] = date.today()
        elif status == 'COMPLETED':
            data['actual_end_date'] = date.today()
        
        return ProductionModel.update_order(order_id, data)
    
    @staticmethod
    def get_order_processes(order_id):
        """获取订单的生产流程"""
        sql = """
        SELECT pp.*, d.name as department_name, u.real_name as operator_name
        FROM production_process pp
        JOIN sys_departments d ON pp.department_id = d.id
        LEFT JOIN sys_users u ON pp.operator_id = u.id
        WHERE pp.order_id = %s
        ORDER BY pp.sequence_no
        """
        return db.execute_query(sql, (order_id,))
    
    @staticmethod
    def update_process(process_id, data):
        """更新生产流程"""
        fields = []
        params = []
        
        update_fields = ['start_time', 'end_time', 'status', 'operator_id', 
                        'quality_check_result', 'remarks']
        
        for field in update_fields:
            if field in data:
                fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not fields:
            return 0
        
        params.append(process_id)
        sql = f"UPDATE production_process SET {', '.join(fields)} WHERE id = %s"
        return db.execute_update(sql, params)
    
    @staticmethod
    def start_process(process_id, operator_id):
        """开始流程"""
        data = {
            'start_time': datetime.now(),
            'status': 'IN_PROGRESS',
            'operator_id': operator_id
        }
        return ProductionModel.update_process(process_id, data)
    
    @staticmethod
    def complete_process(process_id, quality_result='PASS', remarks=''):
        """完成流程"""
        data = {
            'end_time': datetime.now(),
            'status': 'COMPLETED',
            'quality_check_result': quality_result,
            'remarks': remarks
        }
        return ProductionModel.update_process(process_id, data)
    
    @staticmethod
    def search_orders(keyword):
        """搜索订单"""
        try:
            sql = """
            SELECT po.*, p.name as product_name, p.code as product_code,
                   u.real_name as created_by_name
            FROM production_orders po
            LEFT JOIN products p ON po.product_id = p.id
            LEFT JOIN sys_users u ON po.created_by = u.id
            WHERE po.order_no LIKE %s OR p.name LIKE %s OR po.customer_name LIKE %s
            ORDER BY po.created_at DESC
            """
            like_keyword = f"%{keyword}%"
            return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
        except Exception as e:
            if 'unknown column' in str(e).lower():
                sql = """
                SELECT *, NULL as product_name, NULL as product_code, NULL as created_by_name 
                FROM production_orders 
                WHERE order_no LIKE %s OR customer_name LIKE %s
                ORDER BY created_at DESC
                """
                like_keyword = f"%{keyword}%"
                return db.execute_query(sql, (like_keyword, like_keyword))
            raise e
    
    @staticmethod
    def get_orders_by_date_range(start_date, end_date, status=None):
        """根据日期范围获取订单"""
        try:
            sql = """
            SELECT po.*, p.name as product_name, p.code as product_code,
                   u.real_name as created_by_name
            FROM production_orders po
            LEFT JOIN products p ON po.product_id = p.id
            LEFT JOIN sys_users u ON po.created_by = u.id
            WHERE DATE(po.created_at) BETWEEN %s AND %s
            """
            params = [start_date, end_date]
            
            if status:
                sql += " AND po.status = %s"
                params.append(status)
            
            sql += " ORDER BY po.created_at DESC"
            return db.execute_query(sql, params)
        except Exception as e:
            if 'unknown column' in str(e).lower():
                sql = """
                SELECT *, NULL as product_name, NULL as product_code, NULL as created_by_name 
                FROM production_orders WHERE DATE(created_at) BETWEEN %s AND %s
                """
                params = [start_date, end_date]
                if status:
                    sql += " AND status = %s"
                    params.append(status)
                sql += " ORDER BY created_at DESC"
                return db.execute_query(sql, params)
            raise e
    
    @staticmethod
    def get_department_processes(dept_id):
        """获取部门相关的生产流程"""
        try:
            # 尝试使用 product_name 列
            sql = """
            SELECT pp.*, po.order_no, po.quantity, p.product_name as product_name
            FROM production_process pp
            JOIN production_orders po ON pp.order_id = po.id
            LEFT JOIN products p ON po.product_id = p.id
            WHERE pp.department_id = %s
            ORDER BY pp.created_at DESC
            """
            return db.execute_query(sql, (dept_id,))
        except Exception as e:
            error_msg = str(e).lower()
            if 'unknown column' in error_msg or 'product_name' in error_msg:
                try:
                    # 尝试使用 name 列
                    sql = """
                    SELECT pp.*, po.order_no, po.quantity, p.name as product_name
                    FROM production_process pp
                    JOIN production_orders po ON pp.order_id = po.id
                    LEFT JOIN products p ON po.product_id = p.id
                    WHERE pp.department_id = %s
                    ORDER BY pp.created_at DESC
                    """
                    return db.execute_query(sql, (dept_id,))
                except:
                    # 不使用产品名
                    sql = """
                    SELECT pp.*, po.order_no, po.quantity, NULL as product_name
                    FROM production_process pp
                    JOIN production_orders po ON pp.order_id = po.id
                    WHERE pp.department_id = %s
                    ORDER BY pp.created_at DESC
                    """
                    return db.execute_query(sql, (dept_id,))
            return []
    
    @staticmethod
    def finish_process(process_id, operator_id):
        """完成工序"""
        from datetime import datetime
        sql = """
        UPDATE production_process 
        SET status = 'COMPLETED', end_time = %s, operator_id = %s 
        WHERE id = %s
        """
        return db.execute_update(sql, (datetime.now(), operator_id, process_id))
    
    @staticmethod
    def get_statistics():
        """获取生产统计"""
        stats = {}
        
        # 总订单数
        sql = "SELECT COUNT(*) as count FROM production_orders"
        result = db.execute_one(sql)
        stats['total_orders'] = result['count'] if result else 0
        
        # 各状态订单数
        sql = "SELECT status, COUNT(*) as count FROM production_orders GROUP BY status"
        results = db.execute_query(sql)
        stats['by_status'] = {r['status']: r['count'] for r in results}
        
        # 今日订单数
        sql = "SELECT COUNT(*) as count FROM production_orders WHERE DATE(created_at) = CURDATE()"
        result = db.execute_one(sql)
        stats['today_orders'] = result['count'] if result else 0
        
        # 本月订单数
        sql = """
        SELECT COUNT(*) as count FROM production_orders 
        WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
        """
        result = db.execute_one(sql)
        stats['month_orders'] = result['count'] if result else 0
        
        return stats
