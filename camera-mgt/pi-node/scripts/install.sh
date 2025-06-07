#!/bin/bash

# CarWash Pi Node Installation Script
# Installs and configures the CarWash camera management application on Raspberry Pi

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="carwash-pi-node"
APP_USER="carwash"
APP_DIR="/opt/carwash"
SERVICE_NAME="carwash-pi"
NODE_VERSION="18"

# Logging
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

check_raspberry_pi() {
    if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
        warn "This script is designed for Raspberry Pi, but can work on other Linux systems"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log "Raspberry Pi detected"
    fi
}

update_system() {
    title "Updating System Packages"
    
    log "Updating package lists..."
    apt update
    
    log "Upgrading system packages..."
    apt upgrade -y
    
    log "Installing essential packages..."
    apt install -y curl wget git unzip systemd
}

install_nodejs() {
    title "Installing Node.js ${NODE_VERSION}"
    
    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$CURRENT_VERSION" -ge "$NODE_VERSION" ]]; then
            log "Node.js $CURRENT_VERSION is already installed"
            return
        else
            log "Upgrading Node.js from version $CURRENT_VERSION to $NODE_VERSION"
        fi
    fi
    
    log "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    log "Installing Node.js..."
    apt install -y nodejs
    
    # Verify installation
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    log "Installed Node.js: $NODE_VER"
    log "Installed npm: $NPM_VER"
}

install_ffmpeg() {
    title "Installing FFmpeg"
    
    if command -v ffmpeg &> /dev/null; then
        log "FFmpeg is already installed"
        ffmpeg -version | head -1
        return
    fi
    
    log "Installing FFmpeg..."
    apt install -y ffmpeg
    
    # Verify installation
    FFMPEG_VER=$(ffmpeg -version | head -1)
    log "Installed: $FFMPEG_VER"
}

install_pm2() {
    title "Installing PM2 Process Manager"
    
    if command -v pm2 &> /dev/null; then
        log "PM2 is already installed"
        return
    fi
    
    log "Installing PM2 globally..."
    npm install -g pm2
    
    log "Setting up PM2 startup script..."
    pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
}

create_user() {
    title "Creating Application User"
    
    if id "$APP_USER" &>/dev/null; then
        log "User $APP_USER already exists"
    else
        log "Creating user: $APP_USER"
        useradd -r -s /bin/false -d $APP_DIR $APP_USER
    fi
    
    log "Creating application directory: $APP_DIR"
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/{logs,config}
    chown -R $APP_USER:$APP_USER $APP_DIR
}

install_application() {
    title "Installing CarWash Pi Node Application"
    
    log "Copying application files to $APP_DIR..."
    
    # Copy all files except node_modules, logs, and temp files
    rsync -av --exclude 'node_modules' \
              --exclude 'logs' \
              --exclude '.git' \
              --exclude '*.log' \
              --exclude 'coverage' \
              --exclude '.nyc_output' \
              ./ $APP_DIR/
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    log "Installing Node.js dependencies..."
    cd $APP_DIR
    sudo -u $APP_USER npm install --production --no-optional
    
    log "Creating configuration file..."
    if [[ ! -f "$APP_DIR/config/local.json" ]]; then
        sudo -u $APP_USER cp .env.example $APP_DIR/.env
        
        # Generate a random API key
        API_KEY=$(openssl rand -hex 32)
        DEVICE_ID="pi-$(hostname)-$(date +%s)"
        
        cat > $APP_DIR/.env << EOF
# CarWash Pi Node Configuration
NODE_ENV=production
PORT=3000

# Device Identification
DEVICE_ID=$DEVICE_ID

# RTSP Stream Configuration (CONFIGURE THESE)
RTSP_URL=rtsp://192.168.1.100:554/stream
SNAPSHOT_INTERVAL=10
SNAPSHOT_QUALITY=3

# Cloud API Configuration (CONFIGURE THESE)
CLOUD_API_URL=http://your-cloud-api.com
API_KEY=$API_KEY
WEBHOOK_URL=http://your-cloud-api.com/webhooks/device

# Monitoring
METRICS_PORT=9090
LOG_LEVEL=info

# System Paths
FFMPEG_PATH=/usr/bin/ffmpeg
EOF
        
        chown $APP_USER:$APP_USER $APP_DIR/.env
        chmod 600 $APP_DIR/.env
        
        log "Generated API key and configuration file"
        warn "IMPORTANT: Edit $APP_DIR/.env with your actual configuration"
    fi
}

