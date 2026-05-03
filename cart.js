// ══════════════════════════════════════
//  THE COCO BRAND — CART SYSTEM
//  Works with cart HTML already in index.html
// ══════════════════════════════════════

const WHATSAPP_NUMBER = '+2348075081355';

// ── Cart State ──────────────────────────
let cart = [];

// ── Add to Cart ──────────────────────────
function addToCart(id, name, type, priceRaw, shade, img) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, type, priceRaw, img, qty: 1 });
  }
  updateCartUI();
  showToast(name);
}

// Called from WA section cards (onclick="cartAddFromWA(this)")
function cartAddFromWA(el) {
  addToCart(
    el.dataset.id,
    el.dataset.name,
    el.dataset.type,
    parseInt(el.dataset.price, 10) || 8500,
    el.dataset.shade,
    el.dataset.img
  );
}

// ── Remove from Cart ─────────────────────
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
  renderCartItems();
}

// ── Change Quantity ──────────────────────
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  updateCartUI();
  renderCartItems();
}

// ── Update all UI elements ───────────────
function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.priceRaw * i.qty, 0);

  // FAB count badge
  const fabCount = document.getElementById('cart-fab-count');
  if (fabCount) fabCount.textContent = totalItems;

  // FAB visibility
  const fab = document.getElementById('cart-fab');
  if (fab) fab.classList.toggle('cart-fab--visible', totalItems > 0);

  // Drawer subtitle
  const drawerCount = document.getElementById('cart-drawer-count');
  if (drawerCount) drawerCount.textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');

  // Total
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = '₦' + totalPrice.toLocaleString();

  // Empty / items / footer toggle
  const emptyEl  = document.getElementById('cart-empty');
  const itemsEl  = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');
  const isEmpty  = cart.length === 0;
  if (emptyEl)  emptyEl.style.display  = isEmpty ? 'flex'  : 'none';
  if (itemsEl)  itemsEl.style.display  = isEmpty ? 'none'  : 'flex';
  if (footerEl) footerEl.style.display = isEmpty ? 'none'  : 'block';
}

// ── Render items inside drawer ───────────
function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  container.innerHTML = cart.map(function(item) {
    return '<div class="cart-item">' +
      '<div class="cart-item-img"><img src="' + item.img + '" alt="' + item.name + '"></div>' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-type">' + item.type + '</div>' +
        '<div class="cart-item-price">₦' + (item.priceRaw * item.qty).toLocaleString() + '</div>' +
      '</div>' +
      '<div class="cart-item-controls">' +
        '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\', -1)">−</button>' +
        '<span class="qty-num">' + item.qty + '</span>' +
        '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\', 1)">+</button>' +
        '<button class="remove-btn" onclick="removeFromCart(\'' + item.id + '\')">✕</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── Toast ────────────────────────────────
function showToast(name) {
  var old = document.getElementById('cart-toast');
  if (old) old.remove();

  var toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.className = 'cart-toast';
  toast.innerHTML =
    '<div class="cart-toast-icon">✦</div>' +
    '<div class="cart-toast-text">' +
      '<span class="cart-toast-name">' + name + '</span>' +
      '<span class="cart-toast-sub">Added to cart</span>' +
    '</div>';
  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { toast.classList.add('cart-toast--show'); });
  });

  setTimeout(function() {
    toast.classList.remove('cart-toast--show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 2400);
}

// ── Open / Close Drawer ──────────────────
function openCart() {
  renderCartItems();
  updateCartUI();
  var drawer   = document.getElementById('cart-drawer');
  var backdrop = document.getElementById('cart-backdrop');
  if (drawer)   drawer.classList.add('cart-drawer--open');
  if (backdrop) backdrop.classList.add('cart-backdrop--show');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  var drawer   = document.getElementById('cart-drawer');
  var backdrop = document.getElementById('cart-backdrop');
  if (drawer)   drawer.classList.remove('cart-drawer--open');
  if (backdrop) backdrop.classList.remove('cart-backdrop--show');
  document.body.style.overflow = '';
}

// ── Clear Cart ───────────────────────────
function clearCart() {
  cart = [];
  updateCartUI();
  renderCartItems();
}

// ── WhatsApp Checkout ────────────────────
function checkout() {
  if (cart.length === 0) return;

  var totalPrice = cart.reduce(function(sum, i) { return sum + i.priceRaw * i.qty; }, 0);
  var lines = cart.map(function(i) {
    return '• ' + i.name + ' (' + i.type + ') x' + i.qty + ' — ₦' + (i.priceRaw * i.qty).toLocaleString();
  }).join('\n');

  var message =
    "Hello! I'd like to place an order from The Coco Brand 💄\n\n" +
    "*My Order:*\n" + lines + "\n\n" +
    "*Total: ₦" + totalPrice.toLocaleString() + "*\n\n" +
    "Please confirm availability and delivery details. Thank you!";

  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message), '_blank');
}

// ── Wire product tile buttons ────────────
function wireAddToCartButtons() {
  var tiles = document.querySelectorAll('.product-tile[data-id]');
  tiles.forEach(function(tile) {
    var id       = tile.dataset.id;
    var name     = tile.dataset.name;
    var type     = tile.dataset.type;
    var priceRaw = parseInt(tile.dataset.price, 10) || 8500;
    var shade    = tile.dataset.shade;
    var img      = tile.dataset.img;
    var btn      = tile.querySelector('.add-btn');
    if (!btn) return;

    var fresh = btn.cloneNode(true);
    fresh.addEventListener('click', function(e) {
      e.preventDefault();
      addToCart(id, name, type, priceRaw, shade, img);
    });
    btn.replaceWith(fresh);
  });
}

// ── Init ─────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  wireAddToCartButtons();
  updateCartUI();

  var fab      = document.getElementById('cart-fab');
  var backdrop = document.getElementById('cart-backdrop');
  var closeBtn = document.getElementById('cart-close');
  var checkBtn = document.getElementById('cart-checkout-btn');
  var clearBtn = document.getElementById('cart-clear-btn');

  if (fab)      fab.addEventListener('click', openCart);
  if (backdrop) backdrop.addEventListener('click', closeCart);
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (checkBtn) checkBtn.addEventListener('click', checkout);
  if (clearBtn) clearBtn.addEventListener('click', clearCart);
});