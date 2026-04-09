import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Typography, List, Tag, Spin, Empty } from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { dashboardApi } from '../utils/api'

const { Title, Text } = Typography

const StatCard = ({ title, value, icon, color, change, suffix = '' }) => {
  const isPositive = change >= 0
  const changeColor = isPositive ? '#52c41a' : '#ff4d4f'
  const ChangeIcon = isPositive ? RiseOutlined : FallOutlined

  return (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ fontSize: 13, color: '#8c8c8c' }}>{title}</Text>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 28, fontWeight: 600, color: '#262626' }}>{value}</span>
            {suffix && <span style={{ fontSize: 14, color: '#8c8c8c', marginLeft: 4 }}>{suffix}</span>}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
            <ChangeIcon style={{ fontSize: 12, color: changeColor, marginRight: 2 }} />
            <Text style={{ fontSize: 12, color: changeColor, fontWeight: 500 }}>
              {Math.abs(change)}%
            </Text>
            <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 4 }}>较昨日</Text>
          </div>
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}15, ${color}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [trendData, setTrendData] = useState({ dates: [], production: [], quality_rate: [] })
  const [orderStatusData, setOrderStatusData] = useState([])
  const [recentExceptions, setRecentExceptions] = useState([])
  const [user, setUser] = useState({})

  const trendChartRef = useRef(null)
  const pieChartRef = useRef(null)
  const trendChartInstance = useRef(null)
  const pieChartInstance = useRef(null)

  useEffect(() => {
    const userInfo = localStorage.getItem('user')
    if (userInfo) {
      setUser(JSON.parse(userInfo))
    }
    loadData()

    return () => {
      trendChartInstance.current?.dispose()
      pieChartInstance.current?.dispose()
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, trendRes, statusRes, exceptionsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTrend(),
        dashboardApi.getOrderStatus(),
        dashboardApi.getRecentExceptions(),
      ])

      if (statsRes.success) {
        setStats(statsRes.data || {})
      }
      if (trendRes.success) {
        setTrendData(trendRes.data || { dates: [], production: [], quality_rate: [] })
      }
      if (statusRes.success) {
        setOrderStatusData(statusRes.data || [])
      }
      if (exceptionsRes.success) {
        setRecentExceptions(exceptionsRes.data || [])
      }
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && trendChartRef.current && trendData.dates.length > 0) {
      initTrendChart()
    }
  }, [loading, trendData])

  useEffect(() => {
    if (!loading && pieChartRef.current && orderStatusData.length > 0) {
      initPieChart()
    }
  }, [loading, orderStatusData])

  const initTrendChart = () => {
    if (trendChartInstance.current) {
      trendChartInstance.current.dispose()
    }

    trendChartInstance.current = echarts.init(trendChartRef.current)

    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#f0f0f0',
        borderWidth: 1,
        textStyle: { color: '#262626' },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: '#1890ff', type: 'dashed' },
        },
      },
      legend: {
        data: ['产量', '良品率'],
        top: 0,
        right: 60,
        textStyle: { color: '#8c8c8c', fontSize: 12 },
        itemGap: 20,
      },
      grid: {
        left: 60,
        right: 80,
        bottom: 40,
        top: 50,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: trendData.dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#8c8c8c', fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '产量',
          position: 'left',
          axisLine: { show: false },
          axisLabel: { color: '#8c8c8c', fontSize: 12 },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '良品率',
          position: 'right',
          min: 0,
          max: 100,
          axisLine: { show: false },
          axisLabel: { color: '#8c8c8c', fontSize: 12, formatter: '{value}%' },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '产量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#1890ff', width: 2 },
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ]),
          },
          data: trendData.production,
        },
        {
          name: '良品率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#52c41a', width: 2 },
          itemStyle: { color: '#52c41a' },
          yAxisIndex: 1,
          data: trendData.quality_rate,
        },
      ],
    }

    trendChartInstance.current.setOption(option)

    const handleResize = () => {
      trendChartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }

  const initPieChart = () => {
    if (pieChartInstance.current) {
      pieChartInstance.current.dispose()
    }

    pieChartInstance.current = echarts.init(pieChartRef.current)

    const pieData = orderStatusData.map((item) => ({
      name: item.name,
      value: item.value,
      itemStyle: { color: item.color },
      status: item.status,
    }))

    const total = pieData.reduce((sum, item) => sum + item.value, 0)

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#f0f0f0',
        borderWidth: 1,
        textStyle: { color: '#262626' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 10,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 15,
        textStyle: { color: '#8c8c8c', fontSize: 11 },
        formatter: (name) => {
          const item = pieData.find((d) => d.name === name)
          const percent = total > 0 ? ((item?.value || 0) / total * 100).toFixed(1) : 0
          return `${name} ${item?.value || 0}(${percent}%)`
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '60%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#262626',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: { show: false },
          data: pieData,
        },
      ],
    }

    pieChartInstance.current.setOption(option)

    pieChartInstance.current.on('click', (params) => {
      const statusMap = {
        '待排产': 'PENDING',
        '生产中': 'IN_PROGRESS',
        '已完成': 'COMPLETED',
        '异常': 'CANCELLED',
      }
      const status = statusMap[params.name]
      if (status) {
        navigate(`/production?status=${status}`)
      }
    })

    const handleResize = () => {
      pieChartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }

  const exceptionStatusConfig = {
    '待处理': { color: '#ff4d4f', bg: '#fff1f0' },
    '处理中': { color: '#faad14', bg: '#fffbe6' },
    '已处理': { color: '#52c41a', bg: '#f6ffed' },
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 24px' }}>
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
          boxShadow: '0 4px 20px rgba(24, 144, 255, 0.3)',
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ color: 'white', marginBottom: 6, fontWeight: 600 }}>
              欢迎回来，{user.real_name || user.username || '管理员'}！
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              今日是美好的一天，祝您工作顺利！
            </Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            title="今日产量"
            value={stats.today_production || 0}
            icon={<FileTextOutlined />}
            color="#1890ff"
            change={stats.today_production_change || 0}
            suffix="单"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            title="在制品数量"
            value={stats.in_progress || 0}
            icon={<ClockCircleOutlined />}
            color="#faad14"
            change={stats.in_progress_change || 0}
            suffix="单"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            title="良品率"
            value={stats.quality_rate || 0}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
            change={stats.quality_rate_change || 0}
            suffix="%"
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            title="设备利用率"
            value={stats.equipment_rate || 0}
            icon={<ToolOutlined />}
            color="#13c2c2"
            change={stats.equipment_rate_change || 0}
            suffix="%"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <RiseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                生产趋势
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
            <div ref={trendChartRef} style={{ height: 320 }} />
          </Card>

          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <WarningOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                最近异常
              </span>
            }
            style={{
              borderRadius: 16,
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
            bodyStyle={{ padding: '4px 20px' }}
          >
            {recentExceptions.length > 0 ? (
              <List
                dataSource={recentExceptions.slice(0, 5)}
                locale={{ emptyText: '暂无异常记录' }}
                renderItem={(item) => {
                  const statusConfig = exceptionStatusConfig[item.handle_status] || exceptionStatusConfig['待处理']
                  return (
                    <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, #fff1f0, #ffa39e)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <WarningOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 500, color: '#262626', fontSize: 14 }}>
                              {item.order_no}
                            </span>
                            <Tag
                              style={{
                                border: 'none',
                                borderRadius: 6,
                                padding: '2px 10px',
                                background: statusConfig.bg,
                                color: statusConfig.color,
                                fontWeight: 500,
                                fontSize: 12,
                              }}
                            >
                              {item.handle_status}
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ color: '#8c8c8c', fontSize: 12, marginRight: 12 }}>
                                {item.time}
                              </Text>
                              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                                {item.exception_type}
                              </Tag>
                            </div>
                            <Text style={{ color: '#595959', fontSize: 12 }}>
                              {item.product_name} - {item.process_name}
                              {item.remarks && ` · ${item.remarks}`}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            ) : (
              <Empty description="暂无异常记录" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                工单状态
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
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div ref={pieChartRef} style={{ height: 280 }} />
            <Text style={{ fontSize: 11, color: '#bfbfbf', display: 'block', textAlign: 'center', marginTop: 8 }}>
              点击扇区可筛选对应状态的工单
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard