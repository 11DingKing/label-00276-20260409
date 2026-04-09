import { createContext, useContext, useState, useEffect } from 'react'
import { settingsApi } from './api'

const SettingsContext = createContext(null)

// 默认设置
const defaultSettings = {
  site_name: '家具生产管理系统',
  company_name: '',
  admin_email: '',
  admin_phone: '',
  two_factor_auth: false,
  login_lockout: true,
  password_expire_days: 90,
  stock_warning_notify: true,
  order_status_notify: true,
  maintenance_notify: true,
}

// 检查字符串是否包含乱码（非正常中文字符）
const isGarbled = (str) => {
  if (!str || typeof str !== 'string') return false
  // 检查是否包含常见乱码特征
  return /[ç¨å®¶å·ä¸]/.test(str) || /Ã|Â|â|ã/.test(str)
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      
      const res = await settingsApi.get()
      if (res.success && res.data) {
        // 检查是否有乱码，如果有则使用默认值
        const newSettings = { ...defaultSettings }
        for (const key in res.data) {
          const value = res.data[key]
          if (typeof value === 'string' && isGarbled(value)) {
            // 乱码，使用默认值
            console.warn(`设置 ${key} 包含乱码，使用默认值`)
          } else {
            newSettings[key] = value
          }
        }
        setSettings(newSettings)
      }
    } catch (err) {
      console.error('加载设置失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings) => {
    try {
      const res = await settingsApi.update(newSettings)
      if (res.success) {
        setSettings({ ...settings, ...newSettings })
        return true
      }
      return false
    } catch (err) {
      console.error('更新设置失败:', err)
      return false
    }
  }

  useEffect(() => {
    // 清除可能包含乱码的缓存
    localStorage.removeItem('publicSettings')
    loadSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, loadSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export default SettingsContext
