/* supabase.js */
/* Supabase client initialization and configuration */

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://oykuhhogcdbmoybskexd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a3VoaG9nY2RibW95YnNrZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTk1OTksImV4cCI6MjA5NjQ5NTU5OX0.xbIdgA6-DCILYkDQcl_VzWgz7HmIlHYhmRp0u_a87F4';

// Initialize Supabase client using the global supabase object from CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make supabase available globally
window.supabase = supabaseClient;

// ============================================
// TABLE / BUCKET NAMES
// ============================================
// Every table is prefixed with `boutique_` so this project can share the same
// Supabase database with another project. The admin table also carries the
// `_sensen` suffix so the two projects never share administrators.
const TBL = {
  settings: 'boutique_store_settings',
  admins: 'boutique_admin_users_sensen',
  categories: 'boutique_categories',
  products: 'boutique_products',
  variants: 'boutique_product_variants',
  customers: 'boutique_customers',
  cart: 'boutique_cart_items',
  paymentMethods: 'boutique_payment_methods',
  orders: 'boutique_orders',
  proofs: 'boutique_payment_proofs',
  tracking: 'boutique_order_tracking',
  messages: 'boutique_messages'
};

const BUCKET = {
  products: 'boutique-products',
  proofs: 'boutique-proofs'
};

window.TBL = TBL;
window.BUCKET = BUCKET;

const STORE_NAME_FALLBACK = 'Sensen Accessories';
window.STORE_NAME_FALLBACK = STORE_NAME_FALLBACK;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Fetch store settings from Supabase
 * @returns {Promise<Object>} Store settings object
 */
async function fetchStoreSettings() {
  try {
    const { data, error } = await supabaseClient
      .from(TBL.settings)
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data || { store_name: STORE_NAME_FALLBACK };
  } catch (err) {
    console.error('Error fetching store settings:', err);
    return { store_name: STORE_NAME_FALLBACK };
  }
}

/**
 * Fetch active categories (created by the admin)
 * @param {boolean} menuOnly - only categories flagged for the menu
 * @returns {Promise<Array>} Categories ordered by display_order
 */
async function fetchCategories(menuOnly = false) {
  try {
    let query = supabaseClient
      .from(TBL.categories)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (menuOnly) query = query.eq('show_in_menu', true);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

/**
 * Fetch active payment methods configured by the admin
 * @returns {Promise<Array>} Payment methods ordered by display_order
 */
async function fetchPaymentMethods() {
  try {
    const { data, error } = await supabaseClient
      .from(TBL.paymentMethods)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    return [];
  }
}

/**
 * Update store settings in Supabase
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
async function updateStoreSettings(settings) {
  try {
    const { data, error } = await supabaseClient
      .from(TBL.settings)
      .update(settings)
      .eq('id', settings.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating store settings:', err);
    throw err;
  }
}

/**
 * Upload image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} path - Storage path
 * @param {string} bucket - Target bucket (defaults to the products bucket)
 * @returns {Promise<string>} Public URL of uploaded image
 */
async function uploadImage(file, path, bucket = BUCKET.products) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (err) {
    console.error('Error uploading image:', err);
    throw err;
  }
}

/**
 * Upload a manual payment proof (receipt / screenshot)
 * @param {File} file - Proof file
 * @param {string} orderNumber - Order number used as folder
 * @returns {Promise<string>} Public URL of the uploaded proof
 */
async function uploadPaymentProof(file, orderNumber) {
  return uploadImage(file, `proofs/${orderNumber || 'unknown'}`, BUCKET.proofs);
}

/**
 * Delete image from Supabase Storage
 * @param {string} url - Public URL of image to delete
 * @param {string} bucket - Bucket the file lives in
 */
async function deleteImage(url, bucket = BUCKET.products) {
  try {
    // Extract path from public URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`/${bucket}/(.+)`));
    if (!pathMatch) return;
    
    const path = pathMatch[1];
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting image:', err);
  }
}

// Export functions for use in other modules
window.fetchStoreSettings = fetchStoreSettings;
window.updateStoreSettings = updateStoreSettings;
window.fetchCategories = fetchCategories;
window.fetchPaymentMethods = fetchPaymentMethods;
window.uploadImage = uploadImage;
window.uploadPaymentProof = uploadPaymentProof;
window.deleteImage = deleteImage;
