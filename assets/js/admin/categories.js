/* admin/categories.js */
/* Category management - the storefront navigation is built from this table */

// ============================================
// STATE
// ============================================
let categories = [];
let productCounts = {};
let editingCategory = null;
let categoryImage = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;

  await loadCategories();
  initCategoryForm();
  initFilters();
});

// ============================================
// LOADING
// ============================================

async function loadCategories() {
  try {
    const { data, error } = await supabase
      .from(TBL.categories)
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    categories = data || [];
    await loadProductCounts();
    renderCategoriesTable(categories);

  } catch (err) {
    console.error('Error loading categories:', err);
    showToast('Erreur lors du chargement des categories', 'error');
  }
}

async function loadProductCounts() {
  productCounts = {};
  try {
    const { data, error } = await supabase
      .from(TBL.products)
      .select('category_id');

    if (error) throw error;

    (data || []).forEach(p => {
      if (!p.category_id) return;
      productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
    });
  } catch (err) {
    console.error('Error counting products:', err);
  }
}

function renderCategoriesTable(list) {
  const tbody = document.querySelector('.admin-table tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align: center; padding: 24px;">
        Aucune categorie. Cliquez sur "Ajouter une categorie" pour commencer.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td>
        <img src="${c.image_url || '/assets/img/logo-placeholder.svg'}"
             alt="${c.name}"
             style="width: 56px; height: 56px; object-fit: cover;">
      </td>
      <td>${c.name}</td>
      <td style="color: var(--color-text-secondary);">${c.slug}</td>
      <td>${productCounts[c.id] || 0}</td>
      <td>${c.display_order ?? 0}</td>
      <td>
        <div class="toggle ${c.show_in_menu ? 'toggle--active' : ''}"
             onclick="toggleCategoryMenu('${c.id}', ${!c.show_in_menu})">
          <div class="toggle__handle"></div>
        </div>
      </td>
      <td>
        <div class="toggle ${c.is_active ? 'toggle--active' : ''}"
             onclick="toggleCategoryStatus('${c.id}', ${!c.is_active})">
          <div class="toggle__handle"></div>
        </div>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" onclick="openCategoryModal('${c.id}')" title="Modifier">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="table-action" onclick="deleteCategory('${c.id}')" title="Supprimer">
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
// FORM
// ============================================

function initCategoryForm() {
  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCategory();
  });

  // Auto slug from name
  const nameInput = document.getElementById('category-name');
  const slugInput = document.getElementById('category-slug');
  nameInput?.addEventListener('input', () => {
    if (!editingCategory && slugInput && !slugInput.dataset.touched) {
      slugInput.value = slugify(nameInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    slugInput.dataset.touched = 'true';
  });

  // Image upload
  const zone = document.getElementById('category-image-upload');
  const input = document.getElementById('category-image');

  zone?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      categoryImage = await uploadImage(file, 'categories');
      renderCategoryImagePreview();
    } catch (err) {
      console.error('Error uploading category image:', err);
      showToast('Erreur lors du telechargement', 'error');
    }
  });
}

function renderCategoryImagePreview() {
  const container = document.getElementById('category-image-preview');
  if (!container) return;

  container.innerHTML = categoryImage
    ? `<div class="image-thumbnail">
         <img src="${categoryImage}" alt="Image categorie">
         <button type="button" class="image-thumbnail__remove" onclick="removeCategoryImage()">&times;</button>
       </div>`
    : '';
}

