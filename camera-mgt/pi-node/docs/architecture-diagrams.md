# Car Wash Pi Node - Architecture Diagrams

This document contains comprehensive diagrams showing the data flow, API interactions, and service architecture for the Car Wash Pi Node application.

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "External Systems"
        RTSP[RTSP Camera Stream]
        Cloud[Cloud Management API]
        Client[Client Applications]
        Prometheus[Prometheus Server]
    end

    subgraph "Pi Node Application"
        subgraph "API Layer"
            Express[Express Server]
            Auth[Auth Middleware]
            RateLimit[Rate Limiter]
            ErrorHandler[Error Handler]
        end

        subgraph "Controllers"
            SnapshotCtrl[Snapshot Controller]
            HealthCtrl[Health Controller]
            ConfigCtrl[Config Controller]
        end

        subgraph "Core Services"
            StreamMgr[Stream Manager]
            SnapshotCache[Snapshot Cache]
            HealthMonitor[Health Monitor]
            ConfigMgr[Config Manager]
        end

        subgraph "Utilities"
            Logger[Winston Logger]
            Metrics[Prometheus Metrics]
        end

        subgraph "External Processes"
            FFmpeg[FFmpeg Process]
        end
    end

    subgraph "Storage & Cache"
        Memory[In-Memory Cache]
        LocalConfig[Local Config Files]
        Logs[Log Files]
    end

    %% External connections
    RTSP -->|RTSP Stream| StreamMgr
    Cloud -->|Config Sync| ConfigMgr
    Client -->|HTTP/API| Express
    Prometheus -->|Scrape Metrics| Express

    %% API Layer flow
    Express --> Auth
    Auth --> RateLimit
    RateLimit --> SnapshotCtrl
    RateLimit --> HealthCtrl
    RateLimit --> ConfigCtrl
    Express --> ErrorHandler

    %% Controller to Service connections
    SnapshotCtrl --> SnapshotCache
    SnapshotCtrl --> StreamMgr
    HealthCtrl --> HealthMonitor
    ConfigCtrl --> ConfigMgr

    %% Core service interactions
    StreamMgr --> FFmpeg
    StreamMgr --> SnapshotCache
    HealthMonitor --> StreamMgr
    HealthMonitor --> SnapshotCache
    HealthMonitor --> ConfigMgr
    ConfigMgr --> Cloud

    %% Utility connections
    StreamMgr --> Logger
    StreamMgr --> Metrics
    SnapshotCache --> Metrics
    HealthMonitor --> Metrics
    ConfigMgr --> Logger

    %% Storage connections
    SnapshotCache --> Memory
    ConfigMgr --> LocalConfig
    Logger --> Logs

    %% Styling
    classDef external fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef controller fill:#e8f5e8
    classDef service fill:#fff3e0
    classDef utility fill:#fce4ec
    classDef storage fill:#f1f8e9

    class RTSP,Cloud,Client,Prometheus external
    class Express,Auth,RateLimit,ErrorHandler api
    class SnapshotCtrl,HealthCtrl,ConfigCtrl controller
    class StreamMgr,SnapshotCache,HealthMonitor,ConfigMgr service
    class Logger,Metrics,FFmpeg utility
    class Memory,LocalConfig,Logs storage
