// ══════════════════════════════════════
//  THE COCO BRAND — CART SYSTEM
//  Floating cart + toast + WhatsApp checkout
// ══════════════════════════════════════

const WHATSAPP_NUMBER = '+2348075081355';

// ── Cart State ──────────────────────────
let cart = []; // [{ id, name, type, price, priceRaw, shade, img }]

// ── Product Data ─────────────────────────
const products = [
  { id: 'scarlet-kiss',  name: 'Scarlet Kiss',  type: 'Matte Lip Colour',      priceRaw: 8500, price: '₦8,500', shade: '#c0424a', img: './coco-img-1.jpeg' },
  { id: 'bare-velvet',   name: 'Bare Velvet',   type: 'Satin Lip Colour',      priceRaw: 8500, price: '₦8,500', shade: '#c9a090', img: './coco-img-2.jpeg' },
  { id: 'midnight-plum', name: 'Midnight Plum', type: 'Velvet Lip Colour',     priceRaw: 8500, price: '₦8,500', shade: '#6b1a22', img: './coco-img-3.jpeg' },
  { id: 'coco-rose',     name: 'Coco Rose',     type: 'Glossy Lip Colour',     priceRaw: 8500, price: '₦8,500', shade: '#e8748a', img: './coco-img-4.jpeg' },
  { id: 'crystal-gloss', name: 'Crystal Gloss', type: 'Glass Lip Colour',      priceRaw: 8500, price: '₦8,500', shade: '#e8ddd8', img: './coco-img-5.jpeg' },
  { id: 'cocoa-dream',   name: 'Cocoa Dream',   type: 'Rich Brown Lip Colour', priceRaw: 8500, price: '₦8,500', shade: '#5c3317', img: './coco-img-6.jpeg' },
];

// ── Add to Cart ──────────────────────────
function addToCart(productId, productData) {
  // Try the static products array first; fall back to data passed in from the tile
  let product = products.find(p => p.id === productId);
  if (!product && productData) {
    product = productData;
    // Cache it so qty updates work later
    products.push(product);
  }
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  showToast(product.name);
  animateCartBadge();
}

// ── Remove from Cart ─────────────────────
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
  renderCartItems();
}

// ── Change Quantity ──────────────────────
function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = (item.qty || 1) + delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  updateCartUI();
  renderCartItems();
}

// ── Update Badge + Total ─────────────────
function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.priceRaw * (i.qty || 1), 0);

  // Badge
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  // Floating button visibility
  const fab = document.getElementById('cart-fab');
  if (fab) {
    fab.classList.toggle('cart-fab--visible', totalItems > 0);
  }

  // Drawer total
  const totalEl = document.getElementById('cart-total');
  if (totalEl) {
    totalEl.textContent = `₦${totalPrice.toLocaleString()}`;
  }

  // Empty state
  const emptyEl = document.getElementById('cart-empty');
  const itemsEl = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');
  if (emptyEl && itemsEl && footerEl) {
    const isEmpty = cart.length === 0;
    emptyEl.style.display = isEmpty ? 'flex' : 'none';
    itemsEl.style.display = isEmpty ? 'none' : 'flex';
    footerEl.style.display = isEmpty ? 'none' : 'block';
  }
}

