#!/bin/bash

# Telegram notification script for Claude Code hooks
# Usage: ./notify-telegram.sh "message" [optional_title]

# Load environment variables
if [ -f ~/.claude/.env ]; then
    source ~/.claude/.env
fi

# Check if required variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in ~/.claude/.env"
    exit 1
fi

# Get message from argument or stdin
MESSAGE="$1"
TITLE="${2:-Claude Code Notification}"

# If no argument provided, read from stdin (for hook usage)
if [ -z "$MESSAGE" ]; then
    # Read JSON from stdin and extract relevant information
    INPUT=$(cat)
    PROJECT_PATH=$(echo "$INPUT" | jq -r '.workingDirectory // "Unknown"' 2>/dev/null || echo "Unknown")
    PROJECT_NAME=$(basename "$PROJECT_PATH")
    MESSAGE="🤖 Claude needs attention in project: $PROJECT_NAME\n\nPath: $PROJECT_PATH"
fi

# Format message
FORMATTED_MESSAGE="🚨 *$TITLE*\n\n$MESSAGE\n\n⏰ $(date '+%Y-%m-%d %H:%M:%S')"

# Send to Telegram
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="$FORMATTED_MESSAGE" \
    -d parse_mode="Markdown" > /dev/null

echo "Telegram notification sent"