```

## 2. Data Flow Diagram - RTSP Stream Processing

```mermaid
flowchart TD
    Start([Application Start]) --> InitConfig[Initialize Configuration]
    InitConfig --> StartServices[Start Core Services]
    StartServices --> StartStream[Start RTSP Stream]
    
    StartStream --> SpawnFFmpeg[Spawn FFmpeg Process]
    SpawnFFmpeg --> RTSPConnect{RTSP Connection<br/>Successful?}
    
    RTSPConnect -->|Yes| ProcessStream[Process Video Stream]
    RTSPConnect -->|No| RetryLogic{Retry Count <br/>< Max Retries?}
    
    RetryLogic -->|Yes| BackoffDelay[Exponential Backoff Delay]
    BackoffDelay --> SpawnFFmpeg
    RetryLogic -->|No| StreamFailed[Mark Stream as Failed]
    
    ProcessStream --> ReceiveData[Receive Raw Video Data]
    ReceiveData --> ParseJPEG{Valid JPEG<br/>Frame Found?}
    
    ParseJPEG -->|Yes| ValidateSize{Frame Size<br/>Within Limits?}
    ParseJPEG -->|No| ReceiveData
    
    ValidateSize -->|Yes| StoreSnapshot[Store in Snapshot Cache]
    ValidateSize -->|No| DiscardFrame[Discard Oversized Frame]
    DiscardFrame --> ReceiveData
    
    StoreSnapshot --> UpdateMetrics[Update Prometheus Metrics]
    UpdateMetrics --> EmitEvent[Emit frameReceived Event]
    EmitEvent --> ReceiveData
    
    StoreSnapshot --> CleanupCache{Cache Size<br/>> Max Size?}
    CleanupCache -->|Yes| RemoveOldest[Remove Oldest Snapshots]
    CleanupCache -->|No| ReceiveData
    RemoveOldest --> ReceiveData
    
    StreamFailed --> NotifyHealthMonitor[Notify Health Monitor]
    NotifyHealthMonitor --> SelfHealing{Self-Healing<br/>Enabled?}
    SelfHealing -->|Yes| TriggerRestart[Trigger Stream Restart]
    SelfHealing -->|No| LogError[Log Error]
    TriggerRestart --> StartStream
    
    %% Process monitoring
    ProcessStream --> MonitorProcess[Monitor FFmpeg Process]
    MonitorProcess --> ProcessHealthy{Process<br/>Healthy?}
    ProcessHealthy -->|Yes| ProcessStream
    ProcessHealthy -->|No| HandleFailure[Handle Process Failure]
    HandleFailure --> RetryLogic

    %% Styling
    classDef startEnd fill:#c8e6c9
    classDef process fill:#bbdefb
    classDef decision fill:#fff9c4
    classDef error fill:#ffcdd2
    classDef cache fill:#f3e5f5

    class Start,InitConfig startEnd
    class ProcessStream,ReceiveData,StoreSnapshot,UpdateMetrics,SpawnFFmpeg process
    class RTSPConnect,RetryLogic,ParseJPEG,ValidateSize,CleanupCache,SelfHealing,ProcessHealthy decision
    class StreamFailed,HandleFailure,LogError error
    class RemoveOldest,DiscardFrame cache
```

## 3. API Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Auth
    participant RateLimit
    participant Controller
    participant Service
    participant Cache
    participant Metrics

    Client->>Express: HTTP Request
    
    Express->>Auth: Authenticate Request
    alt Authentication Failed
        Auth-->>Client: 401/403 Error
    else Authentication Success
        Auth->>RateLimit: Check Rate Limits
        
        alt Rate Limit Exceeded
            RateLimit-->>Client: 429 Too Many Requests
        else Within Limits
            RateLimit->>Controller: Route to Controller
            
            Controller->>Service: Call Service Method
            Service->>Cache: Get/Set Data
            Cache-->>Service: Return Data
            Service-->>Controller: Return Result
            
            Controller->>Metrics: Record API Metrics
            Metrics-->>Controller: Metrics Recorded
            
            Controller-->>Client: HTTP Response
        end
    end

    Note over Client,Metrics: Error Handling
    alt Service Error
        Service-->>Controller: Throw Error
        Controller->>Express: Pass Error to Handler
        Express-->>Client: 500 Error Response
    end
```

## 4. Service Interaction Pattern

