#!/bin/bash

# CarWash Pi Node Uninstall Script
# Completely removes the CarWash Pi Node application and services

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

confirm_uninstall() {
    title "CarWash Pi Node Uninstall"
    
    echo -e "${RED}WARNING: This will completely remove CarWash Pi Node!${NC}"
    echo
    echo "This will remove:"
    echo "• Application files in $APP_DIR"
    echo "• System service $SERVICE_NAME"
    echo "• Application user $APP_USER"
    echo "• Log files and configuration"
    echo "• Systemd service files"
    echo
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log "Uninstall cancelled"
        exit 0
    fi
}

stop_and_disable_service() {
    title "Stopping and Disabling Service"
    
    if systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
        log "Stopping $SERVICE_NAME service..."
        systemctl stop $SERVICE_NAME || true
        
        log "Disabling $SERVICE_NAME service..."
        systemctl disable $SERVICE_NAME || true
        
        log "Removing systemd service file..."
        rm -f /etc/systemd/system/${SERVICE_NAME}.service
        
        log "Reloading systemd daemon..."
        systemctl daemon-reload
        
        log "Resetting failed state..."
        systemctl reset-failed $SERVICE_NAME || true
        
        log "Service removed successfully"
    else
        log "Service $SERVICE_NAME not found"
    fi
}

remove_pm2_process() {
    title "Removing PM2 Process"
    
    if command -v pm2 &> /dev/null; then
        log "Stopping PM2 processes for $APP_USER..."
        sudo -u $APP_USER pm2 delete all 2>/dev/null || true
        sudo -u $APP_USER pm2 kill 2>/dev/null || true
        log "PM2 processes removed"
    else
        log "PM2 not found, skipping"
    fi
}

create_backup() {
    title "Creating Final Backup"
    
    local backup_dir="/tmp/carwash-backup-$(date +%Y%m%d_%H%M%S)"
    
    if [[ -d "$APP_DIR" ]]; then
        log "Creating backup at $backup_dir..."
        mkdir -p "$backup_dir"
        
        # Backup configuration files
        if [[ -f "$APP_DIR/.env" ]]; then
            cp "$APP_DIR/.env" "$backup_dir/"
        fi
        
        if [[ -f "$APP_DIR/config/local.json" ]]; then
            mkdir -p "$backup_dir/config"
            cp "$APP_DIR/config/local.json" "$backup_dir/config/"
        fi
        
        # Backup logs
        if [[ -d "$APP_DIR/logs" ]]; then
            cp -r "$APP_DIR/logs" "$backup_dir/"
        fi
        
        log "Backup created at: $backup_dir"
        echo "$backup_dir" > /tmp/carwash_final_backup
        
        echo -e "${YELLOW}Configuration backup saved to: $backup_dir${NC}"
        echo -e "${YELLOW}You can restore this manually if needed.${NC}"
    else
        log "No application directory found to backup"
    fi
}

remove_application_files() {
    title "Removing Application Files"
    
    if [[ -d "$APP_DIR" ]]; then
        log "Removing application directory: $APP_DIR"
        rm -rf "$APP_DIR"
        log "Application files removed"
    else
        log "Application directory not found"
    fi
}

remove_user() {
    title "Removing Application User"
    
    if id "$APP_USER" &>/dev/null; then
        log "Removing user: $APP_USER"
        userdel $APP_USER 2>/dev/null || true
        
        # Remove home directory if it exists
        if [[ -d "/home/$APP_USER" ]]; then
            rm -rf "/home/$APP_USER"
        fi
        
        log "User $APP_USER removed"
    else
        log "User $APP_USER not found"
    fi
}

remove_log_rotation() {
    title "Removing Log Rotation"
    
    if [[ -f "/etc/logrotate.d/$APP_NAME" ]]; then
        log "Removing logrotate configuration..."
        rm -f "/etc/logrotate.d/$APP_NAME"
        log "Log rotation configuration removed"
    else
        log "Log rotation configuration not found"
    fi
}

remove_firewall_rules() {
    title "Removing Firewall Rules"
    
    if command -v ufw &> /dev/null; then
        log "Removing UFW firewall rules..."
        
        # Remove application port rule
        ufw delete allow 3000/tcp 2>/dev/null || true
        
        # Remove metrics port rules
        ufw delete allow from 192.168.0.0/16 to any port 9090 2>/dev/null || true
        ufw delete allow from 10.0.0.0/8 to any port 9090 2>/dev/null || true
        ufw delete allow from 172.16.0.0/12 to any port 9090 2>/dev/null || true
        
        log "Firewall rules removed"
    else
        log "UFW not found, skipping firewall cleanup"
    fi
}

