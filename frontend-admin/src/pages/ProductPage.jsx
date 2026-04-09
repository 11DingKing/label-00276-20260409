import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
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
  ShoppingOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { productApi, inventoryApi } from '../utils/api'

const { Title } = Typography

function ProductPage() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [stats, setStats] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState('add') // add, edit, view
  const [currentProduct, setCurrentProduct] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, statsRes] = await Promise.all([
        productApi.getList({ keyword }),
        inventoryApi.getStats(),
      ])
      if (productsRes.success) setProducts(productsRes.data || [])
      if (statsRes.success) setStats(statsRes.data || {})
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData()
  }

  const handleReset = () => {
    setKeyword('')
    productApi.getList({ keyword: '' }).then(res => {
      if (res.success) setProducts(res.data || [])
    })
  }

  const handleAdd = () => {
    setModalType('add')
    setCurrentProduct(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setCurrentProduct(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleView = (record) => {
    setModalType('view')
    setCurrentProduct(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await productApi.delete(id)
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
        const res = await productApi.create(values)
        if (res.success) {
          message.success('创建成功')
          setModalVisible(false)
          loadData()
        } else {
          message.error(res.message || '创建失败')
        }
      } else if (modalType === 'edit') {
        const res = await productApi.update(currentProduct.id, values)
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
      title: '产品编码',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 120,
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'product_type',
      key: 'product_type',
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
            title="确定要删除这个产品吗？"
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
            <ShoppingOutlined style={{ marginRight: 8 }} />
            成品管理
          </div>
          <Space>
              <Input
                placeholder="搜索产品编码/名称"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 220 }}
              />
              <Button onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加产品
              </Button>
          </Space>
      </Card>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="产品总数" value={stats.product_count || 0} suffix="种" />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="库存预警"
              value={stats.product_warning || 0}
              suffix="种"
              valueStyle={{ color: stats.product_warning > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={stats.product_warning > 0 ? <WarningOutlined /> : null}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <Table
          loading={loading}
          dataSource={products}
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
          modalType === 'add' ? '添加产品' : modalType === 'edit' ? '编辑产品' : '产品详情'
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
          initialValues={{ unit: '件', stock_quantity: 0, min_stock: 0, unit_price: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_code"
                label="产品编码"
                rules={[{ required: true, message: '请输入产品编码' }]}
              >
                <Input placeholder="请输入产品编码" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_name"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="product_type" label="分类">
                <Input placeholder="请输入分类" />
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
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入产品描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductPage
