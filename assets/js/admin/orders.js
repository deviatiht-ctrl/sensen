/* admin/orders.js */
/* Order management - view, update status, filter */

// ============================================
// STATE
// ============================================
let orders = [];
let selectedOrder = null;
let selectedOrderEvents = [];
let selectedOrderProofs = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;
  
  loadOrders();
  initFilters();
  initOrderModal();
  
  // Check for order param
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');
  if (orderId) {
    setTimeout(() => openOrderModal(orderId), 500);
  }
});

// ============================================
// ORDER LOADING
// ============================================

async function loadOrders() {
  try {
    const { data, error } = await supabase
      .from(TBL.orders)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    orders = data || [];
    renderOrdersTable(orders);
    
  } catch (err) {
    console.error('Error loading orders:', err);
    showToast('Erreur lors du chargement des commandes', 'error');
  }
}

function renderOrdersTable(ordersToRender) {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  
  if (ordersToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px;">Aucune commande</td></tr>';
    return;
  }
  
  tbody.innerHTML = ordersToRender.map(o => `
    <tr onclick="openOrderModal('${o.id}')" style="cursor: pointer;">
      <td>${o.order_number}</td>
      <td>${o.customer_name}</td>
      <td>${(o.items?.length || 0)} article${(o.items?.length || 0) > 1 ? 's' : ''}</td>
      <td>${formatPrice(o.total)}</td>
      <td>
        ${o.payment_method_name || '-'}<br>
        <span style="font-size: 12px; color: var(--color-text-secondary);">
          ${formatPaymentStatus(o.payment_status)}${o.payment_proof_url ? ' - preuve recue' : ''}
        </span>
      </td>
      <td>
        ${o.delivery_method === 'pickup' ? 'Retrait' : 'Livraison'}<br>
        <span style="font-size: 12px; color: var(--color-text-secondary);">
          ${formatDeliveryStatus(o.delivery_status)}
        </span>
      </td>
      <td>
        <span class="status-badge status-badge--${o.order_status}">
          ${formatStatus(o.order_status)}
        </span>
      </td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('');
}

// ============================================
// ORDER MODAL
// ============================================

function initOrderModal() {
  // Close modal
  document.querySelector('.slide-panel__close')?.addEventListener('click', closeOrderModal);
  
  // Status change
  document.getElementById('order-status')?.addEventListener('change', async (e) => {
    if (selectedOrder) {
      await updateOrderStatus(selectedOrder.id, e.target.value);
    }
  });
  
  // Save notes
  document.querySelector('.btn--save-notes')?.addEventListener('click', async () => {
    if (selectedOrder) {
      const notes = document.getElementById('order-admin-note').value;
      await updateOrderNotes(selectedOrder.id, notes);
    }
  });
  
  // Paiement : valider / refuser
  document.querySelector('.btn--confirm-payment')?.addEventListener('click', () => reviewPayment('approved'));
  document.querySelector('.btn--reject-payment')?.addEventListener('click', () => reviewPayment('rejected'));
  
  // Livraison : infos livreur
  document.querySelector('.btn--save-delivery')?.addEventListener('click', saveDeliveryInfo);
  
  // Livraison : ajouter un evenement de suivi
  document.querySelector('.btn--add-tracking')?.addEventListener('click', addTrackingEvent);
}

async function openOrderModal(orderId) {
  selectedOrder = orders.find(o => o.id === orderId);
  if (!selectedOrder) return;
  
  const panel = document.querySelector('.slide-panel');
  
  await Promise.all([loadOrderTracking(orderId), loadOrderProofs(orderId)]);
  
  // Fill order details
  document.querySelector('.order-modal__number').textContent = selectedOrder.order_number;
  document.querySelector('.order-modal__date').textContent = formatDate(selectedOrder.created_at);
  
  // Customer info
  document.querySelector('.order-customer__name').textContent = selectedOrder.customer_name;
  document.querySelector('.order-customer__email').textContent = selectedOrder.customer_email;
  document.querySelector('.order-customer__phone').textContent = selectedOrder.customer_phone || '-';
  document.querySelector('.order-customer__address').textContent = selectedOrder.delivery_address;
  document.querySelector('.order-customer__city').textContent = selectedOrder.delivery_city || '-';
  
  // Products
  const productsContainer = document.querySelector('.order-products-list');
  productsContainer.innerHTML = selectedOrder.items.map(item => `
    <div class="order-product-item">
      <div class="order-product-item__name">${item.name}</div>
      <div class="order-product-item__meta">
        ${item.size ? `Taille: ${item.size}` : ''}
        ${item.color ? (item.size ? ' | ' : '') + `Couleur: ${item.color}` : ''}
        | Qté: ${item.quantity}
      </div>
      <div class="order-product-item__price">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');
  
  // Payment info (paiement manuel)
  document.querySelector('.order-payment__method').textContent = selectedOrder.payment_method_name || '-';
  document.querySelector('.order-payment__status').textContent = formatPaymentStatus(selectedOrder.payment_status);
  
  const accountEl = document.querySelector('.order-payment__account');
  if (accountEl) accountEl.textContent = selectedOrder.payment_account_number || '-';
  
  const refEl = document.querySelector('.order-payment__reference');
  if (refEl) refEl.textContent = selectedOrder.payment_reference || '-';
  
  const senderEl = document.querySelector('.order-payment__sender');
  if (senderEl) senderEl.textContent = selectedOrder.payment_sender_name || '-';
  
  renderOrderProofs();
  renderDeliverySection();
  renderTrackingTimeline();
  
  // Totals
  document.querySelector('.order-total__subtotal').textContent = formatPrice(selectedOrder.subtotal);
  document.querySelector('.order-total__shipping').textContent = selectedOrder.shipping_fee === 0 ? 'Gratuite' : formatPrice(selectedOrder.shipping_fee);
  document.querySelector('.order-total__total').textContent = formatPrice(selectedOrder.total);
  
  // Status select
  document.getElementById('order-status').value = selectedOrder.order_status;
  
  // Notes
  const customerNoteEl = document.querySelector('.order-customer__note');
  if (customerNoteEl) customerNoteEl.textContent = selectedOrder.notes || '-';
  document.getElementById('order-admin-note').value = selectedOrder.admin_note || '';
  
  panel?.classList.add('slide-panel--open');
}

// ============================================
// PAIEMENT MANUEL
// ============================================

async function loadOrderProofs(orderId) {
  try {
    const { data, error } = await supabase
      .from(TBL.proofs)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    selectedOrderProofs = data || [];
  } catch (err) {
    console.error('Error loading proofs:', err);
    selectedOrderProofs = [];
  }
}

function renderOrderProofs() {
  const container = document.querySelector('.order-payment__proofs');
  if (!container) return;
  
  const fallbackUrl = selectedOrder?.payment_proof_url;
  
  if (selectedOrderProofs.length === 0) {
    container.innerHTML = fallbackUrl
      ? `<a href="${fallbackUrl}" target="_blank" rel="noopener">Voir la preuve de paiement</a>`
      : '<span style="color: var(--color-text-secondary);">Aucune preuve envoyee</span>';
    return;
  }
  
  container.innerHTML = selectedOrderProofs.map(p => `
    <div style="padding: 8px 0; border-bottom: 1px solid var(--color-border); font-size: 13px;">
      <a href="${p.file_url}" target="_blank" rel="noopener">Preuve du ${new Date(p.created_at).toLocaleString('fr-FR')}</a>
      <div style="color: var(--color-text-secondary);">
        ${p.amount ? p.amount + ' HTG - ' : ''}${p.reference || 'sans reference'} - ${formatProofStatus(p.status)}
      </div>
      ${p.admin_note ? `<div style="color: var(--color-text-secondary);">Note: ${p.admin_note}</div>` : ''}
    </div>
  `).join('');
}

async function reviewPayment(status) {
  if (!selectedOrder) return;
  
  const note = status === 'rejected'
    ? prompt('Raison du refus :') || null
    : null;
  
  try {
    const user = await getCurrentUser();
    
    const { error } = await supabase
      .from(TBL.orders)
      .update({
        payment_status: status === 'approved' ? 'confirmed' : 'rejected',
        payment_confirmed_at: status === 'approved' ? new Date().toISOString() : null,
        payment_confirmed_by: status === 'approved' ? (user?.email || null) : null,
        order_status: status === 'approved' ? 'confirmed' : selectedOrder.order_status,
        admin_note: note || selectedOrder.admin_note
      })
      .eq('id', selectedOrder.id);
    
    if (error) throw error;
    
    // Marque les preuves en attente
    if (selectedOrderProofs.length > 0) {
      await supabase
        .from(TBL.proofs)
        .update({
          status: status === 'approved' ? 'approved' : 'rejected',
          admin_note: note,
          reviewed_by: user?.email || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('order_id', selectedOrder.id)
        .eq('status', 'pending');
    }
    
    if (status === 'approved') {
      await supabase.from(TBL.tracking).insert({
        order_id: selectedOrder.id,
        status: 'payment_confirmed',
        title: 'Paiement confirme',
        note: 'Preuve de paiement validee.',
        created_by: user?.email || 'admin'
      });
    }
    
    showToast(status === 'approved' ? 'Paiement confirme' : 'Paiement refuse', 'success');
    await loadOrders();
    openOrderModal(selectedOrder.id);
    
  } catch (err) {
    console.error('Error reviewing payment:', err);
    showToast('Erreur lors de la verification du paiement', 'error');
  }
}

// ============================================
// LIVRAISON + SUIVI
// ============================================

function renderDeliverySection() {
  const methodEl = document.querySelector('.order-delivery__method');
  if (methodEl) {
    methodEl.textContent = selectedOrder.delivery_method === 'pickup'
      ? 'Retrait en boutique'
      : 'Livraison a domicile';
  }
  
  const statusEl = document.querySelector('.order-delivery__status');
  if (statusEl) statusEl.textContent = formatDeliveryStatus(selectedOrder.delivery_status);
  
  const codeEl = document.querySelector('.order-delivery__code');
  if (codeEl) codeEl.textContent = selectedOrder.tracking_code || '-';
  
  const courierInput = document.getElementById('delivery-courier');
  if (courierInput) courierInput.value = selectedOrder.courier_name || '';
  
  const phoneInput = document.getElementById('delivery-courier-phone');
  if (phoneInput) phoneInput.value = selectedOrder.courier_phone || '';
  
  const dateInput = document.getElementById('delivery-date');
  if (dateInput) dateInput.value = selectedOrder.estimated_delivery_date || '';
}

async function saveDeliveryInfo() {
  if (!selectedOrder) return;
  
  const updates = {
    courier_name: document.getElementById('delivery-courier')?.value || null,
    courier_phone: document.getElementById('delivery-courier-phone')?.value || null,
    estimated_delivery_date: document.getElementById('delivery-date')?.value || null
  };
  
  try {
    const { error } = await supabase
      .from(TBL.orders)
      .update(updates)
      .eq('id', selectedOrder.id);
    
    if (error) throw error;
    
    Object.assign(selectedOrder, updates);
    showToast('Informations de livraison enregistrees', 'success');
  } catch (err) {
    console.error('Error saving delivery info:', err);
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

async function loadOrderTracking(orderId) {
  try {
    const { data, error } = await supabase
      .from(TBL.tracking)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    selectedOrderEvents = data || [];
  } catch (err) {
    console.error('Error loading tracking:', err);
    selectedOrderEvents = [];
  }
}

function renderTrackingTimeline() {
  const container = document.querySelector('.order-tracking__timeline');
  if (!container) return;
  
  if (selectedOrderEvents.length === 0) {
    container.innerHTML = '<span style="color: var(--color-text-secondary); font-size: 13px;">Aucun evenement.</span>';
    return;
  }
  
  container.innerHTML = selectedOrderEvents.map(ev => `
    <div style="display: flex; gap: 12px; padding-bottom: 12px;">
      <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-gold); margin-top: 6px; flex-shrink: 0;"></div>
      <div style="font-size: 13px;">
        <div style="font-weight: 500;">${ev.title || formatTrackingStatus(ev.status)}</div>
        ${ev.note ? `<div style="color: var(--color-text-secondary);">${ev.note}</div>` : ''}
        ${ev.location ? `<div style="color: var(--color-text-secondary);">${ev.location}</div>` : ''}
        <div style="color: var(--color-text-secondary); font-size: 12px;">
          ${new Date(ev.created_at).toLocaleString('fr-FR')}${ev.created_by ? ' - ' + ev.created_by : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function addTrackingEvent() {
  if (!selectedOrder) return;
  
  const status = document.getElementById('tracking-status')?.value;
  const note = document.getElementById('tracking-note')?.value || null;
  const location = document.getElementById('tracking-location')?.value || null;
  
  if (!status) {
    showToast('Choisissez une etape de livraison', 'error');
    return;
  }
  
  try {
    const user = await getCurrentUser();
    
    const { error } = await supabase.from(TBL.tracking).insert({
      order_id: selectedOrder.id,
      status,
      title: formatTrackingStatus(status),
      note,
      location,
      created_by: user?.email || 'admin'
    });
    
    if (error) throw error;
    
    document.getElementById('tracking-note').value = '';
    document.getElementById('tracking-location').value = '';
    
    showToast('Etape de livraison ajoutee', 'success');
    await loadOrders();
    openOrderModal(selectedOrder.id);
    
  } catch (err) {
    console.error('Error adding tracking event:', err);
    showToast('Erreur lors de l\'ajout de l\'etape', 'error');
  }
}

function closeOrderModal() {
  const panel = document.querySelector('.slide-panel');
  panel?.classList.remove('slide-panel--open');
  selectedOrder = null;
}

// ============================================
// ORDER ACTIONS
// ============================================

async function updateOrderStatus(orderId, newStatus) {
  try {
    const { error } = await supabase
      .from(TBL.orders)
      .update({ order_status: newStatus })
      .eq('id', orderId);
    
    if (error) throw error;
    
    // Update local state
    const order = orders.find(o => o.id === orderId);
    if (order) order.order_status = newStatus;
    
    renderOrdersTable(orders);
    showToast('Statut mis à jour', 'success');
    
    // Update modal if open
    if (selectedOrder && selectedOrder.id === orderId) {
      selectedOrder.order_status = newStatus;
    }
    
  } catch (err) {
    console.error('Error updating order status:', err);
    showToast('Erreur lors de la mise à jour', 'error');
  }
}

async function updateOrderNotes(orderId, notes) {
  try {
    const { error } = await supabase
      .from(TBL.orders)
      .update({ admin_note: notes })
      .eq('id', orderId);
    
    if (error) throw error;
    
    const order = orders.find(o => o.id === orderId);
    if (order) order.admin_note = notes;
    
    showToast('Notes enregistrées', 'success');
    
  } catch (err) {
    console.error('Error updating notes:', err);
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

// ============================================
// FILTERS
// ============================================

function initFilters() {
  const statusFilter = document.querySelector('.admin-filters__status');
  const paymentFilter = document.querySelector('.admin-filters__payment');
  const deliveryFilter = document.querySelector('.admin-filters__delivery');
  const searchInput = document.querySelector('.admin-filters__search input');
  
  const applyFilters = () => {
    let filtered = [...orders];
    
    // Status filter
    const status = statusFilter?.value;
    if (status && status !== 'all') {
      filtered = filtered.filter(o => o.order_status === status);
    }
    
    // Payment status filter
    const payment = paymentFilter?.value;
    if (payment && payment !== 'all') {
      filtered = filtered.filter(o => o.payment_status === payment);
    }
    
    // Delivery filter
    const delivery = deliveryFilter?.value;
    if (delivery && delivery !== 'all') {
      filtered = delivery === 'pickup' || delivery === 'delivery'
        ? filtered.filter(o => o.delivery_method === delivery)
        : filtered.filter(o => o.delivery_status === delivery);
    }
    
    // Search filter
    const search = searchInput?.value.toLowerCase() || '';
    if (search) {
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(search) ||
        o.customer_name.toLowerCase().includes(search) ||
        o.customer_email.toLowerCase().includes(search)
      );
    }
    
    renderOrdersTable(filtered);
  };
  
  statusFilter?.addEventListener('change', applyFilters);
  paymentFilter?.addEventListener('change', applyFilters);
  deliveryFilter?.addEventListener('change', applyFilters);
  searchInput?.addEventListener('input', applyFilters);
}

// ============================================
// UTILITIES
// ============================================

function formatStatus(status) {
  const statuses = {
    'pending': 'En attente',
    'confirmed': 'Confirmée',
    'processing': 'En préparation',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  return statuses[status] || status;
}

function formatPaymentStatus(status) {
  const statuses = {
    'pending': 'En attente',
    'awaiting_proof': 'Attente de preuve',
    'proof_submitted': 'Preuve a verifier',
    'confirmed': 'Confirme',
    'rejected': 'Refuse',
    'refunded': 'Rembourse'
  };
  return statuses[status] || status || '-';
}

function formatProofStatus(status) {
  const statuses = {
    'pending': 'En attente',
    'approved': 'Validee',
    'rejected': 'Refusee'
  };
  return statuses[status] || status;
}

function formatDeliveryStatus(status) {
  const statuses = {
    'not_started': 'Pas commencee',
    'preparing': 'En preparation',
    'ready_for_pickup': 'Prete pour retrait',
    'picked_up_by_courier': 'Chez le livreur',
    'in_transit': 'En transit',
    'out_for_delivery': 'En cours de livraison',
    'delivered': 'Livree',
    'failed': 'Echouee',
    'returned': 'Retournee'
  };
  return statuses[status] || status || '-';
}

function formatTrackingStatus(status) {
  const statuses = {
    'order_placed': 'Commande recue',
    'payment_confirmed': 'Paiement confirme',
    'preparing': 'En preparation',
    'ready_for_pickup': 'Prete pour le retrait',
    'picked_up_by_courier': 'Prise en charge par le livreur',
    'in_transit': 'En transit',
    'out_for_delivery': 'En cours de livraison',
    'delivered': 'Livree',
    'failed': 'Livraison echouee',
    'returned': 'Retournee',
    'cancelled': 'Annulee'
  };
  return statuses[status] || status;
}

function formatPrice(price) {
  return `${price} HTG`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Exports
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.updateOrderStatus = updateOrderStatus;
window.updateOrderNotes = updateOrderNotes;
window.reviewPayment = reviewPayment;
window.addTrackingEvent = addTrackingEvent;
window.saveDeliveryInfo = saveDeliveryInfo;
