const fs = require('fs')
const path = require('path')
const qrcode = require('qrcode')
const express = require('express')
const bodyParser = require('body-parser')
const config = require('./config.json')

const {
  default: makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys')

const app = express()
app.use(bodyParser.json())
app.use(express.static('file'))
app.use(express.static('views'))

const { state, saveState } = useSingleFileAuthState('./sessions/indoprime.json')

// Load plugins
const plugins = []
const pluginDir = path.join(__dirname, 'plugins')
fs.readdirSync(pluginDir).forEach(file => {
  if (file.endsWith('.js')) {
    const plugin = require(path.join(pluginDir, file))
    if (typeof plugin.run === 'function') plugins.push(plugin)
  }
})

const delay = ms => new Promise(res => setTimeout(res, ms))

async function startBot() {
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  })

  global.sock = sock
  sock.ev.on('creds.update', saveState)

  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      await qrcode.toFile('./file/qr.jpg', qr, { width: 300 })
      console.log('🔑 QR disimpan ke file/qr.jpg')
    }

    if (connection === 'open') {
      console.log(`✅ ${config.botName} siap digunakan!`)
      await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
        text: `${config.botName} telah aktif, siap digunakan Bos ${config.ownerName} 🚀`,
      })
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      console.log(`❌ Disconnect [${code}], mencoba ulang...`)
      if (code !== DisconnectReason.loggedOut) {
        startBot()
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      ''

    if (!text) return

    await sock.sendPresenceUpdate('available', from)
    await delay(2000)

    for (const plugin of plugins) {
      try {
        await plugin.run({ sock, msg, from, text: text.toLowerCase(), config })
      } catch (err) {
        console.error(`[PLUGIN ERROR] ${plugin.name || 'unknown'} →`, err.message)
      }
    }
  })
}

// Kirim pesan via POST
app.post('/send', async (req, res) => {
  const { phone, message } = req.body
  if (!phone || !message) {
    return res.status(400).json({ status: false, message: 'Phone & Message wajib diisi' })
  }

  try {
    const chatId = phone.replace(/^0/, '62') + '@s.whatsapp.net'
    await global.sock.sendMessage(chatId, { text: message })
    res.json({ status: true, message: 'Pesan berhasil dikirim' })
  } catch (err) {
    console.error('❌ Gagal kirim:', err)
    res.status(500).json({ status: false, message: 'Gagal mengirim pesan' })
  }
})

// Routes
app.get('/', (req, res) => res.redirect('/qr.html'))
app.get('/uptime', (_, res) => res.json({ status: 'online', time: new Date().toISOString() }))

const PORT = process.env.PORT || config.port || 3000
app.listen(PORT, () => {
  console.log(`🚀 Webserver aktif di http://localhost:${PORT}`)
})

startBot()