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
    if (panel !== 'home' && link) link.classList.add('active'); // en Home no marcamos menú
  } else {
    panels.home?.classList.add('active');
  }
}
window.addEventListener('hashchange', ()=>show(location.hash.slice(1)));
show(location.hash.slice(1) || 'home'); // por defecto: Dashboard

// ------------- helpers -------------
// ===== Estado para productos/tipos =====
const state = {
  products: [],
  types: [],
  selectedProductId: null
};

// Render productos (solo nombre + Editar)
function renderProductsOnly(products){
  state.products = products || [];
  const tb = document.querySelector('#tblProductsOnly tbody');
  tb.innerHTML = '';
  state.products.forEach(p=>{
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = p.name;
    tr.appendChild(tdName);

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => p_edit(p);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

// Render tipos del producto seleccionado
function renderTypesFor(productId){
  const product = state.products.find(p=>p.id===productId);
  const tb = document.querySelector('#tblTypesFor tbody');
  const title = document.getElementById('pt_title');
  const ptNewBtn = document.getElementById('pt_newBtn');

  tb.innerHTML = '';
  if (!product) {
    title.textContent = 'Selecciona un producto para gestionar sus tipos.';
    ptNewBtn.disabled = true;
    return;
  }
  title.textContent = `Tipos de: ${product.name}`;
  ptNewBtn.disabled = false;

  const list = state.types.filter(t=>t.product_id === productId);
  list.forEach(t=>{
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = t.name;
    tr.appendChild(tdName);

    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.onclick = () => pt_edit(t);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);

    tb.appendChild(tr);
  });
}

async function api(path, opts){
  const r = await fetch(path, { headers:{'Content-Type':'application/json'}, ...opts });
  const data = await r.json().catch(()=> ({}));
  if(!r.ok) throw new Error(data?.error||'Error');
  return data;
}
const $ = sel => document.querySelector(sel);
const fillTable = (tblId, rows, cols) => {
  const tb = document.querySelector(`#${tblId} tbody`); if (!tb) return;
  tb.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=r[c]??''; tr.appendChild(td); });
    const tdAct = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Editar';
    btn.dataset.id = r.id;
    btn.onclick = () => dash.u_edit(r);
    tdAct.appendChild(btn);
    tr.appendChild(tdAct);
    tb.appendChild(tr);
  });
};
const fillSelect = (selId, rows, value='id', label='name')=>{
  const s = document.getElementById(selId); if (!s) return;
  s.innerHTML='';
  rows.forEach(r=>{ const o=document.createElement('option'); o.value=r[value]; o.textContent=r[label]; s.appendChild(o); });
};