cleanup_cron_jobs() {
    title "Cleaning Up Cron Jobs"
    
    # Remove any cron jobs for the app user
    if crontab -u $APP_USER -l &>/dev/null; then
        log "Removing cron jobs for $APP_USER..."
        crontab -u $APP_USER -r 2>/dev/null || true
        log "Cron jobs removed"
    else
        log "No cron jobs found for $APP_USER"
    fi
}

cleanup_temporary_files() {
    title "Cleaning Up Temporary Files"
    
    # Remove any temporary files
    rm -f /tmp/carwash_*
    
    # Clean systemd journal logs for our service
    if command -v journalctl &> /dev/null; then
        log "Cleaning systemd journal logs..."
        journalctl --vacuum-time=1s --quiet || true
    fi
    
    log "Temporary files cleaned"
}

verify_removal() {
    title "Verifying Removal"
    
    local issues=0
    
    # Check service
    if systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
        warn "✗ Service file still exists"
        ((issues++))
    else
        log "✓ Service file removed"
    fi
    
    # Check application directory
    if [[ -d "$APP_DIR" ]]; then
        warn "✗ Application directory still exists"
        ((issues++))
    else
        log "✓ Application directory removed"
    fi
    
    # Check user
    if id "$APP_USER" &>/dev/null; then
        warn "✗ User still exists"
        ((issues++))
    else
        log "✓ User removed"
    fi
    
    # Check if service is running
    if systemctl is-active --quiet $SERVICE_NAME 2>/dev/null; then
        warn "✗ Service is still running"
        ((issues++))
    else
        log "✓ Service is not running"
    fi
    
    if [[ $issues -eq 0 ]]; then
        log "✓ Verification completed successfully"
    else
        warn "⚠ $issues issues found during verification"
    fi
}

print_completion_message() {
    title "Uninstall Complete!"
    
    echo -e "${GREEN}CarWash Pi Node has been successfully removed!${NC}"
    echo
    
    if [[ -f "/tmp/carwash_final_backup" ]]; then
        local backup_path=$(cat /tmp/carwash_final_backup)
        echo -e "${BLUE}Backup Information:${NC}"
        echo "Your configuration has been backed up to:"
        echo "$backup_path"
        echo
        echo "This backup contains:"
        echo "• Configuration files (.env, local.json)"
        echo "• Log files"
        echo
        echo "You can restore these manually if you reinstall."
        echo
    fi
    
    echo -e "${BLUE}What was removed:${NC}"
    echo "• CarWash Pi Node application"
    echo "• System service '$SERVICE_NAME'"
    echo "• Application user '$APP_USER'"
    echo "• Application directory '$APP_DIR'"
    echo "• Systemd service files"
    echo "• Log rotation configuration"
    echo "• Firewall rules"
    echo
    
    echo -e "${BLUE}What was NOT removed:${NC}"
    echo "• Node.js (system package)"
    echo "• FFmpeg (system package)"
    echo "• PM2 (global npm package)"
    echo "• System packages installed during setup"
    echo
    
    echo -e "${YELLOW}Note: You can remove Node.js and FFmpeg manually if no longer needed:${NC}"
    echo "sudo apt remove nodejs ffmpeg"
    echo "sudo npm uninstall -g pm2"
    
    rm -f /tmp/carwash_final_backup
}

# Main uninstall process
main() {
    check_root
    confirm_uninstall
    create_backup
    stop_and_disable_service
    remove_pm2_process
    remove_application_files
    remove_user
    remove_log_rotation
    remove_firewall_rules
    cleanup_cron_jobs
    cleanup_temporary_files
    verify_removal
    print_completion_message
}

# Handle script arguments
if [[ "${1:-}" == "--force" ]]; then
    # Skip confirmation for automated uninstall
    check_root
    create_backup
    stop_and_disable_service
    remove_pm2_process
    remove_application_files
    remove_user
    remove_log_rotation
    remove_firewall_rules
    cleanup_cron_jobs
    cleanup_temporary_files
    verify_removal
    print_completion_message
else
    main
fi