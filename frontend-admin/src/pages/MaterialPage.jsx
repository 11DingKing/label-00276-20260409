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
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Typography,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DatabaseOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { materialApi, inventoryApi } from '../utils/api'

const { Title } = Typography

function MaterialPage() {
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [keyword, setKeyword] = useState('')
  const [stats, setStats] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState('add') // add, edit, view
  const [currentMaterial, setCurrentMaterial] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadCategories()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [materialsRes, statsRes] = await Promise.all([
        materialApi.getList({ keyword }),
        inventoryApi.getStats(),
      ])
      if (materialsRes.success) setMaterials(materialsRes.data || [])
      if (statsRes.success) setStats(statsRes.data || {})
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await materialApi.getCategories()
      if (res.success) setCategories(res.data || [])
    } catch (err) {
      console.error('加载分类失败:', err)
    }
  }

  const handleSearch = () => {
    loadData()
  }

  const handleReset = () => {
    setKeyword('')
    materialApi.getList({ keyword: '' }).then(res => {
      if (res.success) setMaterials(res.data || [])
    })
  }

  const handleAdd = () => {
    setModalType('add')
    setCurrentMaterial(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setCurrentMaterial(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleView = (record) => {
    setModalType('view')
    setCurrentMaterial(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await materialApi.delete(id)
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
        const res = await materialApi.create(values)
        if (res.success) {
          message.success('创建成功')
          setModalVisible(false)
          loadData()
        } else {
          message.error(res.message || '创建失败')
        }
      } else if (modalType === 'edit') {
        const res = await materialApi.update(currentMaterial.id, values)
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

  const columns = [
    {
      title: '物料编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '物料名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '库存数量',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 100,
      render: (val, record) => (
        <span style={{ color: val <= (record.min_stock || 0) ? '#ff4d4f' : 'inherit' }}>
          {val || 0}
        </span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 100,
      render: (text) => text || 0,
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (val) => (val ? `¥${val.toFixed(2)}` : '-'),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const isLow = record.stock_quantity <= (record.min_stock || 0)
        return isLow ? (
          <Tag icon={<WarningOutlined />} color="warning">
            库存不足
          </Tag>
        ) : (
          <Tag color="success">正常</Tag>
        )
      },
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
            title="确定要删除这个物料吗？"
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
            <DatabaseOutlined style={{ marginRight: 8 }} />
            原材料管理
          </div>
          <Space>
              <Input
                placeholder="搜索物料编码/名称"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 220 }}
              />
              <Button onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加物料
              </Button>
          </Space>
      </Card>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="物料总数" value={stats.material_count || 0} suffix="种" />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="库存预警"
              value={stats.material_warning || 0}
              suffix="种"
              valueStyle={{ color: stats.material_warning > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={stats.material_warning > 0 ? <WarningOutlined /> : null}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <Table
          loading={loading}
          dataSource={materials}
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
          modalType === 'add' ? '添加物料' : modalType === 'edit' ? '编辑物料' : '物料详情'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={modalType === 'view' ? () => setModalVisible(false) : handleSubmit}
        width={700}
        okText={modalType === 'view' ? '关闭' : '确定'}
        cancelButtonProps={{ style: { display: modalType === 'view' ? 'none' : 'inline-block' } }}
        getContainer={false}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={modalType === 'view'}
          initialValues={{ unit: '个', stock_quantity: 0, min_stock: 0, unit_price: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="物料编码"
                rules={[{ required: true, message: '请输入物料编码' }]}
              >
                <Input placeholder="请输入物料编码" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="物料名称"
                rules={[{ required: true, message: '请输入物料名称' }]}
              >
                <Input placeholder="请输入物料名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category_id" label="分类">
                <Select placeholder="请选择分类" allowClear>
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specification" label="规格">
                <Input placeholder="请输入规格" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="请输入单位" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit_price" label="单价(元)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stock_quantity" label="库存数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="min_stock" label="最低库存">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default MaterialPage
