const fetch = require('node-fetch')
const config = require('../config.json')

const userCooldown = new Map()
const COOLDOWN_MS = 5 * 1000 // 5 detik cooldown biar gak nyepam

const greetingDetector = /^(hay+|hi+|halo+|pagi|malam|siang|kak+|bro+|tes|assalamualaikum)/i

const manualReplies = [
  { keywords: ['saldo', 'saldo saya', 'cek saldo'], reply: 'Pemilik saya sedang membuat fitur saldo kak, mohon tunggu yaa 🙏' },
  { keywords: ['login', 'daftar', 'register', 'masuk akun'], reply: 'Fitur login & pendaftaran akan segera tersedia kak, ditunggu aja ya ✨' },
  { keywords: ['siapa pemilik', 'owner', 'pemilik indoprime'], reply: 'Pemilik Indoprime itu Kak Hendra 😎' },
  { keywords: ['kamu siapa', 'siapa kamu', 'nama kamu'], reply: 'Saya PrimeAi, asisten pribadi Indoprime 🤖 Siap bantu kakak kapan pun!' },
  { keywords: ['terima kasih', 'makasih', 'thanks', 'thank you'], reply: 'Sama-sama kak 🙏 Semoga harimu menyenangkan!' },
  { keywords: ['kontak', 'cs', 'customer service', 'nomor admin'], reply: 'Untuk bantuan langsung, bisa hubungi Pemilik Saya di WhatsApp ya kak 😊' },
  { keywords: ['apa itu indoprime', 'tentang indoprime'], reply: 'Indoprime adalah layanan digital modern yang dibangun oleh Kak Hendra untuk bantu banyak orang 💼' },
  { keywords: ['jam kerja', 'jam buka'], reply: 'Indoprime aktif 24 jam secara online kak, tapi slowres jam 01:00 - 06:00 WIB 😴' },
  { keywords: ['kerja apa', 'indoprime kerjaan apa', 'kerja di indoprime'], reply: 'Indoprime fokus di bidang jasa digital, otomatisasi, dan teknologi informasi kak 💻📈' },
  { keywords: ['biaya', 'harga', 'ongkos'], reply: 'Untuk harga layanan Indoprime bisa kakak tanyakan langsung ke Kak Hendra ya, soalnya fleksibel tergantung kebutuhan 😊' }
]

module.exports = {
  name: 'respon',
  run: async ({ sock, msg, from, text }) => {
    if (!text || msg.key.fromMe || from.endsWith('@g.us')) return

    const lowerText = text.toLowerCase()
    const now = Date.now()
    const last = userCooldown.get(from) || 0
    const isGreeting = greetingDetector.test(lowerText)

    // Anti-spam kecuali greeting
    if (!isGreeting && now - last < COOLDOWN_MS) return
    userCooldown.set(from, now)

    // Langsung ke AI kalau greeting
    if (isGreeting) {
      return await forwardToAI(sock, from, text, msg)
    }

    // Manual check dulu
    for (const item of manualReplies) {
      if (item.keywords.some(k => lowerText.includes(k))) {
        return await sock.sendMessage(from, { text: item.reply }, { quoted: msg })
      }
    }

    // Kalau tidak ditemukan di manual, kirim ke AI
    await forwardToAI(sock, from, text, msg)
  }
}

// Panggil AI pakai GET (hemat & cepat)
async function forwardToAI(sock, from, prompt, msg) {
  try {
    const url = `https://webhook.indoprime.my.id/ai.php?apikey=${encodeURIComponent(config.indoprimeFetchKey)}&prompt=${encodeURIComponent(prompt)}`
    const res = await fetch(url)
    const json = await res.json()

    const reply = json.output?.trim() || 'Maaf kak, saya belum bisa jawab itu sekarang 😔'
    await sock.sendMessage(from, { text: reply }, { quoted: msg })
  } catch (err) {
    console.error('[AI ERROR]', err)
    await sock.sendMessage(from, {
      text: '⚠️ Maaf kak, sistem kami sedang sibuk. Coba lagi sebentar ya 🙏'
    }, { quoted: msg })
  }
               }
