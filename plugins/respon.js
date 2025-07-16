const fetch = require('node-fetch');
const config = require('../config.json');

const limitUser = new Map();
const LIMIT = 5;
const RESET_MS = 60 * 60 * 1000; // 1 jam

setInterval(() => limitUser.clear(), RESET_MS);

module.exports = {
  name: 'respon',
  run: async ({ sock, msg, from, text }) => {
    if (!text || from.endsWith('@g.us')) return;

    const now = Date.now();
    const user = limitUser.get(from) || { count: 0, last: now };

    // Reset jika sudah lewat waktunya
    if (now - user.last > RESET_MS) {
      user.count = 0;
    }

    if (user.count >= LIMIT) {
      if (user.count === LIMIT) {
        await sock.sendMessage(from, {
          text: '🙏 Kak, untuk menjaga kualitas layanan, kami batasi chat sementara. Yuk lanjut ngobrol nanti ya!'
        });
      }
      user.count++;
      limitUser.set(from, user);
      return;
    }

    user.count++;
    user.last = now;
    limitUser.set(from, user);

    // Deteksi pertanyaan penting
    const penting = /(indoprime|register|saldo|daftar|akun|bot|nama kamu siapa|bisa bantu|cek|info|layanan)/i;
    if (!penting.test(text)) {
      await sock.sendMessage(from, {
        text: 'Hai kak 👋 ada yang bisa PrimeAi bantu? Tanyakan apapun tentang layanan Indoprime ya!'
      });
      return;
    }

    try {
      const res = await fetch('https://webhook.indoprime.my.id/ai.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ApiKey': config.indoprimeFetchKey
        },
        body: JSON.stringify({ prompt: text })
      });

      const json = await res.json();

      if (json?.status && json.output) {
        await sock.sendMessage(from, { text: json.output });
      } else {
        await sock.sendMessage(from, {
          text: '🤖 Maaf kak, pertanyaannya belum bisa aku jawab dengan sempurna. Boleh dicoba dengan kalimat lain?'
        });
      }
    } catch (e) {
      console.error('[❌ ERROR AI]', e);
      await sock.sendMessage(from, {
        text: '🙏 Saat ini aku lagi kesulitan akses jawaban. Tapi kamu bisa coba sebentar lagi ya, makasih atas pengertiannya 🤝'
      });
    }
  }
};
