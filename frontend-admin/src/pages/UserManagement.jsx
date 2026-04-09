import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { userApi, departmentApi } from '../utils/api'

const { Title } = Typography

function UserManagement() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState('add') // add, edit, view
  const [currentUser, setCurrentUser] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, deptsRes] = await Promise.all([
        userApi.getList({ keyword }),
        departmentApi.getList(),
      ])
      if (usersRes.success) {
        setUsers(usersRes.data || [])
      }
      if (deptsRes.success) {
        setDepartments(deptsRes.data || [])
      }
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData()
  }

  const handleReset = () => {
    setKeyword('')
    userApi.getList({ keyword: '' }).then(res => {
      if (res.success) setUsers(res.data || [])
    })
  }

  const handleAdd = () => {
    setModalType('add')
    setCurrentUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setCurrentUser(record)
    form.setFieldsValue({
      ...record,
      password: '',
    })
    setModalVisible(true)
  }

  const handleView = (record) => {
    setModalType('view')
    setCurrentUser(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await userApi.delete(id)
      if (res.success) {
        message.success('删除成功')
        loadData()
      } else {
        message.error(res.message || '删除失败')
      }
    } catch (err) {
      message.error(err.message || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (modalType === 'add') {
        const res = await userApi.create(values)
        if (res.success) {
          message.success('创建成功')
          setModalVisible(false)
          loadData()
        } else {
          message.error(res.message || '创建失败')
        }
      } else if (modalType === 'edit') {
        const res = await userApi.update(currentUser.id, values)
        if (res.success) {
          message.success('更新成功')
          setModalVisible(false)
          loadData()
        } else {
          message.error(res.message || '更新失败')
        }
      }
    } catch (err) {
      console.error('提交失败:', err)
      if (err.message) {
        message.error(err.message)
      }
    }
  }

  const permissionLevels = [
    { value: 1, label: '超级管理员', color: 'red' },
    { value: 2, label: '管理员', color: 'orange' },
    { value: 3, label: '主管', color: 'blue' },
    { value: 4, label: '员工', color: 'green' },
  ]

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '权限等级',
      dataIndex: 'permission_level',
      key: 'permission_level',
      width: 100,
      render: (level) => {
        const item = permissionLevels.find((p) => p.value === level)
        return item ? <Tag color={item.color}>{item.label}</Tag> : '-'
      },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 160,
      render: (text) => text || '从未登录',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card className="page-header-card" style={{ borderRadius: 8, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            用户管理
          </div>
          <Space>
              <Input
                placeholder="搜索用户名/姓名/手机号"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
              />
              <Button onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加用户
              </Button>
          </Space>
      </Card>

      <Card style={{ borderRadius: 8 }}>
        <Table
          loading={loading}
          dataSource={users}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          modalType === 'add' ? '添加用户' : modalType === 'edit' ? '编辑用户' : '用户详情'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={modalType === 'view' ? () => setModalVisible(false) : handleSubmit}
        width={600}
        okText={modalType === 'view' ? '关闭' : '确定'}
        cancelButtonProps={{ style: { display: modalType === 'view' ? 'none' : 'inline-block' } }}
        getContainer={false}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={modalType === 'view'}
          initialValues={{ is_active: 1, permission_level: 4 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="密码"
                rules={modalType === 'add' ? [{ required: true, message: '请输入密码' }] : []}
              >
                <Input.Password
                  placeholder={modalType === 'edit' ? '留空则不修改' : '请输入密码'}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="real_name" label="真实姓名">
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department_id" label="所属部门">
                <Select placeholder="请选择部门" allowClear>
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="permission_level" label="权限等级">
                <Select placeholder="请选择权限等级">
                  {permissionLevels.map((item) => (
                    <Select.Option key={item.value} value={item.value}>
                      {item.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="状态">
                <Select placeholder="请选择状态">
                  <Select.Option value={1}>启用</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
