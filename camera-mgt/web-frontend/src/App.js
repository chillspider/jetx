import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet';

// Layout Components
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/Auth/LoginPage';

// Page Components
import DashboardPage from './pages/Dashboard/DashboardPage';
import DevicesPage from './pages/Devices/DevicesPage';
import DeviceDetailPage from './pages/Devices/DeviceDetailPage';
import PlateRecognitionPage from './pages/PlateRecognition/PlateRecognitionPage';
import WebhooksPage from './pages/Webhooks/WebhooksPage';
import TemplatesPage from './pages/Templates/TemplatesPage';
import SettingsPage from './pages/Settings/SettingsPage';
import MonitoringPage from './pages/Monitoring/MonitoringPage';

// Store
import { useAuthStore } from './store/authStore';

// Styles
import './App.css';

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to=\"/login\" replace />;
  }
  
  return children;
};

function App() {
  const { darkMode } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <div className={`App ${darkMode ? 'dark' : 'light'}`}>
          <Helmet>
            <title>CarWash Fleet Management Dashboard</title>
            <meta name=\"description\" content=\"Manage your CarWash fleet of 500+ Raspberry Pi devices\" />
          </Helmet>
          
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path=\"/login\" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route
                path=\"/*\"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path=\"/\" element={<Navigate to=\"/dashboard\" replace />} />
                        <Route path=\"/dashboard\" element={<DashboardPage />} />
                        <Route path=\"/devices\" element={<DevicesPage />} />
                        <Route path=\"/devices/:id\" element={<DeviceDetailPage />} />
                        <Route path=\"/plates\" element={<PlateRecognitionPage />} />
                        <Route path=\"/webhooks\" element={<WebhooksPage />} />
                        <Route path=\"/templates\" element={<TemplatesPage />} />
                        <Route path=\"/monitoring\" element={<MonitoringPage />} />
                        <Route path=\"/settings\" element={<SettingsPage />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          
          {/* Toast Notifications */}
          <Toaster
            position=\"top-right\"
            toastOptions={{
              duration: 4000,
              style: {
                background: darkMode ? '#1f1f1f' : '#fff',
                color: darkMode ? '#fff' : '#333',
              },
            }}
          />
        </div>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;