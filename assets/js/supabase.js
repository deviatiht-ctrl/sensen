/* supabase.js */
/* Supabase client initialization and configuration */

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://oiokeylwapzxyqxwjgac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2tleWx3YXB6eHlxeHdqZ2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTI0MzcsImV4cCI6MjA5MjcyODQzN30.iuWRXbZgmS2Q8LYwfU3XQ4J1NGK2FM5MD1rbbghjH6U';

// Initialize Supabase client using the global supabase object from CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make supabase available globally
window.supabase = supabaseClient;

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
      .from('store_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data || {};
  } catch (err) {
    console.error('Error fetching store settings:', err);
    return { store_name: 'NOM DU STORE' };
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
      .from('store_settings')
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
 * @returns {Promise<string>} Public URL of uploaded image
 */
async function uploadImage(file, path) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { error: uploadError } = await supabaseClient.storage
      .from('products')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabaseClient.storage
      .from('products')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (err) {
    console.error('Error uploading image:', err);
    throw err;
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} url - Public URL of image to delete
 */
async function deleteImage(url) {
  try {
    // Extract path from public URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/products\/(.+)/);
    if (!pathMatch) return;
    
    const path = pathMatch[1];
    const { error } = await supabaseClient.storage
      .from('products')
      .remove([path]);
    
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting image:', err);
  }
}

// Export functions for use in other modules
window.fetchStoreSettings = fetchStoreSettings;
window.updateStoreSettings = updateStoreSettings;
window.uploadImage = uploadImage;
window.deleteImage = deleteImage;
