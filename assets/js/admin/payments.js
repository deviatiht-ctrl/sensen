/* admin/payments.js */
/* Manual payment methods (logo, type, account) + payment proof review */

// ============================================
// STATE
// ============================================
let methods = [];
let proofs = [];
let editingMethod = null;
let methodLogo = null;

const PAYMENT_TYPES = {
  mobile_money: 'Mobile money',
  bank_transfer: 'Virement bancaire',
  cash: 'Especes',
  card: 'Carte',
  other: 'Autre'
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return;

  await loadMethods();
  await loadProofs();
  initMethodForm();
});

// ============================================
// PAYMENT METHODS
// ============================================

async function loadMethods() {
  try {
    const { data, error } = await supabase
      .from(TBL.paymentMethods)
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    methods = data || [];
    renderMethodsTable();

  } catch (err) {
    console.error('Error loading payment methods:', err);
    showToast('Erreur lors du chargement des modes de paiement', 'error');
  }
}

function renderMethodsTable() {
  const tbody = document.querySelector('#methods-table tbody');
  if (!tbody) return;

  if (methods.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align: center; padding: 24px;">
        Aucun mode de paiement. Ajoutez-en un pour permettre les commandes.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = methods.map(m => `
    <tr>
      <td>
        ${m.logo_url
          ? `<img src="${m.logo_url}" alt="${m.name}" style="width: 44px; height: 44px; object-fit: contain;">`
          : '<span style="color: var(--color-text-secondary);">-</span>'}
      </td>
      <td>${m.name}</td>
      <td>${PAYMENT_TYPES[m.type] || m.type}</td>
      <td>${m.account_name || '-'}</td>
      <td>${m.account_number || '-'}</td>
      <td>${m.requires_proof ? 'Oui' : 'Non'}</td>
      <td>
        <div class="toggle ${m.is_active ? 'toggle--active' : ''}"
             onclick="toggleMethodStatus('${m.id}', ${!m.is_active})">
          <div class="toggle__handle"></div>
        </div>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" onclick="openMethodModal('${m.id}')" title="Modifier">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="table-action" onclick="deleteMethod('${m.id}')" title="Supprimer">
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

function initMethodForm() {
  document.getElementById('method-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveMethod();
  });

  const zone = document.getElementById('method-logo-upload');
  const input = document.getElementById('method-logo');

  zone?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      methodLogo = await uploadImage(file, 'payment-logos');
      renderMethodLogoPreview();
    } catch (err) {
      console.error('Error uploading logo:', err);
      showToast('Erreur lors du telechargement du logo', 'error');
    }
  });
}

function renderMethodLogoPreview() {
  const container = document.getElementById('method-logo-preview');
  if (!container) return;

  container.innerHTML = methodLogo
    ? `<div class="image-thumbnail">
         <img src="${methodLogo}" alt="Logo">
         <button type="button" class="image-thumbnail__remove" onclick="removeMethodLogo()">&times;</button>
       </div>`
    : '';
}

function removeMethodLogo() {
  methodLogo = null;
  renderMethodLogoPreview();
}

function openMethodModal(methodId = null) {
  editingMethod = methodId ? methods.find(m => m.id === methodId) : null;

  const panel = document.querySelector('.slide-panel');
  const title = document.querySelector('.slide-panel__title');
  const form = document.getElementById('method-form');

  if (editingMethod) {
    title.textContent = 'Modifier le mode de paiement';
    document.getElementById('method-name').value = editingMethod.name || '';
    document.getElementById('method-type').value = editingMethod.type || 'mobile_money';
    document.getElementById('method-account-name').value = editingMethod.account_name || '';
    document.getElementById('method-account-number').value = editingMethod.account_number || '';
    document.getElementById('method-bank').value = editingMethod.bank_name || '';
    document.getElementById('method-branch').value = editingMethod.branch || '';
    document.getElementById('method-instructions').value = editingMethod.instructions || '';
    document.getElementById('method-order').value = editingMethod.display_order ?? 0;
    document.getElementById('method-proof').checked = editingMethod.requires_proof !== false;
    document.getElementById('method-active').checked = editingMethod.is_active !== false;
    methodLogo = editingMethod.logo_url || null;
  } else {
    title.textContent = 'Ajouter un mode de paiement';
    form?.reset();
    document.getElementById('method-proof').checked = true;
    document.getElementById('method-active').checked = true;
    methodLogo = null;
  }

  renderMethodLogoPreview();
  panel?.classList.add('slide-panel--open');
}

function closeMethodModal() {
  document.querySelector('.slide-panel')?.classList.remove('slide-panel--open');
  editingMethod = null;
  methodLogo = null;
}

async function saveMethod() {
  const name = document.getElementById('method-name').value.trim();
  if (!name) {
    showToast('Le nom est obligatoire', 'error');
    return;
  }

  const methodData = {
    name,
    type: document.getElementById('method-type').value,
    logo_url: methodLogo,
    account_name: document.getElementById('method-account-name').value || null,
    account_number: document.getElementById('method-account-number').value || null,
    bank_name: document.getElementById('method-bank').value || null,
    branch: document.getElementById('method-branch').value || null,
    instructions: document.getElementById('method-instructions').value || null,
    display_order: parseInt(document.getElementById('method-order').value) || 0,
    requires_proof: document.getElementById('method-proof').checked,
    is_active: document.getElementById('method-active').checked
  };

  try {
    if (editingMethod) {
      const { error } = await supabase
        .from(TBL.paymentMethods)
        .update(methodData)
        .eq('id', editingMethod.id);

      if (error) throw error;
      showToast('Mode de paiement mis a jour', 'success');
    } else {
      const { error } = await supabase
        .from(TBL.paymentMethods)
        .insert(methodData);

      if (error) throw error;
      showToast('Mode de paiement cree', 'success');
    }

    closeMethodModal();
    loadMethods();

  } catch (err) {
    console.error('Error saving payment method:', err);
    showToast('Erreur lors de l\'enregistrement', 'error');
  }
}

async function deleteMethod(methodId) {
  if (!confirm('Supprimer ce mode de paiement ? Les commandes passees gardent leurs infos.')) return;

  try {
    const { error } = await supabase
      .from(TBL.paymentMethods)
      .delete()
      .eq('id', methodId);

    if (error) throw error;

    showToast('Mode de paiement supprime', 'success');
    loadMethods();

  } catch (err) {
    console.error('Error deleting payment method:', err);
    showToast('Erreur lors de la suppression', 'error');
  }
}

async function toggleMethodStatus(methodId, isActive) {
  try {
    const { error } = await supabase
      .from(TBL.paymentMethods)
      .update({ is_active: isActive })
      .eq('id', methodId);

    if (error) throw error;
    loadMethods();
  } catch (err) {
    console.error('Error toggling payment method:', err);
    showToast('Erreur', 'error');
  }
}

// ============================================
// PAYMENT PROOFS
// ============================================

async function loadProofs() {
  try {
    const { data, error } = await supabase
      .from(TBL.proofs)
      .select('*, order:order_id (id, order_number, customer_name, total, payment_status)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    proofs = data || [];
    renderProofsTable();

  } catch (err) {
    console.error('Error loading payment proofs:', err);
  }
}

function renderProofsTable() {
  const tbody = document.querySelector('#proofs-table tbody');
  if (!tbody) return;

  if (proofs.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 24px;">
        Aucune preuve de paiement en attente.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = proofs.map(p => `
    <tr>
      <td>
        <a href="/admin/orders.html?order=${p.order?.id || ''}" style="text-decoration: underline;">
          ${p.order?.order_number || '-'}
        </a>
      </td>
      <td>${p.order?.customer_name || '-'}</td>
      <td>${p.amount ? p.amount + ' HTG' : (p.order?.total ? p.order.total + ' HTG' : '-')}</td>
      <td>${p.reference || '-'}</td>
      <td>${new Date(p.created_at).toLocaleString('fr-FR')}</td>
      <td>
        <a href="${p.file_url}" target="_blank" rel="noopener" style="text-decoration: underline;">Voir</a>
      </td>
      <td>
        <div class="table-actions">
          <button class="admin-btn admin-btn--secondary" onclick="reviewProof('${p.id}', 'approved')">Valider</button>
          <button class="admin-btn admin-btn--secondary" onclick="reviewProof('${p.id}', 'rejected')">Refuser</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Approve or reject a payment proof and sync the order payment status
 */
async function reviewProof(proofId, status) {
  const proof = proofs.find(p => p.id === proofId);
  if (!proof) return;

  const note = status === 'rejected'
    ? prompt('Raison du refus (visible par l\'equipe) :') || null
    : null;

  try {
    const user = await getCurrentUser();

    const { error: proofError } = await supabase
      .from(TBL.proofs)
      .update({
        status,
        admin_note: note,
        reviewed_by: user?.email || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', proofId);

    if (proofError) throw proofError;

    const { error: orderError } = await supabase
      .from(TBL.orders)
      .update({
        payment_status: status === 'approved' ? 'confirmed' : 'rejected',
        payment_confirmed_at: status === 'approved' ? new Date().toISOString() : null,
        payment_confirmed_by: status === 'approved' ? (user?.email || null) : null,
        order_status: status === 'approved' ? 'confirmed' : 'pending'
      })
      .eq('id', proof.order_id);

    if (orderError) throw orderError;

    if (status === 'approved') {
      await supabase.from(TBL.tracking).insert({
        order_id: proof.order_id,
        status: 'payment_confirmed',
        title: 'Paiement confirme',
        note: 'Preuve de paiement validee par l\'administration.',
        created_by: user?.email || 'admin'
      });
    }

    showToast(status === 'approved' ? 'Paiement confirme' : 'Preuve refusee', 'success');
    loadProofs();

  } catch (err) {
    console.error('Error reviewing proof:', err);
    showToast('Erreur lors de la verification', 'error');
  }
}

// Exports
window.openMethodModal = openMethodModal;
window.closeMethodModal = closeMethodModal;
window.saveMethod = saveMethod;
window.deleteMethod = deleteMethod;
window.toggleMethodStatus = toggleMethodStatus;
window.removeMethodLogo = removeMethodLogo;
window.reviewProof = reviewProof;
