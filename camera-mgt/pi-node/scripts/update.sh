#!/bin/bash

# CarWash Pi Node Update Script
# Updates the application while preserving configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="carwash-pi-node"
APP_USER="carwash"
APP_DIR="/opt/carwash"
SERVICE_NAME="carwash-pi"
BACKUP_DIR="/opt/carwash/backups"

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

check_service_exists() {
    if ! systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
        error "Service $SERVICE_NAME not found. Please run install.sh first."
    fi
}

create_backup() {
    title "Creating Backup"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="$BACKUP_DIR/backup_$timestamp"
    
    log "Creating backup directory: $backup_path"
    mkdir -p "$backup_path"
    
    # Backup configuration
    if [[ -f "$APP_DIR/.env" ]]; then
        cp "$APP_DIR/.env" "$backup_path/"
        log "Backed up .env configuration"
    fi
    
    # Backup local config
    if [[ -f "$APP_DIR/config/local.json" ]]; then
        cp "$APP_DIR/config/local.json" "$backup_path/"
        log "Backed up local.json configuration"
    fi
    
    # Backup logs
    if [[ -d "$APP_DIR/logs" ]]; then
        cp -r "$APP_DIR/logs" "$backup_path/"
        log "Backed up log files"
    fi
    
    # Set ownership
    chown -R $APP_USER:$APP_USER "$backup_path"
    
    log "Backup created at: $backup_path"
    echo "$backup_path" > /tmp/carwash_backup_path
}

stop_service() {
    title "Stopping Service"
    
    log "Stopping $SERVICE_NAME service..."
    systemctl stop $SERVICE_NAME
    
    # Wait for graceful shutdown
    sleep 5
    
    log "Service stopped"
}

update_application() {
    title "Updating Application"
    
    log "Updating application files..."
    
    cd "$(dirname "$0")/.."
    
    # Copy new files (excluding config and logs)
    rsync -av --exclude 'node_modules' \
              --exclude 'logs' \
              --exclude '.git' \
              --exclude '*.log' \
              --exclude 'coverage' \
              --exclude '.nyc_output' \
              --exclude '.env' \
              --exclude 'config/local.json' \
              ./ $APP_DIR/
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    log "Application files updated"
}

update_dependencies() {
    title "Updating Dependencies"
    
    cd $APP_DIR
    
    log "Cleaning old dependencies..."
    rm -rf node_modules package-lock.json
    
    log "Installing updated dependencies..."
    sudo -u $APP_USER npm install --production --no-optional
    
    log "Dependencies updated"
}

run_tests() {
    title "Running Update Tests"
    
    cd $APP_DIR
    
    log "Testing configuration load..."
    sudo -u $APP_USER timeout 10s node -e "
        const config = require('./src/config/default');
        console.log('✓ Configuration loaded successfully');
    " || error "Configuration test failed"
    
    log "Testing service startup..."
    sudo -u $APP_USER timeout 15s node -e "
        const CarWashPiApp = require('./src/app');
        const app = new CarWashPiApp();
        app.initialize().then(() => {
            console.log('✓ Application initialization test passed');
            process.exit(0);
        }).catch(err => {
            console.error('✗ Application test failed:', err.message);
            process.exit(1);
        });
    " || error "Application startup test failed"
    
    log "Update tests passed"
}

start_service() {
    title "Starting Service"
    
    log "Starting $SERVICE_NAME service..."
    systemctl start $SERVICE_NAME
    
    # Wait for startup
    sleep 10
    
    # Check if service is running
    if systemctl is-active --quiet $SERVICE_NAME; then
        log "Service started successfully"
    else
        error "Service failed to start. Check logs with: journalctl -u $SERVICE_NAME"
    fi
}

verify_update() {
    title "Verifying Update"
    
    log "Checking service status..."
    systemctl status $SERVICE_NAME --no-pager
    
    log "Checking application health..."
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        log "✓ Health check passed"
    else
        warn "Health check failed - service may still be starting"
    fi
    
    log "Recent service logs:"
    journalctl -u $SERVICE_NAME -n 10 --no-pager
}

rollback() {
    title "Rolling Back Update"
    
    local backup_path=$(cat /tmp/carwash_backup_path 2>/dev/null || echo "")
    
    if [[ -z "$backup_path" || ! -d "$backup_path" ]]; then
        error "No backup found for rollback"
    fi
    
    warn "Rolling back to backup: $backup_path"
    
    # Stop service
    systemctl stop $SERVICE_NAME
    
    # Restore configuration
    if [[ -f "$backup_path/.env" ]]; then
        cp "$backup_path/.env" "$APP_DIR/"
        log "Restored .env configuration"
    fi
    
    if [[ -f "$backup_path/local.json" ]]; then
        cp "$backup_path/local.json" "$APP_DIR/config/"
        log "Restored local.json configuration"
    fi
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    # Start service
    systemctl start $SERVICE_NAME
    
    log "Rollback completed"
}

cleanup() {
    title "Cleaning Up"
    
    # Remove old backups (keep last 5)
    if [[ -d "$BACKUP_DIR" ]]; then
        log "Cleaning old backups..."
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        log "Cleanup completed"
    fi
    
    # Clean temporary files
    rm -f /tmp/carwash_backup_path
}

print_completion_message() {
    title "Update Complete!"
    
    echo -e "${GREEN}CarWash Pi Node has been successfully updated!${NC}"
    echo
    echo -e "${BLUE}Service Status:${NC}"
    systemctl status $SERVICE_NAME --no-pager | head -10
    echo
    echo -e "${BLUE}Health Check:${NC}"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || echo "API not responding yet"
    echo
    echo -e "${BLUE}Management Commands:${NC}"
    echo "• Status:  $APP_DIR/status.sh"
    echo "• Restart: $APP_DIR/restart.sh"
    echo "• Logs:    sudo journalctl -u $SERVICE_NAME -f"
    echo
    if [[ -f "/tmp/carwash_backup_path" ]]; then
        local backup_path=$(cat /tmp/carwash_backup_path)
        echo -e "${YELLOW}Backup available at: $backup_path${NC}"
    fi
}

# Handle script arguments
case "${1:-update}" in
    "update")
        check_root
        check_service_exists
        create_backup
        stop_service
        update_application
        update_dependencies
        run_tests
        start_service
        verify_update
        cleanup
        print_completion_message
        ;;
    "rollback")
        check_root
        rollback
        ;;
    "test")
        run_tests
        ;;
    *)
        echo "Usage: $0 [update|rollback|test]"
        echo "  update   - Update the application (default)"
        echo "  rollback - Rollback to the last backup"
        echo "  test     - Run application tests only"
        exit 1
        ;;
esac