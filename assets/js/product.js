/* product.js */
/* Product detail page functionality */

console.log('Product.js loaded, supabase available:', typeof supabase !== 'undefined');

// ============================================
// STATE
// ============================================
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let quantity = 1;
let currentImageIndex = 0;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadProductDetail();
});

/**
 * Load and display product details
 */
async function loadProductDetail() {
  console.log('Loading product detail...');
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  console.log('Product ID:', productId);
  
  if (!productId) {
    showError('Produit non trouvé');
    return;
  }
  
  try {
    console.log('Fetching from Supabase...');
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();
    
    console.log('Supabase response:', { product, error });
    
    if (error || !product) {
      console.error('Product not found or error:', error);
      showError('Produit non trouvé');
      return;
    }
    
    currentProduct = product;
    console.log('Product loaded successfully:', product.name);
    renderProductDetail(product);
    
  } catch (err) {
    console.error('Error loading product:', err);
    showError('Erreur lors du chargement du produit: ' + err.message);
  }
}

/**
 * Render product detail page
 */
function renderProductDetail(product) {
  // Update breadcrumb
  const breadcrumbCurrent = document.querySelector('.breadcrumb__current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = product.name;
  }
  
  const breadcrumbCategory = document.querySelector('.breadcrumb__category');
  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = formatCategory(product.category);
    breadcrumbCategory.href = `/?category=${product.category}`;
  }
  
  // Update product info
  const categoryEl = document.querySelector('.product-info__category');
  if (categoryEl) categoryEl.textContent = formatCategory(product.category);
  
  const nameEl = document.querySelector('.product-info__name');
  if (nameEl) nameEl.textContent = product.name;
  
  // Update price
  const isOnSale = product.sale_price && product.sale_price < product.price;
  const priceContainer = document.querySelector('.product-info__price');
  
  if (priceContainer) {
    priceContainer.innerHTML = '';
    
    if (isOnSale) {
      const original = document.createElement('span');
      original.className = 'product-info__price-original';
      original.textContent = formatPrice(product.price);
      priceContainer.appendChild(original);
      
      const sale = document.createElement('span');
      sale.className = 'product-info__price-sale';
      sale.textContent = formatPrice(product.sale_price);
      priceContainer.appendChild(sale);
    } else {
      const current = document.createElement('span');
      current.className = 'product-info__price-current';
      current.textContent = formatPrice(product.price);
      priceContainer.appendChild(current);
    }
  }
  
  // Render gallery
  renderGallery(product.images || []);
  
  // Render variants
  renderSizeSelector(product.sizes || []);
  renderColorSelector(product.colors || []);
  
  // Render description
  const descEl = document.querySelector('.product-description__text');
  if (descEl) descEl.textContent = product.description || '';
  
  // Update add to cart button
  updateAddToCartButton();
}

/**
 * Render image gallery
 */
function renderGallery(images) {
  const mainContainer = document.querySelector('.product-gallery__main');
  const thumbsContainer = document.querySelector('.product-gallery__thumbs');
  
  if (!mainContainer || !thumbsContainer) return;
  
  // Clear existing
  mainContainer.innerHTML = '';
  thumbsContainer.innerHTML = '';
  
  // Add placeholder if no images
  const displayImages = images.length > 0 ? images : ['/assets/img/logo-placeholder.svg'];
  
  // Main image
  const mainImg = document.createElement('img');
  mainImg.className = 'product-gallery__main-image';
  mainImg.src = displayImages[0];
  mainImg.alt = currentProduct?.name || '';
  mainImg.onload = () => mainImg.classList.add('product-gallery__main-image--loaded');
  mainContainer.appendChild(mainImg);
  
  // Thumbnails
  displayImages.forEach((img, index) => {
    const thumb = document.createElement('div');
    thumb.className = `product-gallery__thumb ${index === 0 ? 'product-gallery__thumb--active' : ''}`;
    thumb.onclick = () => switchImage(index);
    
    const thumbImg = document.createElement('img');
    thumbImg.src = img;
    thumbImg.alt = `${currentProduct?.name} - ${index + 1}`;
    
    thumb.appendChild(thumbImg);
    thumbsContainer.appendChild(thumb);
  });
}

/**
 * Switch main image
 */