```mermaid
graph LR
    subgraph "Initialization Phase"
        A1[ConfigManager.initialize] --> A2[Load Default Config]
        A2 --> A3[Load Local Config]
        A3 --> A4[Validate Config]
        A4 --> A5[Setup File Watcher]
        A5 --> A6[Start Cloud Sync]
    end

    subgraph "Service Startup"
        B1[StreamManager.start] --> B2[Spawn FFmpeg]
        B2 --> B3[Setup Event Handlers]
        B3 --> B4[Start Processing]
        
        C1[HealthMonitor.start] --> C2[Collect System Metrics]
        C2 --> C3[Monitor Services]
        C3 --> C4[Check Health Status]
    end

    subgraph "Runtime Operations"
        D1[Receive RTSP Data] --> D2[Process Video Frame]
        D2 --> D3[Store Snapshot]
        D3 --> D4[Update Cache]
        D4 --> D5[Record Metrics]
        D5 --> D1
        
        E1[API Request] --> E2[Authenticate]
        E2 --> E3[Get Cached Snapshot]
        E3 --> E4[Return Response]
        E4 --> E5[Log Request]
    end

    subgraph "Health & Monitoring"
        F1[Periodic Health Check] --> F2[Check Stream Status]
        F2 --> F3[Check System Resources]
        F3 --> F4[Evaluate Overall Health]
        F4 --> F5{Issues Detected?}
        F5 -->|Yes| F6[Trigger Self-Healing]
        F5 -->|No| F1
        F6 --> F7[Restart Services]
        F7 --> F1
    end

    subgraph "Configuration Management"
        G1[Config Change Detected] --> G2[Reload Configuration]
        G2 --> G3[Validate New Config]
        G3 --> G4[Apply Changes]
        G4 --> G5[Restart Affected Services]
        G5 --> G6[Emit Config Updated Event]
    end

    %% Inter-service connections
    A6 -.-> G1
    B4 -.-> D1
    C4 -.-> F1
    D3 -.-> E3
    G5 -.-> B1

    %% Styling
    classDef init fill:#e3f2fd
    classDef startup fill:#e8f5e8
    classDef runtime fill:#fff3e0
    classDef health fill:#fce4ec
    classDef config fill:#f3e5f5

    class A1,A2,A3,A4,A5,A6 init
    class B1,B2,B3,B4,C1,C2,C3,C4 startup
    class D1,D2,D3,D4,D5,E1,E2,E3,E4,E5 runtime
    class F1,F2,F3,F4,F5,F6,F7 health
    class G1,G2,G3,G4,G5,G6 config
```

## 5. Error Handling and Recovery Flow

```mermaid
flowchart TD
    Error[Error Detected] --> ErrorType{Error Type}
    
    ErrorType -->|Stream Error| StreamError[Stream Manager Error]
    ErrorType -->|Config Error| ConfigError[Config Manager Error]
    ErrorType -->|API Error| APIError[API Request Error]
    ErrorType -->|System Error| SystemError[System Resource Error]
    
    StreamError --> StreamSeverity{Error Severity}
    StreamSeverity -->|Transient| StreamRetry[Retry with Backoff]
    StreamSeverity -->|Persistent| StreamRestart[Restart Stream Process]
    StreamSeverity -->|Critical| StreamFail[Mark Stream as Failed]
    
    ConfigError --> ConfigSeverity{Error Severity}
    ConfigSeverity -->|Validation| ConfigRevert[Revert to Last Good Config]
    ConfigSeverity -->|Network| ConfigRetry[Retry Cloud Sync]
    ConfigSeverity -->|Critical| ConfigLocal[Use Local Config Only]
    
    APIError --> APISeverity{Error Severity}
    APISeverity -->|Client Error| APIClientError[Return 4xx Response]
    APISeverity -->|Server Error| APIServerError[Return 5xx Response]
    APISeverity -->|Rate Limit| APIRateLimit[Return 429 Response]
    
    SystemError --> SystemSeverity{Error Severity}
    SystemSeverity -->|Warning| SystemLog[Log Warning]
    SystemSeverity -->|Critical| SystemSelfHeal[Trigger Self-Healing]
    
    %% Recovery paths
    StreamRetry --> StreamSuccess{Retry Success?}
    StreamSuccess -->|Yes| RecoveryComplete[Recovery Complete]
    StreamSuccess -->|No| StreamRestart
    
    StreamRestart --> RestartSuccess{Restart Success?}
    RestartSuccess -->|Yes| RecoveryComplete
    RestartSuccess -->|No| StreamFail
    
    ConfigRetry --> ConfigSuccess{Sync Success?}
    ConfigSuccess -->|Yes| RecoveryComplete
    ConfigSuccess -->|No| ConfigLocal
    
    SystemSelfHeal --> SelfHealActions[Execute Self-Healing Actions]
    SelfHealActions --> SelfHealSuccess{Self-Heal Success?}
    SelfHealSuccess -->|Yes| RecoveryComplete
    SelfHealSuccess -->|No| SystemAlert[Send Alert to Monitoring]
    
    %% Final outcomes
    StreamFail --> NotifyHealthMonitor[Notify Health Monitor]
    ConfigLocal --> NotifyHealthMonitor
    APIClientError --> LogRequest[Log Request Details]
    APIServerError --> LogError[Log Server Error]
    APIRateLimit --> LogRateLimit[Log Rate Limit Hit]
    SystemLog --> NotifyHealthMonitor
    SystemAlert --> NotifyHealthMonitor
    
    NotifyHealthMonitor --> UpdateHealthStatus[Update Health Status]
    LogRequest --> RecoveryComplete
    LogError --> RecoveryComplete
    LogRateLimit --> RecoveryComplete
    UpdateHealthStatus --> RecoveryComplete
    
    RecoveryComplete --> MetricsUpdate[Update Error Metrics]
    MetricsUpdate --> End([End])

    %% Styling
    classDef error fill:#ffcdd2
    classDef decision fill:#fff9c4
    classDef action fill:#bbdefb
    classDef recovery fill:#c8e6c9
    classDef final fill:#f3e5f5

    class Error,StreamError,ConfigError,APIError,SystemError error
    class ErrorType,StreamSeverity,ConfigSeverity,APISeverity,SystemSeverity,StreamSuccess,RestartSuccess,ConfigSuccess,SelfHealSuccess decision
    class StreamRetry,StreamRestart,ConfigRevert,ConfigRetry,APIClientError,APIServerError,SystemSelfHeal action
    class RecoveryComplete,SelfHealActions recovery
    class NotifyHealthMonitor,UpdateHealthStatus,MetricsUpdate,End final
```

