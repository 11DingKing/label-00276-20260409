# -*- coding: utf-8 -*-
"""
部门模型
Department Model
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db


class DepartmentModel:
    """部门数据模型"""
    
    @staticmethod
    def get_all_departments():
        """获取所有部门"""
        sql = """
        SELECT d.*, u.real_name as manager_name,
               (SELECT COUNT(*) FROM sys_users WHERE department_id = d.id AND is_active = 1) as employee_count
        FROM sys_departments d 
        LEFT JOIN sys_users u ON d.manager_id = u.id
        WHERE d.is_active = 1
        ORDER BY d.id
        """
        return db.execute_query(sql)
    
    @staticmethod
    def get_department_by_id(dept_id):
        """根据ID获取部门"""
        sql = """
        SELECT d.*, u.real_name as manager_name
        FROM sys_departments d 
        LEFT JOIN sys_users u ON d.manager_id = u.id
        WHERE d.id = %s
        """
        return db.execute_one(sql, (dept_id,))
    
    @staticmethod
    def get_department_by_code(code):
        """根据编码获取部门"""
        sql = """
        SELECT d.*, u.real_name as manager_name
        FROM sys_departments d 
        LEFT JOIN sys_users u ON d.manager_id = u.id
        WHERE d.code = %s
        """
        return db.execute_one(sql, (code,))
    
    @staticmethod
    def create_department(data):
        """创建部门"""
        sql = """
        INSERT INTO sys_departments (name, code, description, manager_id, is_active)
        VALUES (%s, %s, %s, %s, %s)
        """
        params = (
            data['name'],
            data['code'],
            data.get('description', ''),
            data.get('manager_id'),
            data.get('is_active', 1)
        )
        return db.execute_insert(sql, params)
    
    @staticmethod
    def update_department(dept_id, data):
        """更新部门"""
        fields = []
        params = []
        
        if 'name' in data:
            fields.append("name = %s")
            params.append(data['name'])
        if 'description' in data:
            fields.append("description = %s")
            params.append(data['description'])
        if 'manager_id' in data:
            fields.append("manager_id = %s")
            params.append(data['manager_id'])
        if 'is_active' in data:
            fields.append("is_active = %s")
            params.append(data['is_active'])
        
        if not fields:
            return 0
        
        params.append(dept_id)
        sql = f"UPDATE sys_departments SET {', '.join(fields)} WHERE id = %s"
        return db.execute_update(sql, params)
    
    @staticmethod
    def get_department_statistics(dept_id):
        """获取部门统计数据"""
        stats = {}
        
        # 员工数量
        sql = "SELECT COUNT(*) as count FROM sys_users WHERE department_id = %s AND is_active = 1"
        result = db.execute_one(sql, (dept_id,))
        stats['employee_count'] = result['count'] if result else 0
        
        # 进行中的生产任务
        sql = """
        SELECT COUNT(*) as count FROM production_process 
        WHERE department_id = %s AND status IN ('PENDING', 'IN_PROGRESS')
        """
        result = db.execute_one(sql, (dept_id,))
        stats['active_tasks'] = result['count'] if result else 0
        
        # 已完成的任务
        sql = """
        SELECT COUNT(*) as count FROM production_process 
        WHERE department_id = %s AND status = 'COMPLETED'
        """
        result = db.execute_one(sql, (dept_id,))
        stats['completed_tasks'] = result['count'] if result else 0
        
        return stats
    
    @staticmethod
    def get_department_tasks(dept_id, status=None, limit=50):
        """获取部门任务列表"""
        sql = """
        SELECT pp.*, po.order_no, p.name as product_name,
               u.real_name as operator_name
        FROM production_process pp
        JOIN production_orders po ON pp.order_id = po.id
        JOIN products p ON po.product_id = p.id
        LEFT JOIN sys_users u ON pp.operator_id = u.id
        WHERE pp.department_id = %s
        """
        params = [dept_id]
        
        if status:
            sql += " AND pp.status = %s"
            params.append(status)
        
        sql += " ORDER BY pp.created_at DESC LIMIT %s"
        params.append(limit)
        
        return db.execute_query(sql, params)
