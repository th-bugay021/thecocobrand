// The Coco Brand cart and secure Paystack bank-transfer checkout.
let cart = [];

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

function addToCart(id, name, type, priceRaw, shade, img) {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, type, priceRaw, shade, img, qty: 1 });
  updateCartUI();
  showToast(name);
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  updateCartUI();
  renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find((cartItem) => cartItem.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.priceRaw * item.qty, 0);
  document.getElementById('cart-fab-count').textContent = totalItems;
  document.getElementById('cart-fab').classList.toggle('cart-fab--visible', totalItems > 0);
  document.getElementById('cart-drawer-count').textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
  document.getElementById('cart-total').textContent = formatNaira(totalPrice);
  const isEmpty = cart.length === 0;
  document.getElementById('cart-empty').style.display = isEmpty ? 'flex' : 'none';
  document.getElementById('cart-items').style.display = isEmpty ? 'none' : 'flex';
  document.getElementById('cart-footer').style.display = isEmpty ? 'none' : 'block';
}

function renderCartItems() {
  document.getElementById('cart-items').innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img"><img src="${item.img}" alt="${item.name}"></div>
      <div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-type">${item.type}</div><div class="cart-item-price">${formatNaira(item.priceRaw * item.qty)}</div></div>
      <div class="cart-item-controls"><button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button><span class="qty-num">${item.qty}</span><button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button><button class="remove-btn" data-action="remove" data-id="${item.id}" aria-label="Remove item">✕</button></div>
    </div>`).join('');
}

function showToast(name) {
  document.getElementById('cart-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'cart-toast'; toast.className = 'cart-toast';
  toast.innerHTML = `<div class="cart-toast-icon">✦</div><div class="cart-toast-text"><span class="cart-toast-name">${name}</span><span class="cart-toast-sub">Added to cart</span></div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('cart-toast--show')));
  setTimeout(() => { toast.classList.remove('cart-toast--show'); setTimeout(() => toast.remove(), 400); }, 2400);
}

function openCart() {
  renderCartItems(); updateCartUI();
  document.getElementById('cart-drawer').classList.add('cart-drawer--open');
  document.getElementById('cart-backdrop').classList.add('cart-backdrop--show');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('cart-drawer--open');
  document.getElementById('cart-backdrop').classList.remove('cart-backdrop--show');
  document.body.style.overflow = '';
}
function clearCart() { cart = []; updateCartUI(); renderCartItems(); }

function openCheckout() {
  if (!cart.length) return;
  closeCart();
  const modal = document.getElementById('checkout-modal');
  modal.classList.add('checkout-modal--open'); modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  modal.classList.remove('checkout-modal--open'); modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

async function createTransferAccount(event) {
  event.preventDefault();
  const errorEl = document.getElementById('checkout-error');
  const submit = document.getElementById('checkout-submit');
  errorEl.textContent = ''; submit.disabled = true; submit.textContent = 'Creating secure account…';
  const customer = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const response = await fetch('/api/orders/transfer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, items: cart.map(({ id, qty }) => ({ id, qty })) })
    });
    // Read the body once as text first. This is safe even if a proxy/server crashes
    // and sends an empty or non-JSON response; calling response.json() directly is not.
    const responseText = await response.text();
    let result = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`The server returned an invalid response (${response.status}). Please try again.`);
      }
    }
    // Check the HTTP status before expecting a successful order payload.
    if (!response.ok) {
      throw new Error(result.error || `The server could not create the transfer account (HTTP ${response.status}).`);
    }
    if (!result.order) {
      throw new Error('The server returned an empty payment response. Please try again.');
    }
    showTransferDetails(result.order);
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    submit.disabled = false; submit.textContent = 'Create transfer account';
  }
}

function showTransferDetails(order) {
  const transfer = order.transfer;
  document.getElementById('checkout-customer-step').hidden = true;
  document.getElementById('checkout-payment-step').hidden = false;
  document.getElementById('transfer-amount').textContent = formatNaira(order.amount / 100);
  document.getElementById('transfer-bank').textContent = transfer.bankName;
  document.getElementById('transfer-account-name').textContent = transfer.accountName;
  document.getElementById('transfer-account-number').textContent = transfer.accountNumber;
  document.getElementById('transfer-reference').textContent = order.reference;
  document.getElementById('transfer-expiry').textContent = new Date(transfer.expiresAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

function wireAddToCartButtons() {
  document.querySelectorAll('.product-tile[data-id]').forEach((tile) => {
    tile.querySelector('.add-btn').addEventListener('click', (event) => {
      event.preventDefault();
      addToCart(tile.dataset.id, tile.dataset.name, tile.dataset.type, Number(tile.dataset.price), tile.dataset.shade, tile.dataset.img);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireAddToCartButtons(); updateCartUI();
  document.getElementById('cart-fab').addEventListener('click', openCart);
  document.getElementById('cart-backdrop').addEventListener('click', closeCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-clear-btn').addEventListener('click', clearCart);
  document.getElementById('cart-checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('cart-items').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const actions = { increase: 1, decrease: -1 };
    if (button.dataset.action === 'remove') removeFromCart(button.dataset.id);
    else changeQty(button.dataset.id, actions[button.dataset.action]);
  });
  document.getElementById('checkout-modal-close').addEventListener('click', closeCheckout);
  document.getElementById('checkout-modal').addEventListener('click', (event) => { if (event.target === event.currentTarget) closeCheckout(); });
  document.getElementById('checkout-form').addEventListener('submit', createTransferAccount);
});
