#!/bin/bash

# Chatbot Restart Script
# Safely restarts the chatbot service with proper logging

LOG_FILE="/var/log/chatbot/restart.log"
BACKUP_DIR="/var/backups/chatbot"
CONFIG_FILE="/etc/chatbot/config.json"

# Create necessary directories
mkdir -p /var/log/chatbot
mkdir -p "$BACKUP_DIR"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    local backup_file="$BACKUP_DIR/chatbot_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    log_message "Creating backup: $backup_file"
    
    tar -czf "$backup_file" \
        -C /opt chatbot \
        -C /etc chatbot \
        -C /var/log chatbot \
        2>/dev/null
        
    if [[ $? -eq 0 ]]; then
        log_message "Backup created successfully"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/chatbot_backup_*.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null || true
    else
        log_message "WARNING: Backup creation failed"
    fi
}

# Function to check configuration
check_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_message "ERROR: Configuration file not found: $CONFIG_FILE"
        return 1
    fi
    
    # Validate JSON
    if ! python3 -m json.tool "$CONFIG_FILE" >/dev/null 2>&1; then
        log_message "ERROR: Invalid JSON in configuration file"
        return 1
    fi
    
    log_message "Configuration file is valid"
    return 0
}

# Function to stop chatbot gracefully
stop_chatbot() {
    log_message "Stopping chatbot service..."
    
    # Get current PID if available
    local pid=$(supervisorctl pid chatbot 2>/dev/null)
    
    # Stop via supervisor
    supervisorctl stop chatbot
    
    # Wait for graceful shutdown
    local attempts=0
    while [[ $attempts -lt 30 ]]; do
        if ! supervisorctl status chatbot | grep -q "RUNNING"; then
            log_message "Chatbot stopped gracefully"
            return 0
        fi
        sleep 1
        ((attempts++))
    done
    
    # Force kill if still running
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        log_message "WARNING: Forcing chatbot shutdown"
        kill -TERM "$pid" 2>/dev/null || true
        sleep 5
        kill -KILL "$pid" 2>/dev/null || true
    fi
    
    return 0
}

# Function to start chatbot
start_chatbot() {
    log_message "Starting chatbot service..."
    
    # Clear any previous state
    rm -f /tmp/chatbot_failures 2>/dev/null || true
    
    # Start via supervisor
    supervisorctl start chatbot
    
    # Wait for startup
    local attempts=0
    while [[ $attempts -lt 60 ]]; do
        if supervisorctl status chatbot | grep -q "RUNNING"; then
            sleep 5  # Give it a moment to fully initialize
            
            # Test health endpoint
            if curl -s -f http://localhost:5000/health >/dev/null 2>&1; then
                log_message "Chatbot started successfully and is healthy"
                return 0
            fi
        fi
        sleep 1
        ((attempts++))
    done
    
    log_message "ERROR: Chatbot failed to start properly"
    return 1
}

# Function to update permissions
fix_permissions() {
    log_message "Fixing file permissions..."
    
    chown -R chatbot:chatbot /opt/chatbot
    chown -R chatbot:chatbot /var/log/chatbot
    chmod +x /opt/chatbot/app.py
    
    log_message "Permissions updated"
}

# Main restart function
restart_chatbot() {
    log_message "=== Chatbot Restart Process Started ==="
    
    # Validate configuration
    if ! check_config; then
        log_message "ERROR: Configuration validation failed, aborting restart"
        return 1
    fi
    
    # Create backup
    create_backup
    
    # Stop service
    if ! stop_chatbot; then
        log_message "ERROR: Failed to stop chatbot service"
        return 1
    fi
    
    # Fix permissions
    fix_permissions
    
    # Reload supervisor configuration
    supervisorctl reread
    supervisorctl update
    
    # Start service
    if ! start_chatbot; then
        log_message "ERROR: Failed to start chatbot service"
        return 1
    fi
    
    log_message "=== Chatbot Restart Process Completed Successfully ==="
    return 0
}

# Parse command line arguments
case "${1:-restart}" in
    "start")
        log_message "=== Starting Chatbot ==="
        start_chatbot
        ;;
    "stop")
        log_message "=== Stopping Chatbot ==="
        stop_chatbot
        ;;
    "restart")
        restart_chatbot
        ;;
    "status")
        supervisorctl status chatbot
        ;;
    "backup")
        create_backup
        ;;
    "check-config")
        check_config
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|backup|check-config}"
        exit 1
        ;;
esac

exit $?