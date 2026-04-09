import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Switch, Divider, Row, Col, Typography, message, Spin } from 'antd'
import { SettingOutlined, SaveOutlined } from '@ant-design/icons'
import { useSettings } from '../utils/settingsContext'

const { Title, Text } = Typography

function SystemSettings() {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const { settings, loading, updateSettings, loadSettings } = useSettings()

  useEffect(() => {
    if (!loading && settings) {
      // 转换下划线命名为驼峰命名
      form.setFieldsValue({
        siteName: settings.site_name || '家具生产管理系统',
        companyName: settings.company_name || '',
        adminEmail: settings.admin_email || '',
        adminPhone: settings.admin_phone || '',
        twoFactorAuth: settings.two_factor_auth || false,
        loginLockout: settings.login_lockout !== false,
        passwordExpireDays: settings.password_expire_days || 90,
        stockWarningNotify: settings.stock_warning_notify !== false,
        orderStatusNotify: settings.order_status_notify !== false,
        maintenanceNotify: settings.maintenance_notify !== false,
      })
    }
  }, [loading, settings, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      
      // 转换驼峰命名为下划线命名
      const data = {
        site_name: values.siteName,
        company_name: values.companyName,
        admin_email: values.adminEmail,
        admin_phone: values.adminPhone,
        two_factor_auth: values.twoFactorAuth,
        login_lockout: values.loginLockout,
        password_expire_days: values.passwordExpireDays,
        stock_warning_notify: values.stockWarningNotify,
        order_status_notify: values.orderStatusNotify,
        maintenance_notify: values.maintenanceNotify,
      }
      
      const success = await updateSettings(data)
      if (success) {
        message.success('设置保存成功')
        // 重新加载设置
        loadSettings()
      } else {
        message.error('保存失败')
      }
    } catch (err) {
      console.error('保存失败:', err)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

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
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </Title>
      </Card>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="基本设置" style={{ borderRadius: 8, marginBottom: 24 }}>
              <Form.Item name="siteName" label="系统名称">
                <Input placeholder="请输入系统名称" />
              </Form.Item>
              <Form.Item name="companyName" label="公司名称">
                <Input placeholder="请输入公司名称" />
              </Form.Item>
              <Form.Item name="adminEmail" label="管理员邮箱">
                <Input placeholder="请输入管理员邮箱" />
              </Form.Item>
              <Form.Item name="adminPhone" label="管理员电话">
                <Input placeholder="请输入管理员电话" />
              </Form.Item>
            </Card>

            <Card title="安全设置" style={{ borderRadius: 8 }}>
              <Form.Item name="twoFactorAuth" label="启用双因素认证" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="loginLockout" label="登录失败锁定" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="passwordExpireDays" label="密码过期提醒（天）">
                <Input type="number" style={{ width: 200 }} />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="通知设置" style={{ borderRadius: 8, marginBottom: 24 }}>
              <Form.Item name="stockWarningNotify" label="库存预警通知" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="orderStatusNotify" label="订单状态通知" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="maintenanceNotify" label="系统维护通知" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Card>

            <Card title="数据库信息" style={{ borderRadius: 8 }}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Text type="secondary">数据库主机</Text>
                </Col>
                <Col span={16}>
                  <Text>localhost (Docker)</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">数据库名称</Text>
                </Col>
                <Col span={16}>
                  <Text>ruanjin</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">字符集</Text>
                </Col>
                <Col span={16}>
                  <Text>utf8mb4</Text>
                </Col>
                <Col span={8}>
                  <Text type="secondary">端口</Text>
                </Col>
                <Col span={16}>
                  <Text>3306</Text>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleSave} loading={saving}>
          保存设置
        </Button>
      </div>
    </div>
  )
}

export default SystemSettings
