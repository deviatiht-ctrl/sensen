// ============================================
// ADMIN MESSAGES MANAGEMENT
// ============================================

let currentConversation = null;
let conversations = [];
let messagesSubscription = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadConversations();
  setupEventListeners();
  subscribeToNewMessages();
  updateUnreadBadge();
  
  // Refresh conversations every 30 seconds
  setInterval(loadConversations, 30000);
});

function setupEventListeners() {
  const chatForm = document.getElementById('chat-form');
  const backButton = document.getElementById('back-to-conversations');
  
  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    sendAdminMessage();
  });
  
  backButton?.addEventListener('click', () => {
    document.getElementById('conversations-list').classList.remove('conversations-list--hidden');
    document.getElementById('chat-area').classList.remove('chat-area--active');
  });
}

// ============================================
// LOAD CONVERSATIONS
// ============================================

async function loadConversations() {
  try {
    // Get all unique users who have sent messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('user_id, sender, message, created_at, read')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Group by user and get latest message
    const userMap = new Map();
    messages?.forEach(msg => {
      if (!userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          last_message: msg.message,
          last_time: msg.created_at,
          unread_count: 0
        });
      }
      if (msg.sender === 'client' && !msg.read) {
        userMap.get(msg.user_id).unread_count++;
      }
    });
    
    conversations = Array.from(userMap.values());
    
    // Get user details for each conversation
    for (const conv of conversations) {
      const { data: userData } = await supabase
        .from('customers')
        .select('full_name, email, phone')
        .eq('id', conv.user_id)
        .single();
      
      if (userData) {
        conv.name = userData.full_name || 'Client';
        conv.email = userData.email || '';
        conv.phone = userData.phone || '';
      } else {
        conv.name = 'Client';
        conv.email = '';
      }
    }
    
    // Sort by unread first, then by time
    conversations.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      return new Date(b.last_time) - new Date(a.last_time);
    });
    
    renderConversations();
    updateUnreadBadge();
    
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
}

function renderConversations() {
  const container = document.getElementById('conversations-container');
  if (!container) return;
  
  if (conversations.length === 0) {
    container.innerHTML = `
      <div class="chat-empty">
        <i data-lucide="message-circle"></i>
        <p>Aucune conversation</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = conversations.map(conv => `
    <div class="conversation-item ${conv.unread_count > 0 ? 'conversation-item--unread' : ''} ${currentConversation === conv.user_id ? 'conversation-item--active' : ''}" 
         data-user-id="${conv.user_id}"
         onclick="selectConversation('${conv.user_id}')">
      <div class="conversation-avatar">
        <i data-lucide="user"></i>
      </div>
      <div class="conversation-info">
        <div class="conversation-name">${escapeHtml(conv.name)}</div>
        <div class="conversation-preview ${conv.unread_count > 0 ? 'conversation-preview--unread' : ''}">
          ${escapeHtml(conv.last_message.substring(0, 50))}${conv.last_message.length > 50 ? '...' : ''}
        </div>
      </div>
      <div class="conversation-meta">
        <div class="conversation-time">${formatTime(conv.last_time)}</div>
        ${conv.unread_count > 0 ? `<span class="conversation-badge">${conv.unread_count}</span>` : ''}
      </div>
    </div>
  `).join('');
  
  lucide.createIcons();
}

// ============================================
// SELECT CONVERSATION
// ============================================

async function selectConversation(userId) {
  currentConversation = userId;
  const conv = conversations.find(c => c.user_id === userId);
  
  if (!conv) return;
  
  // Update UI
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('conversation-item--active');
  });
  document.querySelector(`[data-user-id="${userId}"]`)?.classList.add('conversation-item--active');
  
  // Show chat area on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('conversations-list').classList.add('conversations-list--hidden');
    document.getElementById('chat-area').classList.add('chat-area--active');
  }
  
  // Update chat header
  document.getElementById('chat-user-name').textContent = conv.name;
  document.getElementById('chat-user-email').textContent = conv.email;
  document.getElementById('view-orders-link').href = `/admin/customers.html?user=${userId}`;
  
  // Show active chat
  document.getElementById('no-conversation').style.display = 'none';
  document.getElementById('active-chat').style.display = 'flex';
  
  // Load messages
  await loadMessages(userId);
  
  // Mark as read
  await markAsRead(userId);
  
  // Focus input
  document.getElementById('chat-input')?.focus();
}

// ============================================
// LOAD MESSAGES
// ============================================

async function loadMessages(userId) {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    renderMessages(messages || []);
    
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

function renderMessages(messages) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  if (messages.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--color-text-secondary); padding: 40px;">Aucun message</div>';
    return;
  }
  
  container.innerHTML = messages.map(msg => `
    <div class="admin-message admin-message--${msg.sender === 'admin' ? 'sent' : 'received'}">
      <p>${escapeHtml(msg.message)}</p>
      <div class="admin-message__time">${formatTime(msg.created_at)}</div>
    </div>
  `).join('');
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// ============================================
// SEND MESSAGE
// ============================================

async function sendAdminMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  
  if (!text || !currentConversation) return;
  
  input.value = '';
  
  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        user_id: currentConversation,
        message: text,
        sender: 'admin',
        read: true
      });
    
    if (error) throw error;
    
    // Add to UI immediately
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'admin-message admin-message--sent';
    msgDiv.innerHTML = `
      <p>${escapeHtml(text)}</p>
      <div class="admin-message__time">Maintenant</div>
    `;
    container?.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    
    // Update conversation preview
    loadConversations();
    
  } catch (err) {
    console.error('Error sending message:', err);
    showToast('Erreur lors de l\'envoi du message', 'error');
  }
}

// ============================================
// MARK AS READ
// ============================================

async function markAsRead(userId) {
  try {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('sender', 'client')
      .eq('read', false);
    
    // Update conversation in list
    const conv = conversations.find(c => c.user_id === userId);
    if (conv) {
      conv.unread_count = 0;
      renderConversations();
      updateUnreadBadge();
    }
    
  } catch (err) {
    console.error('Error marking as read:', err);
  }
}

// ============================================
// SUBSCRIBE TO NEW MESSAGES
// ============================================

function subscribeToNewMessages() {
  messagesSubscription = supabase
    .channel('admin-messages')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMessage = payload.new;
        
        // If this is for the current conversation, add to chat
        if (newMessage.user_id === currentConversation) {
          const container = document.getElementById('chat-messages');
          const msgDiv = document.createElement('div');
          msgDiv.className = `admin-message admin-message--${newMessage.sender === 'admin' ? 'sent' : 'received'}`;
          msgDiv.innerHTML = `
            <p>${escapeHtml(newMessage.message)}</p>
            <div class="admin-message__time">Maintenant</div>
          `;
          container?.appendChild(msgDiv);
          container.scrollTop = container.scrollHeight;
          
          // Mark as read if from client
          if (newMessage.sender === 'client') {
            markAsRead(currentConversation);
          }
        }
        
        // Refresh conversation list
        loadConversations();
      }
    )
    .subscribe();
}

// ============================================
// UPDATE UNREAD BADGE
// ============================================

function updateUnreadBadge() {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  
  const sidebarBadge = document.getElementById('sidebar-unread-badge');
  if (sidebarBadge) {
    sidebarBadge.textContent = totalUnread;
    sidebarBadge.style.display = totalUnread > 0 ? 'inline-flex' : 'none';
  }
}

// ============================================
// UTILITIES
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
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
