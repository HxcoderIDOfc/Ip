const fetch = require('node-fetch')
const config = require('../config.json')

// Anti-spam per user
const userCooldown = new Map()
const COOLDOWN_MS = 5 * 1000 // 5 detik

module.exports = {
  name: 'respon',
  run: async ({ sock, msg, from, text }) => {
    if (!text || msg.key.fromMe || from.endsWith('@g.us')) return

    const now = Date.now()
    const last = userCooldown.get(from) || 0

    if (now - last < COOLDOWN_MS) return
    userCooldown.set(from, now)

    // Kirim ke AI langsung
    try {
      const url = `https://webhook.indoprime.my.id/ai.php?apikey=${config.indoprimeFetchKey}&prompt=${encodeURIComponent(text)}`
      const res = await fetch(url)
      const json = await res.json()

      const reply = json.output?.trim() || '⚠️ Maaf kak, saya belum bisa jawab sekarang.'
      await sock.sendMessage(from, { text: reply }, { quoted: msg })
    } catch (err) {
      console.error('[AI ERROR]', err)
      await sock.sendMessage(from, {
        text: '⚠️ Maaf kak, sistem sedang sibuk. Coba sebentar lagi ya 🙏'
      }, { quoted: msg })
    }
  }
}
