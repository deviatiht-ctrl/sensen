/* cart.js */
/* Cart management, checkout, and payment handling */

// ============================================
// STATE
// ============================================
let cartItems = [];
let cartTotal = { subtotal: 0, shipping: 0, total: 0 };
let selectedPaymentMethod = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  initPaymentMethods();
  initCheckoutForm();
});

// ============================================
// CART LOADING
// ============================================

/**
 * Load cart from Supabase (logged in) or localStorage (guest)
 */
async function loadCart() {
  const user = await getCurrentUser();
  
  if (user) {
    // Load from Supabase
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          size,
          color,
          product:product_id (
            id,
            name,
            price,
            sale_price,
            images,
            stock
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      cartItems = data || [];
    } catch (err) {
      console.error('Error loading cart:', err);
      cartItems = [];
    }
  } else {
    // Load from localStorage
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    
    // Fetch product details for guest cart
    if (guestCart.length > 0) {
      try {
        const productIds = guestCart.map(item => item.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        
        cartItems = guestCart.map(item => ({
          ...item,
          product: products?.find(p => p.id === item.product_id)
        })).filter(item => item.product);
      } catch (err) {
        console.error('Error loading guest cart:', err);
        cartItems = [];
      }
    } else {
      cartItems = [];
    }
  }
  
  renderCart();
  calculateTotals();
}

/**
 * Render cart items
 */
function renderCart() {
  const container = document.querySelector('.cart-items');
  const emptyState = document.querySelector('.cart-empty');
  const cartContent = document.querySelector('.cart-content');
  
  if (!container) return;
  
  if (cartItems.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    updateCartBadge(0);
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  if (cartContent) cartContent.style.display = 'grid';
  
  container.innerHTML = '';
  
  cartItems.forEach(item => {
    const cartItem = createCartItemElement(item);
    container.appendChild(cartItem);
  });
  
  updateCartBadge(cartItems.reduce((sum, i) => sum + i.quantity, 0));
}

/**
 * Create cart item HTML element
 */
function createCartItemElement(item) {
  const product = item.product;
  const price = product.sale_price || product.price;
  const total = price * item.quantity;
  
  const el = document.createElement('div');
  el.className = 'cart-item';
  el.dataset.itemId = item.id;
  
  el.innerHTML = `
    <img class="cart-item__image" src="${product.images?.[0] || '/assets/img/logo-placeholder.svg'}" alt="${product.name}">
    <div class="cart-item__details">
      <div class="cart-item__name">${product.name}</div>
      <div class="cart-item__variant">
        ${item.size ? `Taille: ${item.size}` : ''}
        ${item.color ? (item.size ? ' | ' : '') + `Couleur: ${item.color}` : ''}
      </div>
      <div class="cart-item__price">${formatPrice(price)}</div>
    </div>
    <div class="cart-item__quantity">
      <button class="cart-item__qty-btn" onclick="updateCartItemQty('${item.id}', -1)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <input type="number" class="cart-item__qty-value" value="${item.quantity}" min="1" max="10" onchange="setCartItemQty('${item.id}', this.value)">
      <button class="cart-item__qty-btn" onclick="updateCartItemQty('${item.id}', 1)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
    <div class="cart-item__total">${formatPrice(total)}</div>
    <button class="cart-item__remove" onclick="removeCartItem('${item.id}')">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;
  
  return el;
}

// ============================================
// CART ACTIONS
// ============================================

/**
 * Update item quantity by delta
 */
async function updateCartItemQty(itemId, delta) {
  const item = cartItems.find(i => i.id === itemId || i.id === parseInt(itemId));
  if (!item) return;
  
  const newQty = item.quantity + delta;
  if (newQty < 1 || newQty > 10) return;
  
  await setCartItemQty(itemId, newQty);
}

/**
 * Set item quantity
 */
async function setCartItemQty(itemId, qty) {
  const quantity = parseInt(qty);
  if (quantity < 1 || quantity > 10) return;
  
  const user = await getCurrentUser();
  
  if (user) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating quantity:', err);
      showToast('Erreur lors de la mise à jour', 'error');
      return;
    }
  } else {
    // Update localStorage
    const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    const itemIndex = cart.findIndex(i => i.id === itemId || i.id === parseInt(itemId));
    if (itemIndex >= 0) {
      cart[itemIndex].quantity = quantity;
      localStorage.setItem('guest_cart', JSON.stringify(cart));
    }
  }
  
  // Update local state and re-render
  const item = cartItems.find(i => i.id === itemId || i.id === parseInt(itemId));
  if (item) {
    item.quantity = quantity;
    renderCart();
    calculateTotals();
  }
}

/**
 * Remove item from cart
 */
async function removeCartItem(itemId) {
  const user = await getCurrentUser();
  
  if (user) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error removing item:', err);
      showToast('Erreur lors de la suppression', 'error');
      return;
    }
  } else {
    // Remove from localStorage
    let cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    cart = cart.filter(i => i.id !== itemId && i.id !== parseInt(itemId));
    localStorage.setItem('guest_cart', JSON.stringify(cart));
  }
  
  // Update local state
  cartItems = cartItems.filter(i => i.id !== itemId && i.id !== parseInt(itemId));
  renderCart();
  calculateTotals();
  showToast('Article retiré', 'success');
}

// ============================================
// PRICING
// ============================================

async function calculateTotals() {
  const settings = await fetchStoreSettings();
  
  let subtotal = 0;
  cartItems.forEach(item => {
    const price = item.product.sale_price || item.product.price;
    subtotal += price * item.quantity;
  });
  
  // Calculate shipping
  let shipping = 0;
  if (settings.free_shipping_threshold && subtotal >= settings.free_shipping_threshold) {
    shipping = 0;
  } else {
    shipping = settings.shipping_fee || 0;
  }
  
  const total = subtotal + shipping;
  
  cartTotal = { subtotal, shipping, total };
  
  // Update UI
  updateOrderSummary();
}

function updateOrderSummary() {
  const subtotalEl = document.querySelector('.order-summary__subtotal');
  const shippingEl = document.querySelector('.order-summary__shipping');
  const totalEl = document.querySelector('.order-summary__total');
  
  if (subtotalEl) subtotalEl.textContent = formatPrice(cartTotal.subtotal);
  if (shippingEl) shippingEl.textContent = cartTotal.shipping === 0 ? 'Gratuit' : formatPrice(cartTotal.shipping);
  if (totalEl) totalEl.textContent = formatPrice(cartTotal.total);
}

// ============================================
// PAYMENT METHODS
// ============================================

function initPaymentMethods() {
  const methods = document.querySelectorAll('.payment-method');
  
  methods.forEach(method => {
    method.addEventListener('click', () => {
      const value = method.dataset.method;
      selectPaymentMethod(value);
    });
  });
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  
  document.querySelectorAll('.payment-method').forEach(m => {
    const radio = m.querySelector('.payment-method__radio');
    const isSelected = m.dataset.method === method;
    radio.classList.toggle('payment-method__radio--checked', isSelected);
  });
  
  // Show/hide payment details
  document.querySelectorAll('.payment-details').forEach(d => {
    d.style.display = d.dataset.method === method ? 'block' : 'none';
  });
}

// ============================================
// CHECKOUT
// ============================================

function initCheckoutForm() {
  const form = document.querySelector('.shipping-form');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitOrder();
  });
}

async function submitOrder() {
  if (cartItems.length === 0) {
    showToast('Votre panier est vide', 'error');
    return;
  }
  
  if (!selectedPaymentMethod) {
    showToast('Veuillez sélectionner un mode de paiement', 'error');
    return;
  }
  
  const form = document.querySelector('.shipping-form');
  const formData = new FormData(form);
  
  const orderData = {
    customer_name: formData.get('full_name'),
    customer_email: formData.get('email'),
    customer_phone: formData.get('phone'),
    delivery_address: formData.get('address'),
    delivery_city: formData.get('city'),
    notes: formData.get('notes') || '',
    items: cartItems.map(item => ({
      product_id: item.product.id,
      name: item.product.name,
      price: item.product.sale_price || item.product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color
    })),
    subtotal: cartTotal.subtotal,
    shipping_fee: cartTotal.shipping,
    total: cartTotal.total,
    payment_method: selectedPaymentMethod,
    payment_status: 'pending',
    order_status: 'pending'
  };
  
  // Validate required fields
  if (!orderData.customer_name || !orderData.customer_email || !orderData.delivery_address) {
    showToast('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }
  
  try {
    const user = await getCurrentUser();
    if (user) {
      orderData.user_id = user.id;
    }
    
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clear cart
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    } else {
      localStorage.removeItem('guest_cart');
    }
    
    // Show confirmation
    showOrderConfirmation(data);
    
  } catch (err) {
    console.error('Error submitting order:', err);
    showToast('Erreur lors de la commande', 'error');
  }
}

function showOrderConfirmation(order) {
  const container = document.querySelector('.cart-content');
  if (!container) return;
  
  container.innerHTML = `
    <div class="order-confirmation" style="grid-column: 1 / -1;">
      <svg class="order-confirmation__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="order-confirmation__title">Commande confirmée</div>
      <div class="order-confirmation__order-number">N° de commande: ${order.order_number}</div>
      <div class="order-confirmation__text">
        Merci pour votre commande. Vous recevrez un email de confirmation avec les détails de votre achat.
      </div>
      <a href="/" class="btn btn--primary">Continuer mes achats</a>
    </div>
  `;
  
  updateCartBadge(0);
}

// ============================================
// UTILITIES
// ============================================

function updateCartBadge(count) {
  const badge = document.querySelector('.navbar__badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function formatPrice(price) {
  return `${price} USD`;
}

// Export for global access
window.updateCartItemQty = updateCartItemQty;
window.setCartItemQty = setCartItemQty;
window.removeCartItem = removeCartItem;
window.selectPaymentMethod = selectPaymentMethod;
