# Iprime Cloudflare MCP

Remote MCP server yang berjalan di Cloudflare Workers dan memberi AI/MCP client akses terbatas untuk mengelola Cloudflare Workers.

## Tools

- `list_workers` — melihat daftar Worker pada akun Cloudflare.
- `get_worker` — membaca source/content Worker yang sudah ter-deploy.
- `deploy_worker` — membuat atau mengganti Worker ES-module dengan source JavaScript baru.

Endpoint MCP: `/mcp`

Health check: `/health`

## Secret yang dibutuhkan

Simpan sebagai Cloudflare Worker secrets, jangan commit ke GitHub:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
MCP_ACCESS_TOKEN
```

`CLOUDFLARE_API_TOKEN` minimal perlu izin Workers Scripts Read + Workers Scripts Write. Cloudflare merekomendasikan API Token dibanding Global API Key.

`MCP_ACCESS_TOKEN` melindungi endpoint `/mcp` dengan `Authorization: Bearer ...`. Jangan biarkan MCP yang dapat melakukan deploy terbuka untuk publik.

## Deploy awal

Repo ini memiliki GitHub Actions `.github/workflows/deploy.yml`. Tambahkan GitHub repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Push ke `main` akan menjalankan `wrangler deploy`.

Setelah Worker pertama kali ter-deploy, tambahkan tiga secret di atas ke Worker `iprime-cloudflare-mcp`.

## Catatan ChatGPT

Server ini menggunakan Streamable HTTP MCP melalui `/mcp`. Dukungan aksi tulis/modify pada custom MCP di ChatGPT bergantung pada paket dan fitur Developer Mode yang tersedia. Sampai akses full MCP write tersedia, workflow GitHub -> Cloudflare auto-deploy tetap dapat dipakai untuk perubahan yang dibuat lewat repo.

<!-- deploy trigger: 2026-08-07 -->
