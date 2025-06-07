import React from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Button, Space, Alert } from 'antd';
import { 
  CameraOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LicenseOutlined,
  ApiOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { deviceAPI, plateAPI, webhookAPI, healthAPI } from '../../services/api';

const DashboardPage = () => {
  // Fetch dashboard data
  const { data: deviceStats, isLoading: devicesLoading } = useQuery(
    'deviceStats',
    deviceAPI.getStats,
    { refetchInterval: 30000 }
  );

  const { data: plateStats, isLoading: platesLoading } = useQuery(
    'plateStats',
    () => plateAPI.getStats({ 
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
    }),
    { refetchInterval: 60000 }
  );

  const { data: webhookStats, isLoading: webhooksLoading } = useQuery(
    'webhookStats',
    webhookAPI.getStats,
    { refetchInterval: 60000 }
  );

  const { data: healthData, isLoading: healthLoading } = useQuery(
    'healthData',
    healthAPI.getDetailedHealth,
    { refetchInterval: 15000 }
  );

  const { data: recentDevices } = useQuery(
    'recentDevices',
    () => deviceAPI.getDevices({ limit: 10, sort_by: 'last_seen', sort_order: 'desc' }),
    { refetchInterval: 30000 }
  );

  const { data: recentPlates } = useQuery(
    'recentPlates',
    () => plateAPI.getRecognitions({ limit: 10, sort_by: 'recognized_at', sort_order: 'desc' }),
    { refetchInterval: 30000 }
  );

  // Mock data for charts
  const deviceActivityData = [
    { time: '00:00', online: 450, offline: 50 },
    { time: '04:00', online: 420, offline: 80 },
    { time: '08:00', online: 480, offline: 20 },
    { time: '12:00', online: 495, offline: 5 },
    { time: '16:00', online: 485, offline: 15 },
    { time: '20:00', online: 470, offline: 30 },
  ];

  const plateRecognitionData = [
    { time: '00:00', count: 45 },
    { time: '04:00', count: 12 },
    { time: '08:00', count: 89 },
    { time: '12:00', count: 156 },
    { time: '16:00', count: 234 },
    { time: '20:00', count: 123 },
  ];

  // Recent devices table columns
  const deviceColumns = [
    {
      title: 'Device',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <CameraOutlined />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.device_id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={
            status === 'online' ? 'green' : 
            status === 'offline' ? 'red' : 
            status === 'maintenance' ? 'orange' : 'default'
          }
          icon={
            status === 'online' ? <CheckCircleOutlined /> :
            status === 'offline' ? <CloseCircleOutlined /> :
            <ExclamationCircleOutlined />
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Last Seen',
      dataIndex: 'last_seen',
      key: 'last_seen',
      render: (lastSeen) => {
        if (!lastSeen) return 'Never';
        const diff = Date.now() - new Date(lastSeen).getTime();
        const minutes = Math.floor(diff / 60000);
        return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`;
      },
    },
  ];

  // Recent plates table columns
  const plateColumns = [
    {
      title: 'Plate Number',
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (plateNumber) => (
        <Tag color=\"blue\">{plateNumber}</Tag>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'device_name',
      key: 'device_name',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence) => (
        <Progress 
          percent={Math.round(confidence * 100)} 
          size=\"small\" 
          status={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: 'Time',
      dataIndex: 'recognized_at',
      key: 'recognized_at',
      render: (time) => new Date(time).toLocaleTimeString(),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          Fleet Dashboard
        </h1>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </div>

      {/* System Health Alert */}
      {healthData && healthData.status !== 'healthy' && (
        <Alert
          message=\"System Health Warning\"
          description={`System status: ${healthData.status}. Some services may be experiencing issues.`}
          type=\"warning\"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title=\"Total Devices\"
              value={deviceStats?.data?.total || 0}
              prefix={<CameraOutlined />}
              loading={devicesLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title=\"Online Devices\"
              value={deviceStats?.data?.by_status?.online || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              loading={devicesLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title=\"Plates Today\"
              value={plateStats?.data?.total || 0}
              prefix={<LicenseOutlined />}
              loading={platesLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title=\"Webhook Deliveries\"
              value={webhookStats?.data?.total || 0}
              prefix={<ApiOutlined />}
              loading={webhooksLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title=\"Device Status Over Time\" loading={devicesLoading}>
            <ResponsiveContainer width=\"100%\" height={300}>
              <AreaChart data={deviceActivityData}>
                <CartesianGrid strokeDasharray=\"3 3\" />
                <XAxis dataKey=\"time\" />
                <YAxis />
                <Tooltip />
                <Area 
                  type=\"monotone\" 
                  dataKey=\"online\" 
                  stackId=\"1\" 
                  stroke=\"#52c41a\" 
                  fill=\"#52c41a\" 
                  fillOpacity={0.6}
                  name=\"Online\"
                />
                <Area 
                  type=\"monotone\" 
                  dataKey=\"offline\" 
                  stackId=\"1\" 
                  stroke=\"#ff4d4f\" 
                  fill=\"#ff4d4f\" 
                  fillOpacity={0.6}
                  name=\"Offline\"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title=\"Plate Recognition Activity\" loading={platesLoading}>
            <ResponsiveContainer width=\"100%\" height={300}>
              <LineChart data={plateRecognitionData}>
                <CartesianGrid strokeDasharray=\"3 3\" />
                <XAxis dataKey=\"time\" />
                <YAxis />
                <Tooltip />
                <Line 
                  type=\"monotone\" 
                  dataKey=\"count\" 
                  stroke=\"#1890ff\" 
                  strokeWidth={2}
                  name=\"Recognitions\"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title=\"Recent Device Activity\" extra={<Button type=\"link\">View All</Button>}>
            <Table
              dataSource={recentDevices?.data?.devices || []}
              columns={deviceColumns}
              pagination={false}
              size=\"small\"
              rowKey=\"id\"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title=\"Recent Plate Recognitions\" extra={<Button type=\"link\">View All</Button>}>
            <Table
              dataSource={recentPlates?.data?.recognitions || []}
              columns={plateColumns}
              pagination={false}
              size=\"small\"
              rowKey=\"id\"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;