## 6. Configuration Management Flow

```mermaid
stateDiagram-v2
    [*] --> Initializing
    
    state Initializing {
        [*] --> LoadDefaults
        LoadDefaults --> LoadProduction
        LoadProduction --> LoadLocal
        LoadLocal --> Validate
        Validate --> SetupWatchers
        SetupWatchers --> StartCloudSync
        StartCloudSync --> [*]
    }
    
    Initializing --> Ready
    
    state Ready {
        [*] --> Idle
        
        Idle --> FileChanged : File Change Detected
        Idle --> CloudSync : Cloud Sync Timer
        Idle --> APIUpdate : API Update Request
        Idle --> ConfigReload : Reload Request
        
        FileChanged --> Reloading
        CloudSync --> SyncingWithCloud
        APIUpdate --> Updating
        ConfigReload --> Reloading
        
        Reloading --> Validating
        SyncingWithCloud --> Validating
        Updating --> Validating
        
        Validating --> ApplyingChanges : Valid
        Validating --> Idle : Invalid (Log Error)
        
        ApplyingChanges --> RestartingServices : Stream Config Changed
        ApplyingChanges --> Idle : No Service Restart Needed
        
        RestartingServices --> Idle
    }
    
    Ready --> Error : Critical Error
    
    state Error {
        [*] --> LoggingError
        LoggingError --> FallbackMode
        FallbackMode --> [*]
    }
    
    Error --> Ready : Recovery Successful
    
    note right of CloudSync
        Periodic sync with cloud API
        Handles network failures gracefully
        Exponential backoff on errors
    end note
    
    note right of FileChanged
        Chokidar file watcher
        Debounced to prevent rapid changes
        Validates before applying
    end note
    
    note right of RestartingServices
        Only restarts affected services
        Stream restart for RTSP changes
        Cache clear for memory issues
    end note
```

## 7. Metrics and Monitoring Data Flow

