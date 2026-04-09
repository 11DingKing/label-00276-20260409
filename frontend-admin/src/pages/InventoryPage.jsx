import React, { useState, useEffect } from 'react'
import { Card, Table, Tabs, Row, Col, Typography, Statistic, Spin } from 'antd'
import { InboxOutlined, WarningOutlined } from '@ant-design/icons'
import { materialApi, productApi, inventoryApi } from '../utils/api'

const { Title } = Typography

function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState([])
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({})
  const [activeTab, setActiveTab] = useState('materials')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [materialsRes, productsRes, statsRes] = await Promise.all([
        materialApi.getList(),
        productApi.getList(),
        inventoryApi.getStats(),
      ])
      if (materialsRes.success) setMaterials(materialsRes.data || [])
      if (productsRes.success) setProducts(productsRes.data || [])
      if (statsRes.success) setStats(statsRes.data || {})
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const materialColumns = [
    { title: '物料编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '物料名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '分类', dataIndex: 'category_name', key: 'category_name', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
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
    { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock', width: 100 },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (val) => (val ? `¥${val.toFixed(2)}` : '-'),
    },
  ]

  const productColumns = [
    { title: '产品编码', dataIndex: 'product_code', key: 'product_code', width: 120 },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', width: 150 },
    { title: '分类', dataIndex: 'product_type', key: 'product_type', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
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
    { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock', width: 100 },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (val) => (val ? `¥${val.toFixed(2)}` : '-'),
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
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <InboxOutlined style={{ marginRight: 8 }} />
          库存管理
        </Title>
      </Card>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }}>
            <Statistic title="原材料种类" value={stats.material_count || 0} suffix="种" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #fa8c16' }}>
            <Statistic
              title="原材料预警"
              value={stats.material_warning || 0}
              suffix="种"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }}>
            <Statistic title="成品种类" value={stats.product_count || 0} suffix="种" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #ff4d4f' }}>
            <Statistic
              title="成品预警"
              value={stats.product_warning || 0}
              suffix="种"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'materials',
              label: '原材料库存',
              children: (
                <Table
                  dataSource={materials}
                  columns={materialColumns}
                  rowKey="id"
                  scroll={{ x: 850 }}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                />
              ),
            },
            {
              key: 'products',
              label: '成品库存',
              children: (
                <Table
                  dataSource={products}
                  columns={productColumns}
                  rowKey="id"
                  scroll={{ x: 850 }}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default InventoryPage
