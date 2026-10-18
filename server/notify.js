async function notify(message) {
  console.log('[ALERT]', message);
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
  if (!token || !chatId) {
    console.error('Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) console.error('Telegram error:', res.status, await res.text());
  } catch (err) {
    console.error('Alert failed:', err.message, err.cause ? (err.cause.code || err.cause.message) : '');
  }
}

module.exports = notify;