```mermaid
flowchart LR
    subgraph "Data Sources"
        Stream[Stream Manager]
        Cache[Snapshot Cache]
        API[API Requests]
        System[System Info]
        Health[Health Monitor]
    end

    subgraph "Metrics Collection"
        StreamMetrics[Stream Metrics<br/>• Process Status<br/>• Frame Rate<br/>• Restart Count]
        CacheMetrics[Cache Metrics<br/>• Hit Rate<br/>• Size<br/>• Operations]
        APIMetrics[API Metrics<br/>• Request Count<br/>• Response Time<br/>• Error Rate]
        SystemMetrics[System Metrics<br/>• CPU Usage<br/>• Memory<br/>• Temperature]
        HealthMetrics[Health Metrics<br/>• Component Status<br/>• Issue Count<br/>• Recovery Actions]
    end

    subgraph "Metrics Storage"
        PrometheusClient[Prometheus Client]
        MetricsEndpoint[/metrics Endpoint]
    end

    subgraph "External Monitoring"
        PromServer[Prometheus Server]
        Grafana[Grafana Dashboard]
        Alerting[Alert Manager]
    end

    %% Data flow
    Stream --> StreamMetrics
    Cache --> CacheMetrics
    API --> APIMetrics
    System --> SystemMetrics
    Health --> HealthMetrics

    StreamMetrics --> PrometheusClient
    CacheMetrics --> PrometheusClient
    APIMetrics --> PrometheusClient
    SystemMetrics --> PrometheusClient
    HealthMetrics --> PrometheusClient

    PrometheusClient --> MetricsEndpoint
    MetricsEndpoint --> PromServer
    PromServer --> Grafana
    PromServer --> Alerting

    %% Feedback loop
    Alerting -.->|Webhook| Health
    Health -.->|Self-Healing| Stream

    %% Styling
    classDef source fill:#e3f2fd
    classDef collection fill:#e8f5e8
    classDef storage fill:#fff3e0
    classDef external fill:#fce4ec

    class Stream,Cache,API,System,Health source
    class StreamMetrics,CacheMetrics,APIMetrics,SystemMetrics,HealthMetrics collection
    class PrometheusClient,MetricsEndpoint storage
    class PromServer,Grafana,Alerting external
```

## 8. API Endpoint Map

```mermaid
mindmap
  root((Pi Node API))
    Snapshots
      GET /api/snapshot
        Latest snapshot image
        Headers: Content-Type, X-Timestamp
        Auth: Required
        Rate Limit: 60/min
      GET /api/snapshot/info
        Snapshot metadata
        Response: JSON
        Auth: Required
      GET /api/snapshot/stats
        Cache statistics
        Response: JSON
        Auth: Required
      GET /api/snapshot/:id
        Historical snapshot
        Response: Image
        Auth: Optional
      GET /api/snapshot/list
        Available snapshots
        Response: JSON array
        Auth: Required
      DELETE /api/snapshot/cache
        Clear cache
        Admin only
        Auth: Required
    Health
      GET /api/health
        Basic health check
        Response: JSON status
        Auth: Optional
        Rate Limit: 120/min
      GET /api/health/stats
        Detailed statistics
        Response: JSON
        Auth: Required
      GET /api/health/components
        Component health
        Response: JSON
        Auth: Required
      GET /api/health/liveness
        Kubernetes liveness
        Response: Simple JSON
        Auth: None
      GET /api/health/readiness
        Kubernetes readiness
        Response: Simple JSON
        Auth: None
      POST /api/health/self-heal
        Trigger self-healing
        Admin only
        Auth: Required
      POST /api/health/restart-stream
        Restart stream
        Admin only
        Auth: Required
      GET /api/health/version
        Version information
        Response: JSON
        Auth: None
    Configuration
      GET /api/config
        Current configuration
        Response: Sanitized JSON
        Auth: Required
        Rate Limit: 10/15min
      PUT /api/config
        Update configuration
        Request: JSON updates
        Auth: Required
        Rate Limit: 10/15min
      POST /api/config/reload
        Reload from file/cloud
        Response: Success status
        Auth: Required
      GET /api/config/status
        Configuration status
        Response: JSON
        Auth: Required
      POST /api/config/sync
        Sync with cloud
        Response: Success status
        Auth: Required
      POST /api/config/validate
        Validate configuration
        Request: JSON config
        Auth: Required
      GET /api/config/schema
        Configuration schema
        Response: JSON schema
        Auth: Optional
    Metrics
      GET /metrics
        Prometheus metrics
        Response: Prometheus format
        Auth: None (Local network only)
        Rate Limit: None
```

These diagrams provide a comprehensive view of the Pi Node architecture, showing how data flows through the system, how components interact, and how errors are handled. The diagrams use standard Mermaid syntax and can be rendered in any Markdown viewer that supports Mermaid diagrams.