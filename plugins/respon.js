const fs = require('fs')
const fetch = require('node-fetch')

// Ambil config
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))

// Batasan chat per user
const limit = {}
const MAX_CHATS = 5
const RESET_INTERVAL_MS = 60 * 60 * 1000 // Reset tiap jam

// Reset otomatis tiap interval
setInterval(() => {
  for (const user in limit) {
    limit[user] = 0
  }
}, RESET_INTERVAL_MS)

module.exports = {
  name: 'respon',
  run: async ({ sock, msg, from, text }) => {
    if (!limit[from]) limit[from] = 0
    limit[from]++

    if (limit[from] > MAX_CHATS) {
      await sock.sendMessage(from, {
        text: '🚫 Anda telah mencapai batas interaksi. Coba lagi nanti ya.'
      })
      return
    }

    // Khusus trigger tentang "indoprime"
    if (text.includes('indoprime')) {
      await sock.sendMessage(from, {
        text: '📣 Saya PrimeAi, asisten pribadi Bos Indoprime. Ingin tahu lebih lanjut tentang layanan kami? Tanyakan aja!'
      })
      return
    }

    // Kirim pertanyaan ke AI jika bukan pertanyaan khusus
    try {
      const response = await fetch('https://webhook.indoprime.my.id/ai.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ApiKey': config.indoprimeFetchKey
        },
        body: JSON.stringify({ prompt: text })
      })

      const result = await response.json()
      if (result.status && result.output) {
        await sock.sendMessage(from, { text: `🧠 ${result.output}` })
      } else {
        await sock.sendMessage(from, {
          text: '⚠️ Maaf, saya tidak bisa menjawab pertanyaan itu saat ini.'
        })
      }
    } catch (err) {
      console.error('[AI Error]', err)
      await sock.sendMessage(from, {
        text: '❌ Terjadi kesalahan saat menghubungi AI.'
      })
    }
  }
        }