// ── Render Cart Items in Drawer ──────────
function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">
        <img src="${item.img}" alt="${item.name}">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-type">${item.type}</div>
        <div class="cart-item-price">${item.price}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)" aria-label="Decrease">−</button>
        <span class="qty-num">${item.qty || 1}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)" aria-label="Increase">+</button>
        <button class="remove-btn" onclick="removeFromCart('${item.id}')" aria-label="Remove">✕</button>
      </div>
    </div>
  `).join('');
}

// ── Toast Notification ───────────────────
function showToast(productName) {
  // Remove any existing toast
  const existing = document.getElementById('cart-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.className = 'cart-toast';
  toast.innerHTML = `
    <div class="cart-toast-icon">✦</div>
    <div class="cart-toast-text">
      <span class="cart-toast-name">${productName}</span>
      <span class="cart-toast-sub">Added to cart</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Trigger entrance
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('cart-toast--show'));
  });

  // Auto-dismiss after 2.4s
  setTimeout(() => {
    toast.classList.remove('cart-toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}

// ── Animate Cart Badge ───────────────────
function animateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  badge.classList.remove('badge-pop');
  void badge.offsetWidth; // reflow
  badge.classList.add('badge-pop');
}

// ── Open / Close Cart Drawer ─────────────
function openCart() {
  renderCartItems();
  updateCartUI();
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.add('cart-drawer--open');
  if (overlay) overlay.classList.add('cart-overlay--show');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.remove('cart-drawer--open');
  if (overlay) overlay.classList.remove('cart-overlay--show');
  document.body.style.overflow = '';
}

// ── WhatsApp Checkout ────────────────────
function checkout() {
  if (cart.length === 0) return;

  const totalPrice = cart.reduce((sum, i) => sum + i.priceRaw * (i.qty || 1), 0);

  const itemLines = cart.map(item => {
    const qty = item.qty || 1;
    const lineTotal = item.priceRaw * qty;
    return `• ${item.name} (${item.type}) x${qty} — ₦${lineTotal.toLocaleString()}`;
  }).join('\n');

  const message =
    `Hello! I'd like to place an order from The Coco Brand 💄\n\n` +
    `*My Order:*\n${itemLines}\n\n` +
    `*Total: ₦${totalPrice.toLocaleString()}*\n\n` +
    `Please confirm availability and delivery details. Thank you!`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// ── Inject Cart HTML into DOM ─────────────
function injectCartHTML() {
  const html = `
    <!-- Cart Overlay -->
    <div id="cart-overlay" class="cart-overlay" onclick="closeCart()"></div>

    <!-- Cart Drawer -->
    <div id="cart-drawer" class="cart-drawer" role="dialog" aria-label="Shopping cart">
      <div class="cart-drawer-header">
        <div class="cart-drawer-title">
          <span class="cart-drawer-title-text">Your Cart</span>
          <span id="cart-badge-drawer" class="cart-drawer-count"></span>
        </div>
        <button class="cart-close-btn" onclick="closeCart()" aria-label="Close cart">✕</button>
      </div>

      <!-- Empty State -->
      <div id="cart-empty" class="cart-empty">
        <div class="cart-empty-icon">💄</div>
        <p class="cart-empty-title">Your cart is empty</p>
        <p class="cart-empty-sub">Add a shade to get started</p>
        <button class="cart-empty-btn" onclick="closeCart()">Shop Now</button>
      </div>

      <!-- Items List -->
      <div id="cart-items" class="cart-items" style="display:none"></div>

      <!-- Footer -->
      <div id="cart-footer" class="cart-footer" style="display:none">
        <div class="cart-total-row">
          <span class="cart-total-label">Total</span>
          <span id="cart-total" class="cart-total-value">₦0</span>
        </div>
        <button class="cart-checkout-btn" onclick="checkout()">
          <img src="./whatsapp.png" alt="" class="cart-wa-icon">
          Order on WhatsApp
        </button>
        <button class="cart-continue-btn" onclick="closeCart()">Continue Shopping</button>
      </div>
    </div>

    <!-- Floating Cart Button -->
    <button id="cart-fab" class="cart-fab" onclick="openCart()" aria-label="Open cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <span id="cart-badge" class="cart-badge" style="display:none">0</span>
    </button>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ── Wire up Add-to-Cart Buttons ──────────
// Reads all product info directly from data-* attributes on each .product-tile.
// No positional array, no guessing — fully self-contained.
function wireAddToCartButtons() {
  const tiles = document.querySelectorAll('.product-tile[data-id]');
  tiles.forEach(tile => {
    const id       = tile.dataset.id;
    const name     = tile.dataset.name;
    const type     = tile.dataset.type;
    const priceRaw = parseInt(tile.dataset.price, 10) || 8500;
    const shade    = tile.dataset.shade || '#c0424a';
    const img      = tile.dataset.img   || '';

    if (!id) return;

    const btn = tile.querySelector('.add-btn');
    if (!btn) return;

    const productData = {
      id, name, type, priceRaw,
      price: `₦${priceRaw.toLocaleString()}`,
      shade, img, qty: 1
    };

    // Clone to strip any stale listeners, then attach fresh one
    const freshBtn = btn.cloneNode(true);
    freshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      addToCart(id, productData);
    });
    btn.replaceWith(freshBtn);
  });
}

// ── Init ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectCartHTML();
  wireAddToCartButtons();
  updateCartUI();
});