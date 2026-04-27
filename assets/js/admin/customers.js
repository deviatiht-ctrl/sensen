/* admin/customers.js */
/* Customer management - view list, customer details */

// ============================================
// STATE
// ============================================
let customers = [];
let selectedCustomer = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;
  
  loadCustomers();
  initFilters();
});

// ============================================
// CUSTOMER LOADING
// ============================================

async function loadCustomers() {
  try {
    console.log('Loading customers...');
    
    // Simple query without joins first
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) {
      console.error('Customers error:', customersError);
      throw customersError;
    }
    
    console.log('Customers loaded:', customersData?.length || 0);
    
    // Fetch orders separately
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total');
    
    if (ordersError) {
      console.error('Orders error:', ordersError);
    }
    
    // Calculate stats for each customer
    customers = (customersData || []).map(c => {
      const customerOrders = allOrders?.filter(o => o.user_id === c.id) || [];
      return {
        ...c,
        orders_count: customerOrders.length,
        total_spent: customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      };
    });
    
    renderCustomersTable(customers);
    
  } catch (err) {
    console.error('Error loading customers:', err);
    showToast('Erreur lors du chargement des clients: ' + (err.message || 'Unknown error'), 'error');
  }
}

function renderCustomersTable(customersToRender) {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  
  if (customersToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;">Aucun client</td></tr>';
    return;
  }
  
  tbody.innerHTML = customersToRender.map(c => `
    <tr onclick="viewCustomerDetails('${c.id}')" style="cursor: pointer;">
      <td>${c.full_name || '-'}</td>
      <td>${c.id}</td>
      <td>${c.phone || '-'}</td>
      <td>${formatDate(c.created_at)}</td>
      <td>${c.orders_count || 0}</td>
      <td>${formatPrice(c.total_spent || 0)}</td>
    </tr>
  `).join('');
}

// ============================================
// CUSTOMER DETAILS MODAL
// ============================================

async function viewCustomerDetails(customerId) {
  selectedCustomer = customers.find(c => c.id === customerId);
  if (!selectedCustomer) return;
  
  // Load customer orders
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    renderCustomerModal(selectedCustomer, orders || []);
    
  } catch (err) {
    console.error('Error loading customer orders:', err);
    renderCustomerModal(selectedCustomer, []);
  }
}

function renderCustomerModal(customer, orders) {
  const panel = document.querySelector('.slide-panel');
  
  // Fill customer info
  document.querySelector('.customer-modal__name').textContent = customer.full_name || '-';
  document.querySelector('.customer-modal__email').textContent = customer.id; // email is stored in auth, not customers table
  document.querySelector('.customer-modal__phone').textContent = customer.phone || '-';
  document.querySelector('.customer-modal__address').textContent = customer.address || '-';
  document.querySelector('.customer-modal__city').textContent = customer.city || '-';
  document.querySelector('.customer-modal__registered').textContent = formatDate(customer.created_at);
  
  // Stats
  document.querySelector('.customer-modal__orders-count').textContent = orders.length;
  document.querySelector('.customer-modal__total-spent').textContent = formatPrice(
    orders.reduce((sum, o) => sum + o.total, 0)
  );
  
  // Orders list
  const ordersContainer = document.querySelector('.customer-orders-list');
  if (orders.length === 0) {
    ordersContainer.innerHTML = '<p style="color: var(--color-text-secondary); padding: 16px 0;">Aucune commande</p>';
  } else {
    ordersContainer.innerHTML = orders.map(o => `
      <div class="customer-order-item" onclick="viewOrder('${o.id}')">
        <div class="customer-order-item__header">
          <span class="customer-order-item__number">${o.order_number}</span>
          <span class="status-badge status-badge--${o.order_status}">${formatStatus(o.order_status)}</span>
        </div>
        <div class="customer-order-item__meta">
          ${formatDate(o.created_at)} | ${formatPrice(o.total)}
        </div>
      </div>
    `).join('');
  }
  
  panel?.classList.add('slide-panel--open');
}

function closeCustomerModal() {
  const panel = document.querySelector('.slide-panel');
  panel?.classList.remove('slide-panel--open');
  selectedCustomer = null;
}

// ============================================
// FILTERS
// ============================================

function initFilters() {
  const searchInput = document.querySelector('.admin-filters__search input');
  
  const applyFilters = () => {
    let filtered = [...customers];
    
    const search = searchInput?.value.toLowerCase() || '';
    if (search) {
      filtered = filtered.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(search)) ||
        c.id.toLowerCase().includes(search) ||
        (c.phone && c.phone.toLowerCase().includes(search))
      );
    }
    
    renderCustomersTable(filtered);
  };
  
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

function formatPrice(price) {
  return `${price} USD`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Exports
window.viewCustomerDetails = viewCustomerDetails;
window.closeCustomerModal = closeCustomerModal;
