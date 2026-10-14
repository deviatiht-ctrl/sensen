/* cart.js */
/* Cart management, checkout, and payment handling */

// ============================================
// STATE
// ============================================
let cartItems = [];
let cartTotal = { subtotal: 0, shipping: 0, total: 0 };
let paymentMethods = [];
let selectedPaymentMethod = null;   // objet complet de boutique_payment_methods
let deliveryMethod = 'delivery';    // 'delivery' | 'pickup'
let proofFile = null;               // preuve de paiement (fichier)
let storeSettings = {};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  storeSettings = await fetchStoreSettings();
  applyCheckoutAvailability();
  initDeliveryMethods();
  await loadPaymentMethods();
  initCheckoutForm();
  loadCart();
});

/**
 * Quand checkout_enabled est false dans les parametres :
 * le client voit son panier mais ne peut ni payer ni commander.
 */
function applyCheckoutAvailability() {
  if (storeSettings.checkout_enabled === true) return;

  ['.delivery-methods', '.payment-methods', '.shipping-form', '.promo-code'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  const notice = document.getElementById('checkout-disabled');
  if (!notice) return;

  notice.style.display = 'block';

  const wa = document.getElementById('checkout-whatsapp');
  const phone = (storeSettings.whatsapp_number || storeSettings.contact_phone || '')
    .replace(/[^0-9]/g, '');
  if (wa) {
    if (phone) {
      wa.href = `https://wa.me/${phone}`;
    } else {
      wa.style.display = 'none';
    }
  }
}

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
        .from(TBL.cart)
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
          .from(TBL.products)
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
        .from(TBL.cart)
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
        .from(TBL.cart)
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
  if (!storeSettings || !storeSettings.id) {
    storeSettings = await fetchStoreSettings();
  }
  const settings = storeSettings;
  
  let subtotal = 0;
  cartItems.forEach(item => {
    const price = item.product.sale_price || item.product.price;
    subtotal += price * item.quantity;
  });
  
  // Calculate shipping (aucun frais si le client vient chercher la commande)
  let shipping = 0;
  if (deliveryMethod === 'pickup') {
    shipping = 0;
  } else if (settings.free_shipping_threshold && subtotal >= settings.free_shipping_threshold) {
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
  if (shippingEl) {
    shippingEl.textContent = deliveryMethod === 'pickup'
      ? 'Retrait en boutique'
      : (cartTotal.shipping === 0 ? 'Gratuit' : formatPrice(cartTotal.shipping));
  }
  if (totalEl) totalEl.textContent = formatPrice(cartTotal.total);
}

// ============================================
// DELIVERY METHOD (livraison ou retrait)
// ============================================

function initDeliveryMethods() {
  const options = document.querySelectorAll('.delivery-option');
  if (options.length === 0) return;
  
  options.forEach(option => {
    option.addEventListener('click', () => selectDeliveryMethod(option.dataset.method));
  });
  
  selectDeliveryMethod(deliveryMethod);
}

function selectDeliveryMethod(method) {
  deliveryMethod = method === 'pickup' ? 'pickup' : 'delivery';
  
  document.querySelectorAll('.delivery-option').forEach(option => {
    const isSelected = option.dataset.method === deliveryMethod;
    option.classList.toggle('delivery-option--active', isSelected);
    option.querySelector('.delivery-option__radio')
      ?.classList.toggle('payment-method__radio--checked', isSelected);
  });
  
  // Adresse obligatoire seulement pour la livraison
  const addressFields = document.querySelectorAll('.shipping-form__delivery-only');
  addressFields.forEach(field => {
    field.style.display = deliveryMethod === 'delivery' ? '' : 'none';
    const input = field.matches('input, textarea') ? field : field.querySelector('input, textarea');
    if (input) input.required = deliveryMethod === 'delivery' && input.dataset.required === 'true';
  });
  
  const pickupInfo = document.querySelector('.pickup-info');
  if (pickupInfo) {
    pickupInfo.style.display = deliveryMethod === 'pickup' ? 'block' : 'none';
    const addressEl = pickupInfo.querySelector('.pickup-info__address');
    if (addressEl) {
      addressEl.textContent = storeSettings.pickup_address
        || storeSettings.address
        || 'L\'adresse de retrait vous sera communiquee apres confirmation.';
    }
  }
  
  calculateTotals();
}

// ============================================
// PAYMENT METHODS
// ============================================

/**
 * Load the payment methods configured by the admin and render them
 */
async function loadPaymentMethods() {
  paymentMethods = await fetchPaymentMethods();
  renderPaymentMethods();
}

function renderPaymentMethods() {
  const container = document.querySelector('.payment-methods__list');
  if (!container) return;
  
  if (paymentMethods.length === 0) {
    container.innerHTML = `
      <p class="payment-methods__empty">
        Aucun mode de paiement n'est disponible pour le moment.
        Contactez-nous pour finaliser votre commande.
      </p>`;
    return;
  }
  
  container.innerHTML = paymentMethods.map(method => `
    <div class="payment-method" data-method-id="${method.id}">
      <div class="payment-method__radio"></div>
      ${method.logo_url
        ? `<img class="payment-method__logo" src="${method.logo_url}" alt="${escapeHtml(method.name)}">`
        : ''}
      <span class="payment-method__label">${escapeHtml(method.name)}</span>
      <span class="payment-method__type">${formatPaymentType(method.type)}</span>
    </div>
    <div class="payment-details" data-method-id="${method.id}" style="display: none;">
      ${renderPaymentDetails(method)}
    </div>
  `).join('');
  
  container.querySelectorAll('.payment-method').forEach(el => {
    el.addEventListener('click', () => selectPaymentMethod(el.dataset.methodId));
  });
  
  container.querySelectorAll('.payment-proof__input').forEach(input => {
    input.addEventListener('change', (e) => {
      proofFile = e.target.files?.[0] || null;
      const nameEl = input.parentElement.querySelector('.payment-proof__filename');
      if (nameEl) nameEl.textContent = proofFile ? proofFile.name : '';
    });
  });
}

function renderPaymentDetails(method) {
  const rows = [
    ['Nom du compte', method.account_name],
    ['Numero / Telephone', method.account_number],
    ['Banque', method.bank_name],
    ['Succursale', method.branch]
  ].filter(([, value]) => !!value);
  
  return `
    ${rows.map(([label, value]) => `
      <div class="payment-details__row">
        <span class="payment-details__label">${label}</span>
        <span class="payment-details__value">${escapeHtml(value)}</span>
      </div>
    `).join('')}
    ${method.instructions
      ? `<p class="payment-details__text">${escapeHtml(method.instructions)}</p>`
      : ''}
    ${method.requires_proof ? `
      <div class="payment-proof">
        <label class="payment-proof__label">Preuve de paiement *</label>
        <input type="file" class="payment-proof__input" accept="image/*,application/pdf">
        <span class="payment-proof__filename"></span>
        <input type="text" class="payment-details__input payment-reference"
               placeholder="Numero de transaction / reference">
        <input type="text" class="payment-details__input payment-sender"
               placeholder="Nom de l'expediteur du paiement">
      </div>
    ` : ''}
  `;
}

function selectPaymentMethod(methodId) {
  selectedPaymentMethod = paymentMethods.find(m => m.id === methodId) || null;
  proofFile = null;
  
  document.querySelectorAll('.payment-method').forEach(m => {
    const radio = m.querySelector('.payment-method__radio');
    const isSelected = m.dataset.methodId === methodId;
    m.classList.toggle('payment-method--active', isSelected);
    radio?.classList.toggle('payment-method__radio--checked', isSelected);
  });
  
  document.querySelectorAll('.payment-details').forEach(d => {
    d.style.display = d.dataset.methodId === methodId ? 'block' : 'none';
  });
}

function formatPaymentType(type) {
  const types = {
    'mobile_money': 'Mobile money',
    'bank_transfer': 'Virement bancaire',
    'cash': 'Especes',
    'card': 'Carte',
    'other': 'Autre'
  };
  return types[type] || type || '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
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
  if (storeSettings.checkout_enabled !== true) {
    showToast('Les commandes en ligne ne sont pas encore disponibles', 'error');
    return;
  }

  if (cartItems.length === 0) {
    showToast('Votre panier est vide', 'error');
    return;
  }
  
  if (!selectedPaymentMethod) {
    showToast('Veuillez sélectionner un mode de paiement', 'error');
    return;
  }
  
  if (selectedPaymentMethod.requires_proof && !proofFile) {
    showToast('Veuillez joindre la preuve de paiement', 'error');
    return;
  }
  
  const form = document.querySelector('.shipping-form');
  const formData = new FormData(form);
  
  const detailsBlock = document.querySelector(`.payment-details[data-method-id="${selectedPaymentMethod.id}"]`);
  const paymentReference = detailsBlock?.querySelector('.payment-reference')?.value?.trim() || null;
  const paymentSender = detailsBlock?.querySelector('.payment-sender')?.value?.trim() || null;
  
  const orderData = {
    customer_name: formData.get('full_name'),
    customer_email: formData.get('email'),
    customer_phone: formData.get('phone'),
    delivery_method: deliveryMethod,
    delivery_address: deliveryMethod === 'delivery' ? formData.get('address') : null,
    delivery_city: deliveryMethod === 'delivery' ? formData.get('city') : null,
    delivery_status: 'not_started',
    notes: formData.get('notes') || '',
    items: cartItems.map(item => ({
      product_id: item.product.id,
      name: item.product.name,
      price: item.product.sale_price || item.product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: item.product.images?.[0] || null
    })),
    subtotal: cartTotal.subtotal,
    shipping_fee: cartTotal.shipping,
    total: cartTotal.total,
    payment_method_id: selectedPaymentMethod.id,
    payment_method_name: selectedPaymentMethod.name,
    payment_method_type: selectedPaymentMethod.type,
    payment_account_number: selectedPaymentMethod.account_number,
    payment_reference: paymentReference,
    payment_sender_name: paymentSender,
    payment_status: selectedPaymentMethod.requires_proof ? 'proof_submitted' : 'pending',
    order_status: 'pending'
  };
  
  // Validate required fields
  if (!orderData.customer_name || !orderData.customer_email) {
    showToast('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }
  
  if (deliveryMethod === 'delivery' && !orderData.delivery_address) {
    showToast('Veuillez indiquer l\'adresse de livraison', 'error');
    return;
  }
  
  const submitBtn = document.querySelector('.checkout-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Traitement...';
  }
  
  try {
    const user = await getCurrentUser();
    if (user) {
      orderData.user_id = user.id;
    }
    
    const { data: order, error } = await supabase
      .from(TBL.orders)
      .insert(orderData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Upload de la preuve de paiement (paiement manuel)
    if (proofFile) {
      await submitPaymentProof(order, paymentReference, paymentSender);
    }
    
    // Clear cart
    if (user) {
      await supabase.from(TBL.cart).delete().eq('user_id', user.id);
    } else {
      localStorage.removeItem('guest_cart');
    }
    
    // Show confirmation
    showOrderConfirmation(order);
    
  } catch (err) {
    console.error('Error submitting order:', err);
    showToast('Erreur lors de la commande', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Passer la commande';
    }
  }
}

/**
 * Upload the payment proof and attach it to the order
 */
async function submitPaymentProof(order, reference, senderName) {
  try {
    const fileUrl = await uploadPaymentProof(proofFile, order.order_number);
    
    await supabase.from(TBL.proofs).insert({
      order_id: order.id,
      payment_method_id: selectedPaymentMethod?.id || null,
      file_url: fileUrl,
      amount: order.total,
      reference: reference,
      sender_name: senderName,
      paid_at: new Date().toISOString(),
      status: 'pending'
    });
    
    await supabase
      .from(TBL.orders)
      .update({ payment_proof_url: fileUrl, payment_status: 'proof_submitted' })
      .eq('id', order.id);
    
    order.payment_proof_url = fileUrl;
  } catch (err) {
    console.error('Error uploading payment proof:', err);
    showToast('Commande enregistree, mais la preuve n\'a pas pu etre envoyee', 'error');
  }
}

function showOrderConfirmation(order) {
  const container = document.querySelector('.cart-content');
  if (!container) return;
  
  const isDelivery = order.delivery_method === 'delivery';
  
  container.innerHTML = `
    <div class="order-confirmation" style="grid-column: 1 / -1;">
      <svg class="order-confirmation__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="order-confirmation__title">Commande enregistree</div>
      <div class="order-confirmation__order-number">N° de commande : ${order.order_number}</div>
      ${isDelivery && order.tracking_code ? `
        <div class="order-confirmation__tracking">
          Code de suivi livraison : <strong>${order.tracking_code}</strong>
        </div>` : ''}
      <div class="order-confirmation__text">
        Mode de paiement : <strong>${escapeHtml(order.payment_method_name || '')}</strong><br>
        ${order.payment_status === 'proof_submitted'
          ? 'Votre preuve de paiement a ete recue. Notre equipe la verifie et confirme votre commande.'
          : 'Notre equipe vous contacte pour finaliser le paiement.'}
      </div>
      <div class="order-confirmation__text">
        ${isDelivery
          ? 'Vous pourrez suivre la livraison depuis votre compte, rubrique Commandes.'
          : 'Vous serez averti des que votre commande sera prete pour le retrait.'}
      </div>
      <div class="order-confirmation__actions">
        <a href="/account.html#orders" class="btn btn--primary">Suivre ma commande</a>
        <a href="/" class="btn btn--secondary">Continuer mes achats</a>
      </div>
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
  return `${price} HTG`;
}

// Export for global access
window.updateCartItemQty = updateCartItemQty;
window.setCartItemQty = setCartItemQty;
window.removeCartItem = removeCartItem;
window.selectPaymentMethod = selectPaymentMethod;
window.selectDeliveryMethod = selectDeliveryMethod;
