import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const PAYSTACK_API = 'https://api.paystack.co';
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Keep this catalogue on the server. Never trust a price sent from the browser.
const PRODUCTS = {
  'scarlet-kiss': { name: 'Scarlet Kiss', type: 'Matte Lip Colour', price: 5000 },
  'bare-velvet': { name: 'Bare Velvet', type: 'Satin Lip Colour', price: 5000 },
  'midnight-plum': { name: 'Midnight Plum', type: 'Velvet Lip Colour', price: 5000 },
  'coco-rose': { name: 'Coco Rose', type: 'Glossy Lip Colour', price: 5000 },
  'crystal-gloss': { name: 'Crystal Gloss', type: 'Glass Lip Colour', price: 5000 },
  'cocoa-dream': { name: 'Cocoa Dream', type: 'Rich Brown Lip Colour', price: 5000 }
};

// JSON storage keeps this demo small. Replace it with a database before deploying at scale.
async function readOrders() {
  try { return JSON.parse(await fs.readFile(ORDERS_FILE, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}
async function writeOrders(orders) {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function configured(value) {
  return typeof value === 'string' && value.trim() && !value.includes('replace_me');
}

const mailer = configured(process.env.SMTP_HOST) && configured(process.env.SMTP_USER) && configured(process.env.SMTP_PASS)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

async function sendPaymentEmails(order) {
  if (!mailer || !configured(process.env.OWNER_EMAIL)) {
    console.warn('Payment emails were skipped: configure SMTP_* and OWNER_EMAIL in .env.');
    return;
  }
  const itemList = order.items.map((item) => `${item.name} × ${item.qty}`).join(', ');
  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(order.amount / 100);
  await Promise.all([
    mailer.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.OWNER_EMAIL,
      subject: `Payment received — ${order.reference}`,
      text: `Payment received for ${order.reference}.\nCustomer: ${order.customer.name} (${order.customer.email})\nItems: ${itemList}\nTotal: ${amount}\nPaystack transaction: ${order.paystackTransactionId}`
    }),
    mailer.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: order.customer.email,
      subject: `We received your order ${order.reference}`,
      text: `Hi ${order.customer.firstName},\n\nWe have received your payment of ${amount} for order ${order.reference}. Your order is now being processed.\n\nItems: ${itemList}\n\nThank you for shopping with The Coco Brand.`
    })
  ]);
}

// The webhook must receive the exact raw bytes, so it is registered before express.json().
app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.get('x-paystack-signature') || '';
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(req.body).digest('hex');
  const valid = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return res.status(401).json({ error: 'Invalid Paystack signature.' });

  // Acknowledge promptly; Paystack retries webhook requests that do not receive HTTP 200.
  res.sendStatus(200);

  try {
    const event = JSON.parse(req.body.toString('utf8'));
    if (event.event !== 'charge.success' || event.data?.channel !== 'bank_transfer') return;

    const orders = await readOrders();
    const order = orders[event.data.reference];
    // Check reference and amount against our own saved record. This also makes repeated webhooks safe.
    if (!order || order.status === 'paid' || order.amount !== event.data.amount) return;

    order.status = 'paid';
    order.paidAt = event.data.paid_at || new Date().toISOString();
    order.paystackTransactionId = event.data.id;
    await writeOrders(orders);
    await sendPaymentEmails(order);
  } catch (error) {
    // Paystack already has a 200 response. Log for monitoring rather than retrying and duplicating email.
    console.error('Webhook processing failed:', error);
  }
});

app.use(express.json({ limit: '100kb' }));

// Creates a temporary, order-specific Pay with Transfer account (not a recurring customer DVA).
app.post('/api/orders/transfer', async (req, res) => {
  try {
    if (!configured(process.env.PAYSTACK_SECRET_KEY)) {
      return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY is missing from .env.' });
    }
    const { customer, items } = req.body;
    const email = String(customer?.email || '').trim().toLowerCase();
    const firstName = String(customer?.firstName || '').trim();
    const lastName = String(customer?.lastName || '').trim();
    const phone = String(customer?.phone || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || !firstName || !lastName || !phone || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Please provide your name, email, phone number, and at least one item.' });
    }

    const safeItems = items.map(({ id, qty }) => {
      const product = PRODUCTS[id];
      const quantity = Number(qty);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error('Invalid cart item.');
      return { id, ...product, qty: quantity };
    });
    const amount = safeItems.reduce((total, item) => total + item.price * item.qty, 0) * 100; // Paystack uses kobo.
    const reference = `COCO-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const paystackResponse = await fetch(`${PAYSTACK_API}/charge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        bank_transfer: { account_expires_at: expiresAt },
        metadata: { order_reference: reference, customer_name: `${firstName} ${lastName}`, items: safeItems.map(({ id, qty }) => ({ id, qty })) }
      })
    });
    const result = await paystackResponse.json();
    if (!paystackResponse.ok || !result.status || result.data?.status !== 'pending_bank_transfer') {
      console.error('Paystack charge error:', result);
      return res.status(502).json({ error: result.message || 'Paystack could not create a transfer account. Please try again.' });
    }

    const order = {
      reference, status: 'awaiting_payment', amount, currency: 'NGN', createdAt: new Date().toISOString(),
      customer: { firstName, lastName, name: `${firstName} ${lastName}`, email, phone },
      items: safeItems,
      transfer: {
        accountName: result.data.account_name,
        accountNumber: result.data.account_number,
        bankName: result.data.bank?.name,
        expiresAt: result.data.account_expires_at
      }
    };
    const orders = await readOrders();
    orders[reference] = order;
    await writeOrders(orders);
    return res.status(201).json({ order });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(400).json({ error: error.message || 'Unable to create order.' });
  }
});

app.get('/api/orders/:reference', async (req, res) => {
  const order = (await readOrders())[req.params.reference];
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  // This endpoint is intentionally minimal; do not expose a customer lookup endpoint in production.
  res.json({ reference: order.reference, status: order.status, paidAt: order.paidAt || null });
});

app.use(express.static(__dirname, { dotfiles: 'deny' }));
app.listen(PORT, () => console.log(`The Coco Brand is running at http://localhost:${PORT}`));