// -------- Usuarios: render especial (avatar pequeño + role bonito, SIN id) ----------
function renderUsers(users){
  const tb = document.querySelector('#tblUsers tbody');
  tb.innerHTML = '';

  users.forEach(u=>{
    const role = Number(u.role); // asegura 1/2
    const roleName  = role === 1 ? 'Administrador' : 'Usuario';
    const roleClass = role === 1 ? 'admin' : 'user';

    const tr = document.createElement('tr');

    // Usuario (avatar pequeño + nombre en la misma celda)
    const tdUser = document.createElement('td');
    tdUser.innerHTML = `
      <div class="user-cell">
        <svg class="avatar ${roleClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
        </svg>
        <span class="name">${u.name}</span>
      </div>`;
    tr.appendChild(tdUser);

    // Role
    const tdRole = document.createElement('td');
    tdRole.innerHTML = `<span class="role-badge">${roleName}</span>`;
    tr.appendChild(tdRole);

    // Acciones
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

// -------- Carga inicial ----------
async function loadAll(){
    const [users, products, types, campaigns, campProds, reservations] = await Promise.all([
    api('/api/users').catch(()=>[]),
    api('/api/products').catch(()=>[]),
    api('/api/product_types').catch(()=>[]),
    api('/api/campaigns').catch(()=>[]),
    api('/api/campaign_products').catch(()=>[]),
    api('/api/reservations').catch(()=>[])
  ]);
  
  renderUsers(users);

  // NUEVO: productos y tipos al estado + renders
  state.products = products || [];
  state.types = types || [];
  renderProductsOnly(state.products);
  renderTypesFor(state.selectedProductId);
  
  const typesFmt = types.map(t=>({id:t.id, product:t.product_id, type:t.name}));
  fillTable('tblProducts', products, ['id','name']);
  fillTable('tblTypes', typesFmt, ['id','product','type']);
  fillTable('tblCampaigns', campaigns, ['id','name','start_date','end_date']);
  fillTable('tblCampaignProducts', campProds, ['id','campaign_id','product_id']);
  fillTable('tblReservations', reservations, ['id','client_name','phone','status','created_at']);

  fillSelect('pt_product', products);
  fillSelect('cp_campaign', campaigns);
  fillSelect('cp_product', products);
  fillSelect('r_type', types, 'id', 'name');
}
loadAll().catch(console.error);

// -------- Usuarios: Nuevo / Editar ----------
const uWrap = $('#u_formWrap');
const uNewBtn = $('#u_newBtn');
const uSaveBtn = $('#u_saveBtn');
const uCancelBtn = $('#u_cancelBtn');

function u_showForm(show){ uWrap.style.display = show ? 'grid' : 'none'; }
function u_fillForm(user) {
  $('#u_id').value   = user?.id ?? '';
  $('#u_name').value = user?.name ?? '';
  $('#u_pass').value = ''; // nunca precargamos pass
  $('#u_role').value = user?.role ?? '2';
}

uNewBtn?.addEventListener('click', () => { u_fillForm(null); u_showForm(true); });
uCancelBtn?.addEventListener('click', () => { u_showForm(false); });

uSaveBtn?.addEventListener('click', async () => {
  const id   = $('#u_id').value.trim();
  const name = $('#u_name').value.trim();
  const pass = $('#u_pass').value;
  const role = parseInt($('#u_role').value || '2', 10);
  if (!name) return alert('Nombre requerido');

  if (!id) {
    await api('/api/users', { method:'POST', body:JSON.stringify({ name, password:pass || '1234', role }) });
  } else {
    const payload = { id, name, role };
    if (pass) payload.password = pass;
    await api('/api/users', { method:'PUT', body:JSON.stringify(payload) });
  }
  u_showForm(false);
  await loadAll();
});

export const dash = {
  u_edit(user){ u_fillForm(user); u_showForm(true); },

  // Resto (productos/campañas/reservas) igual que tenías:
  async addProduct(){
    const name = $('#p_name')?.value?.trim(); if(!name) return;
    await api('/api/products', { method:'POST', body:JSON.stringify({ name }) });
    $('#p_name').value=''; loadAll();
  },
  async addProductType(){
    const product_id = $('#pt_product').value;
    const name = $('#pt_name').value.trim();
    if(!product_id || !name) return;
    await api('/api/product_types', { method:'POST', body:JSON.stringify({ product_id, name }) });
    $('#pt_name').value=''; loadAll();
  },
  async addCampaign(){
    const name=$('#c_name').value.trim(), start_date=$('#c_start').value, end_date=$('#c_end').value;
    if(!name||!start_date||!end_date) return alert('Completa todos los campos');
    await api('/api/campaigns', { method:'POST', body:JSON.stringify({ name, start_date, end_date }) });
    $('#c_name').value=''; $('#c_start').value=''; $('#c_end').value=''; loadAll();
  },
  async addCampaignProduct(){
    const campaign_id=$('#cp_campaign').value, product_id=$('#cp_product').value;
    if(!campaign_id||!product_id) return;
    await api('/api/campaign_products', { method:'POST', body:JSON.stringify({ campaign_id, product_id }) });
    loadAll();
  },
  async createReservation(){
    const client_name=$('#r_client').value.trim();
    const phone=$('#r_phone').value.trim();
    const product_type_id=$('#r_type').value;
    const quantity=parseInt($('#r_qty').value||'1',10);
    if(!client_name||!phone||!product_type_id||quantity<1) return alert('Datos incompletos');
    await api('/api/reservations', {
      method:'POST',
      body:JSON.stringify({ client_name, phone, items:[{ product_type_id, quantity }] })
    });
    $('#r_client').value=''; $('#r_phone').value=''; loadAll();
  }
};
window.dash = dash;
