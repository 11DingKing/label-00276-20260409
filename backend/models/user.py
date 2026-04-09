# -*- coding: utf-8 -*-
"""
用户模型
User Model
"""

import sys
import os
import hashlib
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db


class UserModel:
    """用户数据模型"""
    
    @staticmethod
    def hash_password(password):
        """密码哈希"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def verify_login(username, password):
        """验证登录"""
        sql = """
        SELECT u.*, d.name as department_name 
        FROM sys_users u 
        LEFT JOIN sys_departments d ON u.department_id = d.id
        WHERE u.username = %s AND u.is_active = 1
        """
        user = db.execute_one(sql, (username,))
        
        if user and user['password'] == UserModel.hash_password(password):
            # 更新最后登录时间
            update_sql = "UPDATE sys_users SET last_login = %s WHERE id = %s"
            db.execute_update(update_sql, (datetime.now(), user['id']))
            return user
        return None
    
    @staticmethod
    def get_all_users():
        """获取所有用户"""
        sql = """
        SELECT u.*, d.name as department_name 
        FROM sys_users u 
        LEFT JOIN sys_departments d ON u.department_id = d.id
        ORDER BY u.id DESC
        """
        return db.execute_query(sql)
    
    @staticmethod
    def get_user_by_id(user_id):
        """根据ID获取用户"""
        sql = """
        SELECT u.*, d.name as department_name 
        FROM sys_users u 
        LEFT JOIN sys_departments d ON u.department_id = d.id
        WHERE u.id = %s
        """
        return db.execute_one(sql, (user_id,))
    
    @staticmethod
    def get_users_by_department(department_id):
        """获取部门用户"""
        sql = """
        SELECT u.*, d.name as department_name 
        FROM sys_users u 
        LEFT JOIN sys_departments d ON u.department_id = d.id
        WHERE u.department_id = %s AND u.is_active = 1
        ORDER BY u.id DESC
        """
        return db.execute_query(sql, (department_id,))
    
    @staticmethod
    def create_user(data):
        """创建用户"""
        sql = """
        INSERT INTO sys_users (username, password, real_name, email, phone, 
                              department_id, permission_level, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        password_hash = UserModel.hash_password(data.get('password', '123456'))
        params = (
            data['username'],
            password_hash,
            data.get('real_name', ''),
            data.get('email', ''),
            data.get('phone', ''),
            data.get('department_id'),
            data.get('permission_level', 4),
            data.get('is_active', 1)
        )
        return db.execute_insert(sql, params)
    
    @staticmethod
    def update_user(user_id, data):
        """更新用户"""
        fields = []
        params = []
        
        if 'real_name' in data:
            fields.append("real_name = %s")
            params.append(data['real_name'])
        if 'email' in data:
            fields.append("email = %s")
            params.append(data['email'])
        if 'phone' in data:
            fields.append("phone = %s")
            params.append(data['phone'])
        if 'department_id' in data:
            fields.append("department_id = %s")
            params.append(data['department_id'])
        if 'permission_level' in data:
            fields.append("permission_level = %s")
            params.append(data['permission_level'])
        if 'is_active' in data:
            fields.append("is_active = %s")
            params.append(data['is_active'])
        if 'password' in data and data['password']:
            fields.append("password = %s")
            params.append(UserModel.hash_password(data['password']))
        
        if not fields:
            return 0
        
        params.append(user_id)
        sql = f"UPDATE sys_users SET {', '.join(fields)} WHERE id = %s"
        return db.execute_update(sql, params)
    
    @staticmethod
    def delete_user(user_id):
        """删除用户(软删除)"""
        sql = "UPDATE sys_users SET is_active = 0 WHERE id = %s"
        return db.execute_update(sql, (user_id,))
    
    @staticmethod
    def change_password(user_id, old_password, new_password):
        """修改密码"""
        check_sql = "SELECT password FROM sys_users WHERE id = %s"
        user = db.execute_one(check_sql, (user_id,))
        
        if user and user['password'] == UserModel.hash_password(old_password):
            update_sql = "UPDATE sys_users SET password = %s WHERE id = %s"
            db.execute_update(update_sql, (UserModel.hash_password(new_password), user_id))
            return True
        return False
    
    @staticmethod
    def search_users(keyword):
        """搜索用户"""
        sql = """
        SELECT u.*, d.name as department_name 
        FROM sys_users u 
        LEFT JOIN sys_departments d ON u.department_id = d.id
        WHERE (u.username LIKE %s OR u.real_name LIKE %s OR u.phone LIKE %s)
        AND u.is_active = 1
        ORDER BY u.id DESC
        """
        like_keyword = f"%{keyword}%"
        return db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
    
    @staticmethod
    def get_permission_name(level):
        """获取权限名称"""
        permission_names = {
            1: '超级管理员',
            2: '管理员',
            3: '部门经理',
            4: '普通员工'
        }
        return permission_names.get(level, '未知')