function switchImage(index) {
  const mainImg = document.querySelector('.product-gallery__main-image');
  const thumbs = document.querySelectorAll('.product-gallery__thumb');
  const images = currentProduct?.images || [];
  
  if (!mainImg || images.length === 0) return;
  
  currentImageIndex = index;
  
  // Fade effect
  mainImg.style.opacity = '0';
  
  setTimeout(() => {
    mainImg.src = images[index];
    mainImg.style.opacity = '1';
  }, 200);
  
  // Update active thumb
  thumbs.forEach((t, i) => {
    t.classList.toggle('product-gallery__thumb--active', i === index);
  });
}

/**
 * Render size selector
 */
function renderSizeSelector(sizes) {
  const container = document.querySelector('.size-selector');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!sizes || sizes.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  
  sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.className = 'size-selector__btn';
    btn.textContent = size;
    btn.onclick = () => selectSize(size);
    container.appendChild(btn);
  });
}

function selectSize(size) {
  selectedSize = selectedSize === size ? null : size;
  
  document.querySelectorAll('.size-selector__btn').forEach(btn => {
    btn.classList.toggle('size-selector__btn--active', btn.textContent === selectedSize);
  });
  
  updateAddToCartButton();
}

/**
 * Render color selector
 */
function renderColorSelector(colors) {
  const container = document.querySelector('.color-selector');
  const label = document.querySelector('.color-selector-label');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!colors || colors.length === 0) {
    container.style.display = 'none';
    if (label) label.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  if (label) label.style.display = 'block';
  
  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-selector__btn';
    btn.style.backgroundColor = color.hex;
    btn.title = color.name;
    btn.onclick = () => selectColor(color);
    container.appendChild(btn);
  });
}

function selectColor(color) {
  selectedColor = selectedColor?.name === color.name ? null : color;
  
  document.querySelectorAll('.color-selector__btn').forEach(btn => {
    btn.classList.toggle('color-selector__btn--active', btn.title === selectedColor?.name);
  });
  
  updateAddToCartButton();
}

/**
 * Quantity selector
 */
function updateQuantity(delta) {
  const newQty = quantity + delta;
  if (newQty < 1 || newQty > 10) return;
  
  quantity = newQty;
  
  const qtyEl = document.querySelector('.quantity-selector__value');
  if (qtyEl) qtyEl.value = quantity;
}

// Setup quantity buttons
document.addEventListener('DOMContentLoaded', () => {
  const minusBtn = document.querySelector('.quantity-selector__btn--minus');
  const plusBtn = document.querySelector('.quantity-selector__btn--plus');
  const qtyInput = document.querySelector('.quantity-selector__value');
  
  minusBtn?.addEventListener('click', () => updateQuantity(-1));
  plusBtn?.addEventListener('click', () => updateQuantity(1));
  
  qtyInput?.addEventListener('change', (e) => {
    const val = parseInt(e.target.value);
    if (val >= 1 && val <= 10) {
      quantity = val;
    } else {
      e.target.value = quantity;
    }
  });
  
  // Add to cart button
  document.querySelector('.add-to-cart__btn')?.addEventListener('click', addToCart);
  
  // Accordion
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('accordion-item--open');
    });
  });
});

/**
 * Check if product can be added to cart
 */
function canAddToCart() {
  if (!currentProduct) return { ok: false, reason: 'Produit non chargé' };
  
  if (currentProduct.stock === 0) {
    return { ok: false, reason: 'Produit épuisé' };
  }
  
  const hasSizes = currentProduct.sizes && currentProduct.sizes.length > 0;
  const hasColors = currentProduct.colors && currentProduct.colors.length > 0;
  
  if (hasSizes && !selectedSize) {
    return { ok: false, reason: 'Veuillez sélectionner une taille' };
  }
  
  if (hasColors && !selectedColor) {
    return { ok: false, reason: 'Veuillez sélectionner une couleur' };
  }
  
  return { ok: true };
}

/**
 * Update add to cart and buy now button states
 */
function updateAddToCartButton() {
  console.log('Updating buttons, currentProduct:', currentProduct);
  const addToCartBtn = document.querySelector('.add-to-cart__btn');
  const buyNowBtn = document.querySelector('.buy-now__btn');
  console.log('Buttons found:', { addToCartBtn: !!addToCartBtn, buyNowBtn: !!buyNowBtn });
  
  if (!addToCartBtn || !currentProduct) {
    console.log('Early return - missing button or product');
    return;
  }
  
  const isSoldOut = currentProduct.stock === 0;
  
  // Only disable if sold out, otherwise keep enabled
  addToCartBtn.disabled = isSoldOut;
  if (buyNowBtn) {
    buyNowBtn.disabled = isSoldOut;
  }
  
  if (isSoldOut) {
    addToCartBtn.textContent = 'Épuisé';
    addToCartBtn.classList.add('add-to-cart__btn--soldout');
  } else {
    addToCartBtn.innerHTML = '<span>Ajouter au panier</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    addToCartBtn.classList.remove('add-to-cart__btn--soldout');
  }
}

