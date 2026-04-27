/* auth.js */
/* Authentication logic, session management, and user utilities */

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} Current user or null
 */
async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (!session) return null;
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    return user;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

/**
 * Check if current user is an admin
 * @returns {Promise<boolean>} True if user is admin
 */
async function isAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return !!data;
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}

/**
 * Check if user is authenticated, redirect if not
 * @param {string} redirectUrl - URL to redirect to after login
 */
async function requireAuth(redirectUrl = window.location.pathname) {
  const user = await getCurrentUser();
  if (!user) {
    const params = new URLSearchParams();
    params.set('redirect', redirectUrl);
    window.location.href = `/login.html?${params.toString()}`;
    return false;
  }
  return true;
}

/**
 * Check if user is admin, redirect if not
 */
async function requireAdmin() {
  const [user, admin] = await Promise.all([
    getCurrentUser(),
    isAdmin()
  ]);
  
  if (!user || !admin) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ============================================
// AUTH ACTIONS
// ============================================

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User full name
 * @returns {Promise<Object>} Registration result
 */
async function register(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    
    // Create customer record
    if (data.user) {
      await supabase.from('customers').insert({
        id: data.user.id,
        full_name: fullName,
        phone: ''
      });
    }
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login result
 */
async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Logout user
 * @param {string} redirectUrl - URL to redirect after logout
 */
async function logout(redirectUrl = '/login.html') {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear local cart
    localStorage.removeItem('guest_cart');
    
    window.location.href = redirectUrl;
  } catch (err) {
    console.error('Error logging out:', err);
    showToast('Erreur lors de la déconnexion', 'error');
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<Object>} Result
 */
async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account.html?reset=true`
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result
 */
async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Update navbar based on auth state
 */
async function updateNavbar() {
  const user = await getCurrentUser();
  const admin = await isAdmin();
  
  // Update user icon link
  const userLink = document.querySelector('.navbar__icon--user a');
  if (userLink) {
    userLink.href = user ? '/account.html' : '/login.html';
  }
  
  // Show/hide admin link
  const adminLink = document.querySelector('.navbar__admin');
  if (adminLink) {
    if (admin) {
      adminLink.classList.add('navbar__admin--visible');
    } else {
      adminLink.classList.remove('navbar__admin--visible');
    }
  }
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error)
 */
function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ============================================
// INITIALIZATION
// ============================================

// Update navbar on page load
document.addEventListener('DOMContentLoaded', updateNavbar);

// Export functions
window.getCurrentUser = getCurrentUser;
window.isAdmin = isAdmin;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.register = register;
window.login = login;
window.logout = logout;
window.resetPassword = resetPassword;
window.updatePassword = updatePassword;
window.updateNavbar = updateNavbar;
window.showToast = showToast;
