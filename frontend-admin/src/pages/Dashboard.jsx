import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Typography, List, Tag, Spin, Progress } from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  ShoppingOutlined,
  DatabaseOutlined,
  TeamOutlined,
  BarChartOutlined,
  InboxOutlined,
  AppstoreOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { statisticsApi, productionApi } from '../utils/api'

const { Title, Text } = Typography

// 统计卡片组件 - 现代简约风格
const StatCard = ({ title, value, icon, color, suffix }) => (
  <Card
    hoverable
    style={{
      borderRadius: 12,
      border: 'none',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}
    bodyStyle={{ padding: 20 }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Text style={{ fontSize: 13, color: '#8c8c8c' }}>{title}</Text>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#262626' }}>{value}</span>
          <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 4 }}>{suffix}</span>
        </div>
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${color}15, ${color}25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color,
        }}
      >
        {icon}
      </div>
    </div>
  </Card>
)

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [user, setUser] = useState({})

  useEffect(() => {
    const userInfo = localStorage.getItem('user')
    if (userInfo) {
      setUser(JSON.parse(userInfo))
    }
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes] = await Promise.all([
        statisticsApi.getOverview(),
        productionApi.getOrders({ limit: 5 }),
      ])
      if (statsRes.success) {
        setStats(statsRes.data || {})
      }
      if (ordersRes.success) {
        setRecentOrders((ordersRes.data || []).slice(0, 5))
      }
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    PENDING: { text: '待生产', color: '#faad14', bg: '#fffbe6' },
    IN_PROGRESS: { text: '生产中', color: '#1890ff', bg: '#e6f7ff' },
    COMPLETED: { text: '已完成', color: '#52c41a', bg: '#f6ffed' },
    CANCELLED: { text: '已取消', color: '#8c8c8c', bg: '#fafafa' },
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  // 计算完成率
  const completionRate = stats.total_orders > 0 
    ? Math.round((stats.completed_orders || 0) / stats.total_orders * 100) 
    : 0

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 欢迎横幅 - 使用蓝色渐变 */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
          boxShadow: '0 4px 20px rgba(24, 144, 255, 0.3)',
        }}
        bodyStyle={{ padding: '32px 40px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ color: 'white', marginBottom: 8, fontWeight: 600 }}>
              欢迎回来，{user.real_name || user.username || '管理员'}！
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
              今日是美好的一天，祝您工作顺利！
            </Text>
          </Col>
          <Col>
            <Row gutter={16}>
              {[
                { title: '新建订单', icon: <FileTextOutlined />, path: '/production' },
                { title: '用户管理', icon: <UserOutlined />, path: '/users' },
                { title: '部门管理', icon: <TeamOutlined />, path: '/department/1' },
                { title: '数据统计', icon: <BarChartOutlined />, path: '/statistics' },
              ].map((action) => (
                <Col key={action.title}>
                  <div
                    onClick={() => navigate(action.path)}
                    style={{
                      textAlign: 'center',
                      padding: '16px 20px',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      color: 'white',
                      transition: 'all 0.3s',
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{action.icon}</div>
                    <div style={{ fontSize: 13 }}>{action.title}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 - 使用蓝绿色系 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总订单数"
            value={stats.total_orders || 0}
            icon={<FileTextOutlined />}
            color="#1890ff"
            suffix="单"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="今日新增"
            value={stats.today_orders || 0}
            icon={<RiseOutlined />}
            color="#52c41a"
            suffix="单"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="用户总数"
            value={stats.total_users || 0}
            icon={<UserOutlined />}
            color="#13c2c2"
            suffix="人"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="产品数量"
            value={stats.total_products || 0}
            icon={<ShoppingOutlined />}
            color="#faad14"
            suffix="个"
          />
        </Col>
      </Row>

      {/* 下方内容区 */}
      <Row gutter={20}>
        {/* 左侧 - 最近订单 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                最近订单
              </span>
            }
            extra={
              <a 
                onClick={() => navigate('/production')}
                style={{ color: '#1890ff', fontSize: 14 }}
              >
                查看全部 →
              </a>
            }
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              marginBottom: 20,
            }}
            bodyStyle={{ padding: '4px 20px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentOrders}
              locale={{ emptyText: '暂无订单数据' }}
              renderItem={(item) => {
                const status = statusConfig[item.status] || statusConfig.PENDING
                return (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                        </div>
                      }
                      title={
                        <span style={{ fontWeight: 500, color: '#262626', fontSize: 14 }}>
                          {item.order_no}
                        </span>
                      }
                      description={
                        <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                          {item.product_name || '未知产品'} · 数量 {item.quantity}
                        </Text>
                      }
                    />
                    <Tag
                      style={{
                        border: 'none',
                        borderRadius: 6,
                        padding: '2px 10px',
                        background: status.bg,
                        color: status.color,
                        fontWeight: 500,
                        fontSize: 12,
                      }}
                    >
                      {status.text}
                    </Tag>
                  </List.Item>
                )
              }}
            />
          </Card>

          {/* 生产进度 */}
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                订单完成率
              </span>
            }
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row align="middle" gutter={24}>
              <Col>
                <Progress
                  type="circle"
                  percent={completionRate}
                  size={100}
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                  strokeWidth={8}
                />
              </Col>
              <Col flex={1}>
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <div style={{ padding: '10px 14px', background: '#f6ffed', borderRadius: 8 }}>
                      <Text style={{ color: '#8c8c8c', fontSize: 12 }}>已完成</Text>
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#52c41a' }}>
                        {stats.completed_orders || 0}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ padding: '10px 14px', background: '#e6f7ff', borderRadius: 8 }}>
                      <Text style={{ color: '#8c8c8c', fontSize: 12 }}>进行中</Text>
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#1890ff' }}>
                        {(stats.total_orders || 0) - (stats.completed_orders || 0)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 右侧 - 快捷入口 + 系统状态 合并 */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <AppstoreOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                快捷入口
              </span>
            }
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              marginBottom: 20,
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={[12, 12]}>
              {[
                { title: '生产管理', icon: <AppstoreOutlined />, color: '#1890ff', path: '/production' },
                { title: '原材料', icon: <DatabaseOutlined />, color: '#52c41a', path: '/materials' },
                { title: '成品管理', icon: <ShoppingOutlined />, color: '#13c2c2', path: '/products' },
                { title: '库存管理', icon: <InboxOutlined />, color: '#faad14', path: '/inventory' },
              ].map((item) => (
                <Col span={12} key={item.title}>
                  <div
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '14px 12px',
                      borderRadius: 10,
                      border: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = item.color
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f0f0f0'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${item.color}10, ${item.color}20)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        fontSize: 20,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <Text style={{ fontSize: 13, color: '#262626' }}>{item.title}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 系统状态 */}
          <Card
            title={<span style={{ fontWeight: 600, fontSize: 16 }}>系统状态</span>}
            style={{ 
              borderRadius: 16, 
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
            bodyStyle={{ padding: '12px 20px' }}
          >
            {[
              { label: '数据库连接', value: <Tag color="success" style={{ margin: 0 }}>正常</Tag> },
              { label: 'API服务', value: <Tag color="success" style={{ margin: 0 }}>运行中</Tag> },
              { label: '系统版本', value: <Text style={{ color: '#262626' }}>v2.0.0</Text> },
            ].map((item, idx) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < 2 ? '1px solid #f5f5f5' : 'none',
                }}
              >
                <Text style={{ color: '#8c8c8c', fontSize: 13 }}>{item.label}</Text>
                {item.value}
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
