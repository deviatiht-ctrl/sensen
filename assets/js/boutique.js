/* boutique.js */
/* Product listing, filters, search functionality */

// ============================================
// STATE
// ============================================
let currentCategory = 'all';
let currentSort = 'newest';
let currentOffset = 0;
let isLoading = false;
let hasMoreProducts = true;
const PRODUCTS_PER_PAGE = 12;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initSearch();
  loadProducts();
  initInfiniteScroll();
});

// ============================================
// PRODUCT LOADING
// ============================================

/**
 * Load products from Supabase with filters
 */
async function loadProducts(append = false) {
  if (isLoading || (!append && !hasMoreProducts)) return;
  
  isLoading = true;
  showLoading(true);
  
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .range(currentOffset, currentOffset + PRODUCTS_PER_PAGE - 1);
    
    // Apply category filter
    if (currentCategory !== 'all') {
      query = query.eq('category', currentCategory);
    }
    
    // Apply sorting
    if (currentSort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (currentSort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data: products, error } = await query;
    
    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }
    
    console.log('Loaded products:', products?.length || 0, products);
    
    // Check if we have more products
    hasMoreProducts = products.length === PRODUCTS_PER_PAGE;
    
    // Render products
    if (append) {
      appendProducts(products);
    } else {
      renderProducts(products);
    }
    
    currentOffset += products.length;
    
  } catch (err) {
    console.error('Error loading products:', err);
    const grid = document.querySelector('.product-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">Erreur de chargement</div>
          <div class="empty-state__subtitle">${err.message || 'Impossible de charger les produits'}</div>
          <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; cursor: pointer;">Réessayer</button>
        </div>
      `;
    }
  } finally {
    isLoading = false;
    showLoading(false);
  }
}

/**
 * Render products to the grid
 */
function renderProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (products.length === 0) {
    showEmptyState(true);
    return;
  }
  
  showEmptyState(false);
  
  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

/**
 * Append products to existing grid
 */
function appendProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  
  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

/**
 * Create product card HTML element
 */
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.onclick = () => window.location.href = `/product.html?id=${product.id}`;
  
  const isSoldOut = product.stock === 0;
  const isOnSale = product.sale_price && product.sale_price < product.price;
  
  const imageContainer = document.createElement('div');
  imageContainer.className = `product-card__image-container ${isSoldOut ? 'product-card__soldout-image' : ''}`;
  
  // Main image
  const mainImage = document.createElement('img');
  mainImage.className = 'product-card__image';
  mainImage.src = product.images?.[0] || '/assets/img/logo-placeholder.svg';
  mainImage.alt = product.name;
  mainImage.loading = 'lazy';
  imageContainer.appendChild(mainImage);
  
  // Secondary image for hover
  if (product.images?.[1]) {
    const secondaryImage = document.createElement('img');
    secondaryImage.className = 'product-card__image product-card__image-secondary';
    secondaryImage.src = product.images[1];
    secondaryImage.alt = product.name;
    secondaryImage.loading = 'lazy';
    imageContainer.appendChild(secondaryImage);
  }
  
  // Sold out badge
  if (isSoldOut) {
    const soldOut = document.createElement('span');
    soldOut.className = 'product-card__soldout';
    soldOut.textContent = 'Épuisé';
    imageContainer.appendChild(soldOut);
  }
  
  card.appendChild(imageContainer);
  
  // Product info
  const info = document.createElement('div');
  info.className = 'product-card__info';
  
  const category = document.createElement('div');
  category.className = 'product-card__category';
  category.textContent = formatCategory(product.category);
  info.appendChild(category);
  
  const name = document.createElement('div');
  name.className = 'product-card__name';
  name.textContent = product.name;
  info.appendChild(name);
  
  const price = document.createElement('div');
  price.className = 'product-card__price';
  
  if (isOnSale) {
    const original = document.createElement('span');
    original.className = 'product-card__price-original';
    original.textContent = formatPrice(product.price);
    price.appendChild(original);
    
    const sale = document.createElement('span');
    sale.className = 'product-card__price-sale';
    sale.textContent = formatPrice(product.sale_price);
    price.appendChild(sale);
  } else {
    const current = document.createElement('span');
    current.className = 'product-card__price-current';
    current.textContent = formatPrice(product.price);
    price.appendChild(current);
  }
  
  info.appendChild(price);
  card.appendChild(info);
  
  return card;
}

// ============================================
// FILTERING
// ============================================

function initFilters() {
  const categoryBtns = document.querySelectorAll('.filter-bar__category');
  const sortSelect = document.querySelector('.filter-bar__sort-select');
  
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      categoryBtns.forEach(b => b.classList.remove('filter-bar__category--active'));
      btn.classList.add('filter-bar__category--active');
      
      // Update state and reload
      currentCategory = btn.dataset.category || 'all';
      currentOffset = 0;
      hasMoreProducts = true;
      loadProducts();
    });
  });
  
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      currentOffset = 0;
      hasMoreProducts = true;
      loadProducts();
    });
  }
}

// ============================================
// SEARCH
// ============================================

function initSearch() {
  const searchToggle = document.querySelector('.navbar__icon--search');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchClose = document.querySelector('.search-overlay__close');
  const searchInput = document.querySelector('.search-overlay__input');
  
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      searchOverlay?.classList.add('search-overlay--active');
      setTimeout(() => searchInput?.focus(), 100);
    });
  }
  
  if (searchClose) {
    searchClose.addEventListener('click', () => {
      searchOverlay?.classList.remove('search-overlay--active');
    });
  }
  
  // Real-time search
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
      }, 300);
    });
    
    // Close on escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchOverlay?.classList.remove('search-overlay--active');
      }
    });
  }
}

async function performSearch(query) {
  if (!query.trim()) {
    currentOffset = 0;
    loadProducts();
    return;
  }
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .order('display_order', { ascending: true })
      .limit(20);
    
    if (error) throw error;
    
    renderProducts(products);
  } catch (err) {
    console.error('Error searching products:', err);
  }
}

// ============================================
// INFINITE SCROLL / LOAD MORE
// ============================================

function initInfiniteScroll() {
  const loadMoreBtn = document.querySelector('.load-more__btn');
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadProducts(true);
    });
  }
  
  // Optional: Intersection Observer for true infinite scroll
  // const observer = new IntersectionObserver((entries) => {
  //   if (entries[0].isIntersecting && hasMoreProducts && !isLoading) {
  //     loadProducts(true);
  //   }
  // });
  //
  // const sentinel = document.querySelector('.load-more');
  // if (sentinel) observer.observe(sentinel);
}

// ============================================
// UI HELPERS
// ============================================

function showLoading(show) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  
  if (show) {
    const loader = document.createElement('div');
    loader.className = 'loading-state';
    loader.innerHTML = `
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    grid.appendChild(loader);
  } else {
    const loader = grid.querySelector('.loading-state');
    loader?.remove();
  }
}

function showEmptyState(show) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  
  let empty = grid.querySelector('.empty-state');
  
  if (show) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-state__title">La boutique se prépare</div>
        <div class="empty-state__subtitle">De nouveaux articles seront disponibles prochainement.</div>
      `;
      grid.appendChild(empty);
    }
  } else {
    empty?.remove();
  }
}

function formatCategory(category) {
  const categories = {
    'vetements': 'Vêtements',
    'parfums': 'Parfums',
    'accessoires': 'Accessoires',
    'nouveautes': 'Nouveautés',
    'soldes': 'Soldes'
  };
  return categories[category] || category;
}

function formatPrice(price) {
  return `${price} USD`;
}
