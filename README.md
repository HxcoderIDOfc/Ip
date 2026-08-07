# Iprime Chat Connector

Cloudflare Worker connector untuk menghubungkan frontend Chat AI ke API OpenAI-compatible tanpa mengekspos API key ke browser.

## Endpoint

- `GET /` atau `GET /health` — cek status connector
- `POST /api/chat` — meneruskan payload ke `${AI_BASE_URL}/v1/chat/completions`

## Secret Cloudflare

Tambahkan di Cloudflare Worker:

- `AI_BASE_URL`
- `AI_API_KEY`

Contoh `AI_BASE_URL`:

```text
https://api.example.com
```

## Auto deploy dari GitHub

Workflow `.github/workflows/deploy.yml` otomatis deploy setiap push ke `main`.

Tambahkan GitHub Actions Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Jangan simpan API key asli di source code atau commit GitHub.
