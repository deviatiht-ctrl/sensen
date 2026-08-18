/* admin/dashboard.js */
/* Admin dashboard statistics and overview */

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;
  
  loadDashboardStats();
  loadRecentOrders();
  loadLowStockAlert();
  loadPaymentsToVerify();
});

// ============================================
// DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
  try {
    // Total revenue (completed orders)
    const { data: revenueData } = await supabase
      .from(TBL.orders)
      .select('total')
      .eq('payment_status', 'confirmed');
    
    const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    
    // Today's orders
    const today = new Date().toISOString().split('T')[0];
    const { count: todayOrders } = await supabase
      .from(TBL.orders)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    // Active products
    const { count: activeProducts } = await supabase
      .from(TBL.products)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Registered customers
    const { count: customersCount } = await supabase
      .from(TBL.customers)
      .select('*', { count: 'exact', head: true });
    
    // Paiements a verifier (preuves envoyees)
    const { count: pendingPayments } = await supabase
      .from(TBL.orders)
      .select('*', { count: 'exact', head: true })
      .in('payment_status', ['proof_submitted', 'awaiting_proof']);
    
    // Livraisons en cours
    const { count: activeDeliveries } = await supabase
      .from(TBL.orders)
      .select('*', { count: 'exact', head: true })
      .in('delivery_status', ['preparing', 'picked_up_by_courier', 'in_transit', 'out_for_delivery']);
    
    // Update UI
    updateStatCard('revenue', formatPrice(totalRevenue));
    updateStatCard('orders-today', todayOrders || 0);
    updateStatCard('products', activeProducts || 0);
    updateStatCard('customers', customersCount || 0);
    updateStatCard('payments-to-verify', pendingPayments || 0);
    updateStatCard('active-deliveries', activeDeliveries || 0);
    
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function updateStatCard(id, value) {
  const card = document.querySelector(`[data-stat="${id}"]`);
  if (card) {
    card.textContent = value;
  }
}

// ============================================
// RECENT ORDERS
// ============================================

async function loadRecentOrders() {
  try {
    const { data: orders, error } = await supabase
      .from(TBL.orders)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    renderRecentOrders(orders || []);
    
  } catch (err) {
    console.error('Error loading recent orders:', err);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.querySelector('.recent-orders tbody');
  if (!tbody) return;
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px;">Aucune commande récente</td></tr>';
    return;
  }
  
  tbody.innerHTML = orders.map(order => `
    <tr onclick="viewOrder('${order.id}')" style="cursor: pointer;">
      <td>${order.order_number}</td>
      <td>${order.customer_name}</td>
      <td>${formatPrice(order.total)}</td>
      <td>
        <span class="status-badge status-badge--${order.order_status}">
          ${formatStatus(order.order_status)}
        </span>
      </td>
      <td>${formatDate(order.created_at)}</td>
    </tr>
  `).join('');
}

// ============================================
// LOW STOCK ALERT
// ============================================

async function loadLowStockAlert() {
  try {
    const { data: products, error } = await supabase
      .from(TBL.products)
      .select('id, name, stock, is_active')
      .lte('stock', 5)
      .eq('is_active', true)
      .order('stock', { ascending: true })
      .limit(5);
    
    if (error) throw error;
    
    renderLowStockAlert(products || []);
    
  } catch (err) {
    console.error('Error loading low stock alert:', err);
  }
}

function renderLowStockAlert(products) {
  const container = document.querySelector('.low-stock-alert');
  if (!container) return;
  
  if (products.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  const list = container.querySelector('.low-stock-list');
  if (list) {
    list.innerHTML = products.map(p => `
      <div class="low-stock-item" onclick="editProduct('${p.id}')" style="cursor: pointer;">
        <span class="low-stock-name">${p.name}</span>
        <span class="low-stock-count ${p.stock === 0 ? 'out-of-stock' : 'low'}">
          ${p.stock === 0 ? 'Épuisé' : `${p.stock} restant${p.stock > 1 ? 's' : ''}`}
        </span>
      </div>
    `).join('');
  }
  
  container.style.display = 'block';
}

// ============================================
// PAIEMENTS A VERIFIER
// ============================================

async function loadPaymentsToVerify() {
  const container = document.querySelector('.payments-to-verify');
  if (!container) return;
  
  try {
    const { data: orders, error } = await supabase
      .from(TBL.orders)
      .select('id, order_number, customer_name, total, payment_method_name, payment_proof_url, created_at')
      .in('payment_status', ['proof_submitted', 'awaiting_proof'])
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (!orders || orders.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    const list = container.querySelector('.payments-to-verify__list');
    if (list) {
      list.innerHTML = orders.map(o => `
        <div class="payments-to-verify__item" onclick="viewOrder('${o.id}')" style="cursor: pointer; display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--color-border);">
          <span>${o.order_number} - ${o.customer_name}</span>
          <span>${formatPrice(o.total)} - ${o.payment_method_name || ''}</span>
        </div>
      `).join('');
    }
    
    container.style.display = 'block';
  } catch (err) {
    console.error('Error loading payments to verify:', err);
  }
}

// ============================================
// NAVIGATION
// ============================================

function viewOrder(orderId) {
  window.location.href = `/admin/orders.html?order=${orderId}`;
}

function editProduct(productId) {
  window.location.href = `/admin/products.html?edit=${productId}`;
}

// ============================================
// UTILITIES
// ============================================

function formatPrice(price) {
  return `${price} USD`;
}

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

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

// Export
window.viewOrder = viewOrder;
window.editProduct = editProduct;
