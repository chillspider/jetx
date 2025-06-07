#!/bin/bash

# CarWash Cloud API Installation Script
# Installs and configures the Cloud API for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="carwash-cloud-api"
APP_USER="carwash"
APP_DIR="/opt/carwash-cloud"
SERVICE_NAME="carwash-cloud-api"
NODE_VERSION="18"

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

title() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        error "Cannot detect operating system"
    fi
    
    log "Detected OS: $OS $OS_VERSION"
}

install_dependencies() {
    title "Installing System Dependencies"
    
    case $OS in
        "ubuntu"|"debian")
            apt-get update
            apt-get install -y curl wget gnupg2 software-properties-common
            apt-get install -y postgresql-client build-essential python3
            ;;
        "centos"|"rhel"|"rocky"|"alma")
            yum update -y
            yum install -y curl wget gnupg2 postgresql
            yum groupinstall -y "Development Tools"
            yum install -y python3
            ;;
        *)
            error "Unsupported operating system: $OS"
            ;;
    esac
    
    log "System dependencies installed"
}

install_nodejs() {
    title "Installing Node.js"
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    case $OS in
        "ubuntu"|"debian")
            apt-get install -y nodejs
            ;;
        "centos"|"rhel"|"rocky"|"alma")
            yum install -y nodejs npm
            ;;
    esac
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log "Node.js installed: $node_version"
    log "npm installed: $npm_version"
    
    # Install PM2 globally
    npm install -g pm2
    log "PM2 installed globally"
}

create_user() {
    title "Creating Application User"
    
    if id "$APP_USER" &>/dev/null; then
        log "User $APP_USER already exists"
    else
        useradd --system --shell /bin/bash --home-dir /home/$APP_USER --create-home $APP_USER
        log "Created user: $APP_USER"
    fi
    
    # Add user to sudo group for service management
    usermod -aG sudo $APP_USER 2>/dev/null || true
}

setup_directories() {
    title "Setting Up Directories"
    
    # Create application directory
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/logs
    mkdir -p $APP_DIR/uploads
    mkdir -p $APP_DIR/backups
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    # Set permissions
    chmod 755 $APP_DIR
    chmod 755 $APP_DIR/logs
    chmod 755 $APP_DIR/uploads
    chmod 700 $APP_DIR/backups
    
    log "Directories created and configured"
}

copy_application() {
    title "Copying Application Files"
    
    # Get the directory where this script is located
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SOURCE_DIR="$(dirname "$SCRIPT_DIR")"
    
    log "Copying files from $SOURCE_DIR to $APP_DIR"
    
    # Copy application files (excluding node_modules, logs, etc.)
    rsync -av --exclude 'node_modules' \
              --exclude 'logs' \
              --exclude '.git' \
              --exclude '*.log' \
              --exclude 'coverage' \
              --exclude '.nyc_output' \
              --exclude 'uploads' \
              "$SOURCE_DIR/" "$APP_DIR/"
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    log "Application files copied"
}

install_app_dependencies() {
    title "Installing Application Dependencies"
    
    cd $APP_DIR
    
    # Install production dependencies
    sudo -u $APP_USER npm ci --only=production --no-optional
    
    log "Application dependencies installed"
}

setup_database() {
    title "Setting Up Database"
    
    # Check if PostgreSQL is running
    if ! systemctl is-active --quiet postgresql; then
        warn "PostgreSQL service is not running"
        warn "Please ensure PostgreSQL is installed and running"
        warn "Database setup will be skipped"
        return
    fi
    
    # Create database and user (requires PostgreSQL admin access)
    log "Database setup requires PostgreSQL admin privileges"
    log "Please run the following commands manually as postgres user:"
    echo "  sudo -u postgres createdb carwash_prod"
    echo "  sudo -u postgres createuser carwash"
    echo "  sudo -u postgres psql -c \"ALTER USER carwash WITH PASSWORD 'your_secure_password';\""
    echo "  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE carwash_prod TO carwash;\""
    
    warn "Update the .env file with your database credentials"
}

configure_environment() {
    title "Configuring Environment"
    
    if [[ ! -f "$APP_DIR/.env" ]]; then
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
        log "Created .env file from template"
        
        # Generate secure secrets
        JWT_SECRET=$(openssl rand -hex 32)
        API_SECRET=$(openssl rand -hex 32)
        
        # Update .env with generated secrets
        sed -i "s/NODE_ENV=development/NODE_ENV=production/" "$APP_DIR/.env"
        sed -i "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" "$APP_DIR/.env"
        
        log "Generated secure secrets in .env file"
        warn "Please review and update $APP_DIR/.env with your specific configuration"
    else
        log ".env file already exists"
    fi
    
    # Set secure permissions on .env
    chmod 600 "$APP_DIR/.env"
    chown $APP_USER:$APP_USER "$APP_DIR/.env"
}

run_database_migrations() {
    title "Running Database Migrations"
    
    cd $APP_DIR
    
    # Run migrations as app user
    if sudo -u $APP_USER npm run db:migrate 2>/dev/null; then
        log "Database migrations completed successfully"
        
        # Run seeds if this is a fresh installation
        if sudo -u $APP_USER npm run db:seed 2>/dev/null; then
            log "Database seeded with sample data"
        else
            warn "Database seeding failed or was skipped"
        fi
    else
        warn "Database migrations failed"
        warn "Please check database connection and run manually: npm run db:migrate"
    fi
}

