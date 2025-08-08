#!/bin/bash

# Enhanced notification script for interactive Claude Code moments
# Detects when Claude needs user input, permissions, or decisions

# Load environment variables
if [ -f ~/.claude/.env ]; then
    source ~/.claude/.env
fi

# Check if required variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in ~/.claude/.env"
    exit 1
fi

# Get input from stdin if available
INPUT=$(cat)
PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")

# Parse the input to determine what kind of interaction is needed
if echo "$INPUT" | grep -qi "permission\|approve\|confirm\|continue"; then
    MESSAGE="⚠️ *Claude needs permission*\n\n🔒 Claude is requesting permission to run commands\n\n📁 Project: $PROJECT_NAME\n📍 Path: $PROJECT_PATH"
    URGENCY="🚨 HIGH PRIORITY"
elif echo "$INPUT" | grep -qi "input\|decision\|choose\|select"; then
    MESSAGE="❓ *Claude needs your input*\n\n🤔 Claude is waiting for your decision or input\n\n📁 Project: $PROJECT_NAME\n📍 Path: $PROJECT_PATH"
    URGENCY="⚡ ACTION REQUIRED"
elif echo "$INPUT" | grep -qi "error\|failed\|problem"; then
    MESSAGE="❌ *Claude encountered an issue*\n\n🔧 Your attention may be needed to resolve an error\n\n📁 Project: $PROJECT_NAME\n📍 Path: $PROJECT_PATH"
    URGENCY="🚨 ISSUE DETECTED"
else
    MESSAGE="🤖 *Claude needs attention*\n\n💭 Claude may need your input or guidance\n\n📁 Project: $PROJECT_NAME\n📍 Path: $PROJECT_PATH"
    URGENCY="📢 ATTENTION NEEDED"
fi

# Format final message
FORMATTED_MESSAGE="$URGENCY\n\n$MESSAGE\n\n⏰ $(date '+%Y-%m-%d %H:%M:%S')\n\n💻 Return to your terminal to continue"

# Send to Telegram
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="$FORMATTED_MESSAGE" \
    -d parse_mode="Markdown" > /dev/null

echo "Interactive notification sent"