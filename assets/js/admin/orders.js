/* admin/orders.js */
/* Order management - view, update status, filter */

// ============================================
// STATE
// ============================================
let orders = [];
let selectedOrder = null;

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
      .from('orders')
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
      <td>${o.items.length} article${o.items.length > 1 ? 's' : ''}</td>
      <td>${formatPrice(o.total)}</td>
      <td>${formatPaymentMethod(o.payment_method)}</td>
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
  
  // Quick actions
  document.querySelector('.btn--mark-shipped')?.addEventListener('click', async () => {
    if (selectedOrder) {
      await updateOrderStatus(selectedOrder.id, 'shipped');
      closeOrderModal();
    }
  });
  
  // Save notes
  document.querySelector('.btn--save-notes')?.addEventListener('click', async () => {
    if (selectedOrder) {
      const notes = document.getElementById('order-notes').value;
      await updateOrderNotes(selectedOrder.id, notes);
    }
  });
}

async function openOrderModal(orderId) {
  selectedOrder = orders.find(o => o.id === orderId);
  if (!selectedOrder) return;
  
  const panel = document.querySelector('.slide-panel');
  
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
  
  // Payment info
  document.querySelector('.order-payment__method').textContent = formatPaymentMethod(selectedOrder.payment_method);
  document.querySelector('.order-payment__status').textContent = formatPaymentStatus(selectedOrder.payment_status);
  
  // Totals
  document.querySelector('.order-total__subtotal').textContent = formatPrice(selectedOrder.subtotal);
  document.querySelector('.order-total__shipping').textContent = selectedOrder.shipping_fee === 0 ? 'Gratuite' : formatPrice(selectedOrder.shipping_fee);
  document.querySelector('.order-total__total').textContent = formatPrice(selectedOrder.total);
  
  // Status select
  document.getElementById('order-status').value = selectedOrder.order_status;
  
  // Notes
  document.getElementById('order-notes').value = selectedOrder.notes || '';
  
  // Show/hide quick actions based on status
  const markShippedBtn = document.querySelector('.btn--mark-shipped');
  if (markShippedBtn) {
    markShippedBtn.style.display = 
      ['pending', 'confirmed', 'processing'].includes(selectedOrder.order_status) ? 'inline-flex' : 'none';
  }
  
  panel?.classList.add('slide-panel--open');
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
      .from('orders')
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
      .from('orders')
      .update({ notes })
      .eq('id', orderId);
    
    if (error) throw error;
    
    const order = orders.find(o => o.id === orderId);
    if (order) order.notes = notes;
    
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
  const searchInput = document.querySelector('.admin-filters__search input');
  
  const applyFilters = () => {
    let filtered = [...orders];
    
    // Status filter
    const status = statusFilter?.value;
    if (status && status !== 'all') {
      filtered = filtered.filter(o => o.order_status === status);
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

function formatPaymentMethod(method) {
  const methods = {
    'moncash': 'MonCash',
    'natcash': 'NatCash',
    'bank_transfer': 'Virement',
    'cod': 'Paiement à la livraison'
  };
  return methods[method] || method;
}

function formatPaymentStatus(status) {
  const statuses = {
    'pending': 'En attente',
    'confirmed': 'Confirmé',
    'failed': 'Échoué'
  };
  return statuses[status] || status;
}

function formatPrice(price) {
  return `${price} USD`;
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
