const fetch = require('node-fetch')
const config = require('../config.json')

const userCooldown = new Map()
const COOLDOWN_MS = 5 * 1000

// Regex untuk mendeteksi sapaan ringan
const greetingDetector = /^(hay+|hi+|halo+|pagi|malam|siang|kak+|bro+|tes|assalamualaikum)/i

// Jawaban manual
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
    reply: 'Saya PrimeAi, asisten pribadi Indoprime 🤖 Siap bantu kakak kapan pun!'
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
    reply: 'Indoprime adalah layanan digital modern yang dibangun oleh Kak Hendra untuk bantu banyak orang 💼'
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

    const lowerText = text.toLowerCase()
    const now = Date.now()
    const last = userCooldown.get(from) || 0

    const isGreeting = greetingDetector.test(lowerText)

    if (!isGreeting && now - last < COOLDOWN_MS) return // anti-spam hanya kalau bukan greeting
    userCooldown.set(from, now)

    // Kalau greeting, langsung ke AI biar terkesan interaktif
    if (isGreeting) {
      return await forwardToAI(sock, from, text, msg)
    }

    // Coba balasan manual
    for (const item of manualReplies) {
      if (item.keywords.some(k => lowerText.includes(k))) {
        await sock.sendMessage(from, { text: item.reply }, { quoted: msg })
        return
      }
    }

    // Kalau gak cocok manual, panggil AI
    await forwardToAI(sock, from, text, msg)
  }
}

async function forwardToAI(sock, from, prompt, msg) {
  try {
    const res = await fetch('https://webhook.indoprime.my.id/ai.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ApiKey': config.indoprimeFetchKey
      },
      body: JSON.stringify({ prompt })
    })

    const json = await res.json()
    const reply = json.output?.trim() || 'Maaf kak, saya belum bisa jawab itu sekarang 😔'

    await sock.sendMessage(from, { text: reply }, { quoted: msg })
  } catch (err) {
    console.error('[AI ERROR]', err)
    await sock.sendMessage(from, {
      text: '⚠️ Maaf kak, sistem sedang sibuk. Coba lagi sebentar ya 🙏'
    }, { quoted: msg })
  }
  }
