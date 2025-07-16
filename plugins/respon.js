const fetch = require('node-fetch')
const config = require('../config.json')

const userCooldown = new Map()
const COOLDOWN_MS = 5 * 1000 // 5 detik anti-spam

module.exports = {
  name: 'respon',
  run: async ({ sock, msg, from, text }) => {
    if (!text || msg.key.fromMe || from.endsWith('@g.us')) return

    const now = Date.now()
    const last = userCooldown.get(from) || 0
    if (now - last < COOLDOWN_MS) return
    userCooldown.set(from, now)

    try {
      // Build URL GET langsung ke ai.php
      const encodedPrompt = encodeURIComponent(text)
      const apiUrl = `https://webhook.indoprime.my.id/ai.php?apikey=${config.indoprimeFetchKey}&prompt=${encodedPrompt}`

      const res = await fetch(apiUrl)
      const json = await res.json()

      const reply = json.output?.trim() || '⚠️ Maaf kak, saya belum bisa jawab sekarang.'
      await sock.sendMessage(from, { text: reply }, { quoted: msg })

    } catch (err) {
      console.error('[ERROR Akses AI]', err)
      await sock.sendMessage(from, {
        text: '⚠️ Maaf kak, sistem sedang error atau tidak bisa terhubung ke server. Coba lagi sebentar ya 🙏'
      }, { quoted: msg })
    }
  }
}
