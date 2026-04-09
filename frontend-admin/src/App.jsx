import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SettingsProvider } from './utils/settingsContext'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import DepartmentPage from './pages/DepartmentPage'
import ProductionPage from './pages/ProductionPage'
import MaterialPage from './pages/MaterialPage'
import ProductPage from './pages/ProductPage'
import InventoryPage from './pages/InventoryPage'
import StatisticsPage from './pages/StatisticsPage'
import SystemSettings from './pages/SystemSettings'

// 登录保护路由
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="department/:deptId" element={<DepartmentPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="materials" element={<MaterialPage />} />
            <Route path="products" element={<ProductPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  )
}

export default App
