async function notify(message) {
  try {
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

    if (!token || !chatId) {
      console.warn('Telegram alerts disabled: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let description = '';
        try {
          const body = await res.json();
          description = body.description || JSON.stringify(body);
        } catch {
          description = await res.text().catch(() => '');
        }
        console.error(`Telegram alert failed: HTTP ${res.status}${description ? ` - ${description}` : ''}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const cause = err.cause ? (err.cause.code || err.cause.message || String(err.cause)) : '';
      console.error(`Telegram alert network error: ${err.message}${cause ? ` (cause: ${cause})` : ''}`);
    }
  } catch (unexpectedErr) {
    // Top-level guard ensures notify never throws or crashes caller
    console.error('Unexpected error in notify:', unexpectedErr.message);
  }
}

module.exports = notify;
