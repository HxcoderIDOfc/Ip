const fetch = require('node-fetch')
const config = require('../config.json')

// Simpan waktu terakhir tiap user buat anti-spam
const userCooldown = new Map()
const COOLDOWN_MS = 60 * 1000 // 1 menit

// Manual reply rules
const manualReplies = [
  {
    keywords: ['saldo', 'saldo saya', 'cek saldo'],
    reply: 'Pemilik saya sedang membuat fitur saldo kak, mohon tunggu yaa 🙏'
  },
  {
    keywords: ['login', 'daftar', 'register', 'masuk akun'],
    reply: 'Fitur login & pendaftaran akan segera tersedia kak, ditunggu aja ya ✨'
  },
  {
    keywords: ['siapa pemilik', 'owner', 'pemilik indoprime'],
    reply: 'Pemilik Indoprime itu Kak Hendra 😎'
  },
  {
    keywords: ['kamu siapa', 'siapa kamu', 'nama kamu'],
    reply: 'Saya PrimeAi, asisten pribadi dari Indoprime 🤖 Siap bantu 24 jam kak!'
  },
  {
    keywords: ['halo', 'hallo', 'hi', 'hay', 'assalamualaikum'],
    reply: 'Halo kak! 👋 Saya di sini kalau kakak butuh bantuan ya~'
  },
  {
    keywords: ['terima kasih', 'makasih', 'thanks', 'thank you'],
    reply: 'Sama-sama kak 🙏 Semoga harimu menyenangkan!'
  },
  {
    keywords: ['kontak', 'cs', 'customer service', 'nomor admin'],
    reply: 'Untuk bantuan langsung, bisa hubungi Pemilik Saya di WhatsApp ya kak 😊'
  },
  {
    keywords: ['apa itu indoprime', 'tentang indoprime'],
    reply: 'Indoprime adalah layanan profesional digital modern yang dibangun oleh Kak Hendra untuk bantu banyak orang 💼'
  },
  {
    keywords: ['jam kerja', 'jam buka'],
    reply: 'Indoprime aktif 24 jam secara online kak, tapi slowres jam 01:00 - 06:00 WIB 😴'
  }
]

module.exports = {
  name: 'respon',
  run: async ({ sock, msg, from, text }) => {
    if (!text || msg.key.fromMe || from.endsWith('@g.us')) return

    const now = Date.now()
    const last = userCooldown.get(from) || 0
    if (now - last < COOLDOWN_MS) return
    userCooldown.set(from, now)

    const lowerText = text.toLowerCase()

    // Coba cocokan manual reply dulu
    for (const item of manualReplies) {
      if (item.keywords.some(k => lowerText.includes(k))) {
        await sock.sendMessage(from, { text: item.reply })
        return
      }
    }

    // Kalau tidak cocok, baru kirim ke AI
    try {
      const res = await fetch('https://webhook.indoprime.my.id/ai.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ApiKey': config.indoprimeFetchKey
        },
        body: JSON.stringify({ prompt: text })
      })

      const json = await res.json()
      const reply = json.output || 'Maaf kak, saya belum bisa jawab itu sekarang 😔'

      await sock.sendMessage(from, { text: reply })
    } catch (err) {
      console.error('[AI ERROR]', err)
      await sock.sendMessage(from, {
        text: '⚠️ Maaf kak, sistem kami sedang mengalami kendala. Coba lagi sebentar ya.'
      })
    }
  }
      }
