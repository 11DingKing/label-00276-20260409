# -*- coding: utf-8 -*-
"""
Flask API 后端服务
家具生产管理系统 API
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import hashlib
import jwt
import datetime

from database.connection import db
from config.database import DATABASE_CONFIG, DEPARTMENTS, PRODUCTION_STATUS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'furniture-production-system-secret-key-2026'
app.config['JSON_AS_ASCII'] = False  # 支持中文JSON响应
CORS(app)

# ==================== 工具函数 ====================

def hash_password(password):
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()

def token_required(f):
    """Token验证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'message': '缺少认证令牌'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.execute_one(
                "SELECT * FROM sys_users WHERE id = %s AND is_active = 1",
                (data['user_id'],)
            )
            if not current_user:
                return jsonify({'success': False, 'message': '用户不存在或已禁用'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': '无效的令牌'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def success_response(data=None, message='操作成功'):
    """成功响应"""
    return jsonify({'success': True, 'message': message, 'data': data})

def error_response(message='操作失败', code=400):
    """错误响应"""
    return jsonify({'success': False, 'message': message}), code

# ==================== 认证接口 ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return error_response('用户名和密码不能为空')
    
    user = db.execute_one(
        """SELECT u.*, d.name as department_name 
           FROM sys_users u 
           LEFT JOIN sys_departments d ON u.department_id = d.id
           WHERE u.username = %s AND u.is_active = 1""",
        (username,)
    )
    
    if not user:
        return error_response('用户不存在或已禁用')
    
    if user['password'] != hash_password(password):
        return error_response('密码错误')
    
    # 生成Token
    token = jwt.encode({
        'user_id': user['id'],
        'username': user['username'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    # 更新最后登录时间
    db.execute_update(
        "UPDATE sys_users SET last_login = NOW() WHERE id = %s",
        (user['id'],)
    )
    
    return success_response({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'real_name': user.get('real_name', ''),
            'department_id': user.get('department_id'),
            'department_name': user.get('department_name', ''),
            'permission_level': user.get('permission_level', 4),
            'email': user.get('email', ''),
            'phone': user.get('phone', '')
        }
    }, '登录成功')

@app.route('/api/auth/info', methods=['GET'])
@token_required
def get_user_info(current_user):
    """获取当前用户信息"""
    return success_response({
        'id': current_user['id'],
        'username': current_user['username'],
        'real_name': current_user.get('real_name', ''),
        'department_id': current_user.get('department_id'),
        'permission_level': current_user.get('permission_level', 4),
        'email': current_user.get('email', ''),
        'phone': current_user.get('phone', '')
    })

# ==================== 用户管理接口 ====================

@app.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user):
    """获取用户列表"""
    keyword = request.args.get('keyword', '')
    
    if keyword:
        sql = """
            SELECT u.*, d.name as department_name 
            FROM sys_users u 
            LEFT JOIN sys_departments d ON u.department_id = d.id
            WHERE u.username LIKE %s OR u.real_name LIKE %s OR u.phone LIKE %s
            ORDER BY u.id DESC
        """
        like_keyword = f'%{keyword}%'
        users = db.execute_query(sql, (like_keyword, like_keyword, like_keyword))
    else:
        sql = """
            SELECT u.*, d.name as department_name 
            FROM sys_users u 
            LEFT JOIN sys_departments d ON u.department_id = d.id
            ORDER BY u.id DESC
        """
        users = db.execute_query(sql)
    
    # 处理日期时间字段
    for user in users:
        user.pop('password', None)
        if user.get('created_at'):
            user['created_at'] = user['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if user.get('last_login'):
            user['last_login'] = user['last_login'].strftime('%Y-%m-%d %H:%M:%S')
    
    return success_response(users)

@app.route('/api/users', methods=['POST'])
@token_required
def create_user(current_user):
    """创建用户"""
    data = request.get_json()
    
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return error_response('用户名和密码不能为空')
    
    # 检查用户名是否存在
    existing = db.execute_one("SELECT id FROM sys_users WHERE username = %s", (username,))
    if existing:
        return error_response('用户名已存在')
    
    sql = """
        INSERT INTO sys_users (username, password, real_name, email, phone, 
                              department_id, permission_level, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    user_id = db.execute_insert(sql, (
        username,
        hash_password(password),
        data.get('real_name', ''),
        data.get('email', ''),
        data.get('phone', ''),
        data.get('department_id'),
        data.get('permission_level', 4),
        data.get('is_active', 1)
    ))
    
    return success_response({'id': user_id}, '用户创建成功')

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    """更新用户"""
    data = request.get_json()
    
    fields = []
    params = []
    
    if 'real_name' in data:
        fields.append('real_name = %s')
        params.append(data['real_name'])
    if 'email' in data:
        fields.append('email = %s')
        params.append(data['email'])
    if 'phone' in data:
        fields.append('phone = %s')
        params.append(data['phone'])
    if 'department_id' in data:
        fields.append('department_id = %s')
        params.append(data['department_id'])
    if 'permission_level' in data:
        fields.append('permission_level = %s')
        params.append(data['permission_level'])
    if 'is_active' in data:
        fields.append('is_active = %s')
        params.append(data['is_active'])
    if 'password' in data and data['password']:
        fields.append('password = %s')
        params.append(hash_password(data['password']))
    
    if not fields:
        return error_response('没有要更新的字段')
    
    params.append(user_id)
    sql = f"UPDATE sys_users SET {', '.join(fields)} WHERE id = %s"
    db.execute_update(sql, params)
    
    return success_response(None, '用户更新成功')

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    """删除用户"""
    if user_id == current_user['id']:
        return error_response('不能删除当前登录用户')
    
    db.execute_update("DELETE FROM sys_users WHERE id = %s", (user_id,))
    return success_response(None, '用户删除成功')

# ==================== 部门管理接口 ====================

@app.route('/api/departments', methods=['GET'])
@token_required
def get_departments(current_user):
    """获取部门列表"""
    sql = "SELECT * FROM sys_departments ORDER BY id"
    departments = db.execute_query(sql)
    return success_response(departments)

@app.route('/api/departments/<int:dept_id>/tasks', methods=['GET'])
@token_required
def get_department_tasks(current_user, dept_id):
    """获取部门任务"""
    try:
        sql = """
            SELECT pp.*, po.order_no, po.quantity, 
                   p.product_name
            FROM production_process pp
            JOIN production_orders po ON pp.order_id = po.id
            LEFT JOIN products p ON po.product_id = p.id
            WHERE pp.department_id = %s
            ORDER BY pp.created_at DESC
            LIMIT 100
        """
        tasks = db.execute_query(sql, (dept_id,))
        
        for task in tasks:
            if task.get('created_at'):
                task['created_at'] = task['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if task.get('start_time'):
                task['start_time'] = task['start_time'].strftime('%Y-%m-%d %H:%M:%S')
            if task.get('end_time'):
                task['end_time'] = task['end_time'].strftime('%Y-%m-%d %H:%M:%S')
        
        return success_response(tasks)
    except Exception as e:
        print(f"获取部门任务失败: {e}")
        return success_response([])

@app.route('/api/departments/<int:dept_id>/members', methods=['GET'])
@token_required
def get_department_members(current_user, dept_id):
    """获取部门成员"""
    sql = """
        SELECT id, username, real_name, phone, email, permission_level, is_active
        FROM sys_users 
        WHERE department_id = %s
        ORDER BY id
    """
    members = db.execute_query(sql, (dept_id,))
    return success_response(members)

@app.route('/api/departments/<int:dept_id>/stats', methods=['GET'])
@token_required
def get_department_stats(current_user, dept_id):
    """获取部门统计"""
    try:
        total = db.execute_one(
            "SELECT COUNT(*) as cnt FROM production_process WHERE department_id = %s",
            (dept_id,)
        )
        pending = db.execute_one(
            "SELECT COUNT(*) as cnt FROM production_process WHERE department_id = %s AND status = 'PENDING'",
            (dept_id,)
        )
        in_progress = db.execute_one(
            "SELECT COUNT(*) as cnt FROM production_process WHERE department_id = %s AND status = 'IN_PROGRESS'",
            (dept_id,)
        )
        completed = db.execute_one(
            "SELECT COUNT(*) as cnt FROM production_process WHERE department_id = %s AND status = 'COMPLETED'",
            (dept_id,)
        )
        
        return success_response({
            'total': total['cnt'] if total else 0,
            'pending': pending['cnt'] if pending else 0,
            'in_progress': in_progress['cnt'] if in_progress else 0,
            'completed': completed['cnt'] if completed else 0
        })
    except:
        return success_response({'total': 0, 'pending': 0, 'in_progress': 0, 'completed': 0})

# ==================== 生产订单接口 ====================

@app.route('/api/production/orders', methods=['GET'])
@token_required
def get_production_orders(current_user):
    """获取生产订单列表"""
    status = request.args.get('status')
    keyword = request.args.get('keyword', '')
    
    sql = """
        SELECT po.*, p.product_name, p.product_code, u.real_name as created_by_name
        FROM production_orders po
        LEFT JOIN products p ON po.product_id = p.id
        LEFT JOIN sys_users u ON po.created_by = u.id
    """
    params = []
    
    conditions = []
    if status:
        conditions.append("po.status = %s")
        params.append(status)
    if keyword:
        conditions.append("(po.order_no LIKE %s OR p.product_name LIKE %s OR po.customer_name LIKE %s)")
        like_keyword = f'%{keyword}%'
        params.extend([like_keyword, like_keyword, like_keyword])
    
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    
    sql += " ORDER BY po.created_at DESC LIMIT 200"
    
    orders = db.execute_query(sql, params)
    
    for order in orders:
        if order.get('created_at'):
            order['created_at'] = order['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if order.get('planned_start_date'):
            order['planned_start_date'] = order['planned_start_date'].strftime('%Y-%m-%d')
        if order.get('planned_end_date'):
            order['planned_end_date'] = order['planned_end_date'].strftime('%Y-%m-%d')
        if order.get('actual_start_date'):
            order['actual_start_date'] = order['actual_start_date'].strftime('%Y-%m-%d')
        if order.get('actual_end_date'):
            order['actual_end_date'] = order['actual_end_date'].strftime('%Y-%m-%d')
        order['quantity'] = float(order['quantity']) if order.get('quantity') else 0
    
    return success_response(orders)

@app.route('/api/production/orders', methods=['POST'])
@token_required
def create_production_order(current_user):
    """创建生产订单"""
    data = request.get_json()
    
    # 生成订单号
    from datetime import datetime
    today = datetime.now().strftime('%Y%m%d')
    count_result = db.execute_one(
        "SELECT COUNT(*) as count FROM production_orders WHERE order_no LIKE %s",
        (f"PO{today}%",)
    )
    count = (count_result['count'] + 1) if count_result else 1
    order_no = f"PO{today}{count:04d}"
    
    sql = """
        INSERT INTO production_orders (order_no, product_id, quantity, planned_start_date, 
                                       planned_end_date, status, priority, customer_name,
                                       customer_order_no, remarks, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    order_id = db.execute_insert(sql, (
        order_no,
        data.get('product_id'),
        data.get('quantity', 1),
        data.get('planned_start_date'),
        data.get('planned_end_date'),
        'PENDING',
        data.get('priority', 3),
        data.get('customer_name', ''),
        data.get('customer_order_no', ''),
        data.get('remarks', ''),
        current_user['id']
    ))
    
    # 初始化生产流程
    # 生产流程对应的部门 (sequence_no, department_id, process_name)
    processes = [
        (1, 1, '木工加工'),      # 木工部
        (2, 2, '五金安装'),      # 五金部
        (3, 3, '油漆涂装'),      # 油漆部
        (4, 4, '工艺检验'),      # 工艺部
        (5, 5, '包装入库')       # 包装部
    ]
    
    for seq, dept_id, process_name in processes:
        db.execute_insert("""
            INSERT INTO production_process (order_id, department_id, process_name, sequence_no, status)
            VALUES (%s, %s, %s, %s, 'PENDING')
        """, (order_id, dept_id, process_name, seq))
    
    return success_response({'id': order_id, 'order_no': order_no}, '订单创建成功')

@app.route('/api/production/orders/<int:order_id>', methods=['PUT'])
@token_required
def update_production_order(current_user, order_id):
    """更新生产订单"""
    data = request.get_json()
    
    fields = []
    params = []
    
    update_fields = ['quantity', 'planned_start_date', 'planned_end_date', 
                    'status', 'priority', 'customer_name', 'customer_order_no', 'remarks']
    
    for field in update_fields:
        if field in data:
            fields.append(f"{field} = %s")
            params.append(data[field])
    
    if not fields:
        return error_response('没有要更新的字段')
    
    params.append(order_id)
    sql = f"UPDATE production_orders SET {', '.join(fields)} WHERE id = %s"
    db.execute_update(sql, params)
    
    return success_response(None, '订单更新成功')

@app.route('/api/production/orders/<int:order_id>', methods=['DELETE'])
@token_required
def delete_production_order(current_user, order_id):
    """删除生产订单"""
    db.execute_update("DELETE FROM production_process WHERE order_id = %s", (order_id,))
    db.execute_update("DELETE FROM production_orders WHERE id = %s", (order_id,))
    return success_response(None, '订单删除成功')

@app.route('/api/production/orders/<int:order_id>/processes', methods=['GET'])
@token_required
def get_order_processes(current_user, order_id):
    """获取订单生产流程"""
    sql = """
        SELECT pp.*, d.name as department_name, u.real_name as operator_name
        FROM production_process pp
        JOIN sys_departments d ON pp.department_id = d.id
        LEFT JOIN sys_users u ON pp.operator_id = u.id
        WHERE pp.order_id = %s
        ORDER BY pp.sequence_no
    """
    processes = db.execute_query(sql, (order_id,))
    
    for proc in processes:
        if proc.get('start_time'):
            proc['start_time'] = proc['start_time'].strftime('%Y-%m-%d %H:%M:%S')
        if proc.get('end_time'):
            proc['end_time'] = proc['end_time'].strftime('%Y-%m-%d %H:%M:%S')
        if proc.get('created_at'):
            proc['created_at'] = proc['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    
    return success_response(processes)

@app.route('/api/production/stats', methods=['GET'])
@token_required
def get_production_stats(current_user):
    """获取生产统计"""
    total = db.execute_one("SELECT COUNT(*) as cnt FROM production_orders")
    by_status = db.execute_query("SELECT status, COUNT(*) as cnt FROM production_orders GROUP BY status")
    today = db.execute_one("SELECT COUNT(*) as cnt FROM production_orders WHERE DATE(created_at) = CURDATE()")
    
    status_map = {row['status']: row['cnt'] for row in by_status}
    
    return success_response({
        'total': total['cnt'] if total else 0,
        'pending': status_map.get('PENDING', 0),
        'in_progress': status_map.get('IN_PROGRESS', 0),
        'completed': status_map.get('COMPLETED', 0),
        'today': today['cnt'] if today else 0
    })

@app.route('/api/production/process/<int:process_id>/start', methods=['POST'])
@token_required
def start_process(current_user, process_id):
    """开始生产流程"""
    # 检查流程是否存在
    process = db.execute_one("SELECT * FROM production_process WHERE id = %s", (process_id,))
    if not process:
        return error_response('流程不存在')
    
    if process['status'] != 'PENDING':
        return error_response('只有待处理的流程才能开始')
    
    # 检查前置流程是否完成
    prev_process = db.execute_one(
        """SELECT * FROM production_process 
           WHERE order_id = %s AND sequence_no < %s AND status != 'COMPLETED'
           ORDER BY sequence_no DESC LIMIT 1""",
        (process['order_id'], process['sequence_no'])
    )
    if prev_process:
        return error_response('前置流程尚未完成，请先完成前置流程')
    
    # 更新流程状态
    db.execute_update(
        "UPDATE production_process SET status = 'IN_PROGRESS', start_time = NOW(), operator_id = %s WHERE id = %s",
        (current_user['id'], process_id)
    )
    
    # 如果是第一个流程，更新订单状态为进行中
    if process['sequence_no'] == 1:
        db.execute_update(
            "UPDATE production_orders SET status = 'IN_PROGRESS', actual_start_date = CURDATE() WHERE id = %s AND status = 'PENDING'",
            (process['order_id'],)
        )
    
    return success_response(None, '流程已开始')

@app.route('/api/production/process/<int:process_id>/complete', methods=['POST'])
@token_required
def complete_process(current_user, process_id):
    """完成生产流程"""
    # 检查流程是否存在
    process = db.execute_one("SELECT * FROM production_process WHERE id = %s", (process_id,))
    if not process:
        return error_response('流程不存在')
    
    if process['status'] != 'IN_PROGRESS':
        return error_response('只有进行中的流程才能完成')
    
    # 更新流程状态
    db.execute_update(
        "UPDATE production_process SET status = 'COMPLETED', end_time = NOW() WHERE id = %s",
        (process_id,)
    )
    
    # 检查是否所有流程都已完成
    remaining = db.execute_one(
        "SELECT COUNT(*) as cnt FROM production_process WHERE order_id = %s AND status != 'COMPLETED'",
        (process['order_id'],)
    )
    
    # 如果所有流程都完成，更新订单状态
    if remaining and remaining['cnt'] == 0:
        db.execute_update(
            "UPDATE production_orders SET status = 'COMPLETED', actual_end_date = CURDATE() WHERE id = %s",
            (process['order_id'],)
        )
    
    return success_response(None, '流程已完成')

# ==================== 产品管理接口 ====================

@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    """获取产品列表"""
    keyword = request.args.get('keyword', '')
    
    if keyword:
        sql = """
            SELECT *, standard_cost as unit_price FROM products 
            WHERE product_name LIKE %s OR product_code LIKE %s
            ORDER BY id DESC
        """
        like_keyword = f'%{keyword}%'
        products = db.execute_query(sql, (like_keyword, like_keyword))
    else:
        products = db.execute_query("SELECT *, standard_cost as unit_price FROM products ORDER BY id DESC")
    
    for prod in products:
        prod['unit_price'] = float(prod['unit_price']) if prod.get('unit_price') else 0
        prod['stock_quantity'] = float(prod['stock_quantity']) if prod.get('stock_quantity') else 0
        prod['min_stock'] = float(prod['min_stock']) if prod.get('min_stock') else 0
    
    return success_response(products)

@app.route('/api/products', methods=['POST'])
@token_required
def create_product(current_user):
    """创建产品"""
    data = request.get_json()
    
    product_code = data.get('product_code', '').strip()
    product_name = data.get('product_name', '').strip()
    
    if not product_code or not product_name:
        return error_response('产品编码和名称不能为空')
    
    # 检查编码是否存在
    existing = db.execute_one("SELECT id FROM products WHERE product_code = %s", (product_code,))
    if existing:
        return error_response('产品编码已存在')
    
    sql = """
        INSERT INTO products (product_code, product_name, product_type, specification, 
                             unit, standard_cost, stock_quantity, min_stock, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    product_id = db.execute_insert(sql, (
        product_code,
        product_name,
        data.get('product_type', ''),
        data.get('specification', ''),
        data.get('unit', '件'),
        data.get('unit_price', 0),
        data.get('stock_quantity', 0),
        data.get('min_stock', 0),
        data.get('description', '')
    ))
    
    return success_response({'id': product_id}, '产品创建成功')

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    """更新产品"""
    data = request.get_json()
    
    fields = []
    params = []
    
    # 映射前端字段到数据库字段
    field_mapping = {
        'product_name': 'product_name',
        'product_type': 'product_type',
        'specification': 'specification',
        'unit': 'unit',
        'unit_price': 'standard_cost',
        'stock_quantity': 'stock_quantity',
        'min_stock': 'min_stock',
        'description': 'description'
    }
    
    for frontend_field, db_field in field_mapping.items():
        if frontend_field in data:
            fields.append(f"{db_field} = %s")
            params.append(data[frontend_field])
    
    if not fields:
        return error_response('没有要更新的字段')
    
    params.append(product_id)
    sql = f"UPDATE products SET {', '.join(fields)} WHERE id = %s"
    db.execute_update(sql, params)
    
    return success_response(None, '产品更新成功')

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    """删除产品"""
    # 检查是否有关联的生产订单
    orders = db.execute_one(
        "SELECT COUNT(*) as cnt FROM production_orders WHERE product_id = %s",
        (product_id,)
    )
    if orders and orders['cnt'] > 0:
        return error_response('该产品有关联的生产订单，无法删除')
    
    db.execute_update("DELETE FROM products WHERE id = %s", (product_id,))
    return success_response(None, '产品删除成功')

# ==================== 原材料管理接口 ====================

@app.route('/api/materials', methods=['GET'])
@token_required
def get_materials(current_user):
    """获取原材料列表"""
    keyword = request.args.get('keyword', '')
    
    if keyword:
        sql = """
            SELECT m.id, m.material_code as code, m.material_name as name, 
                   m.material_type, m.specification, m.unit,
                   m.current_stock as stock_quantity, m.safety_stock as min_stock,
                   m.cost as unit_price, m.category_id, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            WHERE m.material_name LIKE %s OR m.material_code LIKE %s
            ORDER BY m.id DESC
        """
        like_keyword = f'%{keyword}%'
        materials = db.execute_query(sql, (like_keyword, like_keyword))
    else:
        sql = """
            SELECT m.id, m.material_code as code, m.material_name as name, 
                   m.material_type, m.specification, m.unit,
                   m.current_stock as stock_quantity, m.safety_stock as min_stock,
                   m.cost as unit_price, m.category_id, c.name as category_name
            FROM materials m
            LEFT JOIN material_categories c ON m.category_id = c.id
            ORDER BY m.id DESC
        """
        materials = db.execute_query(sql)
    
    for mat in materials:
        mat['unit_price'] = float(mat['unit_price']) if mat.get('unit_price') else 0
        mat['stock_quantity'] = float(mat['stock_quantity']) if mat.get('stock_quantity') else 0
        mat['min_stock'] = float(mat['min_stock']) if mat.get('min_stock') else 0
    
    return success_response(materials)

@app.route('/api/materials', methods=['POST'])
@token_required
def create_material(current_user):
    """创建原材料"""
    data = request.get_json()
    
    code = data.get('code', '').strip()
    name = data.get('name', '').strip()
    
    if not code or not name:
        return error_response('物料编码和名称不能为空')
    
    # 检查编码是否存在
    existing = db.execute_one("SELECT id FROM materials WHERE material_code = %s", (code,))
    if existing:
        return error_response('物料编码已存在')
    
    sql = """
        INSERT INTO materials (material_code, material_name, material_type, category_id, specification, 
                              unit, cost, current_stock, safety_stock)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    material_id = db.execute_insert(sql, (
        code,
        name,
        data.get('material_type', ''),
        data.get('category_id'),
        data.get('specification', ''),
        data.get('unit', '个'),
        data.get('unit_price', 0),
        data.get('stock_quantity', 0),
        data.get('min_stock', 0)
    ))
    
    return success_response({'id': material_id}, '物料创建成功')

@app.route('/api/materials/<int:material_id>', methods=['PUT'])
@token_required
def update_material(current_user, material_id):
    """更新原材料"""
    data = request.get_json()
    
    fields = []
    params = []
    
    # 映射前端字段到数据库字段
    field_mapping = {
        'name': 'material_name',
        'category_id': 'category_id',
        'specification': 'specification',
        'unit': 'unit',
        'unit_price': 'cost',
        'stock_quantity': 'current_stock',
        'min_stock': 'safety_stock'
    }
    
    for frontend_field, db_field in field_mapping.items():
        if frontend_field in data:
            fields.append(f"{db_field} = %s")
            params.append(data[frontend_field])
    
    if not fields:
        return error_response('没有要更新的字段')
    
    params.append(material_id)
    sql = f"UPDATE materials SET {', '.join(fields)} WHERE id = %s"
    db.execute_update(sql, params)
    
    return success_response(None, '物料更新成功')

@app.route('/api/materials/<int:material_id>', methods=['DELETE'])
@token_required
def delete_material(current_user, material_id):
    """删除原材料"""
    db.execute_update("DELETE FROM materials WHERE id = %s", (material_id,))
    return success_response(None, '物料删除成功')

@app.route('/api/materials/categories', methods=['GET'])
@token_required
def get_material_categories(current_user):
    """获取材料分类"""
    categories = db.execute_query("SELECT * FROM material_categories ORDER BY id")
    return success_response(categories)

# ==================== 库存管理接口 ====================

@app.route('/api/inventory/stats', methods=['GET'])
@token_required
def get_inventory_stats(current_user):
    """获取库存统计"""
    material_count = db.execute_one("SELECT COUNT(*) as cnt FROM materials")
    material_warning = db.execute_one(
        "SELECT COUNT(*) as cnt FROM materials WHERE current_stock <= safety_stock"
    )
    product_count = db.execute_one("SELECT COUNT(*) as cnt FROM products")
    product_warning = db.execute_one(
        "SELECT COUNT(*) as cnt FROM products WHERE stock_quantity <= min_stock"
    )
    
    return success_response({
        'material_count': material_count['cnt'] if material_count else 0,
        'material_warning': material_warning['cnt'] if material_warning else 0,
        'product_count': product_count['cnt'] if product_count else 0,
        'product_warning': product_warning['cnt'] if product_warning else 0
    })

# ==================== 统计分析接口 ====================

@app.route('/api/statistics/overview', methods=['GET'])
@token_required
def get_statistics_overview(current_user):
    """获取统计概览"""
    # 订单统计
    total_orders = db.execute_one("SELECT COUNT(*) as cnt FROM production_orders")
    today_orders = db.execute_one(
        "SELECT COUNT(*) as cnt FROM production_orders WHERE DATE(created_at) = CURDATE()"
    )
    completed_orders = db.execute_one(
        "SELECT COUNT(*) as cnt FROM production_orders WHERE status = 'COMPLETED'"
    )
    
    # 用户统计
    total_users = db.execute_one("SELECT COUNT(*) as cnt FROM sys_users")
    
    # 产品统计
    total_products = db.execute_one("SELECT COUNT(*) as cnt FROM products")
    
    # 材料统计
    total_materials = db.execute_one("SELECT COUNT(*) as cnt FROM materials")
    
    return success_response({
        'total_orders': total_orders['cnt'] if total_orders else 0,
        'today_orders': today_orders['cnt'] if today_orders else 0,
        'completed_orders': completed_orders['cnt'] if completed_orders else 0,
        'total_users': total_users['cnt'] if total_users else 0,
        'total_products': total_products['cnt'] if total_products else 0,
        'total_materials': total_materials['cnt'] if total_materials else 0
    })

@app.route('/api/statistics/department', methods=['GET'])
@token_required
def get_department_statistics(current_user):
    """获取部门统计"""
    sql = """
        SELECT d.name, d.code,
               COUNT(CASE WHEN pp.status = 'PENDING' THEN 1 END) as pending,
               COUNT(CASE WHEN pp.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
               COUNT(CASE WHEN pp.status = 'COMPLETED' THEN 1 END) as completed
        FROM sys_departments d
        LEFT JOIN production_process pp ON d.id = pp.department_id
        GROUP BY d.id, d.name, d.code
        ORDER BY d.id
    """
    stats = db.execute_query(sql)
    return success_response(stats)

# ==================== 系统配置接口 ====================

@app.route('/api/config/status', methods=['GET'])
def get_status_config():
    """获取状态配置"""
    return success_response(PRODUCTION_STATUS)

@app.route('/api/config/departments', methods=['GET'])
def get_departments_config():
    """获取部门配置"""
    return success_response(DEPARTMENTS)

# ==================== 系统设置接口 ====================

@app.route('/api/settings', methods=['GET'])
@token_required
def get_settings(current_user):
    """获取系统设置"""
    settings = db.execute_query("SELECT setting_key, setting_value FROM sys_settings")
    # 转换为字典格式
    result = {}
    for item in settings:
        key = item['setting_key']
        value = item['setting_value']
        # 转换布尔值
        if value == 'true':
            value = True
        elif value == 'false':
            value = False
        # 转换数字
        elif value and value.isdigit():
            value = int(value)
        result[key] = value
    return success_response(result)

@app.route('/api/settings', methods=['PUT'])
@token_required
def update_settings(current_user):
    """更新系统设置"""
    data = request.get_json()
    
    for key, value in data.items():
        # 转换布尔值为字符串
        if isinstance(value, bool):
            value = 'true' if value else 'false'
        else:
            value = str(value) if value is not None else ''
        
        # 更新或插入设置
        existing = db.execute_one(
            "SELECT id FROM sys_settings WHERE setting_key = %s", (key,)
        )
        if existing:
            db.execute_update(
                "UPDATE sys_settings SET setting_value = %s WHERE setting_key = %s",
                (value, key)
            )
        else:
            db.execute_insert(
                "INSERT INTO sys_settings (setting_key, setting_value) VALUES (%s, %s)",
                (key, value)
            )
    
    return success_response(None, '设置保存成功')

# ==================== 健康检查 ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        db.test_connection()
        return success_response({'database': 'connected'}, 'API服务正常')
    except:
        return error_response('数据库连接失败', 500)

# ==================== 启动服务 ====================

def run_api_server(port=5001):
    """启动API服务（使用Waitress生产服务器）"""
    from waitress import serve
    print(f"✓ API服务器启动: http://127.0.0.1:{port}")
    serve(app, host='127.0.0.1', port=port, threads=4)

if __name__ == '__main__':
    run_api_server()