/**
 * Add to cart functionality
 */
async function addToCart() {
  // Check if we can add to cart
  const check = canAddToCart();
  if (!check.ok) {
    showToast(check.reason, 'error');
    return;
  }
  
  if (!currentProduct) return;
  
  const user = await getCurrentUser();
  const cartItem = {
    product_id: currentProduct.id,
    quantity: quantity,
    size: selectedSize,
    color: selectedColor?.name || null
  };
  
  try {
    if (user) {
      // Add to Supabase cart
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          ...cartItem,
          user_id: user.id
        }, {
          onConflict: 'user_id,product_id,size,color'
        });
      
      if (error) throw error;
    } else {
      // Add to local storage cart
      addToGuestCart(cartItem);
    }
    
    // Show success animation
    const btn = document.querySelector('.add-to-cart__btn');
    btn.classList.add('add-to-cart__btn--success');
    
    // Bounce cart badge
    const badge = document.querySelector('.navbar__badge');
    badge?.classList.add('navbar__badge--bounce');
    setTimeout(() => badge?.classList.remove('navbar__badge--bounce'), 300);
    
    // Reset button after delay
    setTimeout(() => {
      btn.classList.remove('add-to-cart__btn--success');
    }, 1500);
    
    // Update cart count
    updateCartCount();
    
    showToast('Ajouté au panier', 'success');
    
  } catch (err) {
    console.error('Error adding to cart:', err);
    showToast('Erreur lors de l\'ajout au panier', 'error');
  }
}

/**
 * Add item to guest cart (localStorage)
 */
function addToGuestCart(item) {
  const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
  
  // Check if item already exists
  const existingIndex = cart.findIndex(i => 
    i.product_id === item.product_id &&
    i.size === item.size &&
    i.color === item.color
  );
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  
  localStorage.setItem('guest_cart', JSON.stringify(cart));
}

/**
 * Update cart badge count
 */
async function updateCartCount() {
  const user = await getCurrentUser();
  let count = 0;
  
  if (user) {
    const { data } = await supabase
      .from('cart_items')
      .select('quantity', { count: 'exact' })
      .eq('user_id', user.id);
    
    count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  } else {
    const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    count = cart.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  const badge = document.querySelector('.navbar__badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Update cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

// ============================================
// UTILITIES
// ============================================

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

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('toast--visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showError(message) {
  const container = document.querySelector('.product-detail');
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state__title">${message}</div>
        <a href="/" class="btn btn--secondary" style="margin-top: 24px;">Retour à la boutique</a>
      </div>
    `;
  }
}

/**
 * Buy Now functionality - Add to cart and redirect to checkout
 */
async function buyNow() {
  // Check if we can buy now
  const check = canAddToCart();
  if (!check.ok) {
    showToast(check.reason, 'error');
    return;
  }
  
  if (!currentProduct) return;
  
  // First add to cart
  const user = await getCurrentUser();
  const cartItem = {
    product_id: currentProduct.id,
    quantity: quantity,
    size: selectedSize,
    color: selectedColor?.name || null
  };
  
  // Check if user is logged in
  if (!user) {
    // Save to localStorage and redirect to login
    addToGuestCart(cartItem);
    showToast('Connectez-vous pour continuer l\'achat', 'info');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/cart.html';
    }, 1500);
    return;
  }
  
  // User is logged in, add to Supabase cart
  try {
    const { error } = await supabase
      .from('cart_items')
      .upsert({
        ...cartItem,
        user_id: user.id
      }, {
        onConflict: 'user_id,product_id,size,color'
      });
    
    if (error) throw error;
    
    // Redirect to cart/checkout
    window.location.href = '/cart.html';
    
  } catch (err) {
    console.error('Error adding to cart:', err);
    showToast('Erreur lors de l\'ajout au panier', 'error');
  }
}

// Export functions for global access
window.switchImage = switchImage;
window.selectSize = selectSize;
window.selectColor = selectColor;
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;
window.buyNow = buyNow;
