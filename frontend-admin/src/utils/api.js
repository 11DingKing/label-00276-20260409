import axios from 'axios'

// 判断是否为桌面应用模式（通过端口判断）
const isDesktopApp = window.location.port === '3002'

// 创建axios实例
const api = axios.create({
  baseURL: isDesktopApp ? 'http://127.0.0.1:5000/api' : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token过期，跳转登录
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error.response.data)
    }
    return Promise.reject({ message: '网络错误，请检查网络连接' })
  }
)

// ==================== 认证接口 ====================
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getUserInfo: () => api.get('/auth/info'),
}

// ==================== 用户管理接口 ====================
export const userApi = {
  getList: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ==================== 部门管理接口 ====================
export const departmentApi = {
  getList: () => api.get('/departments'),
  getTasks: (deptId) => api.get(`/departments/${deptId}/tasks`),
  getMembers: (deptId) => api.get(`/departments/${deptId}/members`),
  getStats: (deptId) => api.get(`/departments/${deptId}/stats`),
}

// ==================== 生产管理接口 ====================
export const productionApi = {
  getOrders: (params) => api.get('/production/orders', { params }),
  createOrder: (data) => api.post('/production/orders', data),
  updateOrder: (id, data) => api.put(`/production/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/production/orders/${id}`),
  getProcesses: (orderId) => api.get(`/production/orders/${orderId}/processes`),
  getStats: () => api.get('/production/stats'),
  // 生产流程操作
  startProcess: (processId) => api.post(`/production/process/${processId}/start`),
  completeProcess: (processId) => api.post(`/production/process/${processId}/complete`),
}

// ==================== 产品管理接口 ====================
export const productApi = {
  getList: (params) => api.get('/products', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}

// ==================== 原材料管理接口 ====================
export const materialApi = {
  getList: (params) => api.get('/materials', { params }),
  getCategories: () => api.get('/materials/categories'),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
}

// ==================== 库存管理接口 ====================
export const inventoryApi = {
  getStats: () => api.get('/inventory/stats'),
}

// ==================== 统计分析接口 ====================
export const statisticsApi = {
  getOverview: () => api.get('/statistics/overview'),
  getDepartment: () => api.get('/statistics/department'),
}

// ==================== 系统配置接口 ====================
export const configApi = {
  getStatusConfig: () => api.get('/config/status'),
  getDepartmentsConfig: () => api.get('/config/departments'),
}

// ==================== 系统设置接口 ====================
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

export default api
