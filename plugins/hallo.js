module.exports = {
  name: 'hallo',
  run: async ({ sock, from, text, config }) => {
    if (text === 'hallo') {
      const apikey = config.apikeys.indoprimeFetchKey || 'no-key'
      const reply = `Halo Bos INDOPRIME! 👑\nAPIKEY kamu: ${apikey}`
      await sock.sendMessage(from, { text: reply })
    }
  }
}