setup_systemd_service() {
    title "Setting Up Systemd Service"
    
    # Create systemd service file
    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=CarWash Cloud API - Fleet Management Service
Documentation=https://github.com/carwash/cloud-api
After=network.target network-online.target postgresql.service
Wants=network-online.target
RequiresMountsFor=$APP_DIR

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=-$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/src/app.js
ExecReload=/bin/kill -HUP \$MAINPID
ExecStop=/bin/kill -TERM \$MAINPID
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Output control
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR
CapabilityBoundingSet=
SystemCallArchitectures=native
MemoryDenyWriteExecute=false
RestrictRealtime=true
RestrictSUIDSGID=true
LockPersonality=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Resource limits
LimitNOFILE=65535
LimitNPROC=4096
MemoryMax=1G
TasksMax=2048

# Monitoring
WatchdogSec=60
NotifyAccess=main

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    log "Systemd service configured and enabled"
}

setup_log_rotation() {
    title "Setting Up Log Rotation"
    
    cat > /etc/logrotate.d/$APP_NAME << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        systemctl reload $SERVICE_NAME || true
    endscript
}
EOF

    log "Log rotation configured"
}

setup_firewall() {
    title "Configuring Firewall"
    
    if command -v ufw &> /dev/null; then
        log "Configuring UFW firewall..."
        
        # Allow SSH (if not already allowed)
        ufw allow ssh || true
        
        # Allow API port
        ufw allow 3003/tcp comment "CarWash Cloud API"
        
        # Allow metrics port (restricted to local networks)
        ufw allow from 192.168.0.0/16 to any port 9090 comment "Prometheus metrics"
        ufw allow from 10.0.0.0/8 to any port 9090
        ufw allow from 172.16.0.0/12 to any port 9090
        
        log "Firewall rules configured"
    else
        warn "UFW not found, skipping firewall configuration"
    fi
}

test_installation() {
    title "Testing Installation"
    
    # Start the service
    log "Starting $SERVICE_NAME service..."
    systemctl start $SERVICE_NAME
    
    # Wait for startup
    sleep 10
    
    # Check service status
    if systemctl is-active --quiet $SERVICE_NAME; then
        log "✓ Service is running"
    else
        error "✗ Service failed to start"
    fi
    
    # Test health endpoint
    if curl -f -s http://localhost:3003/api/health > /dev/null; then
        log "✓ Health check passed"
    else
        warn "✗ Health check failed - service may still be starting"
    fi
    
    # Check logs
    log "Recent service logs:"
    journalctl -u $SERVICE_NAME -n 10 --no-pager
}

print_completion_message() {
    title "Installation Complete!"
    
    echo -e "${GREEN}CarWash Cloud API has been successfully installed!${NC}"
    echo
    echo -e "${BLUE}Service Information:${NC}"
    echo "• Service Name: $SERVICE_NAME"
    echo "• Installation Directory: $APP_DIR"
    echo "• User: $APP_USER"
    echo "• API Port: 3003"
    echo "• Metrics Port: 9090"
    echo
    echo -e "${BLUE}Management Commands:${NC}"
    echo "• Start:   sudo systemctl start $SERVICE_NAME"
    echo "• Stop:    sudo systemctl stop $SERVICE_NAME"
    echo "• Restart: sudo systemctl restart $SERVICE_NAME"
    echo "• Status:  sudo systemctl status $SERVICE_NAME"
    echo "• Logs:    sudo journalctl -u $SERVICE_NAME -f"
    echo
    echo -e "${BLUE}API Endpoints:${NC}"
    echo "• Health:  http://localhost:3003/api/health"
    echo "• API:     http://localhost:3003/api"
    echo "• Metrics: http://localhost:9090/metrics"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Review and update configuration in: $APP_DIR/.env"
    echo "2. Set up database connection (see database setup section above)"
    echo "3. Configure PlateRecognizer API key in .env"
    echo "4. Test the API endpoints"
    echo "5. Set up monitoring and alerting"
    echo
    echo -e "${YELLOW}Important Files:${NC}"
    echo "• Configuration: $APP_DIR/.env"
    echo "• Logs: $APP_DIR/logs/"
    echo "• Service: /etc/systemd/system/${SERVICE_NAME}.service"
    echo
}

# Main installation process
main() {
    title "CarWash Cloud API Installation"
    
    check_root
    detect_os
    install_dependencies
    install_nodejs
    create_user
    setup_directories
    copy_application
    install_app_dependencies
    configure_environment
    setup_database
    run_database_migrations
    setup_systemd_service
    setup_log_rotation
    setup_firewall
    test_installation
    print_completion_message
}

# Handle script arguments
if [[ "${1:-}" == "--help" ]]; then
    echo "CarWash Cloud API Installation Script"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --help     Show this help message"
    echo "  --test     Run in test mode (dry run)"
    echo
    echo "This script will install and configure the CarWash Cloud API"
    echo "for production deployment on Ubuntu/Debian/CentOS/RHEL systems."
    exit 0
elif [[ "${1:-}" == "--test" ]]; then
    echo "Running in test mode..."
    # Add test mode logic here
    exit 0
else
    main
fi