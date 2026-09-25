export const TELEGRAM_BOT_TOKEN = '8758639842:AAGweDOKzPxa8EoOR8noIJdyPLOqyG0JyVo';
export const TELEGRAM_CHAT_ID = '8386717210';

let lastTelegramSendTime = 0;

export async function sendTelegramNotification(message: string, bypassCooldown = false): Promise<boolean> {
  const now = Date.now();
  // 30 second cooldown unless explicitly bypassed for custom messages
  if (!bypassCooldown && now - lastTelegramSendTime < 30000) {
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    if (response.ok) {
      lastTelegramSendTime = now;
      return true;
    }
  } catch (e) {
    console.error('Failed to send Telegram notification:', e);
  }
  return false;
}

export async function sendCustomTelegramMessage(text: string): Promise<{ success: boolean; error?: string }> {
  if (!text || !text.trim()) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  const timeStr = new Date().toLocaleTimeString('en-US');
  const formattedMsg = `💬 *Custom Message from Dashboard*\n\n"${text.trim()}"\n\n⏰ *Sent At:* ${timeStr}`;

  const success = await sendTelegramNotification(formattedMsg, true);
  if (success) {
    return { success: true };
  } else {
    return { success: false, error: 'Failed to send message to Telegram API.' };
  }
}
