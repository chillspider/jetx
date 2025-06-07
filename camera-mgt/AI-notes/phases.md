# Car Wash Fleet Management System - Complete Development Prompt

  Build a comprehensive fleet management system for 500+ car wash locations, each equipped with Raspberry Pi devices running Node.js applications for
   RTSP stream processing, snapshot generation, and cloud connectivity.

  ## System Architecture Overview

  ### Component Structure
  - **Edge Devices**: Raspberry Pi 4 (Node.js + FFmpeg) at each location
  - **Cloud Management**: Web-based fleet management dashboard  
  - **Monitoring Stack**: Prometheus + Grafana for metrics and alerting
  - **Database**: PostgreSQL for configuration, MongoDB for logs/metrics
  - **Message Queue**: Redis for real-time communication
  - **Load Balancer**: Nginx for API gateway and SSL termination

  ### Data Flow
  1. Pi devices stream RTSP → generate snapshots → cache in memory
  2. Car wash handshake → API call to Pi → return cached snapshot
  3. Pi reports metrics/logs → Cloud management system
  4. Cloud dashboard → manage configurations → push to Pi devices
  5. Prometheus scrapes metrics → Grafana dashboards → alerting

  ## 1. Raspberry Pi Node.js Stack

  ### Core Requirements
  Build a robust Node.js application running on each Raspberry Pi that handles:

  **A) RTSP Stream Management**
  - Persistent FFmpeg process management for 1 RTSP stream per Pi
  - Automatic stream recovery on connection failures
  - Configurable snapshot intervals (10-15 seconds default)
  - Memory-efficient snapshot caching with rotation
  - Stream health monitoring and error reporting

  **B) Snapshot API Service**
  - Express.js REST API serving cached snapshots
  - Endpoint: `GET /api/snapshot` returns latest JPEG image
  - Response time: <100ms from memory cache
  - Metadata endpoint: `GET /api/snapshot/info` (timestamp, size, stream status)
  - Authentication via API keys

  **C) Configuration Management**
  - Dynamic configuration updates from cloud without restart
  - Settings: RTSP URL, snapshot interval, quality settings, API keys
  - Local config backup with cloud sync
  - Zero-downtime configuration changes

  **D) System Monitoring**
  - CPU, memory, temperature, disk usage metrics
  - FFmpeg process health and performance stats
  - Network connectivity and RTSP stream quality metrics
  - Custom metrics for car wash business logic
  - Prometheus metrics endpoint: `/metrics`

  **E) Self-Healing Capabilities**
  - Automatic FFmpeg process restart on failures
  - Exponential backoff retry logic for RTSP connections
  - Memory cleanup and garbage collection
  - System resource monitoring with auto-restart triggers
  - Log rotation and disk space management

  ### Technical Implementation
  ```javascript
  // Key modules to implement:
  - streamManager.js     // FFmpeg process control
  - snapshotCache.js     // Memory-based image storage
  - apiServer.js         // REST API endpoints  
  - configManager.js     // Cloud config sync
  - healthMonitor.js     // System metrics
  - selfHealing.js       // Auto-recovery logic
  ```

  **Package Dependencies:**
  - express, cors, helmet (API server)
  - fluent-ffmpeg (FFmpeg control)
  - node-cache (snapshot caching)
  - axios (cloud communication)
  - prom-client (Prometheus metrics)
  - winston (logging)
  - chokidar (config file watching)
  - systeminformation (hardware metrics)

  ## 2. Cloud Management API

  ### Backend Requirements
  Build a scalable Node.js/Express backend providing:

  **A) Pi Fleet Management**
  - Device registration and authentication
  - Configuration management with versioning
  - Bulk operations (update all, restart fleet, etc.)
  - Device grouping and templating
  - Real-time device status monitoring

  **B) Configuration Templates**
  - Template system for device configurations
  - Environment-specific settings (dev/staging/prod)
  - Configuration validation and testing
  - Rollback capabilities for failed deployments
  - A/B testing for configuration changes

  **C) Monitoring and Analytics**
  - Aggregated metrics from all Pi devices
  - Performance analytics and trend analysis
  - Alert management and escalation rules
  - SLA monitoring and reporting
  - Custom dashboards for business metrics

  **D) User Management**
  - Multi-tenant support for different car wash operators
  - Role-based access control (admin, operator, viewer)
  - API key management for Pi devices
  - Audit logging for all configuration changes

  ### API Endpoints Structure
  ```
  Authentication:
  POST /auth/login
  POST /auth/refresh
  POST /auth/logout

  Device Management:
  GET /api/devices
  POST /api/devices/register
  PUT /api/devices/:id/config
  POST /api/devices/bulk-update
  GET /api/devices/:id/status
  POST /api/devices/:id/restart

  Configuration:
  GET /api/templates
  POST /api/templates
  PUT /api/templates/:id
  POST /api/templates/:id/deploy

  Monitoring:
  GET /api/metrics/overview
  GET /api/metrics/device/:id
  GET /api/alerts
  POST /api/alerts/acknowledge
  ```

  ## 3. Web Dashboard (Cloud GUI)

  ### Frontend Requirements
  Build a modern React/Vue.js dashboard with:

  **A) Device Fleet Overview**
  - Real-time status grid of all 500+ locations
  - Color-coded health indicators (green/yellow/red)
  - Quick action buttons (restart, update, diagnose)
  - Search and filtering capabilities
  - Geographic map view of locations

  **B) Configuration Management**
  - Visual configuration editor with form validation
  - Template library with drag-and-drop deployment
  - Configuration diff viewer for comparing versions
  - Bulk configuration deployment with progress tracking
  - Rollback interface for failed deployments

  **C) Monitoring Dashboards**
  - Real-time metrics charts (CPU, memory, temperature)
  - Stream quality and performance graphs
  - Business metrics (successful snapshots, API response times)
  - Alert management interface with acknowledgment
  - Historical data analysis and reporting

  **D) Device Detail Views**
  - Individual device deep-dive with all metrics
  - Live log streaming from Pi devices
  - Remote debugging and diagnostics tools
  - Configuration history and change tracking
  - Snapshot preview and testing interface

  ### Frontend Tech Stack
  - React/Vue.js with TypeScript
  - Chart.js/D3.js for data visualization
  - Socket.io for real-time updates
  - Material-UI/Ant Design for components
  - React Query/Vue Query for API state management

  ## 4. Prometheus Monitoring Stack

  ### Metrics Collection Strategy
  **Pi Device Metrics (via node_exporter + custom metrics):**
  ```
  # System metrics
  node_cpu_usage_percent
  node_memory_usage_bytes  
  node_temperature_celsius
  node_disk_usage_percent
  node_network_bytes_total

  # Application metrics
  carwash_ffmpeg_process_status
  carwash_stream_connection_status
  carwash_snapshot_generation_rate
  carwash_api_request_duration_seconds
  carwash_api_request_total
  carwash_snapshot_cache_size_bytes
  carwash_last_successful_snapshot_timestamp
  ```

  **Cloud Service Metrics:**
  ```
  # API performance
  http_request_duration_seconds
  http_requests_total
  api_database_connection_pool_size
  api_active_connections

  # Business metrics  
  carwash_total_devices_online
  carwash_configuration_deployments_total
  carwash_alerts_active_count
  ```

  ### Alerting Rules
  ```yaml
  # Critical alerts
  - Device offline for >5 minutes
  - CPU temperature >80°C for >2 minutes  
  - Memory usage >90% for >5 minutes
  - FFmpeg process crashed
  - API response time >5 seconds

  # Warning alerts  
  - Device offline for >2 minutes
  - CPU usage >80% for >10 minutes
  - Snapshot generation errors >10% rate
  - Configuration deployment failures
  ```

  ### Grafana Dashboards
  1. **Fleet Overview**: All devices status, alerts summary
  2. **Device Deep Dive**: Individual Pi detailed metrics
  3. **Business Metrics**: Snapshot success rates, API performance
  4. **Infrastructure**: System resources, network performance
  5. **Alerts Dashboard**: Active alerts, acknowledgments, trends

  ## 5. Self-Healing Implementation

  ### Pi-Level Self-Healing
  ```javascript
  // Implement comprehensive auto-recovery:

  class SelfHealingManager {
    // Monitor FFmpeg process health
    monitorStreamHealth() {
      // Check process exists and responding
      // Verify RTSP connection quality
      // Monitor snapshot generation rate
      // Auto-restart with exponential backoff
    }
    
    // System resource management
    monitorSystemHealth() {
      // Temperature monitoring with throttling
      // Memory cleanup and leak detection
      // Disk space monitoring and log rotation
      // Network connectivity verification
    }
    
    // Configuration sync verification
    ensureConfigSync() {
      // Verify cloud connectivity
      // Check configuration version
      // Auto-update when cloud changes detected
      // Fallback to local config on network issues
    }
  }
  ```

  ### Cloud-Level Self-Healing
  ```javascript
  // Implement fleet management auto-recovery:

  class FleetHealingManager {
    // Device monitoring and intervention
    monitorFleetHealth() {
      // Detect offline devices
      // Identify performance degradation patterns
      // Auto-trigger device restarts
      // Escalate persistent issues to operators
    }
    
    // Configuration deployment monitoring
    ensureConfigDeployments() {
      // Track deployment success rates
      // Auto-rollback failed deployments
      // Retry failed device updates
      // Notify operators of deployment issues
    }
    
    // Alert management and escalation
    manageAlerts() {
      // Auto-acknowledge transient alerts
      // Escalate unresolved critical alerts
      // Generate summary reports
      // Trigger automated remediation actions
    }
  }
  ```

  ## 6. Technology Stack Recommendation: Pure Code vs n8n

  ### Recommendation: **Pure Code Implementation**

  **Why NOT n8n for this system:**

  **Cons of n8n:**
  - **Performance overhead** for 500+ devices
  - **Limited debugging** capabilities at scale
  - **Vendor lock-in** and customization constraints
  - **Complex error handling** for business logic
  - **Scaling challenges** with high-frequency data
  - **Limited monitoring** and observability options

  **Pros of Pure Code:**
  - **Maximum performance** and resource efficiency
  - **Complete customization** for car wash requirements
  - **Enterprise-grade debugging** and logging
  - **Optimal database design** for metrics and logs
  - **Fine-grained error handling** and recovery
  - **Professional monitoring** with Prometheus/Grafana

  ### Recommended Tech Stack

  **Pi Side:**
  - Node.js 18+ with TypeScript
  - Express.js for API server
  - fluent-ffmpeg for stream control
  - Prometheus client for metrics
  - PM2 for process management

  **Cloud Side:**
  - Node.js/Express API with TypeScript
  - PostgreSQL for configuration data
  - MongoDB for logs and time-series data
  - Redis for real-time communication
  - React dashboard with TypeScript

  **DevOps:**
  - Docker containers for all services
  - Kubernetes for cloud orchestration
  - Prometheus + Grafana for monitoring
  - CI/CD with GitHub Actions
  - Infrastructure as Code with Terraform

  ## Implementation Phases

  ### Phase 1: Core Pi Application (2-3 weeks)
  - FFmpeg stream management
  - Snapshot caching and API
  - Basic monitoring and metrics
  - Configuration management

  ### Phase 2: Cloud Management (3-4 weeks)  
  - Fleet management API
  - Configuration templates
  - Device registration and auth
  - Basic monitoring dashboard

  ### Phase 3: Advanced Monitoring (2-3 weeks)
  - Prometheus metrics integration
  - Grafana dashboards
  - Alerting rules and notifications
  - Performance optimization

  ### Phase 4: Self-Healing (2-3 weeks)
  - Automated recovery systems
  - Advanced alerting and escalation
  - Fleet-wide operations
  - Documentation and training

  ### Phase 5: Production Deployment (2-3 weeks)
  - Staged rollout to pilot locations
  - Performance testing and optimization
  - Security hardening and compliance
  - Operations runbooks and support

  ## Expected Outcomes

  **Performance Targets:**
  - Snapshot API response: <100ms
  - Device fleet management: 500+ devices
  - Configuration deployment: <30 seconds fleet-wide
  - System uptime: 99.5% availability
  - Alert response time: <2 minutes for critical issues

  **Operational Benefits:**
  - Centralized fleet management for 500+ locations
  - Automated recovery reducing manual intervention by 90%
  - Real-time monitoring and alerting
  - Template-based configuration deployment
  - Comprehensive audit trails and compliance reporting

  This system provides enterprise-grade fleet management while maintaining the cost advantages of the Raspberry Pi edge computing approach.