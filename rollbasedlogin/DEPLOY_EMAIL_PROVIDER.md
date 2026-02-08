# Email OTP in Production (Render)

Render often blocks outbound SMTP (ports 587/465/25). If you're seeing timeouts to `smtp.gmail.com:587`, use an HTTPS email provider.

This project supports two providers:

## Option 1: Resend (recommended for Render)

Set these **environment variables on the Render backend service**:

- `APP_MAIL_PROVIDER=resend`
- `RESEND_API_KEY=...` (from Resend dashboard)
- `APP_MAIL_FROM=...` (must be a verified sender/domain in Resend)

Important:

- `APP_MAIL_FROM` **cannot** be a Gmail/Yahoo/Outlook address (like `something@gmail.com`). Resend requires you to verify a domain you own.
- Typical setup:
	- In Resend: **Domains → Add domain** → add your domain (example: `yourdomain.com`) → add the DNS records (SPF/DKIM) in your domain provider → verify.
	- On Render: set `APP_MAIL_FROM=noreply@yourdomain.com` (or another address on that verified domain).

Leave your existing `app.2fa.delivery=mail` enabled.

Health check endpoint:

- `GET /health` returns `ok`

## Option 2: SMTP (works locally, may fail on Render)

Set these env vars:

- `APP_MAIL_PROVIDER=smtp`
- `SPRING_MAIL_USERNAME=...`
- `SPRING_MAIL_PASSWORD=...`

For Gmail, `SPRING_MAIL_PASSWORD` must be a Google App Password.

## Temporary fallback (debug)

To disable email sending and log OTPs in backend logs:

- `APP_2FA_DELIVERY=log`
