import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card,
  Table,
  Tabs,
  Tag,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Button,
  Space,
  message,
  Modal,
  Descriptions,
} from 'antd'
import {
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { departmentApi, productionApi } from '../utils/api'

const { Title, Text } = Typography

// 部门信息映射
const deptInfoMap = {
  1: { name: '木工部', icon: '🪵', color: '#8b4513' },
  2: { name: '五金部', icon: '🔧', color: '#708090' },
  3: { name: '油漆部', icon: '🎨', color: '#ff6347' },
  4: { name: '工艺部', icon: '🏭', color: '#4682b4' },
  5: { name: '包装部', icon: '📦', color: '#daa520' },
  6: { name: '客服部', icon: '📞', color: '#20b2aa' },
  7: { name: '业务部', icon: '💼', color: '#1890ff' },
  8: { name: '原材料仓库', icon: '🏪', color: '#cd853f' },
  9: { name: '成品仓库', icon: '🏠', color: '#2e8b57' },
  10: { name: '工程部', icon: '⚙️', color: '#4169e1' },
  11: { name: '审计部', icon: '📋', color: '#dc143c' },
  12: { name: '采购部', icon: '🛒', color: '#ff8c00' },
  13: { name: '财务部', icon: '💰', color: '#ffd700' },
}

function DepartmentPage() {
  const { deptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [activeTab, setActiveTab] = useState('tasks')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)

  const deptInfo = deptInfoMap[deptId] || { name: '未知部门', icon: '📁', color: '#1890ff' }

  useEffect(() => {
    loadData()
  }, [deptId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, tasksRes, membersRes] = await Promise.all([
        departmentApi.getStats(deptId),
        departmentApi.getTasks(deptId),
        departmentApi.getMembers(deptId),
      ])
      if (statsRes.success) setStats(statsRes.data || {})
      if (tasksRes.success) setTasks(tasksRes.data || [])
      if (membersRes.success) setMembers(membersRes.data || [])
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    PENDING: { text: '待处理', color: 'orange', icon: <ClockCircleOutlined /> },
    IN_PROGRESS: { text: '进行中', color: 'blue', icon: <SyncOutlined spin /> },
    COMPLETED: { text: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  }

  // 开始流程
  const handleStartProcess = async (processId) => {
    try {
      const res = await productionApi.startProcess(processId)
      if (res.success) {
        message.success('流程已开始')
        loadData() // 刷新数据
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err) {
      message.error(err.message || '操作失败')
    }
  }

  // 完成流程
  const handleCompleteProcess = async (processId) => {
    try {
      const res = await productionApi.completeProcess(processId)
      if (res.success) {
        message.success('流程已完成')
        loadData() // 刷新数据
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err) {
      message.error(err.message || '操作失败')
    }
  }

  // 查看详情
  const handleShowDetail = (record) => {
    setCurrentTask(record)
    setDetailVisible(true)
  }

  const taskColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150,
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '工序名称',
      dataIndex: 'process_name',
      key: 'process_name',
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = statusConfig[status] || { text: status, color: 'default' }
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (text) => text || '-',
    },
    {
      title: '完成时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 160,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size={4} style={{ width: '100%', justifyContent: 'center' }}>
          {record.status === 'PENDING' && (
            <Button 
              type="link" 
              size="small"
              style={{ minWidth: 48 }}
              onClick={() => handleStartProcess(record.id)}
            >
              开始
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button 
              type="link" 
              size="small"
              style={{ color: '#52c41a', minWidth: 48 }}
              onClick={() => handleCompleteProcess(record.id)}
            >
              完成
            </Button>
          )}
          {record.status === 'COMPLETED' && (
            <span style={{ color: '#52c41a', minWidth: 48, display: 'inline-block', textAlign: 'center' }}>已完成</span>
          )}
          <Button 
            type="link" 
            size="small"
            onClick={() => handleShowDetail(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ]

  const memberColumns = [
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      render: (text, record) => text || record.username,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '在职' : '离职'}</Tag>
      ),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {/* 页面头部 */}
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                backgroundColor: `${deptInfo.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}
            >
              {deptInfo.icon}
            </div>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {deptInfo.name}
            </Title>
            <Text type="secondary">部门管理与任务追踪</Text>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }}>
            <Statistic title="总任务" value={stats.total || 0} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #fa8c16' }}>
            <Statistic
              title="待处理"
              value={stats.pending || 0}
              suffix="个"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="进行中"
              value={stats.in_progress || 0}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="已完成"
              value={stats.completed || 0}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签页 */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'tasks',
              label: (
                <span>
                  <TeamOutlined />
                  工作任务
                </span>
              ),
              children: (
                <Table
                  dataSource={tasks}
                  columns={taskColumns}
                  rowKey="id"
                  scroll={{ x: 1000 }}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                  locale={{ emptyText: '暂无任务数据' }}
                />
              ),
            },
            {
              key: 'members',
              label: (
                <span>
                  <TeamOutlined />
                  部门成员
                </span>
              ),
              children: (
                <Table
                  dataSource={members}
                  columns={memberColumns}
                  rowKey="id"
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                  locale={{ emptyText: '暂无成员数据' }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 任务详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOutlined style={{ color: '#1890ff' }} />
            <span>任务详情</span>
          </div>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
        centered
        getContainer={false}
      >
        {currentTask && (
          <Descriptions 
            bordered 
            column={2} 
            size="small"
            style={{ marginTop: 16 }}
            labelStyle={{ fontWeight: 500, background: '#fafafa' }}
          >
            <Descriptions.Item label="订单号" span={2}>
              <span style={{ fontWeight: 600, color: '#1890ff' }}>
                {currentTask.order_no}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="产品名称">
              {currentTask.product_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="工序名称">
              {currentTask.process_name}
            </Descriptions.Item>
            <Descriptions.Item label="数量">
              {currentTask.quantity || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag 
                color={
                  currentTask.status === 'COMPLETED' ? 'success' : 
                  currentTask.status === 'IN_PROGRESS' ? 'processing' : 'default'
                }
                icon={
                  currentTask.status === 'COMPLETED' ? <CheckCircleOutlined /> : 
                  currentTask.status === 'IN_PROGRESS' ? <SyncOutlined spin /> : 
                  <ClockCircleOutlined />
                }
              >
                {statusConfig[currentTask.status]?.text || currentTask.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始时间" span={2}>
              {currentTask.start_time || '尚未开始'}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间" span={2}>
              {currentTask.end_time || '尚未完成'}
            </Descriptions.Item>
            {currentTask.description && (
              <Descriptions.Item label="任务说明" span={2}>
                {currentTask.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default DepartmentPage
