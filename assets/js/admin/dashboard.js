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
});

// ============================================
// DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
  try {
    // Total revenue (completed orders)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .eq('order_status', 'delivered');
    
    const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    
    // Today's orders
    const today = new Date().toISOString().split('T')[0];
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    // Active products
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Registered customers
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    // Update UI
    updateStatCard('revenue', formatPrice(totalRevenue));
    updateStatCard('orders-today', todayOrders || 0);
    updateStatCard('products', activeProducts || 0);
    updateStatCard('customers', customersCount || 0);
    
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
      .from('orders')
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
      .from('products')
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
