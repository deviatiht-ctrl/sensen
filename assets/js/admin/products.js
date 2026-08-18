/* admin/products.js */
/* Product management - CRUD, image upload, status toggle */

// ============================================
// STATE
// ============================================
let products = [];
let categories = [];
let editingProduct = null;
let uploadedImages = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;
  
  await loadCategories();
  await loadProducts();
  initProductForm();
  initFilters();
  
  // Check for edit param
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId) {
    setTimeout(() => openProductModal(editId), 500);
  }
});

// ============================================
// PRODUCT LOADING
// ============================================

/**
 * Load the categories created by the admin and fill the selects
 */
async function loadCategories() {
  try {
    const { data, error } = await supabase
      .from(TBL.categories)
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    categories = data || [];
    
    const formSelect = document.getElementById('product-category');
    if (formSelect) {
      formSelect.innerHTML = categories.length
        ? categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
        : '<option value="">Creez d\'abord une categorie</option>';
    }
    
    const filterSelect = document.querySelector('.admin-filters__category');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="all">Toutes les categories</option>'
        + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    const emptyNotice = document.querySelector('.categories-empty-notice');
    if (emptyNotice) {
      emptyNotice.style.display = categories.length ? 'none' : 'block';
    }
    
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

async function loadProducts() {
  try {
    const { data, error } = await supabase
      .from(TBL.products)
      .select('*, category:category_id (id, name, slug)')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    products = data || [];
    renderProductsTable(products);
    
  } catch (err) {
    console.error('Error loading products:', err);
    showToast('Erreur lors du chargement des produits', 'error');
  }
}

function renderProductsTable(productsToRender) {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;
  
  if (productsToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px;">Aucun produit</td></tr>';
    return;
  }
  
  tbody.innerHTML = productsToRender.map(p => `
    <tr>
      <td>
        <img src="${p.images?.[0] || '/assets/img/logo-placeholder.svg'}" 
             alt="${p.name}" 
             style="width: 50px; height: 67px; object-fit: cover;">
      </td>
      <td>${p.name}</td>
      <td>${formatCategory(p)}</td>
      <td>${formatPrice(p.sale_price || p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <div class="toggle ${p.is_active ? 'toggle--active' : ''}" 
             onclick="toggleProductStatus('${p.id}', ${!p.is_active})">
          <div class="toggle__handle"></div>
        </div>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" onclick="openProductModal('${p.id}')" title="Modifier">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="table-action" onclick="deleteProduct('${p.id}')" title="Supprimer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================
// PRODUCT FORM
// ============================================

function initProductForm() {
  // Form submission
  const form = document.getElementById('product-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProduct();
  });
  
  // Image upload
  const uploadZone = document.querySelector('.image-upload');
  const fileInput = document.getElementById('product-images');
  
  uploadZone?.addEventListener('click', () => fileInput?.click());
  uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--color-accent)';
  });
  uploadZone?.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '';
  });
  uploadZone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    if (e.dataTransfer.files.length > 0) {
      await handleImageUpload(e.dataTransfer.files);
    }
  });
  
  fileInput?.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      await handleImageUpload(e.target.files);
    }
  });
  
  // Tags input (sizes)
  initTagsInput('.sizes-input', 'sizes');
}

async function handleImageUpload(files) {
  const maxFiles = 6 - uploadedImages.length;
  const filesToUpload = Array.from(files).slice(0, maxFiles);
  
  for (const file of filesToUpload) {
    try {
      const url = await uploadImage(file, 'products');
      uploadedImages.push(url);
      renderImageThumbnails();
    } catch (err) {
      console.error('Error uploading image:', err);
      showToast('Erreur lors du téléchargement', 'error');
    }
  }
}

function renderImageThumbnails() {
  const container = document.querySelector('.image-thumbnails');
  if (!container) return;
  
  container.innerHTML = uploadedImages.map((url, index) => `
    <div class="image-thumbnail">
      <img src="${url}" alt="Image ${index + 1}">
      <button class="image-thumbnail__remove" onclick="removeImage(${index})">×</button>
    </div>
  `).join('');
}

function removeImage(index) {
  const url = uploadedImages[index];
  deleteImage(url);
  uploadedImages.splice(index, 1);
  renderImageThumbnails();
}

// ============================================
// MODAL
// ============================================

function openProductModal(productId = null) {
  editingProduct = productId ? products.find(p => p.id === productId) : null;
  
  const panel = document.querySelector('.slide-panel');
  const title = document.querySelector('.slide-panel__title');
  const form = document.getElementById('product-form');
  
  if (editingProduct) {
    title.textContent = 'Modifier le produit';
    
    // Fill form
    document.getElementById('product-name').value = editingProduct.name;
    document.getElementById('product-category').value = editingProduct.category_id || '';
    document.getElementById('product-description').value = editingProduct.description || '';
    document.getElementById('product-price').value = editingProduct.price;
    document.getElementById('product-sale-price').value = editingProduct.sale_price || '';
    document.getElementById('product-stock').value = editingProduct.stock;
    document.getElementById('product-status').checked = editingProduct.is_active;
    
    // Set sizes
    if (editingProduct.sizes) {
      window.productSizes = [...editingProduct.sizes];
      renderSizesTags();
    }
    
    const featuredEl = document.getElementById('product-featured');
    if (featuredEl) featuredEl.checked = !!editingProduct.is_featured;
    const newEl = document.getElementById('product-new');
    if (newEl) newEl.checked = !!editingProduct.is_new;
    
    // Set images
    uploadedImages = [...(editingProduct.images || [])];
    renderImageThumbnails();
  } else {
    title.textContent = 'Ajouter un produit';
    form?.reset();
    uploadedImages = [];
    window.productSizes = [];
    renderImageThumbnails();
    renderSizesTags();
  }
  
  panel?.classList.add('slide-panel--open');
}

function closeProductModal() {
  const panel = document.querySelector('.slide-panel');
  panel?.classList.remove('slide-panel--open');
  editingProduct = null;
}

// ============================================
// SAVE PRODUCT
// ============================================

async function saveProduct() {
  const formData = new FormData(document.getElementById('product-form'));
  
  const salePrice = formData.get('sale_price') ? parseFloat(formData.get('sale_price')) : null;
  
  const productData = {
    name: formData.get('name'),
    category_id: formData.get('category') || null,
    description: formData.get('description'),
    price: parseFloat(formData.get('price')),
    sale_price: salePrice,
    stock: parseInt(formData.get('stock')),
    sizes: window.productSizes || [],
    images: uploadedImages,
    is_sale: !!salePrice,
    is_featured: document.getElementById('product-featured')?.checked || false,
    is_new: document.getElementById('product-new')?.checked || false,
    is_active: document.getElementById('product-status').checked
  };
  
  if (!productData.category_id) {
    showToast('Selectionnez une categorie (creez-en une si necessaire)', 'error');
    return;
  }
  
  try {
    if (editingProduct) {
      // Update existing
      const { error } = await supabase
        .from(TBL.products)
        .update(productData)
        .eq('id', editingProduct.id);
      
      if (error) throw error;
      
      showToast('Produit mis à jour', 'success');
    } else {
      // Create new
      const { error } = await supabase
        .from(TBL.products)
        .insert(productData);
      
      if (error) throw error;
      
      showToast('Produit créé', 'success');
    }
    
    closeProductModal();
    loadProducts();
    
  } catch (err) {
    console.error('Error saving product:', err);
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(productId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
  
  try {
    // Option 1: Hard delete
    // const { error } = await supabase.from('products').delete().eq('id', productId);
    
    // Option 2: Soft delete (set inactive)
    const { error } = await supabase
      .from(TBL.products)
      .update({ is_active: false })
      .eq('id', productId);
    
    if (error) throw error;
    
    showToast('Produit supprimé', 'success');
    loadProducts();
    
  } catch (err) {
    console.error('Error deleting product:', err);
    showToast('Erreur lors de la suppression', 'error');
  }
}

// ============================================
// TOGGLE STATUS
// ============================================

async function toggleProductStatus(productId, newStatus) {
  try {
    const { error } = await supabase
      .from(TBL.products)
      .update({ is_active: newStatus })
      .eq('id', productId);
    
    if (error) throw error;
    
    loadProducts();
    
  } catch (err) {
    console.error('Error toggling status:', err);
    showToast('Erreur', 'error');
  }
}

// ============================================
// FILTERS
// ============================================

function initFilters() {
  const searchInput = document.querySelector('.admin-filters__search input');
  const categorySelect = document.querySelector('.admin-filters__category');
  const statusSelect = document.querySelector('.admin-filters__status');
  
  const applyFilters = () => {
    let filtered = [...products];
    
    // Search filter
    const search = searchInput?.value.toLowerCase() || '';
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search)
      );
    }
    
    // Category filter
    const category = categorySelect?.value;
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category_id === category);
    }
    
    // Status filter
    const status = statusSelect?.value;
    if (status && status !== 'all') {
      const isActive = status === 'active';
      filtered = filtered.filter(p => p.is_active === isActive);
    }
    
    renderProductsTable(filtered);
  };
  
  searchInput?.addEventListener('input', applyFilters);
  categorySelect?.addEventListener('change', applyFilters);
  statusSelect?.addEventListener('change', applyFilters);
}

// ============================================
// TAGS INPUT (Sizes)
// ============================================

function initTagsInput(selector, storageKey) {
  window[storageKey] = [];
  
  const container = document.querySelector(selector);
  if (!container) return;
  
  const input = container.querySelector('input');
  
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = input.value.trim();
      if (value && !window[storageKey].includes(value)) {
        window[storageKey].push(value);
        renderSizesTags();
        input.value = '';
      }
    }
    if (e.key === 'Backspace' && !input.value && window[storageKey].length > 0) {
      window[storageKey].pop();
      renderSizesTags();
    }
  });
}

function renderSizesTags() {
  const container = document.querySelector('.sizes-tags');
  const input = document.querySelector('.sizes-input input');
  if (!container) return;
  
  const tags = window.productSizes || [];
  
  // Insert tags before input
  container.innerHTML = tags.map((tag, index) => `
    <span class="tags-input__tag">
      ${tag}
      <span class="tags-input__tag-remove" onclick="removeSize(${index})">×</span>
    </span>
  `).join('') + (input ? input.outerHTML : '');
}

function removeSize(index) {
  window.productSizes.splice(index, 1);
  renderSizesTags();
}

// ============================================
// UTILITIES
// ============================================

function formatCategory(product) {
  if (product?.category?.name) return product.category.name;
  return categories.find(c => c.id === product?.category_id)?.name || '-';
}

function formatPrice(price) {
  return price ? `${price} USD` : '-';
}

// Exports
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.removeImage = removeImage;
window.removeSize = removeSize;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.toggleProductStatus = toggleProductStatus;
