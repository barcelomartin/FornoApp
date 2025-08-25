// ===== helpers de uso general (definidos ANTES de usarlos) =====
const $ = (s) => document.querySelector(s);

async function api(path, opts) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || 'Error');
  return data;
}

// ===== guard de login =====
const me = JSON.parse(localStorage.getItem('forno_user') || 'null');
if (!me) location.href = '/login.html';
$('#who').textContent = `Usuario: ${me.name}`;
$('#logoutBtn').onclick = () => { localStorage.removeItem('forno_user'); location.href = '/login.html'; };

// ===== router simple por hash =====
const links = [...document.querySelectorAll('a[data-panel]')];
const panels = {
  home: null,
  usuarios: $('#panel-usuarios'),
  productos: $('#panel-productos'),
  campanias: $('#panel-campanias'),
  reservas: $('#panel-reservas'),
};
function show(panel) {
  Object.values(panels).forEach(p => p && p.classList.remove('active'));
  links.forEach(a => a.classList.remove('active'));
  if (panels[panel]) {
    panels[panel].classList.add('active');
    links.find(a => a.dataset.panel === panel)?.classList.add('active');
  }
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1) || 'usuarios'); // por defecto usuarios

// ==========================================================
//                           USUARIOS
// ==========================================================
function renderUsers(users) {
  const tb = $('#tblUsers tbody');
  tb.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="user-cell">
          <svg class="avatar ${Number(u.role) === 1 ? 'admin' : 'user'}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
          </svg>
          ${u.name}
        </div>
      </td>
      <td><span class="role-badge">${Number(u.role) === 1 ? 'Administrador' : 'Usuario'}</span></td>
      <td><button class="btn u-edit">Editar</button></td>`;
    tr.querySelector('.u-edit').onclick = () => dash.u_edit(u);
    tb.appendChild(tr);
  });
}

const uWrap = $('#u_formWrap');
const uNewBtn = $('#u_newBtn');
const uSaveBtn = $('#u_saveBtn');
const uCancelBtn = $('#u_cancelBtn');

function u_showForm(show) { uWrap.style.display = show ? 'grid' : 'none'; }
function u_fillForm(user) {
  $('#u_id').value = user?.id ?? '';
  $('#u_name').value = user?.name ?? '';
  $('#u_pass').value = '';
  $('#u_role').value = user?.role ?? '2';
}
uNewBtn?.addEventListener('click', () => { u_fillForm(null); u_showForm(true); });
uCancelBtn?.addEventListener('click', () => u_showForm(false));
uSaveBtn?.addEventListener('click', async () => {
  const id = $('#u_id').value.trim();
  const name = $('#u_name').value.trim();
  const pass = $('#u_pass').value;
  const role = parseInt($('#u_role').value || '2', 10);
  if (!name) return alert('Nombre requerido');

  if (!id) {
    await api('/api/users', { method: 'POST', body: JSON.stringify({ name, password: pass || '1234', role }) });
  } else {
    const payload = { id, name, role };
    if (pass) payload.password = pass;
    await api('/api/users', { method: 'PUT', body: JSON.stringify(payload) });
  }
  u_showForm(false);
  await loadAll();
});

// ==========================================================
//                     PRODUCTOS & TIPOS
// ==========================================================
const state = { products: [], types: [] };

function renderProductsGrid() {
  const tb = $('#tblProductsGrid tbody');
  tb.innerHTML = '';

  if (!state.products.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.innerHTML = '<span class="muted">No hay productos</span>';
    tr.appendChild(td);
    tb.appendChild(tr);
    return;
  }

  state.products.forEach(p => {
    const tipos = state.types.filter(t => t.product_id === p.id);

    // fila principal
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td><span class="pill">${tipos.length}</span></td>
      <td><button class="btn verTipos">Ver tipos</button></td>`;
    tb.appendChild(tr);

    // fila expandida
    const tr2 = document.createElement('tr');
    tr2.className = 'expand-row';
    tr2.style.display = 'none';
    const td = document.createElement('td');
    td.colSpan = 3;
    td.innerHTML = `
      <div class="expand-box">
        <strong>Tipos de ${p.name}:</strong>
        <ul style="margin:6px 0 0 18px">
          ${tipos.map(t => `<li>${t.name}</li>`).join('') || '<li class="muted">(sin tipos)</li>'}
        </ul>
      </div>`;
    tr2.appendChild(td);
    tb.appendChild(tr2);

    tr.querySelector('.verTipos').onclick = () => {
      tr2.style.display = tr2.style.display === 'none' ? 'table-row' : 'none';
    };
  });
}

// ==========================================================
//           Campañas / Reservas (tablas simples demo)
// ==========================================================
function fillTable(id, rows, cols) {
  const tb = document.querySelector(`#${id} tbody`);
  tb.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    cols.forEach(c => {
      const td = document.createElement('td');
      td.textContent = r[c] ?? '';
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}

// API público para el botón editar de usuarios
export const dash = {
  u_edit(u) { u_fillForm(u); u_showForm(true); }
};
window.dash = dash;

// ==========================================================
//                       CARGA INICIAL
// ==========================================================
async function loadAll() {
  try {
    const [users, products, types, camps, reservations] = await Promise.all([
      api('/api/users').catch(() => []),
      api('/api/products').catch(() => []),
      api('/api/product_types').catch(() => []),
      api('/api/campaigns').catch(() => []),
      api('/api/reservations').catch(() => []),
    ]);

    renderUsers(users);

    state.products = products || [];
    state.types    = types || [];
    renderProductsGrid();

    fillTable('tblCampaigns', camps, ['id', 'name']);
    fillTable('tblReservations', reservations, ['id', 'client_name', 'phone']);
  } catch (err) {
    console.error('loadAll error:', err);
  }
}
loadAll();
