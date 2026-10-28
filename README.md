# YBiz for business — Nodemailer contact form

## Requirements
- Node.js 20 or newer
- A mailbox / SMTP provider that permits sending email
- Vercel CLI for local development (`npm install -g vercel`)

## Install and run locally
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and enter your real SMTP details.
3. Run `npm run dev` and open the local URL shown by Vercel.

Do not put SMTP credentials in `index.html` or any browser-side JavaScript. Keep `.env` private and out of Git.

## Environment variables
- `SMTP_HOST`: SMTP hostname from your email provider
- `SMTP_PORT`: normally `465` for implicit TLS or `587` for STARTTLS
- `SMTP_SECURE`: `true` for port 465; usually `false` for port 587
- `SMTP_USER`: SMTP login / mailbox username
- `SMTP_PASS`: mailbox password or app-specific SMTP password
- `CONTACT_TO_EMAIL`: inbox that receives YBiz enquiries
- `MAIL_FROM`: optional sender address approved by your provider; defaults to `SMTP_USER`

## Deploy to Vercel
Import the project into Vercel, add the same environment variables under Project Settings → Environment Variables, then redeploy. The `/api/contact` function sends the email server-side. The form will not send live email until valid SMTP credentials are configured.

Use your email provider's exact SMTP settings. Do not guess SMTP hostnames or use your normal account password if the provider requires an app password. For production, add provider-backed rate limiting / CAPTCHA to further reduce spam.