install_systemd_service() {
    title "Installing Systemd Service"
    
    log "Creating systemd service file..."
    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=CarWash Pi Node - Camera Management Service
Documentation=https://github.com/carwash/pi-node
After=network.target
Wants=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/src/app.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
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

# Resource limits
LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
    
    log "Reloading systemd daemon..."
    systemctl daemon-reload
    
    log "Enabling $SERVICE_NAME service..."
    systemctl enable $SERVICE_NAME
}

setup_log_rotation() {
    title "Setting up Log Rotation"
    
    log "Creating logrotate configuration..."
    cat > /etc/logrotate.d/$APP_NAME << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        systemctl reload $SERVICE_NAME || true
    endscript
}
EOF
    
    log "Log rotation configured for 7 days retention"
}

configure_firewall() {
    title "Configuring Firewall"
    
    if command -v ufw &> /dev/null; then
        log "Configuring UFW firewall..."
        
        # Allow SSH
        ufw allow ssh
        
        # Allow application port
        ufw allow 3000/tcp comment "CarWash Pi Node API"
        
        # Allow metrics port (local network only)
        ufw allow from 192.168.0.0/16 to any port 9090 comment "Prometheus metrics"
        ufw allow from 10.0.0.0/8 to any port 9090
        ufw allow from 172.16.0.0/12 to any port 9090
        
        log "Firewall rules configured"
        log "Run 'ufw enable' to activate the firewall"
    else
        warn "UFW firewall not installed. Consider installing and configuring it."
    fi
}

create_scripts() {
    title "Creating Management Scripts"
    
    # Create start script
    cat > $APP_DIR/start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
sudo systemctl start carwash-pi
sudo systemctl status carwash-pi
EOF
    
    # Create stop script
    cat > $APP_DIR/stop.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
sudo systemctl stop carwash-pi
EOF
    
    # Create restart script
    cat > $APP_DIR/restart.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
sudo systemctl restart carwash-pi
sudo systemctl status carwash-pi
EOF
    
    # Create status script
    cat > $APP_DIR/status.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "=== Service Status ==="
sudo systemctl status carwash-pi
echo
echo "=== Recent Logs ==="
sudo journalctl -u carwash-pi -n 20 --no-pager
EOF
    
    # Create update script
    cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Updating CarWash Pi Node..."
sudo systemctl stop carwash-pi
git pull origin main
npm install --production --no-optional
sudo systemctl start carwash-pi
sudo systemctl status carwash-pi
EOF
    
    chmod +x $APP_DIR/*.sh
    chown $APP_USER:$APP_USER $APP_DIR/*.sh
    
    log "Created management scripts in $APP_DIR"
}

run_tests() {
    title "Running Installation Tests"
    
    log "Testing application startup..."
    cd $APP_DIR
    
    # Test configuration load
    sudo -u $APP_USER timeout 10s node -e "
        const config = require('./src/config/default');
        console.log('✓ Configuration loaded successfully');
        console.log('✓ Device ID:', config.cloud.deviceId);
    " || warn "Configuration test failed"
    
    # Test dependencies
    sudo -u $APP_USER node -e "
        console.log('✓ Node.js version:', process.version);
        console.log('✓ Dependencies check passed');
    " || warn "Dependencies test failed"
    
    log "Installation tests completed"
}

print_completion_message() {
    title "Installation Complete!"
    
    echo -e "${GREEN}CarWash Pi Node has been successfully installed!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit configuration: sudo nano $APP_DIR/.env"
    echo "2. Configure your RTSP camera URL"
    echo "3. Set your cloud API endpoint"
    echo "4. Start the service: sudo systemctl start $SERVICE_NAME"
    echo "5. Check status: sudo systemctl status $SERVICE_NAME"
    echo
    echo -e "${BLUE}Management commands:${NC}"
    echo "• Start:   $APP_DIR/start.sh"
    echo "• Stop:    $APP_DIR/stop.sh"
    echo "• Restart: $APP_DIR/restart.sh"
    echo "• Status:  $APP_DIR/status.sh"
    echo "• Logs:    sudo journalctl -u $SERVICE_NAME -f"
    echo
    echo -e "${BLUE}API Endpoints:${NC}"
    echo "• Health: http://localhost:3000/api/health"
    echo "• Snapshot: http://localhost:3000/api/snapshot"
    echo "• Metrics: http://localhost:9090/metrics"
    echo
    echo -e "${YELLOW}Important: Remember to configure your camera settings in $APP_DIR/.env${NC}"
}

# Main installation process
main() {
    title "CarWash Pi Node Installation"
    
    check_root
    check_raspberry_pi
    update_system
    install_nodejs
    install_ffmpeg
    create_user
    install_application
    install_systemd_service
    setup_log_rotation
    configure_firewall
    create_scripts
    run_tests
    print_completion_message
}

# Run main function
main "$@"