function removeCategoryImage() {
  categoryImage = null;
  renderCategoryImagePreview();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================
// MODAL
// ============================================

function openCategoryModal(categoryId = null) {
  editingCategory = categoryId ? categories.find(c => c.id === categoryId) : null;

  const panel = document.querySelector('.slide-panel');
  const title = document.querySelector('.slide-panel__title');
  const form = document.getElementById('category-form');
  const slugInput = document.getElementById('category-slug');

  if (editingCategory) {
    title.textContent = 'Modifier la categorie';
    document.getElementById('category-name').value = editingCategory.name || '';
    slugInput.value = editingCategory.slug || '';
    slugInput.dataset.touched = 'true';
    document.getElementById('category-description').value = editingCategory.description || '';
    document.getElementById('category-order').value = editingCategory.display_order ?? 0;
    document.getElementById('category-active').checked = editingCategory.is_active !== false;
    document.getElementById('category-menu').checked = editingCategory.show_in_menu !== false;
    categoryImage = editingCategory.image_url || null;
  } else {
    title.textContent = 'Ajouter une categorie';
    form?.reset();
    delete slugInput.dataset.touched;
    document.getElementById('category-active').checked = true;
    document.getElementById('category-menu').checked = true;
    categoryImage = null;
  }

  renderCategoryImagePreview();
  panel?.classList.add('slide-panel--open');
}

function closeCategoryModal() {
  document.querySelector('.slide-panel')?.classList.remove('slide-panel--open');
  editingCategory = null;
  categoryImage = null;
}

// ============================================
// SAVE / DELETE
// ============================================

async function saveCategory() {
  const name = document.getElementById('category-name').value.trim();
  const slug = slugify(document.getElementById('category-slug').value || name);

  if (!name || !slug) {
    showToast('Le nom de la categorie est obligatoire', 'error');
    return;
  }

  const categoryData = {
    name,
    slug,
    description: document.getElementById('category-description').value || null,
    image_url: categoryImage,
    display_order: parseInt(document.getElementById('category-order').value) || 0,
    is_active: document.getElementById('category-active').checked,
    show_in_menu: document.getElementById('category-menu').checked
  };

  try {
    if (editingCategory) {
      const { error } = await supabase
        .from(TBL.categories)
        .update(categoryData)
        .eq('id', editingCategory.id);

      if (error) throw error;
      showToast('Categorie mise a jour', 'success');
    } else {
      const { error } = await supabase
        .from(TBL.categories)
        .insert(categoryData);

      if (error) throw error;
      showToast('Categorie creee', 'success');
    }

    closeCategoryModal();
    loadCategories();

  } catch (err) {
    console.error('Error saving category:', err);
    if (err.code === '23505' || err.code === '23000' || /duplicate/i.test(err.message || '')) {
      showToast('Ce slug existe deja, choisissez-en un autre', 'error');
    } else {
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  }
}

async function deleteCategory(categoryId) {
  const count = productCounts[categoryId] || 0;
  const message = count > 0
    ? `Cette categorie contient ${count} produit(s). Ils resteront sans categorie. Continuer ?`
    : 'Supprimer cette categorie ?';

  if (!confirm(message)) return;

  try {
    const { error } = await supabase
      .from(TBL.categories)
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    showToast('Categorie supprimee', 'success');
    loadCategories();

  } catch (err) {
    console.error('Error deleting category:', err);
    showToast('Erreur lors de la suppression', 'error');
  }
}

async function toggleCategoryStatus(categoryId, isActive) {
  await updateCategoryField(categoryId, { is_active: isActive });
}

async function toggleCategoryMenu(categoryId, showInMenu) {
  await updateCategoryField(categoryId, { show_in_menu: showInMenu });
}

async function updateCategoryField(categoryId, patch) {
  try {
    const { error } = await supabase
      .from(TBL.categories)
      .update(patch)
      .eq('id', categoryId);

    if (error) throw error;
    loadCategories();
  } catch (err) {
    console.error('Error updating category:', err);
    showToast('Erreur', 'error');
  }
}

// ============================================
// FILTERS
// ============================================

function initFilters() {
  const searchInput = document.querySelector('.admin-filters__search input');
  const statusSelect = document.querySelector('.admin-filters__status');

  const applyFilters = () => {
    let filtered = [...categories];

    const search = searchInput?.value.toLowerCase() || '';
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) || (c.slug || '').includes(search)
      );
    }

    const status = statusSelect?.value;
    if (status && status !== 'all') {
      const isActive = status === 'active';
      filtered = filtered.filter(c => !!c.is_active === isActive);
    }

    renderCategoriesTable(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);
  statusSelect?.addEventListener('change', applyFilters);
}

// Exports
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
window.toggleCategoryStatus = toggleCategoryStatus;
window.toggleCategoryMenu = toggleCategoryMenu;
window.removeCategoryImage = removeCategoryImage;
