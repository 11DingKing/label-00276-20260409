import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Avatar, Dropdown, Space, Typography, message } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  ShoppingOutlined,
  InboxOutlined,
  CaretDownOutlined,
} from '@ant-design/icons'
import { departmentApi } from '../utils/api'
import './MainLayout.css'

const { Header, Content } = Layout
const { Text } = Typography

const menuConfig = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: 'dept', icon: <TeamOutlined />, label: '部门管理', expandable: true },
  { key: '/production', icon: <AppstoreOutlined />, label: '生产管理' },
  { key: '/materials', icon: <DatabaseOutlined />, label: '原材料管理' },
  { key: '/products', icon: <ShoppingOutlined />, label: '成品管理' },
  { key: '/inventory', icon: <InboxOutlined />, label: '库存管理' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

const deptIcons = {
  WOODWORK: '🪵', HARDWARE: '🔧', PAINTING: '🎨', CRAFT: '🏭', PACKAGING: '📦',
  CUSTOMER_SERVICE: '📞', BUSINESS: '💼', RAW_WAREHOUSE: '🏪', PRODUCT_WAREHOUSE: '🏠',
  ENGINEERING: '⚙️', AUDIT: '📋', PURCHASING: '🛒', FINANCE: '💰',
}

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [departments, setDepartments] = useState([])
  const [user, setUser] = useState({})
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
    departmentApi.getList().then(res => {
      if (res.success) setDepartments(res.data || [])
    }).catch(() => {})
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    message.success('已退出登录')
    navigate('/login')
  }

  const userMenu = [
    { key: 'settings', icon: <SettingOutlined />, label: '系统设置', onClick: () => navigate('/settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  const isActive = (key) => location.pathname === key
  const isDeptActive = location.pathname.startsWith('/department/')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <aside className="sidebar">
        <div className="sidebar-logo">家具生产管理系统</div>
        <nav className="sidebar-nav">
          {menuConfig.map(item => {
            if (item.expandable) {
              return (
                <div key={item.key} className="nav-group">
                  <div
                    className={`nav-item ${isDeptActive ? 'active' : ''}`}
                    onClick={() => setExpanded(!expanded)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.label}</span>
                    <CaretDownOutlined className={`nav-arrow ${expanded ? 'expanded' : ''}`} />
                  </div>
                  <div className={`nav-sub ${expanded ? 'show' : ''}`}>
                    {departments.map(d => (
                      <div
                        key={d.id}
                        className={`nav-sub-item ${isActive(`/department/${d.id}`) ? 'active' : ''}`}
                        onClick={() => navigate(`/department/${d.id}`)}
                      >
                        <span className="dept-icon">{deptIcons[d.code] || '📁'}</span>
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return (
              <div
                key={item.key}
                className={`nav-item ${isActive(item.key) ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </div>
            )
          })}
        </nav>
      </aside>

      <Layout className="main-layout">
        <Header className="main-header">
          <Dropdown menu={{ items: userMenu }} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Text>{user.real_name || user.username || '用户'}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
