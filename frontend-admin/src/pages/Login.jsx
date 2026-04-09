import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, message, Card, Typography, Space, Divider } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { authApi } from '../utils/api'

const { Title, Text } = Typography

// 默认系统名称
const DEFAULT_SITE_NAME = '家具生产管理系统'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      if (res.success) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        message.success('登录成功')
        navigate('/dashboard')
      } else {
        message.error(res.message || '登录失败')
      }
    } catch (err) {
      message.error(err.message || '登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
        padding: 24,
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
      </div>

      <Card
        style={{
          width: 440,
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          border: 'none',
        }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #1890ff, #36cfc9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(24, 144, 255, 0.35)',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 36, color: 'white' }} />
          </div>
          <Title level={2} style={{ marginBottom: 8, fontWeight: 600, color: '#262626' }}>
            {DEFAULT_SITE_NAME}
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
            企业级家具生产全流程管理平台
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="用户名"
              autoComplete="username"
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
              autoComplete="current-password"
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-btn"
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #1890ff, #36cfc9)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(24, 144, 255, 0.35)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0', color: '#d9d9d9' }}>
          <Text style={{ color: '#bfbfbf', fontSize: 12 }}>FURNITURE PRODUCTION SYSTEM</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Space split={<span style={{ color: '#e8e8e8' }}>|</span>}>
            <Text style={{ color: '#bfbfbf', fontSize: 12 }}>版本 v2.0.0</Text>
            <Text style={{ color: '#bfbfbf', fontSize: 12 }}>© 2026</Text>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default Login
