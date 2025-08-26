// --- guard: requiere login
const me = JSON.parse(localStorage.getItem('forno_user') || 'null');
if (!me) location.href = '/login.html';

// ui header
const who = document.getElementById('who');
if (who) who.textContent = `Usuario: ${me?.name}`;
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => { localStorage.removeItem('forno_user'); location.href='/login.html'; };

// router simple por hash
const links = [...document.querySelectorAll('a[data-panel]')];
const panels = {
  home:      document.getElementById('panel-home'),
  usuarios:  document.getElementById('panel-usuarios'),
  productos: document.getElementById('panel-productos'),
  campanias: document.getElementById('panel-campanias'),
  reservas:  document.getElementById('panel-reservas'),
};
function show(panel) {
  Object.values(panels).forEach(p=>p && p.classList.remove('active'));
  links.forEach(a=>a.classList.remove('active'));
  if (panels[panel]) {
    panels[panel].classList.add('active');
    const link = links.find(a=>a.dataset.panel===panel);
    if (panel !== 'home' && link) link.classList.add('active');
  } else {
    panels.home?.classList.add('active');
  }
}
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
show(location.hash.slice(1) || 'home');

// ----------------- Helpers -----------------
async function api(path, opts){
  const r = await fetch(path, { headers:{'Content-Type':'application/json'}, ...opts });
  const data = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(data?.error || 'Error');
  return data;
}
const $ = sel => document.querySelector(sel);

// -------- Usuarios: render especial (avatar pequeño + role bonito, SIN id) ----------
function renderUsers(users){
  const tb = document.querySelector('#tblUsers tbody');
  if (!tb) return;
  tb.innerHTML = '';

  users.forEach(u=>{
    const role = Number(u.role);
    const roleName  = role === 1 ? 'Administrador' : 'Operador';
    const roleClass = role === 1 ? 'admin' : 'user';

    const tr = document.createElement('tr');

    const tdUser = document.createElement('td');
    tdUser.innerHTML = `
      <div class="user-cell">
        <svg class="avatar ${roleClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
        </svg>
        <span class="name">${u.name}</span>
      </div>`;
    tr.appendChild(tdUser);

    const tdRole = document.createElement('td');
    tdRole.innerHTML = `<span class="role-badge">${roleName}</span>`;
    tr.appendChild(tdRole);

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => dash.u_edit(u);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

// -------- Carga inicial global --------
async function loadAll(){
  const [users] = await Promise.all([
    api('/api/users').catch(()=>[])
  ]);
  renderUsers(users);
}
loadAll().catch(console.error);

// -------- Usuarios: Nuevo / Editar ----------
const uWrap = $('#u_formWrap');
const uNewBtn = $('#u_newBtn');
const uSaveBtn = $('#u_saveBtn');
const uCancelBtn = $('#u_cancelBtn');

function u_showForm(show){ if (uWrap) uWrap.style.display = show ? 'grid' : 'none'; }
function u_fillForm(user) {
  $('#u_id').value   = user?.id ?? '';
  $('#u_name').value = user?.name ?? '';
  $('#u_pass').value = '';
  $('#u_role').value = user?.role ?? '2';
}

uNewBtn?.addEventListener('click', () => { u_fillForm(null); u_showForm(true); });
uCancelBtn?.addEventListener('click', () => { u_showForm(false); });

uSaveBtn?.addEventListener('click', async () => {
  const id   = $('#u_id')?.value?.trim() || '';
  const name = $('#u_name')?.value?.trim() || '';
  const pass = $('#u_pass')?.value || '';
  const role = parseInt($('#u_role')?.value || '2', 10);
  if (!name) return alert('Nombre requerido');

  if (!id) {
    await api('/api/users', {
      method:'POST',
      body: JSON.stringify({ name, password: pass || '1234', role })
    });
  } else {
    const payload = { id, name, role };
    if (pass) payload.password = pass;
    await api('/api/users', {
      method:'PUT',
      body: JSON.stringify(payload)
    });
  }

  u_showForm(false);
  await loadAll();
});

// Exponer funciones globales
export const dash = {
  u_edit(user){ u_fillForm(user); u_showForm(true); }
};
