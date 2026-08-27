# Paystack bank-transfer setup

This project uses Paystack **Pay with Transfer**, which creates a temporary account number for one checkout order. It does not offer card payment in this checkout flow.

## 1. Configure the server

Copy `.env.example` to `.env` and fill in:

- `PAYSTACK_SECRET_KEY` — use a Paystack **secret** test key while testing and your live secret key in production. Never put this key in `index.js` or any browser code.
- `SMTP_*`, `MAIL_FROM`, and `OWNER_EMAIL` — the mailbox used to send the two payment emails. Gmail requires an App Password.

Install and run:

```bash
npm install
npm start
```

Open `http://localhost:3000` rather than opening `index.html` directly. The browser needs the Node server for `/api/orders/transfer`.

## 2. Configure Paystack

In the Paystack Dashboard, set the webhook URL to:

```text
https://your-domain.example/api/paystack/webhook
```

The production URL must be publicly reachable; a localhost URL cannot receive Paystack webhooks. The server validates the `x-paystack-signature` HMAC before it processes any event.

## 3. Test and go live

Use the Paystack test secret key and its bank-transfer test flow first. When testing is complete, use your live key only after your Nigerian business has completed Paystack's required activation steps.

Orders are stored in `data/orders.json`, which is intentionally ignored by Git. It is suitable for a small single-server prototype. Use a database before deploying multiple server instances or expecting higher order volume.

The account number is tied to a single Paystack transaction and expires after two hours. The customer must send the exact displayed amount. When Paystack sends `charge.success` with `channel: bank_transfer`, the server checks the signed event against the saved reference and amount, marks the order paid, and sends owner/customer emails.
