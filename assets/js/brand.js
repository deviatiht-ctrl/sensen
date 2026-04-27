/* brand.js */
/* Brand page functionality - cart count, store name, logo loading */

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Load store settings
  loadStoreSettings();
  
  // Update cart count
  updateCartCount();
  
  // Check auth state for admin link
  updateAdminLink();
});

// ============================================
// STORE SETTINGS
// ============================================
async function loadStoreSettings() {
  try {
    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .single();
    
    if (settings) {
      // Update store name
      const storeNameEl = document.getElementById('store-name');
      if (storeNameEl && settings.store_name) {
        storeNameEl.textContent = settings.store_name;
        document.title = `${settings.store_name} - Notre Marque`;
      }
      
      // Update logo
      const logoEl = document.getElementById('navbar-logo');
      if (logoEl && settings.logo_url) {
        logoEl.src = settings.logo_url;
      }
    }
  } catch (err) {
    console.log('No store settings found, using defaults');
  }
}

// ============================================
// CART COUNT
// ============================================
async function updateCartCount() {
  try {
    const user = await getCurrentUser();
    let count = 0;
    
    if (user) {
      // Get cart from Supabase
      const { data } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);
      
      count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    } else {
      // Get cart from localStorage
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      count = guestCart.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  } catch (err) {
    console.error('Error updating cart count:', err);
  }
}

// ============================================
// ADMIN LINK VISIBILITY
// ============================================
async function updateAdminLink() {
  const isAdmin = await checkAdmin();
  const adminLink = document.getElementById('admin-link');
  if (adminLink) {
    adminLink.style.display = isAdmin ? 'block' : 'none';
  }
}

// Exports
window.updateCartCount = updateCartCount;
