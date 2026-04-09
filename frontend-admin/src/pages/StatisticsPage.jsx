import React, { useState, useEffect } from 'react'
import { Card, Table, Row, Col, Typography, Statistic, Progress, Spin } from 'antd'
import {
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { statisticsApi } from '../utils/api'

const { Title } = Typography

function StatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({})
  const [deptStats, setDeptStats] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, deptRes] = await Promise.all([
        statisticsApi.getOverview(),
        statisticsApi.getDepartment(),
      ])
      if (overviewRes.success) setOverview(overviewRes.data || {})
      if (deptRes.success) setDeptStats(deptRes.data || [])
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const deptColumns = [
    {
      title: '部门',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '待处理',
      dataIndex: 'pending',
      key: 'pending',
      width: 80,
      render: (val) => <span style={{ color: '#fa8c16' }}>{val || 0}</span>,
    },
    {
      title: '进行中',
      dataIndex: 'in_progress',
      key: 'in_progress',
      width: 80,
      render: (val) => <span style={{ color: '#1890ff' }}>{val || 0}</span>,
    },
    {
      title: '已完成',
      dataIndex: 'completed',
      key: 'completed',
      width: 80,
      render: (val) => <span style={{ color: '#52c41a' }}>{val || 0}</span>,
    },
    {
      title: '完成率',
      key: 'rate',
      width: 200,
      render: (_, record) => {
        const total = (record.pending || 0) + (record.in_progress || 0) + (record.completed || 0)
        const percent = total > 0 ? Math.round((record.completed / total) * 100) : 0
        return <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
      },
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  const completionRate =
    overview.total_orders > 0
      ? Math.round((overview.completed_orders / overview.total_orders) * 100)
      : 0

  return (
    <div>
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          数据统计
        </Title>
      </Card>

      {/* 概览统计 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="订单总数"
              value={overview.total_orders || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="今日新增"
              value={overview.today_orders || 0}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              suffix="单"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="用户总数"
              value={overview.total_users || 0}
              prefix={<UserOutlined style={{ color: '#13c2c2' }} />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="产品数量"
              value={overview.total_products || 0}
              prefix={<ShoppingOutlined style={{ color: '#fa8c16' }} />}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      {/* 订单完成率 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="订单完成率" style={{ borderRadius: 8, height: '100%' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={completionRate}
                size={180}
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }}
              />
              <div style={{ marginTop: 24 }}>
                <Row gutter={48} justify="center">
                  <Col>
                    <Statistic title="已完成" value={overview.completed_orders || 0} suffix="单" />
                  </Col>
                  <Col>
                    <Statistic title="总订单" value={overview.total_orders || 0} suffix="单" />
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <TeamOutlined style={{ marginRight: 8 }} />
                部门任务统计
              </span>
            }
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Table
              dataSource={deptStats}
              columns={deptColumns}
              rowKey="code"
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StatisticsPage
