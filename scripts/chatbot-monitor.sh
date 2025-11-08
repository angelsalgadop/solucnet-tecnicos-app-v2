#!/bin/bash

# Chatbot Monitoring Script
# Checks chatbot health and restarts if necessary

LOG_FILE="/var/log/chatbot/monitor.log"
CHATBOT_URL="http://localhost:5000/health"
MAX_FAILURES=3
FAILURE_COUNT_FILE="/tmp/chatbot_failures"

# Create log directory if it doesn't exist
mkdir -p /var/log/chatbot

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to get current failure count
get_failure_count() {
    if [[ -f "$FAILURE_COUNT_FILE" ]]; then
        cat "$FAILURE_COUNT_FILE"
    else
        echo "0"
    fi
}

# Function to increment failure count
increment_failure_count() {
    local current_count=$(get_failure_count)
    echo $((current_count + 1)) > "$FAILURE_COUNT_FILE"
}

# Function to reset failure count
reset_failure_count() {
    echo "0" > "$FAILURE_COUNT_FILE"
}

# Function to check if chatbot is running
is_chatbot_running() {
    supervisorctl status chatbot | grep -q "RUNNING"
    return $?
}

# Function to check chatbot health via HTTP
check_chatbot_health() {
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$CHATBOT_URL" 2>/dev/null)
        [[ "$response" == "200" ]]
    else
        # Fallback: just check if process is running
        is_chatbot_running
    fi
}

# Function to restart chatbot
restart_chatbot() {
    log_message "Attempting to restart chatbot service..."
    
    # Try graceful restart first
    supervisorctl restart chatbot
    
    sleep 10
    
    if is_chatbot_running; then
        log_message "Chatbot successfully restarted"
        reset_failure_count
        return 0
    else
        log_message "Failed to restart chatbot via supervisor"
        return 1
    fi
}

# Function to send notification (if configured)
send_notification() {
    local message="$1"
    
    # Log to system log
    logger "CHATBOT MONITOR: $message"
    
    # If webhook URL is configured, send notification
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"🤖 Chatbot Monitor: $message\"}" \
            2>/dev/null || true
    fi
}

# Main monitoring logic
main() {
    log_message "Starting health check..."
    
    if ! is_chatbot_running; then
        log_message "ERROR: Chatbot service is not running"
        increment_failure_count
        
        if restart_chatbot; then
            send_notification "Chatbot was down and has been successfully restarted"
        else
            send_notification "CRITICAL: Failed to restart chatbot service"
        fi
        
        return
    fi
    
    if ! check_chatbot_health; then
        log_message "WARNING: Chatbot health check failed"
        increment_failure_count
        
        local failures=$(get_failure_count)
        
        if [[ $failures -ge $MAX_FAILURES ]]; then
            log_message "ERROR: Health check failed $failures times, restarting service"
            
            if restart_chatbot; then
                send_notification "Chatbot health checks were failing and service has been restarted"
            else
                send_notification "CRITICAL: Chatbot health checks failing and restart failed"
            fi
        else
            log_message "Health check failure $failures/$MAX_FAILURES"
        fi
    else
        # Health check passed
        local failures=$(get_failure_count)
        if [[ $failures -gt 0 ]]; then
            log_message "Health check recovered (was failing $failures times)"
            reset_failure_count
        fi
        log_message "Health check passed"
    fi
}

# Run main function
main "$@"

# Clean up old log files (keep last 7 days)
find /var/log/chatbot -name "*.log" -mtime +7 -delete 2>/dev/null || true