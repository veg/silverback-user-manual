#!/bin/bash
# Pull latest documentation updates for Silverback User Manual

LOG_FILE="/var/lib/node/silverback-user-manual/pull.log"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE" 2>/dev/null
}

# Change to documentation directory
cd /var/lib/node/silverback-user-manual || exit 1

log "Pulling latest documentation updates"

# Pull latest changes
git pull origin master >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "Successfully pulled latest updates"
    # Restart PM2 process if changes were pulled
    if [[ -n $(git log HEAD@{1}..HEAD --oneline 2>/dev/null) ]]; then
        log "Changes detected, restarting PM2 process"
        /usr/local/bin/pm2 restart silverback-manual >> "$LOG_FILE" 2>&1
        log "PM2 process restarted"
    fi
else
    log "Error pulling updates"
fi

log "Update check complete"