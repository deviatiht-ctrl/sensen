/* account.js */
/* Customer account management - orders, profile */

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await requireAuth();
  if (!isAuthenticated) return;
  
  loadAccountData();
  initTabs();
  initProfileForm();
  initLogout();
});

// ============================================
// ACCOUNT DATA LOADING
// ============================================

async function loadAccountData() {
  const user = await getCurrentUser();
  if (!user) return;
  
  try {
    // Load customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error loading customer:', customerError);
    }
    
    // Load orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (ordersError) throw ordersError;
    
    renderProfile({ ...user.user_metadata, ...customer });
    renderOrders(orders || []);
    
  } catch (err) {
    console.error('Error loading account data:', err);
    showToast('Erreur lors du chargement des données', 'error');
  }
}

// ============================================
// PROFILE SECTION
// ============================================

function renderProfile(data) {
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const addressInput = document.getElementById('profile-address');
  const cityInput = document.getElementById('profile-city');
  
  if (nameInput) nameInput.value = data?.full_name || '';
  if (emailInput) emailInput.value = data?.email || '';
  if (phoneInput) phoneInput.value = data?.phone || '';
  if (addressInput) addressInput.value = data?.address || '';
  if (cityInput) cityInput.value = data?.city || '';
}

function initProfileForm() {
  const form = document.getElementById('profile-form');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = await getCurrentUser();
    if (!user) return;
    
    const formData = new FormData(form);
    
    const updates = {
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city')
    };
    
    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: updates.full_name }
      });
      
      if (authError) throw authError;
      
      // Upsert customer record
      const { error: customerError } = await supabase
        .from('customers')
        .upsert({
          id: user.id,
          ...updates
        }, { onConflict: 'id' });
      
      if (customerError) throw customerError;
      
      showToast('Profil mis à jour', 'success');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  });
}

// ============================================
// ORDERS SECTION
// ============================================

function renderOrders(orders) {
  const container = document.querySelector('.orders-list');
  if (!container) return;
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="orders-empty">
        <p>Vous n'avez pas encore passé de commande.</p>
        <a href="/" class="btn btn--secondary" style="margin-top: 16px;">Découvrir la boutique</a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-card" data-order-id="${order.id}" onclick="viewOrderDetails && viewOrderDetails('${order.id}')" style="cursor: pointer;">
      <div class="order-header">
        <div class="order-header__left">
          <div class="order-number">${order.order_number}</div>
          <div class="order-date">${formatDate(order.created_at)}</div>
        </div>
        <div class="order-header__right">
          <span class="status-badge status-badge--${order.order_status}">${formatStatus(order.order_status)}</span>
          <span class="order-total">${formatPrice(order.total)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-rose);">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>
  `).join('');
}

// Function to view order details in modal - will be defined in HTML
if (typeof window !== 'undefined') {
  window.viewOrderDetails = window.viewOrderDetails || function(orderId) {
    // Fallback - the actual function is defined in account.html
    console.log('View order:', orderId);
  };
}

// ============================================
// TABS
// ============================================

function initTabs() {
  const tabs = document.querySelectorAll('.account-tab');
  const panels = document.querySelectorAll('.account-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('account-tab--active'));
      tab.classList.add('account-tab--active');
      
      // Show target panel
      panels.forEach(p => {
        p.classList.toggle('account-panel--active', p.id === target);
      });
    });
  });
  
  // Check URL hash for tab
  const hash = window.location.hash.slice(1);
  if (hash) {
    const tab = document.querySelector(`.account-tab[data-tab="${hash}"]`);
    tab?.click();
  }
}

// ============================================
// LOGOUT
// ============================================

function initLogout() {
  const logoutBtn = document.querySelector('.account-logout');
  
  logoutBtn?.addEventListener('click', async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  });
}

// ============================================
// UTILITIES
// ============================================

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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

function formatPaymentMethod(method) {
  const methods = {
    'moncash': 'MonCash',
    'natcash': 'NatCash',
    'bank_transfer': 'Virement bancaire',
    'cod': 'Paiement à la livraison'
  };
  return methods[method] || method;
}

function formatPrice(price) {
  return `${price} USD`;
}

// Export for global access
window.toggleOrder = toggleOrder;
