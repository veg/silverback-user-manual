#!/bin/bash
# Weekly documentation update script for Silverback User Manual

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
LOG_FILE="/home/sweaver/warewulf-admin/silverback-user-manual/update.log"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Change to documentation directory
cd /home/sweaver/warewulf-admin/silverback-user-manual || exit 1

log "Starting weekly documentation update"

# Update documentation using Claude CLI
log "Running Claude CLI to update documentation"
claude "Please review the Silverback ARM HPC documentation in this directory. Check if any system information needs updating (like software versions, node status, or configuration changes). Update the documentation if needed and commit any changes." >> "$LOG_FILE" 2>&1

# Check if there are any changes to commit
if [[ -n $(git status -s) ]]; then
    log "Changes detected, committing and pushing"
    git add .
    git commit -m "Weekly automated documentation update - $(date +'%Y-%m-%d')" >> "$LOG_FILE" 2>&1
    git push origin master >> "$LOG_FILE" 2>&1
    log "Documentation updated successfully"
else
    log "No documentation changes needed"
fi

log "Weekly update complete"