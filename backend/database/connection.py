# -*- coding: utf-8 -*-
"""
数据库连接管理模块 - 线程安全版本
Database Connection Manager - Thread-safe Version
"""

import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
import threading
import sys
import os

# 添加父目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.database import DATABASE_CONFIG


class DatabaseConnection:
    """线程安全的数据库连接管理类"""
    
    def __init__(self):
        # 使用线程本地存储来管理每个线程的连接
        self._local = threading.local()
    
    def _get_connection(self):
        """获取当前线程的数据库连接"""
        if not hasattr(self._local, 'connection') or self._local.connection is None:
            self._local.connection = self._create_connection()
        
        # 检查连接是否有效，如果无效则重新连接
        try:
            self._local.connection.ping(reconnect=True)
        except:
            self._local.connection = self._create_connection()
        
        return self._local.connection
    
    def _create_connection(self):
        """创建新的数据库连接"""
        try:
            connection = pymysql.connect(
                host=DATABASE_CONFIG['host'],
                port=DATABASE_CONFIG['port'],
                user=DATABASE_CONFIG['user'],
                password=DATABASE_CONFIG['password'],
                database=DATABASE_CONFIG['database'],
                charset=DATABASE_CONFIG['charset'],
                cursorclass=DictCursor,
                autocommit=True,  # 使用自动提交简化处理
                connect_timeout=10,
                read_timeout=30,
                write_timeout=30
            )
            return connection
        except pymysql.Error as e:
            print(f"数据库连接失败: {e}")
            raise
    
    def connect(self):
        """建立数据库连接（兼容旧接口）"""
        return self._get_connection()
    
    def close(self):
        """关闭当前线程的数据库连接"""
        if hasattr(self._local, 'connection') and self._local.connection:
            try:
                self._local.connection.close()
            except:
                pass
            self._local.connection = None
    
    @contextmanager
    def get_cursor(self):
        """获取数据库游标的上下文管理器"""
        connection = self._get_connection()
        cursor = connection.cursor()
        try:
            yield cursor
        except Exception as e:
            raise e
        finally:
            cursor.close()
    
    def execute_query(self, sql, params=None):
        """执行查询SQL并返回结果"""
        with self.get_cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchall()
    
    def execute_one(self, sql, params=None):
        """执行查询SQL并返回单条结果"""
        with self.get_cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchone()
    
    def execute_update(self, sql, params=None):
        """执行更新SQL"""
        with self.get_cursor() as cursor:
            affected_rows = cursor.execute(sql, params)
            return affected_rows
    
    def execute_insert(self, sql, params=None):
        """执行插入SQL并返回新记录ID"""
        with self.get_cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.lastrowid
    
    def execute_many(self, sql, params_list):
        """批量执行SQL"""
        with self.get_cursor() as cursor:
            cursor.executemany(sql, params_list)
            return cursor.rowcount
    
    def test_connection(self):
        """测试数据库连接"""
        try:
            connection = self._get_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                return result is not None
        except Exception as e:
            print(f"数据库连接测试失败: {e}")
            return False


# 全局数据库实例
db = DatabaseConnection()
