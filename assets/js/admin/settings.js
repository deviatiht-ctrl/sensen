/* admin/settings.js */
/* Store settings - name, logo, payment, shipping, admins */

// ============================================
// STATE
// ============================================
let settings = null;
let adminUsers = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;
  
  await loadSettings();
  await loadAdminUsers();
  initForms();
  initLogoUpload();
});

// ============================================
// SETTINGS LOADING
// ============================================

async function loadSettings() {
  try {
    const data = await fetchStoreSettings();
    settings = data;
    
    // Fill store info form
    document.getElementById('store-name').value = settings.store_name || '';
    document.getElementById('store-description').value = settings.description || '';
    document.getElementById('store-email').value = settings.contact_email || '';
    document.getElementById('store-phone').value = settings.contact_phone || '';
    document.getElementById('store-whatsapp').value = settings.whatsapp_number || '';
    document.getElementById('store-address').value = settings.address || '';
    
    // Fill shipping form
    document.getElementById('delivery-enabled').checked = settings.delivery_enabled !== false;
    document.getElementById('pickup-enabled').checked = settings.pickup_enabled !== false;
    document.getElementById('pickup-address').value = settings.pickup_address || '';
    document.getElementById('delivery-delay').value = settings.delivery_delay || '';
    document.getElementById('shipping-fee').value = settings.shipping_fee || 0;
    document.getElementById('free-shipping-enabled').checked = !!settings.free_shipping_threshold;
    document.getElementById('free-shipping-threshold').value = settings.free_shipping_threshold || '';
    document.getElementById('shipping-zones').value = settings.shipping_zones || '';
    
    // Update logo preview
    if (settings.logo_url) {
      const preview = document.querySelector('.logo-preview img');
      if (preview) preview.src = settings.logo_url;
    }
    
  } catch (err) {
    console.error('Error loading settings:', err);
    showToast('Erreur lors du chargement des paramètres', 'error');
  }
}

async function loadAdminUsers() {
  try {
    const { data, error } = await supabase
      .from(TBL.admins)
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    adminUsers = data || [];
    renderAdminUsers();
    
  } catch (err) {
    console.error('Error loading admin users:', err);
  }
}

// ============================================
// FORMS
// ============================================

function initForms() {
  // Store info form
  document.getElementById('store-info-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveStoreInfo();
  });
  
  // Shipping form
  document.getElementById('shipping-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveShippingSettings();
  });
  
  // Add admin form
  document.getElementById('add-admin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addAdminUser();
  });
  
  // Free shipping toggle
  document.getElementById('free-shipping-enabled')?.addEventListener('change', (e) => {
    const thresholdInput = document.getElementById('free-shipping-threshold');
    thresholdInput.disabled = !e.target.checked;
    if (!e.target.checked) thresholdInput.value = '';
  });
}

// ============================================
// SAVE SETTINGS
// ============================================

async function saveStoreInfo() {
  const updates = {
    store_name: document.getElementById('store-name').value,
    description: document.getElementById('store-description').value,
    contact_email: document.getElementById('store-email').value,
    contact_phone: document.getElementById('store-phone').value,
    whatsapp_number: document.getElementById('store-whatsapp').value,
    address: document.getElementById('store-address').value
  };
  
  try {
    await updateStoreSettings({ ...settings, ...updates });
    showToast('Informations enregistrées', 'success');
  } catch (err) {
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

async function saveShippingSettings() {
  const freeShippingEnabled = document.getElementById('free-shipping-enabled').checked;
  
  const updates = {
    delivery_enabled: document.getElementById('delivery-enabled').checked,
    pickup_enabled: document.getElementById('pickup-enabled').checked,
    pickup_address: document.getElementById('pickup-address').value || null,
    delivery_delay: document.getElementById('delivery-delay').value || null,
    shipping_fee: parseFloat(document.getElementById('shipping-fee').value) || 0,
    free_shipping_threshold: freeShippingEnabled 
      ? parseFloat(document.getElementById('free-shipping-threshold').value) || null
      : null,
    shipping_zones: document.getElementById('shipping-zones').value
  };
  
  try {
    await updateStoreSettings({ ...settings, ...updates });
    showToast('Paramètres de livraison enregistrés', 'success');
  } catch (err) {
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

// ============================================
// LOGO UPLOAD
// ============================================

function initLogoUpload() {
  const uploadZone = document.querySelector('.logo-upload');
  const fileInput = document.getElementById('logo-upload');
  
  uploadZone?.addEventListener('click', () => fileInput?.click());
  
  fileInput?.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await handleLogoUpload(e.target.files[0]);
    }
  });
}

async function handleLogoUpload(file) {
  try {
    const url = await uploadImage(file, 'logos', BUCKET.products);
    
    // Update settings with new logo URL
    await updateStoreSettings({ ...settings, logo_url: url });
    
    // Update preview
    const preview = document.querySelector('.logo-preview img');
    if (preview) preview.src = url;
    
    settings.logo_url = url;
    showToast('Logo mis à jour', 'success');
    
  } catch (err) {
    console.error('Error uploading logo:', err);
    showToast('Erreur lors du téléchargement', 'error');
  }
}

// ============================================
// ADMIN USERS
// ============================================

async function addAdminUser() {
  const email = document.getElementById('new-admin-email').value.trim();
  
  if (!email) return;
  
  try {
    const { error } = await supabase
      .from(TBL.admins)
      .insert({ email: email.toLowerCase() });
    
    if (error) {
      if (error.code === '23505') {
        showToast('Cet email est déjà administrateur', 'error');
      } else {
        throw error;
      }
      return;
    }
    
    document.getElementById('new-admin-email').value = '';
    showToast('Administrateur ajouté', 'success');
    loadAdminUsers();
    
  } catch (err) {
    console.error('Error adding admin:', err);
    showToast('Erreur lors de l\'ajout', 'error');
  }
}

async function removeAdminUser(email) {
  if (!confirm(`Êtes-vous sûr de vouloir retirer ${email} des administrateurs ?`)) return;
  
  // Prevent removing yourself
  const currentUser = await getCurrentUser();
  if (currentUser?.email === email) {
    showToast('Vous ne pouvez pas vous retirer vous-même', 'error');
    return;
  }
  
  try {
    const { error } = await supabase
      .from(TBL.admins)
      .delete()
      .eq('email', email);
    
    if (error) throw error;
    
    showToast('Administrateur retiré', 'success');
    loadAdminUsers();
    
  } catch (err) {
    console.error('Error removing admin:', err);
    showToast('Erreur lors de la suppression', 'error');
  }
}

function renderAdminUsers() {
  const list = document.querySelector('.admin-users-list');
  if (!list) return;
  
  if (adminUsers.length === 0) {
    list.innerHTML = '<p style="color: var(--color-text-secondary);">Aucun administrateur</p>';
    return;
  }
  
  list.innerHTML = adminUsers.map(u => `
    <div class="admin-user-item">
      <span class="admin-user-email">${u.email}</span>
      <button class="admin-user-remove" onclick="removeAdminUser('${u.email}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');
}

// Exports
window.removeAdminUser = removeAdminUser;
