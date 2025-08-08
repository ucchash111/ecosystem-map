# Telegram Notifications for Claude Code

This setup allows Claude Code to send you Telegram notifications when it needs your attention during CLI sessions.

## Setup Steps

### 1. Create a Telegram Bot
1. Open Telegram and message `@BotFather`
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (looks like `123456789:ABCdefGhIJklmNoPQRstUVwxyz`)

### 2. Get Your Chat ID
1. Message `@userinfobot` on Telegram  
2. Send any message to get your chat ID
3. Copy the number (your user ID)

### 3. Configure Environment Variables
1. Copy the template: `cp .claude/.env.example ~/.claude/.env`
2. Edit `~/.claude/.env` with your values:
   ```bash
   TELEGRAM_BOT_TOKEN=your_actual_bot_token
   TELEGRAM_CHAT_ID=your_actual_chat_id
   ```

### 4. Test the Setup
Run the test command:
```bash
./notify-telegram.sh "Test message from Claude Code"
```

## How It Works

The hooks are configured in `.claude/settings.json` to:
- Send notification when Claude finishes responding (`Stop` event)
- Send notification when you submit prompts (`UserPromptSubmit` event)

## Customization

Edit `.claude/settings.json` to:
- Add more hook events (PreToolUse, PostToolUse, etc.)
- Change notification triggers
- Modify notification messages

## Troubleshooting

- Ensure the script is executable: `chmod +x notify-telegram.sh`
- Check that jq is installed: `sudo apt install jq` (Ubuntu/Debian)
- Verify your bot token and chat ID are correct
- Test with a simple message first