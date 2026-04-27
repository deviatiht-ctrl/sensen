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
    
    // Fill payment form
    document.getElementById('moncash-number').value = settings.moncash_number || '';
    document.getElementById('natcash-number').value = settings.natcash_number || '';
    
    if (settings.bank_details) {
      const bank = typeof settings.bank_details === 'string' 
        ? JSON.parse(settings.bank_details) 
        : settings.bank_details;
      document.getElementById('bank-name').value = bank.name || '';
      document.getElementById('bank-account').value = bank.account || '';
      document.getElementById('bank-owner').value = bank.owner || '';
    }
    
    document.getElementById('cod-enabled').checked = settings.cod_enabled !== false;
    
    // Fill shipping form
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
      .from('admin_users')
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
  
  // Payment form
  document.getElementById('payment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePaymentSettings();
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
    contact_email: document.getElementById('store-email').value
  };
  
  try {
    await updateStoreSettings({ ...settings, ...updates });
    showToast('Informations enregistrées', 'success');
  } catch (err) {
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

async function savePaymentSettings() {
  const bankDetails = {
    name: document.getElementById('bank-name').value,
    account: document.getElementById('bank-account').value,
    owner: document.getElementById('bank-owner').value
  };
  
  const updates = {
    moncash_number: document.getElementById('moncash-number').value,
    natcash_number: document.getElementById('natcash-number').value,
    bank_details: bankDetails,
    cod_enabled: document.getElementById('cod-enabled').checked
  };
  
  try {
    await updateStoreSettings({ ...settings, ...updates });
    showToast('Paramètres de paiement enregistrés', 'success');
  } catch (err) {
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

async function saveShippingSettings() {
  const freeShippingEnabled = document.getElementById('free-shipping-enabled').checked;
  
  const updates = {
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
    const url = await uploadImage(file, 'logos');
    
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
      .from('admin_users')
      .insert({ email });
    
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
      .from('admin_users')
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
